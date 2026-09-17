import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Autocomplete } from '@/components/Autocomplete'
import { ChoiceGroup } from '@/components/ChoiceGroup'
import { AromaChip } from '@/components/ui/AromaChip'
import { Button } from '@/components/ui/Button'
import { Card, Divider, Heading, Label, Pill } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { ColorDot } from '@/components/ui/WineGlass'
import {
  bottleCase,
  explain,
  rankBottle,
  rankPosition,
  type BottleInput,
  type Catalog,
  type CaseProfile,
  type RankedStyle,
} from '@/engine'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { appearanceLabel, explanationText, levelLabel } from '@/lib/labels'
import { APPEARANCE_HEX, AROMA_FAMILY, STYLE_COLOR_HEX } from '@/lib/palette'
import { capitalize, interpolate } from '@/lib/text'
import {
  redAppearanceSchema,
  roseAppearanceSchema,
  whiteAppearanceSchema,
  type Appearance,
  type DescriptorCluster,
  type Level,
  type StructureKey,
} from '@/schema'
import { entryPath } from '../lexicon/search'

const LEVELS: Level[] = [1, 2, 3, 4, 5]
const PALATE: StructureKey[] = ['sweetness', 'acidity', 'tannin', 'alcohol', 'body', 'finish']
const APPEARANCE_ROWS: Appearance[][] = [
  [...whiteAppearanceSchema.options],
  [...roseAppearanceSchema.options],
  [...redAppearanceSchema.options],
]
const MAX_AROMAS = 8
const CANDIDATES = 5

const DEFAULT_PROFILE: CaseProfile = {
  appearance: 'ruby',
  intensity: 3,
  sweetness: 1,
  acidity: 3,
  tannin: 3,
  alcohol: 3,
  body: 3,
  finish: 3,
}

type Phase = 'notes' | 'ranked'

/**
 * "Rigtig flaske": the player fills in the tasting sheet for a wine in the glass, the app ranks
 * the closest styles, and whoever knows the bottle reveals the answer. The engine does the
 * ranking and the explanation; this page only collects input.
 */
export function BottlePage({ catalog = defaultCatalog }: { catalog?: Catalog }) {
  const [profile, setProfile] = useState<CaseProfile>(DEFAULT_PROFILE)
  const [descriptorIds, setDescriptorIds] = useState<string[]>([])
  const [phase, setPhase] = useState<Phase>('notes')
  const [revealedId, setRevealedId] = useState<string | null>(null)

  const input: BottleInput = useMemo(() => ({ profile, descriptorIds }), [profile, descriptorIds])
  const ranked = useMemo(
    () => (phase === 'ranked' ? rankBottle(input, catalog, CANDIDATES) : []),
    [phase, input, catalog],
  )

  const setLevel = (key: StructureKey, value: Level | null) =>
    setProfile((p) => ({ ...p, [key]: value }))
  const toggleAroma = (id: string) =>
    setDescriptorIds((ids) =>
      ids.includes(id) ? ids.filter((d) => d !== id) : ids.length < MAX_AROMAS ? [...ids, id] : ids,
    )
  const reset = () => {
    setProfile(DEFAULT_PROFILE)
    setDescriptorIds([])
    setPhase('notes')
    setRevealedId(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <header className="flex flex-col gap-1.5">
        <Heading as="h1" size="display">
          {da.pages.bottle.title}
        </Heading>
        <p className="text-ink-2 text-sm leading-relaxed">{da.bottle.intro}</p>
      </header>

      {phase === 'notes' ? (
        <NotesForm
          profile={profile}
          descriptorIds={descriptorIds}
          catalog={catalog}
          onLevel={setLevel}
          onAppearance={(appearance) => setProfile((p) => ({ ...p, appearance }))}
          onToggleAroma={toggleAroma}
          onRank={() => setPhase('ranked')}
        />
      ) : (
        <>
          <NotesSummary input={input} catalog={catalog} onEdit={() => setPhase('notes')} />
          <Ranking ranked={ranked} catalog={catalog} revealedId={revealedId} />
          <Reveal
            input={input}
            ranked={ranked}
            catalog={catalog}
            revealedId={revealedId}
            onReveal={setRevealedId}
          />
          <Button variant="secondary" size="md" block onClick={reset}>
            <Icon name="refresh" size={18} strokeWidth={2.4} />
            {da.bottle.startOver}
          </Button>
        </>
      )}
    </div>
  )
}

interface NotesFormProps {
  profile: CaseProfile
  descriptorIds: string[]
  catalog: Catalog
  onLevel: (key: StructureKey, value: Level | null) => void
  onAppearance: (appearance: Appearance) => void
  onToggleAroma: (id: string) => void
  onRank: () => void
}

function NotesForm({
  profile,
  descriptorIds,
  catalog,
  onLevel,
  onAppearance,
  onToggleAroma,
  onRank,
}: NotesFormProps) {
  const byCluster = useMemo(() => {
    const groups = new Map<DescriptorCluster, typeof catalog.descriptors>()
    for (const d of catalog.descriptors) {
      groups.set(d.cluster, [...(groups.get(d.cluster) ?? []), d])
    }
    return [...groups.entries()]
  }, [catalog])

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onRank()
      }}
    >
      <Card as="section" className="flex flex-col gap-3 rounded-[24px]">
        <h2 className="sr-only">{da.bottle.stepAppearance}</h2>
        <Label>{da.bottle.stepAppearance}</Label>
        <div role="radiogroup" aria-label={da.tastingCard.colour} className="flex flex-col gap-2">
          {APPEARANCE_ROWS.map((row) => (
            <div key={row[0]} className="flex flex-wrap gap-1.5">
              {row.map((appearance) => {
                const selected = profile.appearance === appearance
                return (
                  <button
                    key={appearance}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onAppearance(appearance)}
                    className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold ${
                      selected
                        ? 'border-primary-ink bg-primary-soft text-primary-ink'
                        : 'border-line bg-surface text-ink'
                    }`}
                  >
                    <ColorDot hex={APPEARANCE_HEX[appearance]} size={14} />
                    {capitalize(appearanceLabel(appearance))}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <LevelRow attribute="intensity" value={profile.intensity} onChange={onLevel} />
      </Card>

      <Card as="section" className="flex flex-col gap-3 rounded-[24px]">
        <h2 className="sr-only">{da.bottle.stepNose}</h2>
        <div className="flex items-center justify-between">
          <Label>{da.bottle.stepNose}</Label>
          <span className="text-ink-2 text-xs font-bold">
            {interpolate(da.bottle.aromaCount, { count: descriptorIds.length })}
          </span>
        </div>
        <p className="text-ink-2 text-[13px]">
          {interpolate(da.bottle.aromaHelp, { max: MAX_AROMAS })}
        </p>
        {byCluster.map(([cluster, descriptors]) => (
          <div key={cluster} className="flex flex-col gap-1.5">
            <span className="text-ink-2 text-[11px] font-extrabold tracking-[0.08em] uppercase">
              {AROMA_FAMILY[cluster].name}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {descriptors.map((d) => {
                const selected = descriptorIds.includes(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onToggleAroma(d.id)}
                    className={`rounded-full ${selected ? 'ring-primary-ink ring-2' : 'opacity-80'}`}
                  >
                    <AromaChip
                      descriptor={d}
                      size="sm"
                      outline={selected ? 'primary' : undefined}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </Card>

      <Card as="section" className="flex flex-col gap-3 rounded-[24px]">
        <h2 className="sr-only">{da.bottle.stepPalate}</h2>
        <Label>{da.bottle.stepPalate}</Label>
        {PALATE.map((attribute) => (
          <LevelRow
            key={attribute}
            attribute={attribute}
            value={profile[attribute]}
            nullable={attribute === 'tannin'}
            onChange={onLevel}
          />
        ))}
      </Card>

      <Button type="submit" block>
        {da.bottle.rank}
        <Icon name="arrowRight" size={18} strokeWidth={2.6} />
      </Button>
    </form>
  )
}

function LevelRow({
  attribute,
  value,
  nullable = false,
  onChange,
}: {
  attribute: StructureKey
  value: Level | null
  nullable?: boolean
  onChange: (key: StructureKey, value: Level | null) => void
}) {
  const items = [
    ...(nullable ? [{ id: 0, label: da.bottle.tanninNone }] : []),
    ...LEVELS.map((level) => ({ id: level, label: levelLabel(attribute, level) })),
  ]
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-ink-2 text-[13px] font-semibold">{da.attribute[attribute]}</span>
      <ChoiceGroup
        name={da.attribute[attribute]}
        items={items}
        value={value ?? 0}
        onChange={(id) => onChange(attribute, id === 0 ? null : (id as Level))}
      />
    </div>
  )
}

function NotesSummary({
  input,
  catalog,
  onEdit,
}: {
  input: BottleInput
  catalog: Catalog
  onEdit: () => void
}) {
  const { profile, descriptorIds } = input
  const parts = [
    capitalize(appearanceLabel(profile.appearance)),
    descriptorIds
      .slice(0, 3)
      .map((id) => catalog.descriptor(id).name.toLowerCase())
      .join(', '),
    `${da.attribute.acidity.toLowerCase()} ${levelLabel('acidity', profile.acidity)}`,
    profile.tannin !== null &&
      `${da.attribute.tannin.toLowerCase()} ${levelLabel('tannin', profile.tannin)}`,
  ].filter(Boolean)
  return (
    <Card className="flex items-center justify-between gap-3 rounded-[24px]">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Label>{da.bottle.yourNotes}</Label>
        <span className="truncate text-sm font-bold">{parts.join(' · ')}</span>
      </div>
      <Button variant="ghost" size="md" onClick={onEdit}>
        {da.bottle.editNotes}
      </Button>
    </Card>
  )
}

function Ranking({
  ranked,
  catalog,
  revealedId,
}: {
  ranked: RankedStyle[]
  catalog: Catalog
  revealedId: string | null
}) {
  return (
    <Card as="section" aria-label={da.bottle.rankTitle} flush className="rounded-[24px]">
      <div className="px-4 pt-4 pb-2">
        <Heading size="md">{da.bottle.rankTitle}</Heading>
      </div>
      <ol className="divide-line divide-y">
        {ranked.map(({ style }, i) => {
          const hit = revealedId === style.id
          return (
            <li
              key={style.id}
              className={`flex items-center gap-3 px-4 py-2.5 ${hit ? 'bg-ok-soft' : ''}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                  i === 0 ? 'bg-primary text-on-primary' : 'bg-surface-2 text-ink-2'
                }`}
              >
                {i + 1}
              </span>
              <ColorDot hex={STYLE_COLOR_HEX[style.color]} size={12} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-serif text-base font-semibold">{style.name}</span>
                <span className="text-ink-2 text-xs">
                  {catalog.region(style.regionId).name} · {catalog.grape(style.grapeIds[0]!).name}
                </span>
              </span>
              {i === 0 && !revealedId && <Pill tone="primary">{da.bottle.bestGuess}</Pill>}
              {hit && (
                <Pill tone="ok">
                  <Icon name="check" size={12} strokeWidth={3} />
                </Pill>
              )}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

function Reveal({
  input,
  ranked,
  catalog,
  revealedId,
  onReveal,
}: {
  input: BottleInput
  ranked: RankedStyle[]
  catalog: Catalog
  revealedId: string | null
  onReveal: (id: string | null) => void
}) {
  const [pending, setPending] = useState<string | null>(null)
  const options = useMemo(
    () =>
      catalog.styles.map((s) => ({
        id: s.id,
        label: s.name,
        searchText: [
          s.name,
          catalog.region(s.regionId).name,
          ...s.grapeIds.map((g) => catalog.grape(g).name),
        ].join(' '),
      })),
    [catalog],
  )

  if (!revealedId) {
    return (
      <Card
        as="section"
        aria-label={da.bottle.revealTitle}
        className="flex flex-col gap-3 rounded-[24px]"
      >
        <Heading size="md">{da.bottle.revealTitle}</Heading>
        <p className="text-ink-2 text-[13px]">{da.bottle.revealHelp}</p>
        <Autocomplete options={options} value={pending} onChange={setPending} />
        <Button size="md" block disabled={pending === null} onClick={() => onReveal(pending)}>
          {da.bottle.revealButton}
        </Button>
      </Card>
    )
  }

  const actual = catalog.style(revealedId)
  const top = ranked[0]?.style ?? null
  const position = rankPosition(ranked, revealedId)
  const explanations = top && top.id !== actual.id ? explain(bottleCase(input), actual, top) : []

  return (
    <Card
      as="section"
      aria-label={da.bottle.revealTitle}
      className="flex flex-col gap-3 rounded-[24px]"
    >
      <div className="flex items-center gap-3">
        <ColorDot hex={STYLE_COLOR_HEX[actual.color]} size={16} />
        <Heading size="md">{actual.name}</Heading>
      </div>
      <p className="text-sm font-bold">
        {position
          ? interpolate(da.bottle.positionHit, { position })
          : interpolate(da.bottle.positionMiss, { count: ranked.length })}
      </p>
      {top && explanations.length > 0 && (
        <>
          <Divider />
          <Label>{da.bottle.whyTitle}</Label>
          <ul className="flex flex-col gap-2">
            {explanations.map((e, i) => (
              <li key={i} className="bg-surface-2 rounded-2xl p-3 text-sm leading-relaxed">
                {explanationText(e, actual.name, top.name, catalog)}
              </li>
            ))}
          </ul>
        </>
      )}
      <Link
        to={entryPath({ kind: 'style', id: actual.id })}
        className="text-primary-ink text-sm font-bold underline underline-offset-2"
      >
        {interpolate(da.bottle.readAbout, { name: actual.name })}
      </Link>
    </Card>
  )
}
