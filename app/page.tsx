'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function JoinPage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Cookie-based auto-redirect if already in a league
    const cookie = document.cookie
      .split('; ')
      .find(r => r.startsWith('brewmier_player='))
    if (cookie) {
      try {
        const data = JSON.parse(atob(cookie.split('=').slice(1).join('=')))
        if (data.joinCode) router.push(`/league/${data.joinCode}`)
      } catch {}
    }
  }, [router])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          join_code: joinCode.trim().toUpperCase(),
          display_name: displayName.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      router.push(`/league/${(data.league.join_code as string)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-league-red flex flex-col items-center justify-center p-4">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <div className="bg-foam rounded-full p-2 shadow-[0_0_0_4px_#D8A031] overflow-hidden">
            <Image src="/logo.png" alt="Brewmier League" width={80} height={80} priority />
          </div>
        </div>
        <h1 className="font-headline text-6xl text-beer-gold tracking-widest leading-none">
          BREWMIER
        </h1>
        <h2 className="font-headline text-4xl text-foam tracking-widest">
          LEAGUE
        </h2>
        <p className="font-body text-foam/80 mt-2 text-sm">
          Log pints. Climb tables. Become legend.
        </p>
      </div>

      {/* Card */}
      <div className="bg-cream border-4 border-navy w-full max-w-sm shadow-[4px_4px_0px_#112240]">
        {/* Card header */}
        <div className="bg-navy px-6 py-3">
          <p className="font-headline text-beer-gold text-xl tracking-wider">
            JOIN YOUR LEAGUE
          </p>
        </div>

        <form onSubmit={handleJoin} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-body font-bold text-navy uppercase tracking-widest mb-1">
              League Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. PUB01"
              required
              className="w-full border-2 border-navy bg-foam px-3 py-2 font-headline text-2xl text-navy tracking-widest focus:outline-none focus:border-league-red"
            />
          </div>
          <div>
            <label className="block text-xs font-body font-bold text-navy uppercase tracking-widest mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Dave"
              required
              maxLength={32}
              className="w-full border-2 border-navy bg-foam px-3 py-2 font-body text-navy focus:outline-none focus:border-league-red"
            />
          </div>

          {error && (
            <p className="text-league-red font-body text-sm font-semibold">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-beer-gold font-headline text-2xl tracking-widest py-3 hover:bg-league-red disabled:opacity-50 transition-colors"
          >
            {loading ? 'SIGNING ON...' : 'SIGN ON'}
          </button>
        </form>
      </div>
    </main>
  )
}
