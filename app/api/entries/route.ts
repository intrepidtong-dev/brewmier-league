import { NextRequest, NextResponse } from 'next/server'
import { createEntry, getEntriesByPlayer, getRecentEntryByPlayer } from '@/lib/db'
import { getPlayerCookie } from '@/lib/cookies'

const DUPLICATE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

// GET /api/entries?player_id=1
export async function GET(req: NextRequest) {
  const playerId = parseInt(req.nextUrl.searchParams.get('player_id') ?? '', 10)
  if (isNaN(playerId)) {
    return NextResponse.json({ error: 'player_id required' }, { status: 400 })
  }
  const entries = getEntriesByPlayer(playerId)
  return NextResponse.json(entries)
}

// POST /api/entries  { timezone_offset, venue?, notes? }
// Requires valid brewmier_player cookie
export async function POST(req: NextRequest) {
  const playerCookie = getPlayerCookie()
  if (!playerCookie) {
    return NextResponse.json({ error: 'Not in a league. Join first.' }, { status: 401 })
  }

  const body = await req.json()
  const { timezone_offset, venue, notes } = body

  if (venue && (venue as string).length > 200) {
    return NextResponse.json({ error: 'venue must be 200 characters or fewer' }, { status: 400 })
  }
  if (notes && (notes as string).length > 200) {
    return NextResponse.json({ error: 'notes must be 200 characters or fewer' }, { status: 400 })
  }

  // Duplicate entry guard
  const recent = getRecentEntryByPlayer(playerCookie.playerId)
  if (recent) {
    const elapsed = Date.now() - new Date(recent.logged_at).getTime()
    if (elapsed < DUPLICATE_WINDOW_MS) {
      const remainingMins = Math.ceil((DUPLICATE_WINDOW_MS - elapsed) / 60000)
      return NextResponse.json(
        {
          warning: true,
          message: `Steady on — you logged one ${Math.floor(elapsed / 60000)}m ago. Wait ${remainingMins} more minute(s) or this will violate league rules.`,
          entry: recent,
        },
        { status: 409 },
      )
    }
  }

  const entry = createEntry(
    playerCookie.playerId,
    playerCookie.leagueId,
    typeof timezone_offset === 'number' ? timezone_offset : 0,
    venue,
    notes,
  )
  return NextResponse.json(entry, { status: 201 })
}
