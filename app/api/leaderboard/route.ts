import { NextRequest, NextResponse } from 'next/server'
import { getLeagueByCode, getPlayersByLeague, getEntriesByLeague, getScoringRules } from '@/lib/db'
import { computeScores } from '@/lib/scoring'

// GET /api/leaderboard?join_code=PUB01&mode=season|alltime
export async function GET(req: NextRequest) {
  const joinCode = req.nextUrl.searchParams.get('join_code')
  const mode = req.nextUrl.searchParams.get('mode') ?? 'season'

  if (!joinCode) {
    return NextResponse.json({ error: 'join_code required' }, { status: 400 })
  }

  const league = getLeagueByCode(joinCode.toUpperCase())
  if (!league) {
    return NextResponse.json({ error: 'League not found' }, { status: 404 })
  }

  const players = getPlayersByLeague(league.id)
  const entries = getEntriesByLeague(league.id)
  const rules = getScoringRules(league.id)

  const effectiveLeague = mode === 'alltime'
    ? { ...league, season_start: null, season_end: null }
    : league

  const scores = computeScores(players, entries, rules, effectiveLeague)

  return NextResponse.json({ league, scores, mode })
}
