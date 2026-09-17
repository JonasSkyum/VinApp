import { useState } from 'react'
import { AromaChips } from '@/components/ui/AromaChip'
import { Card, Divider, Heading, Label } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { OakToggle, ScaleHeader, ScaleRow } from '@/components/ui/SegmentScale'
import { ColorDot, WineGlass } from '@/components/ui/WineGlass'
import type { Catalog, TastingCase } from '@/engine'
import { da } from '@/i18n/da'
import { appearanceLabel, levelLabel } from '@/lib/labels'
import { APPEARANCE_HEX } from '@/lib/palette'
import { capitalize, interpolate } from '@/lib/text'
import type { StructureKey } from '@/schema'

interface TastingCardProps {
  tastingCase: TastingCase
  catalog: Catalog
  /** Wide layout: always expanded, no toggle. */
  fixed?: boolean
}

const PALATE: StructureKey[] = ['sweetness', 'acidity', 'tannin', 'alcohol', 'body', 'finish']

/** The case in WSET order: appearance, nose, palate, oak. Collapsible on phones. */
export function TastingCard({ tastingCase, catalog, fixed = false }: TastingCardProps) {
  const { profile, descriptorIds } = tastingCase
  const [collapsed, setCollapsed] = useState(false)
  const style = catalog.style(tastingCase.styleId)
  const expanded = fixed || !collapsed
  const colour = capitalize(appearanceLabel(profile.appearance))
  // Bubbles and fortification are visible in the glass, so the card says so.
  const kind =
    style.color === 'sparkling' || style.color === 'fortified'
      ? da.lexicon.styleColor[style.color]
      : null
  const summary = [
    colour,
    kind?.toLowerCase(),
    descriptorIds
      .slice(0, 2)
      .map((id) => catalog.descriptor(id).name.toLowerCase())
      .join(', '),
    `${da.attribute.acidity.toLowerCase()} ${levelLabel('acidity', profile.acidity)}`,
    da.oak[style.oak],
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Card
      as="section"
      aria-label={da.tastingCard.title}
      className="flex flex-col gap-3.5 rounded-[24px]"
    >
      <div className="flex items-center justify-between">
        <Heading size="md">{da.tastingCard.title}</Heading>
        {fixed ? (
          <span className="text-ink-2 text-xs font-bold">{da.tastingCard.alwaysVisible}</span>
        ) : (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setCollapsed((c) => !c)}
            className="border-line bg-surface-2 text-ink flex min-h-11 items-center gap-1 rounded-full border py-0 pr-2.5 pl-3.5 text-[13px] font-extrabold"
          >
            {expanded ? da.tastingCard.hide : da.tastingCard.show}
            <Icon name={expanded ? 'chevronUp' : 'chevronDown'} size={16} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {!expanded && (
        <div className="flex items-center gap-2.5 text-sm font-bold">
          <ColorDot hex={APPEARANCE_HEX[profile.appearance]} size={18} />
          <span>{summary}</span>
        </div>
      )}

      {expanded && (
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3.5">
            <WineGlass appearance={profile.appearance} intensity={profile.intensity} />
            <div className="flex flex-col gap-0.5">
              <Label>1 · {da.tastingCard.appearance}</Label>
              <span className="text-[17px] font-extrabold">
                {colour}
                {kind && <span className="text-ink-2 font-bold"> · {kind}</span>}
              </span>
              <span className="text-ink-2 text-[13px]">
                {interpolate(da.intensity.label, {
                  value: levelLabel('intensity', profile.intensity),
                })}
              </span>
            </div>
          </div>

          <Divider />

          <div className="flex flex-col gap-2">
            <Label>2 · {da.tastingCard.nose}</Label>
            <AromaChips ids={descriptorIds} catalog={catalog} />
          </div>

          <Divider />

          <div className="flex flex-col gap-[7px]">
            <ScaleHeader label={`3 · ${da.tastingCard.palate}`} />
            {PALATE.map((attribute) => {
              const value = profile[attribute]
              return value === null ? null : (
                <ScaleRow key={attribute} attribute={attribute} value={value} />
              )
            })}
            {profile.tannin === null && (
              <span className="text-ink-3 text-[11px]">{da.tastingCard.tanninNote}</span>
            )}
          </div>

          <Divider />

          <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-2">
            <Label>4 · {da.tastingCard.oak}</Label>
            <OakToggle oak={style.oak} />
          </div>
        </div>
      )}
    </Card>
  )
}
