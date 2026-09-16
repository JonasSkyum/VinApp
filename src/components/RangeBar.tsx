import { da } from '@/i18n/da'
import { rangeLabel } from '@/lib/labels'
import { interpolate } from '@/lib/text'
import type { Level, Range, StructureKey } from '@/schema'

interface RangeBarProps {
  attribute: StructureKey
  range: Range
  /** Visually emphasise the row (used in comparisons where the attribute differs). */
  emphasis?: boolean
  /** Hide the attribute name, e.g. in side-by-side tables that print it once. */
  hideName?: boolean
}

const STEPS: Level[] = [1, 2, 3, 4, 5]

/** Five segments with the [min, max] interval filled in. */
export function RangeBar({ attribute, range, emphasis = false, hideName = false }: RangeBarProps) {
  const label = rangeLabel(attribute, range)
  return (
    <div
      role="img"
      aria-label={interpolate(da.tastingCard.scaleAria, {
        attribute: da.attribute[attribute],
        value: label,
      })}
      className={`flex items-center gap-3 ${emphasis ? 'font-semibold' : ''}`}
    >
      {!hideName && (
        <span className="text-wine-900/80 w-28 shrink-0 text-sm">{da.attribute[attribute]}</span>
      )}
      <div className="flex flex-1 gap-1">
        {STEPS.map((step) => {
          const inRange = step >= range[0] && step <= range[1]
          return (
            <span
              key={step}
              className={`h-2.5 flex-1 rounded-sm ${
                inRange ? (emphasis ? 'bg-wine-700' : 'bg-wine-500') : 'bg-wine-200'
              }`}
            />
          )
        })}
      </div>
      <span className="text-wine-900 w-28 shrink-0 text-right text-xs">{label}</span>
    </div>
  )
}
