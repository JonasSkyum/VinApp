import { da } from '@/i18n/da'

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
        className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
      >
        {da.lexicon.unverified}
      </span>
    )
  }
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <strong>{da.lexicon.unverified}.</strong> {da.lexicon.unverifiedHelp}
    </p>
  )
}
