import { da } from '@/i18n/da'
import { levelLabel, rangeLabel } from '@/lib/labels'
import { interpolate } from '@/lib/text'
import type { Level, Range, StructureKey } from '@/schema'

const STEPS: Level[] = [1, 2, 3, 4, 5]

type Tone = 'primary' | 'guess'

interface SegmentsProps {
  /** A single level, or a [min, max] interval. */
  value: Level | Range
  tone?: Tone
  height?: number
  gap?: number
}

/**
 * Five segments. Below the value: muted; at the value (or inside the interval): strong;
 * above: track. The "guess" tone is striped amber so a comparison never relies on hue alone.
 */
export function Segments({ value, tone = 'primary', height = 10, gap = 3 }: SegmentsProps) {
  const [min, max] = Array.isArray(value) ? value : [value, value]
  return (
    <div className="grid grid-cols-5" style={{ gap }}>
      {STEPS.map((step) => {
        let cls: string
        if (step > max) cls = 'bg-track'
        else if (step >= min) cls = tone === 'guess' ? 'bg-partial-fill' : 'bg-scale-on'
        else cls = tone === 'guess' ? 'stripe-partial' : 'bg-scale-mid'
        return <span key={step} className={`rounded-[3px] ${cls}`} style={{ height }} />
      })}
    </div>
  )
}

interface ScaleRowProps {
  attribute: StructureKey
  value: Level | Range
  tone?: Tone
  /** Overrides the attribute name in the first column (e.g. a wine name in comparisons). */
  name?: string
  nameClassName?: string
  size?: 'full' | 'mini'
  /** Bold row for attributes that matter in a comparison. */
  emphasis?: boolean
}

/** Label · five segments · value text. Colour is never the only carrier of meaning. */
export function ScaleRow({
  attribute,
  value,
  tone = 'primary',
  name,
  nameClassName = '',
  size = 'full',
  emphasis = false,
}: ScaleRowProps) {
  const text = Array.isArray(value) ? rangeLabel(attribute, value) : levelLabel(attribute, value)
  const label = name ?? da.attribute[attribute]
  const mini = size === 'mini'
  return (
    <div
      role="img"
      aria-label={interpolate(da.tastingCard.scaleAria, { attribute: label, value: text })}
      className={`grid items-center gap-2 ${mini ? 'grid-cols-[76px_minmax(0,1fr)_64px]' : 'grid-cols-[72px_minmax(0,1fr)_72px]'}`}
    >
      <span
        className={`truncate text-[13px] ${emphasis ? 'text-ink font-extrabold' : 'text-ink-2 font-semibold'} ${nameClassName}`}
      >
        {label}
      </span>
      <Segments value={value} tone={tone} height={mini ? 8 : 10} />
      <span className="text-right text-[13px] leading-tight font-extrabold">{text}</span>
    </div>
  )
}

/** Column headings for a block of scale rows: "lav … høj". */
export function ScaleHeader({ label, size = 'full' }: { label: string; size?: 'full' | 'mini' }) {
  const mini = size === 'mini'
  return (
    <div
      aria-hidden="true"
      className={`grid items-end gap-2 ${mini ? 'grid-cols-[76px_minmax(0,1fr)_64px]' : 'grid-cols-[72px_minmax(0,1fr)_72px]'}`}
    >
      <span className="text-ink-2 text-[11px] font-extrabold tracking-[0.08em] uppercase">
        {label}
      </span>
      <div className="text-ink-3 flex justify-between text-[10px] font-bold">
        <span>{da.scale[1]}</span>
        <span>{da.scale[5]}</span>
      </div>
      <span />
    </div>
  )
}

/** Three-way oak indicator: Ingen · Let · Tydelig. */
export function OakToggle({
  oak,
  compact = false,
}: {
  oak: 'none' | 'light' | 'pronounced'
  compact?: boolean
}) {
  const items = [
    ['none', da.oakShort.none],
    ['light', da.oakShort.light],
    ['pronounced', da.oakShort.pronounced],
  ] as const
  return (
    <div
      role="img"
      aria-label={`${da.lexicon.oak}: ${da.oak[oak]}`}
      className="bg-surface-2 grid grid-cols-3 gap-1 rounded-[11px] p-[3px]"
    >
      {items.map(([id, label]) => (
        <span
          key={id}
          className={`rounded-lg text-center text-[13px] ${compact ? 'py-1' : 'py-[5px]'} ${
            id === oak
              ? 'bg-surface text-primary-ink shadow-card font-extrabold'
              : 'text-ink-3 font-semibold'
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  )
}
