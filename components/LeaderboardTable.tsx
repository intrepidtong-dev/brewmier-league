import type { PlayerScore } from '@/lib/scoring'

type Props = {
  scores: PlayerScore[]
  currentPlayerId?: number
}

const medals = ['🥇', '🥈', '🥉']

export default function LeaderboardTable({ scores, currentPlayerId }: Props) {
  if (scores.length === 0) {
    return (
      <p className="text-center text-navy/60 font-body py-8">
        No players yet. Share the join code to get started.
      </p>
    )
  }

  return (
    <div className="border-2 border-navy rounded overflow-hidden">
      {/* Header */}
      <div className="bg-navy text-foam grid grid-cols-[3rem_1fr_5rem_5rem] px-4 py-2 text-sm font-body font-semibold uppercase tracking-wide">
        <span>#</span>
        <span>Player</span>
        <span className="text-center">Pints</span>
        <span className="text-center">Pts</span>
      </div>

      {/* Rows */}
      {scores.map((s, i) => {
        const isMe = s.player_id === currentPlayerId
        return (
          <div
            key={s.player_id}
            className={`grid grid-cols-[3rem_1fr_5rem_5rem] px-4 py-3 border-t-2 border-navy/20 items-center font-body ${
              isMe ? 'bg-beer-gold/20 font-semibold' : i % 2 === 0 ? 'bg-foam' : 'bg-cream'
            }`}
          >
            <span className="text-lg">{medals[i] ?? `${i + 1}`}</span>
            <a
              href={`/player/${encodeURIComponent(s.display_name)}`}
              className="hover:underline text-navy"
            >
              {s.display_name}
              {isMe && <span className="ml-2 text-xs text-beer-gold font-bold">YOU</span>}
            </a>
            <span className="text-center font-headline text-xl text-league-red">
              {s.beer_count}
            </span>
            <span className="text-center font-headline text-xl text-navy">
              {s.points}
            </span>
          </div>
        )
      })}
    </div>
  )
}
