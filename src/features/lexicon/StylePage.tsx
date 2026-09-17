import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AromaChip, AromaChips } from '@/components/ui/AromaChip'
import { Button } from '@/components/ui/Button'
import { Card, Heading, Label } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { OakToggle, ScaleRow, Segments } from '@/components/ui/SegmentScale'
import { ColorDot, WineGlass } from '@/components/ui/WineGlass'
import { rangeSeparation, styleNeighbours, type Catalog } from '@/engine'
import { useTastingSessionContext } from '@/features/tasting/tastingSessionContext'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { appearanceLabel, rangeLabel } from '@/lib/labels'
import { APPEARANCE_HEX, STYLE_COLOR_HEX } from '@/lib/palette'
import { interpolate, joinList } from '@/lib/text'
import { structureKeys, type Style, type StructureKey } from '@/schema'
import { entryPath } from './search'
import { Breadcrumb, Chip, EntryHeader, NotFound, StoryCard } from './shared'

const NEIGHBOUR_COUNT = 3
const PROFILE_KEYS: StructureKey[] = ['sweetness', 'acidity', 'tannin', 'alcohol', 'body', 'finish']
const TRAIN_OPTIONS = { difficulty: 'advanced', colors: 'both', rounds: 5 } as const

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function StylePage({ catalog = defaultCatalog }: { catalog?: Catalog }) {
  const { id = '' } = useParams()
  const style = catalog.styles.find((s) => s.id === id)
  if (!style) return <NotFound />

  const region = catalog.region(style.regionId)
  const country = catalog.countryOf(style.regionId)
  const neighbours = styleNeighbours(style, catalog.styles, NEIGHBOUR_COUNT)
  const climate = region.climate ?? catalog.regionLevelOf(region.id).climate

  return (
    <article className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <EntryHeader
        title={style.name}
        crumbs={<Breadcrumb region={region} catalog={catalog} />}
        subtitle={
          <>
            {style.grapeIds.map((gid, i) => (
              <span key={gid}>
                {i > 0 && ', '}
                <Link to={entryPath({ kind: 'grape', id: gid })} className="hover:underline">
                  {catalog.grape(gid).name}
                </Link>
              </span>
            ))}
            {' · '}
            {region.name}
            {region.id !== country.id && `, ${country.name}`}
          </>
        }
        chips={
          <>
            <Chip dot={STYLE_COLOR_HEX[style.color]}>{da.lexicon.styleColor[style.color]}</Chip>
            {climate && (
              <Chip>
                <Icon name={climate === 'warm' ? 'sun' : 'snow'} size={12} strokeWidth={2.2} />
                {da.climate[climate]}
              </Chip>
            )}
            <Chip>{da.lexicon.difficultyLabel[style.difficulty]}</Chip>
          </>
        }
        verified={style.verified}
        note={style.note}
        sources={style.sources}
      />

      <StoryCard title={da.lexicon.story.style} story={style.story} />

      <Card
        as="section"
        aria-label={da.lexicon.typicalProfile}
        className="flex flex-col gap-3 rounded-[24px]"
      >
        <div className="flex items-center gap-3">
          <WineGlass
            appearance={style.profile.appearance}
            intensity={style.profile.intensity[1]}
            size={48}
          />
          <div className="flex flex-col">
            <Heading size="md">{da.lexicon.typicalProfile}</Heading>
            <span className="text-ink-2 text-[13px]">
              {capitalize(appearanceLabel(style.profile.appearance))} ·{' '}
              {interpolate(da.intensity.label, {
                value: rangeLabel('intensity', style.profile.intensity),
              })}
            </span>
          </div>
        </div>
        <AromaChips ids={style.descriptorIds} catalog={catalog} />
        {PROFILE_KEYS.map((key) => {
          const range = style.profile[key]
          return range === null ? null : <ScaleRow key={key} attribute={key} value={range} />
        })}
        <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-2">
          <span className="text-ink-2 text-[13px] font-semibold">{da.lexicon.oak}</span>
          <OakToggle oak={style.oak} compact />
        </div>
      </Card>

      {neighbours.length > 0 && (
        <ConfusedWith style={style} others={neighbours.map((n) => n.style)} catalog={catalog} />
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/tasting" className="text-primary-ink font-bold underline underline-offset-2">
          {da.lexicon.playTasting}
        </Link>
        <Link to="/map" className="text-primary-ink font-bold underline underline-offset-2">
          {da.lexicon.playMap}
        </Link>
      </div>
    </article>
  )
}

function ConfusedWith({
  style,
  others,
  catalog,
}: {
  style: Style
  others: Style[]
  catalog: Catalog
}) {
  const [index, setIndex] = useState(0)
  const other = others[Math.min(index, others.length - 1)]!
  const { startWeak } = useTastingSessionContext()
  const navigate = useNavigate()
  return (
    <section aria-labelledby="confused-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Heading id="confused-title" size="lg">
          {da.lexicon.confusedWith}
        </Heading>
        <div role="tablist" aria-label={da.lexicon.confusedWith} className="flex flex-wrap gap-2">
          {others.map((o, i) => (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
              className={`min-h-10 rounded-full px-3.5 text-sm ${
                i === index
                  ? 'bg-ink text-canvas font-extrabold'
                  : 'border-line bg-surface text-ink border font-bold'
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
      </div>

      <Comparison key={other.id} a={style} b={other} catalog={catalog} />

      <Button
        block
        onClick={() => {
          startWeak(TRAIN_OPTIONS)
          navigate('/tasting')
        }}
      >
        {da.lexicon.trainPair}
      </Button>
    </section>
  )
}

type Diff = 'none' | 'differs' | 'decisive'

function diffOf(a: [number, number] | null, b: [number, number] | null): Diff {
  if (a === null || b === null) return 'none'
  if (rangeSeparation(a, b) > 0) return 'decisive'
  return a[0] !== b[0] || a[1] !== b[1] ? 'differs' : 'none'
}

/** Side-by-side ranges and aromas; rows where the two styles differ are highlighted and tagged. */
export function Comparison({ a, b, catalog }: { a: Style; b: Style; catalog: Catalog }) {
  const shared = a.descriptorIds.filter((d) => b.descriptorIds.includes(d))
  const onlyA = a.descriptorIds.filter((d) => !shared.includes(d))
  const onlyB = b.descriptorIds.filter((d) => !shared.includes(d))
  const rows = structureKeys
    .filter((key) => key !== 'intensity')
    .map((key) => ({
      key,
      ra: a.profile[key],
      rb: b.profile[key],
      diff: diffOf(a.profile[key], b.profile[key]),
    }))
    .filter((r) => r.ra !== null && r.rb !== null)
  const oakDiff: Diff = a.oak === b.oak ? 'none' : 'decisive'
  const colourDiff: Diff = a.profile.appearance === b.profile.appearance ? 'none' : 'differs'

  const decisive = rows
    .filter((r) => r.diff === 'decisive')
    .map((r) => da.attribute[r.key].toLowerCase())
  const differs = rows
    .filter((r) => r.diff === 'differs')
    .map((r) => da.attribute[r.key].toLowerCase())
  const tellAttributes = [
    ...decisive,
    ...(oakDiff === 'decisive' ? [da.lexicon.oak.toLowerCase()] : []),
    ...differs,
  ].slice(0, 3)
  const name = (id: string) => catalog.descriptor(id).name.toLowerCase()

  return (
    <div className="flex flex-col gap-3">
      <Card flush className="rounded-[24px]">
        <div className="grid grid-cols-2">
          <Head style={a} catalog={catalog} className="border-line border-r" />
          <Head style={b} catalog={catalog} />
        </div>

        <CompareRow label={da.tastingCard.colour} diff={colourDiff}>
          {[a, b].map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-xs font-extrabold">
              <ColorDot hex={APPEARANCE_HEX[s.profile.appearance]} size={12} />
              {capitalize(appearanceLabel(s.profile.appearance))}
            </span>
          ))}
        </CompareRow>

        <CompareRow
          label={da.lexicon.aromas}
          diff={onlyA.length + onlyB.length > 0 ? 'differs' : 'none'}
        >
          {[
            { own: onlyA, key: a.id },
            { own: onlyB, key: b.id },
          ].map(({ own, key }) => (
            <div key={key} className="flex flex-col items-start gap-1.5">
              {shared.map((id) => (
                <AromaChip key={id} descriptor={catalog.descriptor(id)} size="sm" />
              ))}
              {own.map((id) => (
                <AromaChip
                  key={id}
                  descriptor={catalog.descriptor(id)}
                  size="sm"
                  outline="partial"
                />
              ))}
            </div>
          ))}
        </CompareRow>

        {rows.map((r) => (
          <CompareRow key={r.key} label={da.attribute[r.key]} diff={r.diff}>
            {[r.ra!, r.rb!].map((range, i) => (
              <div
                key={i}
                role="img"
                aria-label={interpolate(da.tastingCard.scaleAria, {
                  attribute: da.attribute[r.key],
                  value: rangeLabel(r.key, range),
                })}
                className="flex flex-col gap-1"
              >
                <Segments value={range} height={7} gap={2} />
                <span className="text-xs font-extrabold">{rangeLabel(r.key, range)}</span>
              </div>
            ))}
          </CompareRow>
        ))}

        <CompareRow label={da.lexicon.oak} diff={oakDiff}>
          {[a, b].map((s) => (
            <span key={s.id} className="text-xs font-extrabold">
              {da.oakShort[s.oak]}
            </span>
          ))}
        </CompareRow>
      </Card>

      <div className="bg-primary-soft flex gap-3 rounded-[20px] p-3.5">
        <Icon name="bulb" size={22} className="text-primary-ink shrink-0" />
        <div className="flex flex-col gap-1">
          <span className="text-primary-ink text-[15px] font-extrabold">
            {da.lexicon.howToTell}
          </span>
          <span className="text-sm leading-snug">
            {tellAttributes.length === 0
              ? da.lexicon.tellSame
              : interpolate(da.lexicon.tellAttributes, {
                  list: joinList(tellAttributes, da.result.explanation.listAnd),
                })}
            {onlyA.length > 0 && onlyB.length > 0 && (
              <>
                {' '}
                {interpolate(da.lexicon.tellAromas, {
                  a: a.name,
                  aromasA: joinList(onlyA.map(name), da.result.explanation.listAnd),
                  b: b.name,
                  aromasB: joinList(onlyB.map(name), da.result.explanation.listAnd),
                })}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

function Head({
  style,
  catalog,
  className = '',
}: {
  style: Style
  catalog: Catalog
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-3.5 ${className}`}>
      <ColorDot hex={APPEARANCE_HEX[style.profile.appearance]} size={18} />
      <div className="flex min-w-0 flex-col">
        <Link
          to={entryPath({ kind: 'style', id: style.id })}
          className="truncate font-serif text-base font-semibold"
        >
          {style.name}
        </Link>
        <span className="text-ink-2 truncate text-xs">
          {style.grapeIds.map((g) => catalog.grape(g).name).join(', ')}
        </span>
      </div>
    </div>
  )
}

function CompareRow({
  label,
  diff,
  children,
}: {
  label: string
  diff: Diff
  children: React.ReactNode
}) {
  return (
    <div
      className={`border-line border-t px-3 pt-2 pb-2.5 ${diff === 'none' ? '' : 'bg-partial-soft'}`}
    >
      <div className="flex items-center justify-center gap-1.5 pb-1.5">
        <Label>{label}</Label>
        {diff !== 'none' && (
          <span className="bg-partial-fill text-bordeaux-ink flex items-center gap-0.5 rounded-full px-[7px] py-px text-[10px] font-extrabold">
            <Icon name="swap" size={10} strokeWidth={3} />
            {diff === 'decisive' ? da.lexicon.decisive : da.lexicon.differs}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  )
}
