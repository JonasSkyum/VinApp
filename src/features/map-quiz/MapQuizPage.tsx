import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Autocomplete } from '@/components/Autocomplete'
import { LazyWineMap } from '@/components/map/LazyWineMap'
import type { MapMarker, MapPoint } from '@/components/map/mapTypes'
import { PageTitle } from '@/components/PageTitle'
import { boundsOf, mapQuizPool, type Catalog, type MapQuestion, type MapResult } from '@/engine'
import { useSound } from '@/features/settings/useSound'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { interpolate } from '@/lib/text'
import type { LngLat } from '@/schema'
import { formatSeconds } from './format'
import { MapSetupScreen } from './MapSetupScreen'
import { MapSummary } from './MapSummary'
import { useMapQuizContext } from './mapQuizContext'

export function MapQuizPage({ now = Date.now }: { now?: () => number }) {
  const catalog = defaultCatalog
  const { state, start, answer, next, restart, reset } = useMapQuizContext()
  const [pendingName, setPendingName] = useState<string | null>(null)
  const elapsed = useElapsedSeconds(
    state.startedAt,
    state.finishedAt,
    state.phase === 'playing',
    now,
  )

  const pool = useMemo(
    () => (state.phase === 'setup' ? [] : mapQuizPool(catalog, state.options)),
    [catalog, state.options, state.phase],
  )
  const question = state.questions[state.index] ?? null
  const targetId = question ? primaryTargetId(question) : null

  const points = useMemo<MapPoint[]>(() => {
    const dots = pool
      .filter((r) => r.type !== 'country')
      .map((r) => ({ id: r.id, lngLat: r.center }))
    // A country asked in "name" mode has no dot to blink, so add its centre.
    if (question?.kind === 'name' && targetId && !dots.some((d) => d.id === targetId)) {
      dots.push({ id: targetId, lngLat: catalog.region(targetId).center })
    }
    return dots
  }, [pool, question, targetId, catalog])

  const bounds = useMemo(
    () =>
      boundsOf(
        pool.map((r) => r.center),
        1.5,
      ),
    [pool],
  )
  const markers = useMemo<MapMarker[]>(
    () => feedbackMarkers(state.feedback, catalog),
    [state.feedback, catalog],
  )
  const play = useSound()
  useEffect(() => {
    const f = state.feedback
    if (f) play(f.correct ? 'correct' : f.points > 0 ? 'partial' : 'wrong')
  }, [state.feedback, play])

  if (state.phase === 'setup') {
    return (
      <>
        <PageTitle>{da.pages.map.title}</PageTitle>
        <MapSetupScreen initial={state.options} catalog={catalog} onStart={start} />
      </>
    )
  }

  if (state.phase === 'summary') {
    return (
      <>
        <PageTitle>{da.pages.map.title}</PageTitle>
        <MapSummary
          results={state.results}
          seconds={elapsed}
          catalog={catalog}
          onPlayAgain={restart}
          onNewQuiz={reset}
        />
      </>
    )
  }

  const q = question!
  const answering = state.feedback === null
  const onMapClick = (lngLat: LngLat, insideGeoId: string | null) => {
    if (!answering || q.kind === 'name') return
    answer({ kind: 'click', lngLat, insideGeoId })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <PageTitle>{da.pages.map.title}</PageTitle>
        <span className="text-wine-900/70 text-sm tabular-nums">
          {da.mapQuiz.question} {state.index + 1}/{state.questions.length} · {da.mapQuiz.time}{' '}
          {formatSeconds(elapsed)}
        </span>
      </div>

      <p className="text-wine-800 text-lg font-semibold" aria-live="polite">
        {promptText(q, catalog)}
      </p>

      <LazyWineMap
        label={da.mapQuiz.mapLabel}
        points={points}
        highlightId={answering && q.kind === 'name' ? q.regionId : null}
        markers={markers}
        bounds={bounds}
        onClick={onMapClick}
        className="border-wine-200 h-[55vh] min-h-72 border"
      />

      {answering && q.kind === 'name' && (
        <NameAnswer
          key={state.index}
          question={q}
          catalog={catalog}
          pending={pendingName}
          onSelect={setPendingName}
          onLock={() => {
            answer({ kind: 'choice', regionId: pendingName })
            setPendingName(null)
          }}
        />
      )}

      {state.feedback && (
        <div
          role="status"
          className={`rounded-xl border p-4 ${
            state.feedback.correct
              ? 'border-green-300 bg-green-50 text-green-900'
              : 'border-red-300 bg-red-50 text-red-900'
          }`}
        >
          <p className="font-medium">
            {feedbackText(state.feedback, catalog)}{' '}
            <Link
              to={`/lexicon/regions/${state.feedback.targetRegionId}`}
              className="font-normal underline"
            >
              {interpolate(da.result.lexiconRegion, {
                name: catalog.region(state.feedback.targetRegionId).name,
              })}
            </Link>
          </p>
          <button
            type="button"
            onClick={next}
            className="bg-wine-700 hover:bg-wine-800 mt-3 w-full rounded-lg px-4 py-3 font-semibold text-white"
          >
            {state.index === state.questions.length - 1 ? da.mapQuiz.summary.title : da.common.next}
          </button>
        </div>
      )}
    </div>
  )
}

interface NameAnswerProps {
  question: Extract<MapQuestion, { kind: 'name' }>
  catalog: Catalog
  pending: string | null
  onSelect: (id: string | null) => void
  onLock: () => void
}

function NameAnswer({ question, catalog, pending, onSelect, onLock }: NameAnswerProps) {
  return (
    <div className="space-y-3">
      {question.answerKind === 'choice' ? (
        <div
          role="radiogroup"
          aria-label={da.mapQuiz.prompt.name}
          className="grid grid-cols-2 gap-2"
        >
          {question.options.map((id) => {
            const active = pending === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(id)}
                className={`rounded-lg border px-3 py-3 text-left ${
                  active
                    ? 'border-wine-700 bg-wine-700 text-white'
                    : 'border-wine-300 hover:border-wine-500 bg-white'
                }`}
              >
                {catalog.region(id).name}
              </button>
            )
          })}
        </div>
      ) : (
        <Autocomplete
          value={pending}
          onChange={onSelect}
          options={question.options.map((id) => {
            const name = catalog.region(id).name
            return { id, label: name, searchText: name }
          })}
        />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onLock}
          disabled={pending === null}
          className="bg-wine-700 hover:bg-wine-800 flex-1 rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-40"
        >
          {da.common.lockAnswer}
        </button>
        <button
          type="button"
          onClick={() => {
            onSelect(null)
            onLock()
          }}
          className="border-wine-300 text-wine-800 rounded-lg border px-4 py-3"
        >
          {da.common.skip}
        </button>
      </div>
    </div>
  )
}

function primaryTargetId(question: MapQuestion): string {
  return question.kind === 'grape' ? question.regionIds[0]! : question.regionId
}

function promptText(question: MapQuestion, catalog: Catalog): string {
  switch (question.kind) {
    case 'find':
      return interpolate(da.mapQuiz.prompt.find, { name: catalog.region(question.regionId).name })
    case 'name':
      return da.mapQuiz.prompt.name
    case 'grape':
      return interpolate(da.mapQuiz.prompt.grape, { name: catalog.grape(question.grapeId).name })
  }
}

function feedbackText(result: MapResult, catalog: Catalog): string {
  const name = catalog.region(result.targetRegionId).name
  const t = da.mapQuiz.feedback
  if (result.question.kind === 'name') {
    if (result.answer.kind === 'choice' && result.answer.regionId === null)
      return interpolate(t.skipped, { name })
    return interpolate(result.correct ? t.nameCorrect : t.nameWrong, { name })
  }
  const values = { name, points: result.points, distance: result.distanceKm ?? 0 }
  if (result.points === result.maxPoints) return interpolate(t.hit, values)
  if (result.correct) return interpolate(t.near, values)
  return interpolate(t.miss, values)
}

function feedbackMarkers(result: MapResult | null, catalog: Catalog): MapMarker[] {
  if (!result) return []
  const target = result.targetRegionId
  const markers: MapMarker[] = [
    { id: `target-${target}`, lngLat: catalog.region(target).center, kind: 'target' },
  ]
  if (result.answer.kind === 'click') {
    markers.push({
      id: 'clicked',
      lngLat: result.answer.lngLat,
      kind: result.correct ? 'clicked-correct' : 'clicked-wrong',
    })
  }
  return markers
}

function useElapsedSeconds(
  startedAt: number,
  finishedAt: number | null,
  running: boolean,
  now: () => number,
): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!running || finishedAt !== null) return
    const timer = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(timer)
  }, [running, finishedAt])
  if (!running && finishedAt === null) return 0
  void tick
  const end = finishedAt ?? now()
  return Math.max(0, Math.floor((end - startedAt) / 1000))
}
