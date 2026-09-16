import { CountUp } from '@/components/CountUp'
import type { RoundScore } from '@/engine'
import { da } from '@/i18n/da'
import { interpolate } from '@/lib/text'
import { ratio, tierStats, type TierStat } from './stats'

interface SessionSummaryProps {
  scores: RoundScore[]
  onPlayAgain: () => void
  onNewSession: () => void
}

export function SessionSummary({ scores, onPlayAgain, onNewSession }: SessionSummaryProps) {
  const total = scores.reduce((sum, s) => sum + s.total, 0)
  const max = scores.reduce((sum, s) => sum + s.max, 0)
  const stats = tierStats(scores)
  const best = stats.reduce((a, b) => (ratio(b) > ratio(a) ? b : a), stats[0]!)
  const worst = stats.reduce((a, b) => (ratio(b) < ratio(a) ? b : a), stats[0]!)

  return (
    <section aria-labelledby="summary-title" className="space-y-5">
      <h2 id="summary-title" className="text-wine-800 text-2xl font-bold">
        {da.summary.title}
      </h2>

      <div className="border-wine-200 rounded-xl border bg-white p-5 text-center shadow-sm">
        <p className="text-wine-900/70 text-sm">{da.summary.total}</p>
        <p className="text-wine-800 text-5xl font-bold">
          <CountUp value={total} durationSeconds={1.2} />
          <span className="text-wine-900/70 text-xl font-normal"> / {max}</span>
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Stat label={da.summary.bestTier} stat={best} />
        <Stat label={da.summary.worstTier} stat={worst} />
      </dl>

      <div>
        <h3 className="text-wine-800 mb-2 font-semibold">{da.summary.perRound}</h3>
        <ol className="flex flex-wrap gap-2">
          {scores.map((s, i) => (
            <li
              key={i}
              className="border-wine-200 rounded-lg border bg-white px-3 py-2 text-sm tabular-nums"
            >
              {da.common.round} {i + 1}: {s.total}/{s.max}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPlayAgain}
          className="bg-wine-700 hover:bg-wine-800 flex-1 rounded-lg px-4 py-3 font-semibold text-white"
        >
          {da.common.playAgain}
        </button>
        <button
          type="button"
          onClick={onNewSession}
          className="border-wine-300 text-wine-800 flex-1 rounded-lg border px-4 py-3"
        >
          {da.common.newSession}
        </button>
      </div>
    </section>
  )
}

function Stat({ label, stat }: { label: string; stat: TierStat }) {
  return (
    <div className="border-wine-200 rounded-xl border bg-white p-3">
      <dt className="text-wine-900/70">{label}</dt>
      <dd className="text-wine-800 font-semibold">
        {da.tier.short[stat.tier]} ·{' '}
        {interpolate(da.summary.accuracy, { percent: Math.round(ratio(stat) * 100) })}
      </dd>
    </div>
  )
}
