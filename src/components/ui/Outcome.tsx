import type { Outcome } from '@/engine'
import { OUTCOME_TONE } from '@/lib/palette'
import { HalfIcon, Icon } from './Icon'

/** Check / half circle / cross, colour plus shape. */
export function OutcomeIcon({
  outcome,
  size = 14,
  strokeWidth = 3,
}: {
  outcome: Outcome
  size?: number
  strokeWidth?: number
}) {
  if (outcome === 'partial') return <HalfIcon size={size} />
  if (outcome === 'correct') return <Icon name="check" size={size} strokeWidth={strokeWidth} />
  if (outcome === 'wrong') return <Icon name="x" size={size} strokeWidth={strokeWidth} />
  return <Icon name="minus" size={size} strokeWidth={strokeWidth} />
}

/** "Rigtigt" / "Delvist" / "Forkert" pill with icon and text. */
export function OutcomePill({ outcome }: { outcome: Outcome }) {
  const tone = OUTCOME_TONE[outcome]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-extrabold ${tone.bg} ${tone.fg}`}
    >
      <OutcomeIcon outcome={outcome} />
      {tone.label}
    </span>
  )
}

/** Square tile for the daily share grid. */
export function OutcomeTile({ outcome, label }: { outcome: Outcome; label: string }) {
  const bg =
    outcome === 'correct'
      ? 'bg-ok-fill text-white'
      : outcome === 'partial'
        ? 'bg-partial-fill text-bordeaux-ink'
        : 'bg-miss text-white'
  const word = OUTCOME_TONE[outcome].label.toLowerCase()
  return (
    <div
      role="listitem"
      aria-label={`${label}: ${word}`}
      className="flex flex-col items-center gap-1.5"
    >
      <div
        className={`flex aspect-square w-full items-center justify-center rounded-[14px] ${bg}`}
        style={{ boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.15)' }}
      >
        <OutcomeIcon outcome={outcome} size={22} />
      </div>
      <span className="text-ink-2 text-[11px] font-bold">{label}</span>
    </div>
  )
}
