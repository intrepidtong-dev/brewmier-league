import type { BeerEntry, ScoringRule, League } from '@/lib/db'

export type PlayerScore = {
  player_id: number
  display_name: string
  points: number
  beer_count: number
  last_entry: string | null
}

export function computeScores(
  players: { id: number; display_name: string }[],
  allEntries: BeerEntry[],
  rules: ScoringRule[],
  league: League,
): PlayerScore[] {
  const seasonStart = league.season_start ? new Date(league.season_start) : null
  const seasonEnd = league.season_end ? new Date(league.season_end) : null

  const scored = players.map(player => {
    const entries = allEntries.filter(e => {
      if (e.player_id !== player.id) return false
      const t = new Date(e.logged_at)
      if (seasonStart && t < seasonStart) return false
      if (seasonEnd && t > seasonEnd) return false
      return true
    })

    let points = 0
    for (const rule of rules) {
      if (rule.rule_type === 'per_entry') {
        points += entries.length * rule.points
      }
    }

    const sorted = [...entries].sort((a, b) =>
      b.logged_at.localeCompare(a.logged_at)
    )

    return {
      player_id: player.id,
      display_name: player.display_name,
      points,
      beer_count: entries.length,
      last_entry: sorted[0]?.logged_at ?? null,
    }
  })

  return scored.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    // Tiebreaker 1: whoever reached score first (earlier last_entry) ranks higher
    if (a.last_entry && b.last_entry) return a.last_entry.localeCompare(b.last_entry)
    if (a.last_entry) return -1
    if (b.last_entry) return 1
    // Tiebreaker 2: alphabetical by display name
    return a.display_name.localeCompare(b.display_name)
  })
}
