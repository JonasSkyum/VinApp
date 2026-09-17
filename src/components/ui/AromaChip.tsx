import type { Catalog } from '@/engine'
import { AROMA_FAMILY } from '@/lib/palette'
import type { Descriptor } from '@/schema'

interface AromaChipProps {
  descriptor: Descriptor
  size?: 'sm' | 'md'
  /** Dashed outline for aromas that only one wine in a comparison has. */
  outline?: 'partial' | 'primary'
}

/** Aroma chip: the family icon carries the family, the text carries the aroma. */
export function AromaChip({ descriptor, size = 'md', outline }: AromaChipProps) {
  const family = AROMA_FAMILY[descriptor.cluster]
  const icon = size === 'sm' ? 20 : 24
  const border =
    outline === 'partial'
      ? 'border-[1.5px] border-dashed border-partial'
      : outline === 'primary'
        ? 'border-[1.5px] border-primary-ink'
        : 'border border-line'
  return (
    <span
      title={family.name}
      className={`bg-surface-2 inline-flex items-center gap-1.5 rounded-full py-[3px] pr-[11px] pl-[3px] ${border} ${size === 'sm' ? 'text-xs' : 'text-[13px]'} font-bold`}
    >
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 items-center justify-center rounded-full"
        style={{ width: icon, height: icon, background: family.tint }}
      >
        <svg
          width={icon * 0.58}
          height={icon * 0.58}
          viewBox="0 0 24 24"
          fill="none"
          stroke={family.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={family.path} />
        </svg>
      </span>
      {descriptor.name}
    </span>
  )
}

/** Wrapping row of chips for a list of descriptor ids. */
export function AromaChips({
  ids,
  catalog,
  size,
}: {
  ids: readonly string[]
  catalog: Catalog
  size?: 'sm' | 'md'
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <AromaChip key={id} descriptor={catalog.descriptor(id)} size={size} />
      ))}
    </div>
  )
}
