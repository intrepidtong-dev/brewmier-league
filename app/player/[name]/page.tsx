import NavBar from '@/components/NavBar'
import { getPlayerByName, getLeagueByCode, getEntriesByPlayer, getPlayersByLeague, getEntriesByLeague, getScoringRules } from '@/lib/db'
import { computeScores } from '@/lib/scoring'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

type Props = { params: { name: string } }

function formatLocalTime(loggedAt: string, tzOffsetMins: number): string {
  const utc = new Date(loggedAt).getTime()
  const local = new Date(utc + tzOffsetMins * 60 * 1000)
  return local.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export default function PlayerProfilePage({ params }: Props) {
  const cookieStore = cookies()
  const raw = cookieStore.get('brewmier_player')?.value
  let joinCode: string | undefined
  try {
    if (raw) joinCode = JSON.parse(Buffer.from(raw, 'base64').toString()).joinCode
  } catch {}

  if (!joinCode) notFound()

  const league = getLeagueByCode(joinCode)
  if (!league) notFound()

  const playerName = decodeURIComponent(params.name)
  const player = getPlayerByName(league.id, playerName)
  if (!player) notFound()

  const entries = getEntriesByPlayer(player.id)
  const allPlayers = getPlayersByLeague(league.id)
  const allEntries = getEntriesByLeague(league.id)
  const rules = getScoringRules(league.id)
  const seasonScores = computeScores(allPlayers, allEntries, rules, league)
  const mySeasonScore = seasonScores.find(s => s.player_id === player.id)
  const seasonRank = seasonScores.findIndex(s => s.player_id === player.id) + 1

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Player header */}
        <div className="bg-navy text-foam p-5 mb-4">
          <p className="font-body text-xs text-foam/50 uppercase tracking-widest mb-1">Player Profile</p>
          <h1 className="font-headline text-5xl text-beer-gold tracking-wider">
            {player.display_name.toUpperCase()}
          </h1>
          <p className="font-body text-sm text-foam/70 mt-1">
            {league.name}
          </p>
        </div>

        {/* Stat blocks */}
        <div className="grid grid-cols-3 gap-0 border-2 border-navy mb-4">
          {[
            { label: 'Season Rank', value: seasonRank > 0 ? `#${seasonRank}` : '–' },
            { label: 'Season Pts', value: mySeasonScore?.points ?? 0 },
            { label: 'Total Pints', value: entries.length },
          ].map(({ label, value }) => (
            <div key={label} className="text-center py-4 border-r-2 last:border-r-0 border-navy bg-foam">
              <div className="font-headline text-4xl text-league-red">{value}</div>
              <div className="font-body text-xs text-navy/60 uppercase tracking-wide mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Entry log */}
        <div className="border-2 border-navy">
          <div className="bg-navy px-4 py-2">
            <h2 className="font-headline text-xl text-beer-gold tracking-wider">MATCH LOG</h2>
          </div>
          {entries.length === 0 ? (
            <p className="text-center font-body text-navy/50 py-6">No pints logged yet.</p>
          ) : (
            entries.map(entry => (
              <div
                key={entry.id}
                className="border-t-2 border-navy/20 px-4 py-3 bg-foam odd:bg-cream"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-body font-semibold text-navy">
                      🍺 {entry.venue ?? 'Undisclosed location'}
                    </p>
                    {entry.notes && (
                      <p className="font-body text-sm text-navy/60">{entry.notes}</p>
                    )}
                  </div>
                  <p className="font-body text-xs text-navy/50 text-right whitespace-nowrap ml-4">
                    {formatLocalTime(entry.logged_at, entry.timezone_offset)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  )
}
