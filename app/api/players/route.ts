import { NextRequest, NextResponse } from 'next/server'
import { getLeagueByCode, getOrCreatePlayer, deletePlayer } from '@/lib/db'
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
  if (trimmedName.length > 32) {
    return NextResponse.json({ error: 'display_name must be 32 characters or fewer' }, { status: 400 })
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
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}

// DELETE /api/players  { join_code, display_name }  [X-Admin-Secret required]
// Deletes a player and their beer entries (CASCADE)
export async function DELETE(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { join_code, display_name } = await req.json()
  if (!join_code || !display_name) {
    return NextResponse.json({ error: 'join_code and display_name required' }, { status: 400 })
  }
  const league = getLeagueByCode((join_code as string).toUpperCase())
  if (!league) {
    return NextResponse.json({ error: 'League not found' }, { status: 404 })
  }
  const deleted = deletePlayer(league.id, (display_name as string).trim())
  if (!deleted) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }
  return NextResponse.json({ deleted: true })
}
