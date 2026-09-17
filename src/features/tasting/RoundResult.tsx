import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CountUp } from '@/components/CountUp'
import { LazyWineMap } from '@/components/map/LazyWineMap'
import { AromaChip } from '@/components/ui/AromaChip'
import { Button } from '@/components/ui/Button'
import { Card, Heading, Label } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { OutcomePill } from '@/components/ui/Outcome'
import { ScaleRow, Segments } from '@/components/ui/SegmentScale'
import { ColorDot, WineGlass } from '@/components/ui/WineGlass'
import {
  areTwins,
  boundsOf,
  explain,
  guessedStyle,
  haversineKm,
  nearestNeighbour,
  tierSpec,
  type Catalog,
  type Explanation,
  type RoundScore,
  type TastingCase,
} from '@/engine'
import { useSound } from '@/features/settings/useSound'
import { da } from '@/i18n/da'
import { interpolate } from '@/lib/text'
import { answerLabel, appearanceLabel, explanationText, levelLabel } from '@/lib/labels'
import { APPEARANCE_HEX } from '@/lib/palette'
import type { Style } from '@/schema'

interface RoundResultProps {
  tastingCase: TastingCase
  score: RoundScore
  catalog: Catalog
  isLastRound: boolean
  onNext: () => void
  /** Wide layout: the label and score sit beside the explanations. */
  wide?: boolean
}

/** Degrees of longitude/latitude shown around the region on the mini-map. */
const MINI_MAP_PADDING_DEG = 4

function headline(score: RoundScore): { title: string; sub: string } {
  const outcome = (tier: number) => score.tiers.find((t) => t.tier === tier)?.outcome
  const allRight = score.tiers.every((t) => t.outcome === 'correct')
  if (allRight) return { title: da.result.headlineAll, sub: da.result.subAll }
  const grape = outcome(3)
  const place = [4, 5, 6].map(outcome).filter((o) => o !== undefined)
  if (grape === 'correct' && place.some((o) => o !== 'correct'))
    return { title: da.result.headlineGrape, sub: da.result.subPlace }
  if (grape && grape !== 'correct' && place.length > 0 && place.every((o) => o === 'correct'))
    return { title: da.result.headlinePlace, sub: da.result.subGrape }
  if (outcome(2) === 'correct') return { title: da.result.headlineClimate, sub: da.result.subNone }
  return { title: da.result.headlineNone, sub: da.result.subNone }
}

export function RoundResult({
  tastingCase,
  score,
  catalog,
  isLastRound,
  onNext,
  wide = false,
}: RoundResultProps) {
  const reduced = useReducedMotion()
  const play = useSound()
  useEffect(() => {
    const outcomes = score.tiers.map((t) => t.outcome)
    play(
      outcomes.every((o) => o === 'correct')
        ? 'correct'
        : outcomes.some((o) => o === 'correct' || o === 'partial')
          ? 'partial'
          : 'wrong',
    )
  }, [play, score])

  const style = catalog.style(tastingCase.styleId)
  const grape = catalog.grape(style.grapeIds[0]!)
  const region = catalog.region(style.regionId)
  const country = catalog.countryOf(style.regionId)
  const guessed = guessedStyle(tastingCase, score, catalog)
  const explanations = guessed ? explain(tastingCase, style, guessed) : []
  const neighbour = guessed ? null : nearestNeighbour(tastingCase, catalog)
  const { title, sub } = headline(score)

  // Where the player's region guess landed, if it was a different place.
  const regionTier = score.tiers.find((t) => t.tier === 5 || t.tier === 4)
  const guessedRegion =
    regionTier && regionTier.answer !== null && regionTier.answer !== regionTier.correctId
      ? safeRegion(regionTier.answer, catalog)
      : null
  const km = guessedRegion
    ? Math.round(haversineKm(guessedRegion.center, region.center) / 100) * 100
    : null

  // WineMap compares props by value, so fresh arrays each render are fine.
  const miniMapPoints = [{ id: region.id, lngLat: region.center }]
  const miniMapBounds = boundsOf([region.center], MINI_MAP_PADDING_DEG)

  const reveal = (
    <section
      aria-label={da.result.revealLabel}
      className="relative flex h-[262px] items-center justify-center"
    >
      <span className="sr-only">{da.result.reveal}</span>
      <div
        aria-hidden="true"
        className="bg-bordeaux shadow-card absolute h-[236px] w-[228px] rounded-2xl"
        style={{ transform: 'rotate(-7deg) translateX(-14px)' }}
      />
      <motion.div
        initial={reduced ? false : { rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.42, ease: 'easeOut' }}
        style={{ transformPerspective: 800, rotate: 2 }}
        className="bg-paper shadow-float relative box-border h-[244px] w-[236px] rounded-2xl p-[9px]"
      >
        <div
          className="border-bordeaux text-bordeaux-ink flex h-full flex-col items-center justify-center gap-[7px] rounded-[9px] border-[1.5px] px-3 text-center"
          style={{ outline: '1px solid #7A1F3D', outlineOffset: -5 }}
        >
          <span className="text-bordeaux text-[10px] font-extrabold tracking-[0.2em] uppercase">
            {region.id === country.id ? country.name : `${region.name} · ${country.name}`}
          </span>
          <span className="bg-bordeaux h-px w-11" />
          <Link
            to={`/lexicon/styles/${style.id}`}
            className="font-serif text-[30px] leading-none font-semibold tracking-[0.03em]"
          >
            {style.name}
          </Link>
          <span className="text-bordeaux-ink-2 font-serif text-xs italic">
            {da.lexicon.styleColor[style.color]} · {da.oak[style.oak]}
          </span>
          <span className="bg-bordeaux h-px w-11" />
          <span className="text-sm font-extrabold">
            {style.grapeIds.map((id) => catalog.grape(id).name).join(', ')}
          </span>
        </div>
      </motion.div>
    </section>
  )

  const scoreCard = (
    <Card
      as="section"
      className="flex items-center justify-between gap-3 rounded-[20px] px-4 py-3.5"
    >
      <div className="flex flex-col">
        <span className="text-ink-2 text-xs font-bold">{da.result.roundScore}</span>
        <span className="text-primary-ink text-4xl leading-10 font-extrabold tabular-nums">
          +<CountUp value={score.total} />{' '}
          <span className="text-ink-2 text-base">/ {score.max} p</span>
        </span>
      </div>
      <div className="flex flex-col items-end gap-1 text-right">
        <span className="font-serif text-[19px] font-semibold">{title}</span>
        <span className="text-ink-2 text-[13px]">{sub}</span>
      </div>
    </Card>
  )

  const tierTable = (
    <Card as="section" aria-label={da.result.perTier} flush className="rounded-[20px]">
      <table className="w-full border-collapse">
        <thead className="sr-only">
          <tr>
            <th>{da.result.tierColumn}</th>
            <th>{da.result.yourAnswer}</th>
            <th>{da.common.points}</th>
          </tr>
        </thead>
        <tbody>
          {score.tiers.map((t) => {
            const { field } = tierSpec(t.tier)
            return (
              <tr key={t.tier} className="border-line border-b">
                <td className="py-2 pl-3.5 align-middle">
                  <div className="flex min-h-11 flex-col justify-center gap-0.5">
                    <Label>{da.tier.short[t.tier]}</Label>
                    <span className="text-[15px] font-bold">
                      {t.answer === null ? '—' : answerLabel(field, t.answer, catalog)}
                    </span>
                    {t.outcome !== 'correct' && (
                      <span className="text-ink-2 text-xs">
                        {da.result.correctIs}{' '}
                        <b className="text-ink">{answerLabel(field, t.correctId, catalog)}</b>
                      </span>
                    )}
                  </div>
                </td>
                <td className="w-24 px-2 align-middle">
                  <OutcomePill outcome={t.outcome} />
                </td>
                <td className="w-12 pr-3.5 text-right text-[15px] font-extrabold tabular-nums">
                  {t.points}/{t.maxPoints}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="bg-surface-2 flex justify-between px-3.5 py-3 text-[15px] font-extrabold">
        <span>{da.result.total}</span>
        <span className="tabular-nums">
          {score.total} / {score.max}
        </span>
      </div>
    </Card>
  )

  const why = (
    <Card as="section" aria-labelledby="why-title" className="flex flex-col gap-3.5 rounded-[24px]">
      <Heading id="why-title" size="lg" className="text-[22px]">
        {da.result.whyTitle}
      </Heading>
      {guessed && (
        <div className="flex flex-wrap gap-3.5 text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="bg-scale-on h-2 w-3.5 rounded-sm" />
            {style.name}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="stripe-partial h-2 w-3.5 rounded-sm" />
            {interpolate(da.result.yourGuessNamed, { name: guessed.name })}
          </span>
        </div>
      )}
      {guessed && areTwins(style, guessed) && (
        <p className="text-ink-2 text-sm leading-relaxed">
          {interpolate(da.result.twinNote, { correct: style.name, guessed: guessed.name })}
        </p>
      )}
      {guessed && explanations.length > 0 ? (
        explanations.map((e, i) => (
          <ExplanationBlock
            key={i}
            n={i + 1}
            explanation={e}
            correct={style}
            guessed={guessed}
            tastingCase={tastingCase}
            catalog={catalog}
          />
        ))
      ) : guessed ? (
        <p className="text-ink-2 text-sm leading-relaxed">
          {interpolate(da.result.indistinguishable, { correct: style.name, guessed: guessed.name })}
        </p>
      ) : (
        <p className="text-ink-2 text-sm leading-relaxed">
          {da.result.perfect}{' '}
          {neighbour && interpolate(da.result.confusedWith, { name: neighbour.name })}
        </p>
      )}
    </Card>
  )

  const map = (
    <Card as="section" flush className="rounded-[24px]">
      <div className="relative">
        <LazyWineMap
          label={interpolate(da.result.miniMap, { name: region.name })}
          points={miniMapPoints}
          highlightId={region.id}
          bounds={miniMapBounds}
          interactive={false}
          className="h-[200px] rounded-none"
        />
        <span className="bg-surface shadow-card pointer-events-none absolute top-3 left-3 rounded-full px-2.5 py-[5px] text-xs font-extrabold">
          {region.name} · {country.name}
        </span>
      </div>
      {guessedRegion && km !== null && (
        <div className="text-ink-2 flex items-center gap-2 px-3.5 py-3 text-[13px]">
          <Icon name="x" size={16} strokeWidth={2.6} className="text-wrong shrink-0" />
          {interpolate(da.result.distanceAway, {
            name: guessedRegion.name,
            km: km.toLocaleString('da-DK'),
          })}
        </div>
      )}
    </Card>
  )

  const readMore = (
    <Card as="nav" aria-label={da.result.readMore} flush className="rounded-[20px]">
      <Link
        to={`/lexicon/grapes/${grape.id}`}
        className="border-line text-ink flex min-h-14 items-center justify-between border-b px-3.5 text-[15px] font-bold"
      >
        <span className="flex items-center gap-2.5">
          <ColorDot hex={APPEARANCE_HEX[style.profile.appearance]} size={14} />
          {interpolate(da.result.lexiconGrape, { name: grape.name })}
        </span>
        <Icon name="chevronRight" size={18} strokeWidth={2.2} className="text-ink-2" />
      </Link>
      <Link
        to={`/lexicon/regions/${region.id}`}
        className="text-ink flex min-h-14 items-center justify-between px-3.5 text-[15px] font-bold"
      >
        <span className="flex items-center gap-2.5">
          <Icon name="map" size={16} className="text-ink-2" />
          {interpolate(da.result.lexiconRegion, { name: region.name })}
        </span>
        <Icon name="chevronRight" size={18} strokeWidth={2.2} className="text-ink-2" />
      </Link>
    </Card>
  )

  const next = (
    <Button block onClick={onNext}>
      {isLastRound ? da.summary.title : da.tasting.nextWine}
      <Icon name="arrowRight" size={18} strokeWidth={2.6} />
    </Button>
  )

  if (wide) {
    return (
      <div className="grid grid-cols-[440px_minmax(0,1fr)] items-start gap-7">
        <div className="flex flex-col gap-4">
          {reveal}
          {scoreCard}
          {tierTable}
          {next}
        </div>
        <div className="flex flex-col gap-4">
          {why}
          {map}
          {readMore}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {reveal}
      {scoreCard}
      {tierTable}
      {why}
      {map}
      {readMore}
      <div className="border-line bg-canvas fixed inset-x-0 bottom-0 z-10 border-t px-4 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-[1100px]">{next}</div>
      </div>
    </div>
  )
}

function safeRegion(id: string, catalog: Catalog) {
  try {
    return catalog.region(id)
  } catch {
    return null
  }
}

interface ExplanationBlockProps {
  n: number
  explanation: Explanation
  correct: Style
  guessed: Style
  tastingCase: TastingCase
  catalog: Catalog
}

/** One numbered "why" block: comparison bars (or aromas / colours) plus the generated sentence. */
function ExplanationBlock({
  n,
  explanation,
  correct,
  guessed,
  tastingCase,
  catalog,
}: ExplanationBlockProps) {
  const text = explanationText(explanation, correct.name, guessed.name, catalog)
  const title =
    explanation.kind === 'attribute'
      ? da.attribute[explanation.attribute]
      : explanation.kind === 'appearance'
        ? da.tastingCard.colour
        : da.tastingCard.aromas
  return (
    <div className="bg-surface-2 flex flex-col gap-2 rounded-2xl p-3">
      <div className="flex items-center gap-2">
        <span className="bg-primary text-on-primary flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs font-extrabold">
          {n}
        </span>
        <span className="text-[15px] font-extrabold">{title}</span>
      </div>

      {explanation.kind === 'attribute' && (
        <>
          <ScaleRow
            attribute={explanation.attribute}
            value={explanation.correctRange}
            name={correct.name}
            nameClassName="text-primary-ink"
            size="mini"
          />
          <ScaleRow
            attribute={explanation.attribute}
            value={explanation.guessedRange}
            tone="guess"
            name={da.result.yourGuess}
            nameClassName="text-partial"
            size="mini"
          />
          <div className="grid grid-cols-[76px_minmax(0,1fr)_64px] items-center gap-2 text-xs">
            <span className="text-ink-2 font-bold">{da.tastingCard.title}</span>
            <Segments value={explanation.caseValue} height={6} />
            <span className="text-right font-extrabold">
              {levelLabel(explanation.attribute, explanation.caseValue)}
            </span>
          </div>
        </>
      )}

      {explanation.kind === 'appearance' && (
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-xs font-bold">
            <WineGlass appearance={explanation.caseValue} size={40} />
            {appearanceLabel(explanation.caseValue)}
          </span>
          <span className="text-ink-2 flex items-center gap-2 text-xs font-bold">
            <WineGlass appearance={explanation.guessedAppearance} size={40} />
            {appearanceLabel(explanation.guessedAppearance)}
          </span>
        </div>
      )}

      {explanation.kind === 'descriptors' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-start gap-1.5">
            <span className="text-primary-ink text-xs font-bold">{correct.name}</span>
            {tastingCase.descriptorIds.map((id) => (
              <AromaChip key={id} descriptor={catalog.descriptor(id)} size="sm" />
            ))}
          </div>
          <div className="flex flex-col items-start gap-1.5">
            <span className="text-partial text-xs font-bold">{guessed.name}</span>
            {guessed.descriptorIds
              .filter((id) => !tastingCase.descriptorIds.includes(id))
              .slice(0, 3)
              .map((id) => (
                <AromaChip
                  key={id}
                  descriptor={catalog.descriptor(id)}
                  size="sm"
                  outline="partial"
                />
              ))}
          </div>
        </div>
      )}

      <span className="text-ink-2 text-[13px] leading-snug">{text}</span>
    </div>
  )
}
