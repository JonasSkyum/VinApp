import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Autocomplete } from '@/components/Autocomplete'
import { useImmersive } from '@/components/chrome'
import { LazyWineMap } from '@/components/map/LazyWineMap'
import type { MapMarker, MapPoint } from '@/components/map/mapTypes'
import { PageTitle } from '@/components/PageTitle'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Label } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { SegmentProgress } from '@/components/ui/Meters'
import { OutcomeIcon } from '@/components/ui/Outcome'
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
  useImmersive(state.phase === 'playing')

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
      <div className="mx-auto w-full max-w-xl">
        <PageTitle className="mb-1">{da.pages.map.title}</PageTitle>
        <p className="text-ink-2 mb-5 text-[15px]">{da.mapQuiz.setupIntro}</p>
        <MapSetupScreen initial={state.options} catalog={catalog} onStart={start} />
      </div>
    )
  }

  if (state.phase === 'summary') {
    return (
      <div className="mx-auto w-full max-w-xl">
        <PageTitle>{da.pages.map.title}</PageTitle>
        <MapSummary
          results={state.results}
          seconds={elapsed}
          catalog={catalog}
          onPlayAgain={restart}
          onNewQuiz={reset}
        />
      </div>
    )
  }

  const q = question!
  const answering = state.feedback === null
  const onMapClick = (lngLat: LngLat, insideGeoId: string | null) => {
    if (!answering || q.kind === 'name') return
    answer({ kind: 'click', lngLat, insideGeoId })
  }
  const results = state.results.map((r) => (r.correct ? 'ok' : 'bad') as 'ok' | 'bad')
  const scope = scopeLabel(state.options, catalog)
  const last = state.index === state.questions.length - 1

  return (
    <div className="bg-map-sea relative h-dvh w-full overflow-hidden">
      <div className="absolute inset-0">
        <LazyWineMap
          label={da.mapQuiz.mapLabel}
          points={points}
          highlightId={answering && q.kind === 'name' ? q.regionId : null}
          markers={markers}
          bounds={bounds}
          onClick={onMapClick}
          controls
          className="h-full w-full rounded-none"
        />
      </div>

      <section
        aria-label={da.mapQuiz.task}
        className="bg-surface shadow-float absolute top-3 right-3 left-3 z-[2] mx-auto flex max-w-[1100px] flex-col gap-2.5 rounded-[22px] px-3 pt-2.5 pb-3.5"
      >
        <div className="flex items-center gap-2">
          <Link
            to="/"
            onClick={reset}
            aria-label={da.mapQuiz.exit}
            className="text-ink-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          >
            <Icon name="close" size={22} strokeWidth={2.2} />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <Label>{scope}</Label>
            <span className="font-serif text-[22px] leading-[1.15]" aria-live="polite">
              <Prompt question={q} catalog={catalog} />
            </span>
          </div>
          <span
            aria-label={interpolate(da.mapQuiz.timeAria, { time: formatSeconds(elapsed) })}
            className="bg-surface-2 flex h-[34px] shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm font-extrabold tabular-nums"
          >
            <Icon name="clock" size={15} strokeWidth={2.2} />
            {formatSeconds(elapsed)}
          </span>
        </div>
        <div className="flex items-center gap-2.5 px-1">
          <SegmentProgress total={state.questions.length} results={results} />
          <span className="text-[13px] font-extrabold tabular-nums">
            {state.index + 1}/{state.questions.length}
          </span>
        </div>
      </section>

      {answering && q.kind === 'name' && (
        <Sheet>
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
        </Sheet>
      )}

      {state.feedback && (
        <Sheet live>
          <Feedback result={state.feedback} catalog={catalog} />
          <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2.5">
            <ButtonLink
              to={`/lexicon/regions/${state.feedback.targetRegionId}`}
              variant="secondary"
            >
              {da.mapQuiz.readAbout}
            </ButtonLink>
            <Button onClick={next}>
              {last ? da.mapQuiz.summary.title : da.mapQuiz.nextRegion}
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  )
}

/** Bottom sheet with the drag handle; the feedback variant is a live region. */
function Sheet({ live = false, children }: { live?: boolean; children: React.ReactNode }) {
  return (
    <section
      aria-label={live ? da.mapQuiz.feedbackLabel : da.mapQuiz.prompt.name}
      aria-live={live ? 'polite' : undefined}
      className="bg-surface shadow-sheet absolute inset-x-0 bottom-0 z-[2] flex flex-col gap-3 rounded-t-[28px] px-4 pt-2.5 pb-[max(24px,env(safe-area-inset-bottom))] md:inset-x-auto md:right-6 md:bottom-6 md:w-[420px] md:rounded-[28px]"
    >
      <span
        aria-hidden="true"
        className="bg-line h-[5px] w-10 self-center rounded-full md:hidden"
      />
      {children}
    </section>
  )
}

function Feedback({ result, catalog }: { result: MapResult; catalog: Catalog }) {
  const outcome = result.correct
    ? result.points === result.maxPoints
      ? 'correct'
      : 'partial'
    : 'wrong'
  const tone =
    outcome === 'correct'
      ? 'bg-ok-soft text-ok'
      : outcome === 'partial'
        ? 'bg-partial-soft text-partial'
        : 'bg-wrong-soft text-wrong'
  const target = catalog.region(result.targetRegionId)
  const geoId = result.answer.kind === 'click' ? result.answer.insideGeoId : null
  const clickedIn = geoId ? catalog.regions.find((r) => r.geoId === geoId) : null
  const wasClick = result.answer.kind === 'click'
  return (
    <>
      <div role="status" className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${tone}`}
        >
          <OutcomeIcon outcome={outcome} size={22} strokeWidth={2.8} />
        </span>
        <div className="flex flex-col">
          <span className="font-serif text-[21px] font-semibold">
            {feedbackTitle(result, catalog)}
          </span>
          <span className="text-ink-2 text-[13px]">
            {interpolate(da.mapQuiz.pointsLine, { points: result.points })}
            {clickedIn && ` · ${interpolate(da.mapQuiz.clickedIn, { name: clickedIn.name })}`}
          </span>
          <span className="sr-only">{feedbackText(result, catalog)}</span>
        </div>
      </div>
      <p className="text-ink-2 text-sm leading-relaxed">
        {[
          target.name,
          catalog
            .ancestors(target.id)
            .slice(1)
            .reverse()
            .map((r) => r.name)
            .join(' › '),
          target.climate ? da.climate[target.climate] : '',
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {wasClick && (
        <div className="text-ink-2 flex flex-wrap gap-3.5 text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <span className="bg-ok h-3 w-3 rounded-full" />
            {da.mapQuiz.legendTarget}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="border-wrong bg-wrong-soft box-border h-3 w-3 rounded-full border-2" />
            {da.mapQuiz.legendClick}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-map-region h-3 w-3 rounded-full" />
            {da.mapQuiz.legendOthers}
          </span>
        </div>
      )}
    </>
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
    <div className="flex flex-col gap-2.5">
      <span className="font-serif text-lg font-semibold">{da.mapQuiz.prompt.name}</span>
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
                className={`flex min-h-[52px] items-center justify-between gap-1.5 rounded-[14px] px-3.5 text-left text-[15px] ${
                  active
                    ? 'border-primary-ink bg-primary-soft text-primary-ink border-2 font-extrabold'
                    : 'border-line bg-surface text-ink border-[1.5px] font-bold'
                }`}
              >
                {catalog.region(id).name}
                {active && (
                  <span
                    aria-hidden="true"
                    className="border-primary-ink box-border h-[18px] w-[18px] shrink-0 rounded-full border-[5px]"
                  />
                )}
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
      <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2.5">
        <Button onClick={onLock} disabled={pending === null}>
          <Icon name="lock" size={18} strokeWidth={2.4} />
          {da.common.lockAnswer}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            onSelect(null)
            onLock()
          }}
        >
          {da.common.skip}
        </Button>
      </div>
    </div>
  )
}

function primaryTargetId(question: MapQuestion): string {
  return question.kind === 'grape' ? question.regionIds[0]! : question.regionId
}

/** "Klik på <b>Barolo</b>": the name in bordeaux, the rest plain. */
function Prompt({ question, catalog }: { question: MapQuestion; catalog: Catalog }) {
  const t = da.mapQuiz.prompt
  const strong = (name: string) => <b className="text-primary-ink font-bold">{name}</b>
  switch (question.kind) {
    case 'find': {
      const [before, after] = t.find.split('{name}')
      return (
        <>
          {before}
          {strong(catalog.region(question.regionId).name)}
          {after}
        </>
      )
    }
    case 'name':
      return <>{t.name}</>
    case 'grape': {
      const [before, after] = t.grape.split('{name}')
      return (
        <>
          {before}
          {strong(catalog.grape(question.grapeId).name)}
          {after}
        </>
      )
    }
  }
}

function scopeLabel(
  options: { mode: string; countryId: string; world: string },
  catalog: Catalog,
): string {
  const t = da.mapQuiz
  const place =
    options.countryId !== 'all'
      ? catalog.region(options.countryId).name
      : options.world === 'all'
        ? t.world.all
        : t.world[options.world as 'old' | 'new']
  if (options.mode === 'name') return interpolate(t.nameIn, { name: place })
  if (options.mode === 'grape') return t.grapeIn
  return interpolate(t.findIn, { name: place })
}

function feedbackTitle(result: MapResult, catalog: Catalog): string {
  const name = catalog.region(result.targetRegionId).name
  const t = da.mapQuiz
  const km = Math.round(result.distanceKm ?? 0).toLocaleString('da-DK')
  if (result.question.kind === 'name') {
    if (result.answer.kind === 'choice' && result.answer.regionId === null)
      return interpolate(t.skippedTitle, { name })
    return interpolate(result.correct ? t.nameTitleOk : t.nameTitleWrong, { name })
  }
  if (result.points === result.maxPoints) return t.hitTitle
  if (result.correct) return interpolate(t.nearTitle, { km })
  return interpolate(t.missTitle, { km })
}

function feedbackText(result: MapResult, catalog: Catalog): string {
  const name = catalog.region(result.targetRegionId).name
  const t = da.mapQuiz.feedback
  if (result.question.kind === 'name') {
    if (result.answer.kind === 'choice' && result.answer.regionId === null)
      return interpolate(t.skipped, { name })
    return interpolate(result.correct ? t.nameCorrect : t.nameWrong, { name })
  }
  const values = { name, points: result.points, distance: Math.round(result.distanceKm ?? 0) }
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
