'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import LeaderboardTable from '@/components/LeaderboardTable'
import type { PlayerScore } from '@/lib/scoring'

type LeagueData = {
  league: { id: number; name: string; join_code: string; season_start: string | null; season_end: string | null }
  scores: PlayerScore[]
  mode: string
}

function getMyPlayerId(): number | undefined {
  const cookie = document.cookie.split('; ').find(r => r.startsWith('brewmier_player='))
  if (!cookie) return undefined
  try {
    const data = JSON.parse(atob(cookie.split('=').slice(1).join('=')))
    return data.playerId
  } catch { return undefined }
}

export default function LeaguePage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [mode, setMode] = useState<'season' | 'alltime'>('season')
  const [data, setData] = useState<LeagueData | null>(null)
  const [myId, setMyId] = useState<number | undefined>()
  const [error, setError] = useState('')

  const fetchLeaderboard = useCallback(async () => {
    const res = await fetch(`/api/leaderboard?join_code=${code}&mode=${mode}`)
    if (!res.ok) { setError('League not found.'); return }
    setData(await res.json())
  }, [code, mode])

  useEffect(() => {
    setMyId(getMyPlayerId())
    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 30_000)
    return () => clearInterval(interval)
  }, [fetchLeaderboard])

  if (error) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center font-body text-navy">
        {error}
      </main>
    )
  }

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* League header */}
        <div className="bg-navy text-foam p-4 mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-headline text-4xl text-beer-gold tracking-wider">
              {data?.league.name ?? '...'}
            </h1>
            <p className="font-body text-sm text-foam/70">
              Code: <span className="font-mono font-bold text-foam">{code}</span>
            </p>
          </div>
          <button
            onClick={() => router.push('/log')}
            className="bg-league-red text-foam font-headline text-xl px-4 py-2 hover:bg-beer-gold hover:text-navy transition-colors"
          >
            LOG PINT
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex border-2 border-navy mb-4 overflow-hidden">
          {(['season', 'alltime'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 font-headline text-lg py-2 tracking-wider transition-colors ${
                mode === m
                  ? 'bg-navy text-beer-gold'
                  : 'bg-cream text-navy hover:bg-navy/10'
              }`}
            >
              {m === 'season' ? 'THIS SEASON' : 'ALL TIME'}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {data ? (
          <LeaderboardTable scores={data.scores} currentPlayerId={myId} />
        ) : (
          <p className="text-center font-body text-navy/50 py-8">Loading the table...</p>
        )}
      </main>
    </>
  )
}
