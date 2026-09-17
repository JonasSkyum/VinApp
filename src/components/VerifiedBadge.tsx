import { da } from '@/i18n/da'
import { Icon } from './ui/Icon'

interface VerifiedBadgeProps {
  verified: boolean
  /** Render the compact pill (lists) instead of the explanatory box (pages). */
  compact?: boolean
}

/** Marks content the developer has not yet reviewed against sources. Renders nothing when verified. */
export function VerifiedBadge({ verified, compact = false }: VerifiedBadgeProps) {
  if (verified) return null
  if (compact) {
    return (
      <span
        title={da.lexicon.unverifiedHelp}
        className="border-ink-3 text-ink-2 inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed px-2 py-[3px] text-[11px] font-bold"
      >
        <Icon name="info" size={11} strokeWidth={2.4} />
        {da.lexicon.unverified}
      </span>
    )
  }
  return (
    <p className="bg-partial-soft text-partial flex items-start gap-2 rounded-2xl px-3 py-2 text-sm">
      <Icon name="info" size={16} strokeWidth={2.2} className="mt-0.5 shrink-0" />
      <span>
        <strong>{da.lexicon.unverified}.</strong> {da.lexicon.unverifiedHelp}
      </span>
    </p>
  )
}
