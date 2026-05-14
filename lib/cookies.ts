import { cookies } from 'next/headers'

export type PlayerCookie = {
  playerId: number
  displayName: string
  leagueId: number
  joinCode: string
}

export function getPlayerCookie(): PlayerCookie | null {
  const cookieStore = cookies()
  const raw = cookieStore.get('brewmier_player')?.value
  if (!raw) return null
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')) as PlayerCookie
  } catch {
    return null
  }
}

export function serializePlayerCookie(data: PlayerCookie): string {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}
