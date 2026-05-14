import {
  getDb, _resetDb,
  createLeague, getLeagueByCode, getAllLeagues,
  getOrCreatePlayer, getPlayersByLeague, getPlayerByName,
  createEntry, getEntriesByPlayer, getEntriesByLeague, getRecentEntryByPlayer,
  getScoringRules, getAllEntriesWithContext,
} from '@/lib/db'

beforeEach(() => {
  process.env.DATABASE_PATH = ':memory:'
  _resetDb()
})

afterAll(() => {
  _resetDb()
})

// --- Leagues ---

test('createLeague persists and returns a league', () => {
  const league = createLeague('Pub FC', 'PUB01')
  expect(league.join_code).toBe('PUB01')
  expect(league.name).toBe('Pub FC')
  expect(league.id).toBeGreaterThan(0)
})

test('createLeague also seeds a per_entry scoring rule', () => {
  const league = createLeague('Pub FC', 'PUB02')
  const rules = getScoringRules(league.id)
  expect(rules).toHaveLength(1)
  expect(rules[0].rule_type).toBe('per_entry')
  expect(rules[0].points).toBe(1)
})

test('getLeagueByCode returns undefined for unknown code', () => {
  expect(getLeagueByCode('NOPE')).toBeUndefined()
})

test('getLeagueByCode returns the league for known code', () => {
  createLeague('Test', 'FOUND')
  expect(getLeagueByCode('FOUND')?.name).toBe('Test')
})

test('duplicate join_code throws', () => {
  createLeague('First', 'DUP01')
  expect(() => createLeague('Second', 'DUP01')).toThrow()
})

// --- Players ---

test('getOrCreatePlayer creates a new player', () => {
  const league = createLeague('Test', 'PLY01')
  const player = getOrCreatePlayer(league.id, 'Dave')
  expect(player.display_name).toBe('Dave')
  expect(player.league_id).toBe(league.id)
})

test('getOrCreatePlayer returns existing player on re-join', () => {
  const league = createLeague('Test', 'PLY02')
  const p1 = getOrCreatePlayer(league.id, 'Eve')
  const p2 = getOrCreatePlayer(league.id, 'Eve')
  expect(p1.id).toBe(p2.id)
})

test('same name in different leagues creates separate players', () => {
  const l1 = createLeague('League A', 'LA001')
  const l2 = createLeague('League B', 'LB001')
  const p1 = getOrCreatePlayer(l1.id, 'Frank')
  const p2 = getOrCreatePlayer(l2.id, 'Frank')
  expect(p1.id).not.toBe(p2.id)
})

// --- Entries ---

test('createEntry sets logged_at on the server', () => {
  const league = createLeague('Test', 'ENT01')
  const player = getOrCreatePlayer(league.id, 'Grace')
  const before = new Date().toISOString()
  const entry = createEntry(player.id, league.id, -300, 'The Crown', 'Guinness')
  const after = new Date().toISOString()
  expect(entry.logged_at >= before).toBe(true)
  expect(entry.logged_at <= after).toBe(true)
  expect(entry.venue).toBe('The Crown')
  expect(entry.notes).toBe('Guinness')
})

test('getEntriesByPlayer returns entries newest first', () => {
  const league = createLeague('Test', 'ENT02')
  const player = getOrCreatePlayer(league.id, 'Hank')
  createEntry(player.id, league.id, 0)
  createEntry(player.id, league.id, 0)
  const entries = getEntriesByPlayer(player.id)
  expect(entries.length).toBe(2)
  expect(entries[0].logged_at >= entries[1].logged_at).toBe(true)
})

test('getRecentEntryByPlayer returns undefined when no entries', () => {
  const league = createLeague('Test', 'ENT03')
  const player = getOrCreatePlayer(league.id, 'Iris')
  expect(getRecentEntryByPlayer(player.id)).toBeUndefined()
})
