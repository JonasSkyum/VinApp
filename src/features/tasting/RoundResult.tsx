import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CountUp } from '@/components/CountUp'
import { LazyWineMap } from '@/components/map/LazyWineMap'
import {
  boundsOf,
  explain,
  guessedStyle,
  nearestNeighbour,
  tierSpec,
  type Catalog,
  type RoundScore,
  type TastingCase,
} from '@/engine'
import { useSound } from '@/features/settings/useSound'
import { da } from '@/i18n/da'
import { interpolate } from '@/lib/text'
import { answerLabel, explanationText } from '@/lib/labels'

interface RoundResultProps {
  tastingCase: TastingCase
  score: RoundScore
  catalog: Catalog
  isLastRound: boolean
  onNext: () => void
}

/** Degrees of longitude/latitude shown around the region on the mini-map. */
const MINI_MAP_PADDING_DEG = 4

const OUTCOME_CLASS = {
  correct: 'bg-green-100 text-green-900',
  partial: 'bg-amber-100 text-amber-900',
  wrong: 'bg-red-100 text-red-900',
  skipped: 'bg-gray-100 text-gray-700',
} as const

export function RoundResult({
  tastingCase,
  score,
  catalog,
  isLastRound,
  onNext,
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
  const breadcrumb = catalog
    .ancestors(style.regionId)
    .reverse()
    .map((r) => r.name)
    .join(' › ')

  // WineMap compares props by value, so fresh arrays each render are fine.
  const miniMapPoints = [{ id: region.id, lngLat: region.center }]
  const miniMapBounds = boundsOf([region.center], MINI_MAP_PADDING_DEG)

  const guessed = guessedStyle(tastingCase, score, catalog)
  const explanations = guessed ? explain(tastingCase, style, guessed) : []
  const neighbour = guessed ? null : nearestNeighbour(tastingCase, catalog)

  return (
    <section aria-labelledby="result-title" className="space-y-5">
      <motion.div
        initial={reduced ? false : { rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ transformPerspective: 800 }}
        className="border-wine-200 rounded-xl border bg-white p-5 shadow-sm"
      >
        <p className="text-wine-900/70 text-sm">{da.result.reveal}</p>
        <h2 id="result-title" className="text-wine-800 text-2xl font-bold">
          <Link to={`/lexicon/styles/${style.id}`} className="hover:underline">
            {style.name}
          </Link>
        </h2>
        <p className="mt-1 text-sm">
          {style.grapeIds.map((id) => catalog.grape(id).name).join(', ')} · {da.oak[style.oak]}
        </p>
        <p className="text-wine-900/80 text-sm">{breadcrumb}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to={`/lexicon/grapes/${grape.id}`} className="text-wine-700 underline">
            {interpolate(da.result.lexiconGrape, { name: grape.name })}
          </Link>
          <Link to={`/lexicon/regions/${region.id}`} className="text-wine-700 underline">
            {interpolate(da.result.lexiconRegion, { name: region.name })}
          </Link>
        </div>
      </motion.div>

      <div className="flex items-baseline justify-between">
        <span className="text-wine-900/80 text-sm">{da.result.roundScore}</span>
        <span className="text-wine-800 text-3xl font-bold">
          <CountUp value={score.total} />
          <span className="text-wine-900/70 text-base font-normal"> / {score.max}</span>
        </span>
      </div>

      <table className="w-full text-sm">
        <thead className="text-wine-900/70 text-left text-xs uppercase">
          <tr>
            <th className="py-1 pr-2 font-semibold">{da.result.tierColumn}</th>
            <th className="py-1 pr-2 font-semibold">{da.result.yourAnswer}</th>
            <th className="py-1 pr-2 font-semibold">{da.result.correctAnswer}</th>
            <th className="py-1 text-right font-semibold">{da.common.points}</th>
          </tr>
        </thead>
        <tbody>
          {score.tiers.map((t) => {
            const { field } = tierSpec(t.tier)
            return (
              <tr key={t.tier} className="border-wine-100 border-t">
                <td className="py-2 pr-2 font-medium">{da.tier.short[t.tier]}</td>
                <td className="py-2 pr-2">
                  <span className={`rounded px-1.5 py-0.5 ${OUTCOME_CLASS[t.outcome]}`}>
                    {t.answer === null ? da.outcome.skipped : answerLabel(field, t.answer, catalog)}
                  </span>
                </td>
                <td className="py-2 pr-2">{answerLabel(field, t.correctId, catalog)}</td>
                <td className="py-2 text-right tabular-nums">
                  {t.points}/{t.maxPoints}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="border-wine-200 bg-wine-100/60 rounded-xl border p-4">
        <h3 className="text-wine-800 mb-2 font-semibold">{da.result.whyTitle}</h3>
        {guessed && explanations.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {explanations.map((e, i) => (
              <li key={i}>{explanationText(e, style.name, guessed.name, catalog)}</li>
            ))}
          </ul>
        ) : guessed ? (
          <p className="text-sm">
            {interpolate(da.result.indistinguishable, {
              correct: style.name,
              guessed: guessed.name,
            })}
          </p>
        ) : (
          <p className="text-sm">
            {da.result.perfect}{' '}
            {neighbour && interpolate(da.result.confusedWith, { name: neighbour.name })}
          </p>
        )}
      </div>

      <LazyWineMap
        label={interpolate(da.result.miniMap, { name: region.name })}
        points={miniMapPoints}
        highlightId={region.id}
        bounds={miniMapBounds}
        interactive={false}
        className="border-wine-200 h-40 border"
      />

      <button
        type="button"
        onClick={onNext}
        className="bg-wine-700 hover:bg-wine-800 w-full rounded-lg px-4 py-3 text-lg font-semibold text-white"
      >
        {isLastRound ? da.summary.title : da.common.next}
      </button>
    </section>
  )
}
