import { computeScores } from '@/lib/scoring'
import type { BeerEntry, ScoringRule, League } from '@/lib/db'

const league: League = {
  id: 1, name: 'Test League', join_code: 'TEST',
  season_start: '2024-01-01', season_end: null, created_at: '2024-01-01T00:00:00Z',
}

const players = [
  { id: 1, display_name: 'Alice' },
  { id: 2, display_name: 'Bob' },
]

const perEntryRule: ScoringRule = {
  id: 1, league_id: 1, rule_type: 'per_entry', points: 1, config_json: null,
}

function makeEntry(id: number, playerId: number, loggedAt: string): BeerEntry {
  return { id, player_id: playerId, league_id: 1, logged_at: loggedAt, timezone_offset: 0, venue: null, notes: null }
}

test('ranks players by points descending', () => {
  const entries = [
    makeEntry(1, 1, '2024-01-15T12:00:00Z'),
    makeEntry(2, 1, '2024-01-16T12:00:00Z'),
    makeEntry(3, 2, '2024-01-15T12:00:00Z'),
  ]
  const scores = computeScores(players, entries, [perEntryRule], league)
  expect(scores[0].display_name).toBe('Alice')
  expect(scores[0].points).toBe(2)
  expect(scores[0].beer_count).toBe(2)
  expect(scores[1].display_name).toBe('Bob')
  expect(scores[1].points).toBe(1)
})

test('excludes entries before season_start', () => {
  const seasonLeague = { ...league, season_start: '2024-02-01' }
  const entries = [
    makeEntry(1, 1, '2024-01-15T12:00:00Z'), // before season
    makeEntry(2, 1, '2024-02-15T12:00:00Z'), // in season
  ]
  const scores = computeScores(players, entries, [perEntryRule], seasonLeague)
  expect(scores[0].points).toBe(1)
})

test('excludes entries after season_end', () => {
  const seasonLeague = { ...league, season_end: '2024-03-01' }
  const entries = [
    makeEntry(1, 1, '2024-02-15T12:00:00Z'), // in season
    makeEntry(2, 1, '2024-04-01T12:00:00Z'), // after season
  ]
  const scores = computeScores(players, entries, [perEntryRule], seasonLeague)
  expect(scores[0].points).toBe(1)
})

test('all-time mode (null season bounds) includes all entries', () => {
  const allTime = { ...league, season_start: null, season_end: null }
  const entries = [
    makeEntry(1, 1, '2022-01-01T12:00:00Z'),
    makeEntry(2, 1, '2025-12-31T12:00:00Z'),
  ]
  const scores = computeScores(players, entries, [perEntryRule], allTime)
  expect(scores[0].points).toBe(2)
})

test('player with no entries gets 0 points', () => {
  const scores = computeScores(players, [], [perEntryRule], league)
  expect(scores.every(s => s.points === 0)).toBe(true)
})

test('last_entry is the most recent logged_at for that player', () => {
  const entries = [
    makeEntry(1, 1, '2024-01-10T12:00:00Z'),
    makeEntry(2, 1, '2024-01-20T12:00:00Z'),
  ]
  const scores = computeScores(players, entries, [perEntryRule], league)
  expect(scores[0].last_entry).toBe('2024-01-20T12:00:00Z')
})
