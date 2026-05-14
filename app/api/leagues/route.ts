import { NextRequest, NextResponse } from 'next/server'
import { createLeague, getLeagueByCode } from '@/lib/db'

// GET /api/leagues?join_code=ABC
export async function GET(req: NextRequest) {
  const joinCode = req.nextUrl.searchParams.get('join_code')
  if (!joinCode) {
    return NextResponse.json({ error: 'join_code required' }, { status: 400 })
  }
  const league = getLeagueByCode(joinCode.toUpperCase())
  if (!league) {
    return NextResponse.json({ error: 'League not found' }, { status: 404 })
  }
  return NextResponse.json(league)
}

// POST /api/leagues  { name, join_code, season_start?, season_end? }
// Requires X-Admin-Secret header matching ADMIN_SECRET env var
export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { name, join_code, season_start, season_end } = body
  if (!name || !join_code) {
    return NextResponse.json({ error: 'name and join_code required' }, { status: 400 })
  }
  try {
    const league = createLeague(
      name,
      (join_code as string).toUpperCase(),
      season_start,
      season_end,
    )
    return NextResponse.json(league, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('UNIQUE')) {
      return NextResponse.json({ error: 'join_code already taken' }, { status: 409 })
    }
    throw e
  }
}
