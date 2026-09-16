import { da } from '@/i18n/da'
import { interpolate } from '@/lib/text'
import type { Level, StructureKey } from '@/schema'
import { levelLabel } from './labels'

interface ScaleBarProps {
  attribute: StructureKey
  value: Level
}

const STEPS: Level[] = [1, 2, 3, 4, 5]

/** Five-segment bar with the Danish level label. Colour is never the only carrier of meaning. */
export function ScaleBar({ attribute, value }: ScaleBarProps) {
  const label = levelLabel(attribute, value)
  return (
    <div
      role="img"
      aria-label={interpolate(da.tastingCard.scaleAria, {
        attribute: da.attribute[attribute],
        value: label,
      })}
      className="flex items-center gap-3"
    >
      <span className="text-wine-900/80 w-28 shrink-0 text-sm">{da.attribute[attribute]}</span>
      <div className="flex flex-1 gap-1">
        {STEPS.map((step) => (
          <span
            key={step}
            className={`h-2.5 flex-1 rounded-sm ${step <= value ? 'bg-wine-600' : 'bg-wine-200'}`}
          />
        ))}
      </div>
      <span className="text-wine-900 w-20 shrink-0 text-right text-sm font-medium">{label}</span>
    </div>
  )
}
