import { NextRequest, NextResponse } from 'next/server'
import { getLeagueByCode, getOrCreatePlayer } from '@/lib/db'
import { serializePlayerCookie } from '@/lib/cookies'

// POST /api/players  { join_code, display_name }
// Creates or re-links player; sets brewmier_player cookie
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { join_code, display_name } = body

  if (!join_code || !display_name) {
    return NextResponse.json({ error: 'join_code and display_name required' }, { status: 400 })
  }

  const trimmedName = (display_name as string).trim()
  if (!trimmedName) {
    return NextResponse.json({ error: 'display_name cannot be blank' }, { status: 400 })
  }

  const league = getLeagueByCode((join_code as string).toUpperCase())
  if (!league) {
    return NextResponse.json({ error: 'League not found. Check your join code.' }, { status: 404 })
  }

  const player = getOrCreatePlayer(league.id, trimmedName)

  const cookieValue = serializePlayerCookie({
    playerId: player.id,
    displayName: player.display_name,
    leagueId: league.id,
    joinCode: league.join_code,
  })

  const response = NextResponse.json({ player, league }, { status: 200 })
  response.cookies.set('brewmier_player', cookieValue, {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: false,           // client reads it for redirect on first load
    sameSite: 'lax',
    path: '/',
  })
  return response
}
