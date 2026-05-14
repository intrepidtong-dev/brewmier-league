'use client'

import { useState } from 'react'
import NavBar from '@/components/NavBar'

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [form, setForm] = useState({ name: '', join_code: '', season_start: '', season_end: '' })
  const [msg, setMsg] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/leagues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
      body: JSON.stringify({
        name: form.name,
        join_code: form.join_code.toUpperCase(),
        season_start: form.season_start || undefined,
        season_end: form.season_end || undefined,
      }),
    })
    const data = await res.json()
    if (res.status === 201) {
      setMsg(`League "${data.name}" created. Join code: ${data.join_code}`)
      setForm({ name: '', join_code: '', season_start: '', season_end: '' })
    } else if (res.status === 401) {
      setMsg('Wrong admin secret.')
      setAuthenticated(false)
    } else {
      setMsg(data.error ?? 'Error creating league.')
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    // Test secret by attempting a POST with intentionally missing fields to get a 400 (not 401)
    const res = await fetch('/api/leagues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
      body: JSON.stringify({}), // missing name/join_code → will get 400 if auth passes, 401 if auth fails
    })
    if (res.status === 401) {
      setMsg('Wrong admin secret.')
      return
    }
    // Any non-401 response (including 400 for missing fields) means the secret is valid
    setAuthenticated(true)
    setMsg('')
  }

  if (!authenticated) {
    return (
      <>
        <NavBar />
        <main className="max-w-md mx-auto px-4 py-12">
          <div className="bg-navy text-foam p-4 mb-6">
            <h1 className="font-headline text-4xl text-beer-gold tracking-wider">ADMIN</h1>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-body font-bold text-navy uppercase tracking-widest mb-1">
                Admin Secret
              </label>
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                required
                className="w-full border-2 border-navy bg-foam px-3 py-2 font-body text-navy focus:outline-none focus:border-league-red"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-navy text-beer-gold font-headline text-xl py-3 tracking-widest hover:bg-league-red transition-colors"
            >
              ENTER
            </button>
            {msg && <p className="text-league-red font-body text-sm font-semibold">{msg}</p>}
          </form>
        </main>
      </>
    )
  }

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-navy text-foam p-4 mb-6">
          <h1 className="font-headline text-4xl text-beer-gold tracking-wider">ADMIN PANEL</h1>
        </div>

        <div className="border-2 border-navy bg-foam p-6">
          <h2 className="font-headline text-2xl text-navy tracking-wider mb-4">CREATE LEAGUE</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body font-bold text-navy uppercase tracking-widest mb-1">
                  League Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Pub FC"
                  className="w-full border-2 border-navy bg-cream px-3 py-2 font-body text-navy focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-body font-bold text-navy uppercase tracking-widest mb-1">
                  Join Code
                </label>
                <input
                  type="text"
                  value={form.join_code}
                  onChange={e => setForm(f => ({ ...f, join_code: e.target.value.toUpperCase() }))}
                  required
                  placeholder="PUB01"
                  className="w-full border-2 border-navy bg-cream px-3 py-2 font-headline text-navy tracking-widest focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body font-bold text-navy uppercase tracking-widest mb-1">
                  Season Start (optional)
                </label>
                <input
                  type="date"
                  value={form.season_start}
                  onChange={e => setForm(f => ({ ...f, season_start: e.target.value }))}
                  className="w-full border-2 border-navy bg-cream px-3 py-2 font-body text-navy focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-body font-bold text-navy uppercase tracking-widest mb-1">
                  Season End (optional)
                </label>
                <input
                  type="date"
                  value={form.season_end}
                  onChange={e => setForm(f => ({ ...f, season_end: e.target.value }))}
                  className="w-full border-2 border-navy bg-cream px-3 py-2 font-body text-navy focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-league-red text-foam font-headline text-xl py-3 tracking-widest hover:bg-navy transition-colors"
            >
              CREATE LEAGUE
            </button>
          </form>
          {msg && (
            <p className={`mt-4 font-body text-sm font-semibold ${msg.includes('created') ? 'text-navy' : 'text-league-red'}`}>
              {msg}
            </p>
          )}
        </div>
      </main>
    </>
  )
}
