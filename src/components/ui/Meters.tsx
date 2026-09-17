import { masteryTone } from '@/lib/palette'

interface ProgressBarProps {
  /** 0–1 */
  value: number
  /** Extra share shown in amber on top, e.g. XP "on the way". */
  pending?: number
  height?: number
  /** Light bar for bordeaux backgrounds. */
  inverted?: boolean
  label?: string
  max?: number
  now?: number
}

export function ProgressBar({
  value,
  pending = 0,
  height = 8,
  inverted = false,
  label,
  max,
  now,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value * 100))
  const pendingPct = Math.max(0, Math.min(100 - pct, pending * 100))
  return (
    <div
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? max : undefined}
      aria-valuenow={label ? now : undefined}
      className={`relative w-full overflow-hidden rounded-full ${inverted ? 'bg-white/20' : 'bg-track'}`}
      style={{ height }}
    >
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${inverted ? 'bg-paper' : 'bg-primary'}`}
        style={{ width: `${pct}%` }}
      />
      {pendingPct > 0 && (
        <div
          className="bg-partial-fill absolute inset-y-0"
          style={{ left: `${pct}%`, width: `${pendingPct}%` }}
        />
      )}
    </div>
  )
}

interface RingProps {
  /** 0–100 */
  percent: number
  size?: 56 | 48 | 72
  label?: string
}

/** Mastery ring: amber under 40 %, bordeaux to 75 %, green above. The number is always printed. */
export function Ring({ percent, size = 56, label }: RingProps) {
  const stroke = size >= 72 ? 7 : 6
  const r = size / 2 - stroke / 2 - 1
  const c = 2 * Math.PI * r
  const tone = masteryTone(percent)
  const color =
    tone === 'ok' ? 'var(--ok)' : tone === 'partial' ? 'var(--partial-fill)' : 'var(--scale-on)'
  return (
    <div
      role="img"
      aria-label={label ? `${label}: ${percent} %` : `${percent} %`}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--track)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(c * percent) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-extrabold tabular-nums"
        style={{ fontSize: size >= 72 ? 17 : 13 }}
      >
        {percent}%
      </span>
    </div>
  )
}

/** Segmented progress: one cell per question, coloured by outcome. */
export function SegmentProgress({
  total,
  results,
  height = 6,
}: {
  total: number
  results: readonly ('ok' | 'bad')[]
  height?: number
}) {
  return (
    <div
      className="grid flex-1 gap-0.5"
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: total }, (_, i) => {
        const r = results[i]
        const cls =
          r === 'ok'
            ? 'bg-ok'
            : r === 'bad'
              ? 'bg-wrong'
              : i === results.length
                ? 'bg-primary-ink'
                : 'bg-track'
        return <span key={i} className={`rounded-sm ${cls}`} style={{ height }} />
      })}
    </div>
  )
}
