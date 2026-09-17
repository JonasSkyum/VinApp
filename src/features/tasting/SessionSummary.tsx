import { CountUp } from '@/components/CountUp'
import { Button } from '@/components/ui/Button'
import { Card, Heading } from '@/components/ui/Card'
import type { RoundScore } from '@/engine'
import { da } from '@/i18n/da'
import { interpolate } from '@/lib/text'
import { ratio, tierStats, type TierStat } from './stats'

interface SessionSummaryProps {
  scores: RoundScore[]
  onPlayAgain: () => void
  onNewSession: () => void
}

/** Wine drops raining over the reward card for a perfect session. */
const DROPS = [
  [8, 12, -20, 1],
  [22, 70, 15, 0.8],
  [14, 108, 40, 1.1],
  [80, 18, -10, 0.9],
  [86, 96, 25, 1.2],
  [70, 60, -35, 0.7],
  [40, 8, 10, 0.8],
  [56, 118, -15, 1],
  [92, 50, 30, 0.8],
  [30, 40, -40, 0.6],
] as const
const DROP_COLORS = ['#E8CF4E', '#F2A594', '#FBF5E9', '#E2849F', '#DDB343']

export function SessionSummary({ scores, onPlayAgain, onNewSession }: SessionSummaryProps) {
  const total = scores.reduce((sum, s) => sum + s.total, 0)
  const max = scores.reduce((sum, s) => sum + s.max, 0)
  const stats = tierStats(scores)
  const best = stats.reduce((a, b) => (ratio(b) > ratio(a) ? b : a), stats[0]!)
  const worst = stats.reduce((a, b) => (ratio(b) < ratio(a) ? b : a), stats[0]!)
  const perfect = total === max && max > 0

  return (
    <section aria-labelledby="summary-title" className="flex flex-col gap-4">
      <Heading as="h2" id="summary-title" size="lg">
        {da.summary.title}
      </Heading>

      <div
        className={`relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-[24px] px-5 py-7 text-center ${
          perfect
            ? 'bg-primary text-on-primary shadow-float'
            : 'border-line bg-surface shadow-card border'
        }`}
      >
        {perfect &&
          DROPS.map(([x, y, r, s], i) => (
            <svg
              key={i}
              width="12"
              height="17"
              viewBox="0 0 12 17"
              aria-hidden="true"
              className="absolute"
              style={{ left: `${x}%`, top: y, transform: `rotate(${r}deg) scale(${s})` }}
            >
              <path
                d="M6 0C6 0 0 7 0 11a6 6 0 0 0 12 0C12 7 6 0 6 0z"
                fill={DROP_COLORS[i % DROP_COLORS.length]}
              />
            </svg>
          ))}
        <span
          className={`relative text-xs font-extrabold tracking-[0.1em] ${perfect ? '' : 'text-ink-2'}`}
        >
          {perfect ? da.result.perfectRound : da.summary.total}
        </span>
        <span
          className={`relative font-serif text-5xl font-semibold tabular-nums ${perfect ? '' : 'text-primary-ink'}`}
        >
          <CountUp value={total} durationSeconds={1.2} />
          <span className={`text-xl ${perfect ? 'opacity-90' : 'text-ink-2'}`}> / {max}</span>
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Stat label={da.summary.bestTier} stat={best} tone="ok" />
        <Stat label={da.summary.worstTier} stat={worst} tone="partial" />
      </dl>

      <Card as="section" className="flex flex-col gap-2 rounded-[22px]">
        <Heading as="h3" size="sm">
          {da.summary.perRound}
        </Heading>
        <ol className="flex flex-wrap gap-2">
          {scores.map((s, i) => (
            <li
              key={i}
              className="border-line bg-surface-2 rounded-full border px-3 py-1.5 text-sm font-bold tabular-nums"
            >
              {da.common.round} {i + 1}: {s.total}/{s.max}
            </li>
          ))}
        </ol>
      </Card>

      <div className="flex gap-2.5">
        <Button className="flex-1" onClick={onPlayAgain}>
          {da.common.playAgain}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onNewSession}>
          {da.common.newSession}
        </Button>
      </div>
    </section>
  )
}

function Stat({ label, stat, tone }: { label: string; stat: TierStat; tone: 'ok' | 'partial' }) {
  return (
    <Card className="flex flex-col gap-1 rounded-[20px]">
      <dt className="text-ink-2 text-xs font-bold">{label}</dt>
      <dd className="flex flex-col">
        <span className="font-serif text-lg font-semibold">{da.tier.short[stat.tier]}</span>
        <span className={`text-sm font-extrabold ${tone === 'ok' ? 'text-ok' : 'text-partial'}`}>
          {interpolate(da.summary.accuracy, { percent: Math.round(ratio(stat) * 100) })}
        </span>
      </dd>
    </Card>
  )
}
