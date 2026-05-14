'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'

export default function LogPage() {
  const router = useRouter()
  const [venue, setVenue] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; warning?: string; error?: string } | null>(null)

  function getTimezoneOffset(): number {
    return -new Date().getTimezoneOffset() // minutes east of UTC
  }

  function getJoinCode(): string | undefined {
    const cookie = document.cookie.split('; ').find(r => r.startsWith('brewmier_player='))
    if (!cookie) return undefined
    try { return JSON.parse(atob(cookie.split('=').slice(1).join('='))).joinCode } catch { return undefined }
  }

  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timezone_offset: getTimezoneOffset(),
          venue: venue.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.status === 201) {
        setResult({ success: true })
        setVenue('')
        setNotes('')
      } else if (res.status === 409 && data.warning) {
        setResult({ warning: data.message })
      } else if (res.status === 401) {
        router.push('/')
      } else {
        setResult({ error: data.error ?? 'Something went wrong.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <NavBar />
      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-navy text-foam p-4 mb-6">
          <h1 className="font-headline text-4xl text-beer-gold tracking-wider">
            LOG A PINT
          </h1>
          <p className="font-body text-sm text-foam/70 mt-1">
            Real time only. No backdating. League rules apply.
          </p>
        </div>

        {result?.success && (
          <div className="bg-beer-gold text-navy border-2 border-navy p-4 mb-4 font-body font-semibold">
            <span className="font-headline text-xl">ABSOLUTE SCENES.</span>{' '}
            Pint logged. Get on it.
            <button
              onClick={() => router.push(`/league/${getJoinCode()}`)}
              className="block mt-2 underline text-sm font-normal"
            >
              Back to the table &rarr;
            </button>
          </div>
        )}

        {result?.warning && (
          <div className="bg-league-red text-foam border-2 border-navy p-4 mb-4 font-body">
            <span className="font-headline text-xl">STEADY ON.</span>{' '}
            {result.warning}
          </div>
        )}

        {result?.error && (
          <div className="bg-league-red text-foam border-2 border-navy p-4 mb-4 font-body">
            {result.error}
          </div>
        )}

        <form onSubmit={handleLog} className="space-y-5">
          <div>
            <label className="block text-xs font-body font-bold text-navy uppercase tracking-widest mb-1">
              Venue / Location
            </label>
            <input
              type="text"
              value={venue}
              onChange={e => setVenue(e.target.value)}
              placeholder="e.g. The Crown, Wembley, Dave's sofa"
              maxLength={200}
              className="w-full border-2 border-navy bg-foam px-3 py-3 font-body text-navy focus:outline-none focus:border-league-red"
            />
          </div>

          <div>
            <label className="block text-xs font-body font-bold text-navy uppercase tracking-widest mb-1">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Guinness, what a pint"
              maxLength={200}
              className="w-full border-2 border-navy bg-foam px-3 py-2 font-body text-navy focus:outline-none focus:border-league-red"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-league-red text-foam font-headline text-3xl tracking-widest py-4 hover:bg-navy disabled:opacity-50 transition-colors"
          >
            {loading ? 'LOGGING...' : '🍺 LOG PINT'}
          </button>
        </form>
      </main>
    </>
  )
}
