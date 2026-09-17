import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { StreakPill } from '@/components/AppLayout'
import { useImmersive } from '@/components/chrome'
import { PageTitle } from '@/components/PageTitle'
import { Icon } from '@/components/ui/Icon'
import { ProgressBar } from '@/components/ui/Meters'
import { GlassOutline } from '@/components/ui/WineGlass'
import {
  DAILY_DIFFICULTY,
  dailyDateKey,
  dailyNumber,
  dailySeed,
  dailyStreak,
  formatCountdown,
  pickDailyStyle,
  roundRecords,
  toDailyResult,
  type SessionOptions,
} from '@/engine'
import { useProgress } from '@/features/progress/progressContext'
import { QuestionPanel } from '@/features/tasting/QuestionPanel'
import { RoundResult } from '@/features/tasting/RoundResult'
import { TastingCard } from '@/features/tasting/TastingCard'
import { useTastingSession } from '@/features/tasting/useTastingSession'
import { useWide } from '@/features/tasting/useWide'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { formatDailyDate } from '@/lib/dates'
import { interpolate } from '@/lib/text'
import { DailySummary } from './DailySummary'
import { useCountdown } from './useCountdown'

const DAILY_OPTIONS: SessionOptions = { difficulty: DAILY_DIFFICULTY, colors: 'both', rounds: 1 }

/**
 * One seeded round per calendar day (Europe/Copenhagen), the same for everyone.
 * The session is local to this page; the result is what persists.
 */
export function DailyPage() {
  const catalog = defaultCatalog
  const progress = useProgress()
  const reduced = useReducedMotion()
  const wide = useWide()
  const remaining = useCountdown()
  // Fixed at mount so a game that straddles midnight still counts for the day it started.
  const [dateKey] = useState(() => dailyDateKey(Date.now()))
  const { state, startSeeded, select, lock, nextRound } = useTastingSession(catalog)

  const played = progress.data.daily[dateKey]
  const number = dailyNumber(dateKey)
  const streak = dailyStreak(progress.data.daily, dateKey)
  const playing = state.phase === 'question' || state.phase === 'result'
  useImmersive(playing && !wide)

  // Persist the round once, the moment it is scored.
  const recorded = useRef(false)
  useEffect(() => {
    if (state.phase !== 'result' || !state.round || recorded.current) return
    recorded.current = true
    const score = state.scores[0]!
    const now = Date.now()
    progress.record(roundRecords(state.round.tastingCase, score, catalog, now))
    progress.recordDaily(toDailyResult(dateKey, state.round.tastingCase.styleId, score, now))
  }, [state.phase, state.round, state.scores, progress, catalog, dateKey])

  const start = () =>
    startSeeded(DAILY_OPTIONS, dailySeed(dateKey), [pickDailyStyle(catalog, dateKey).id])

  const header = (
    <header className="flex min-h-14 items-center justify-between">
      <div className="flex flex-col">
        <PageTitle className="mb-0 text-[28px]">{da.pages.daily.title}</PageTitle>
        <span className="text-ink-2 text-[13px]">
          {interpolate(da.daily.numberDate, { number, date: formatDailyDate(dateKey) })}
        </span>
      </div>
      <StreakPill days={streak} />
    </header>
  )

  if (played && (state.phase === 'setup' || state.phase === 'summary')) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3.5">
        {header}
        <DailySummary result={played} streak={streak} catalog={catalog} />
      </div>
    )
  }

  if (state.phase === 'setup') {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3.5">
        {header}
        <section className="bg-primary text-on-primary shadow-float relative flex flex-col gap-4 overflow-hidden rounded-[26px] p-5">
          <GlassOutline
            size={220}
            stroke="#FBF5E9"
            className="pointer-events-none absolute -top-4 -right-8 opacity-[0.16]"
          />
          <span className="relative text-xs font-extrabold tracking-[0.08em]">
            {interpolate(da.home.dailyLabel, { number })}
          </span>
          <div className="relative flex flex-col gap-1.5">
            <span className="font-serif text-[30px] leading-[1.1] font-semibold">
              {da.home.dailyTitle}
            </span>
            <p className="max-w-[300px] text-sm leading-relaxed opacity-90">{da.daily.intro}</p>
          </div>
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-semibold opacity-85">{da.home.dailyNextIn}</span>
              <span
                className="text-xl font-extrabold tabular-nums"
                aria-label={da.daily.countdownLabel}
              >
                {formatCountdown(remaining)}
              </span>
            </div>
            <button
              type="button"
              onClick={start}
              className="press bg-paper text-bordeaux flex min-h-[52px] items-center gap-2 rounded-full px-6 text-base font-extrabold"
              style={{ boxShadow: 'inset 0 -3px 0 rgba(122,31,61,.2)' }}
            >
              {da.daily.start}
              <Icon name="arrowRight" size={16} strokeWidth={2.6} />
            </button>
          </div>
        </section>
      </div>
    )
  }

  const round = state.round!
  const isResult = state.phase === 'result'

  const question = (
    <motion.div
      key={`q-${state.tierIndex}`}
      initial={reduced ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
    >
      <QuestionPanel
        questions={round.questions}
        tierIndex={state.tierIndex}
        answers={state.answers}
        pending={state.pending}
        catalog={catalog}
        onSelect={select}
        onLock={lock}
        onSkip={() => {
          select(null)
          lock()
        }}
        wide={wide}
      />
    </motion.div>
  )

  const result = (
    <RoundResult
      tastingCase={round.tastingCase}
      score={state.scores[0]!}
      catalog={catalog}
      isLastRound
      onNext={nextRound}
      wide={wide}
    />
  )

  if (wide) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        {isResult ? (
          result
        ) : (
          <div className="grid grid-cols-[440px_minmax(0,1fr)] items-start gap-7">
            <TastingCard tastingCase={round.tastingCase} catalog={catalog} fixed />
            {question}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-canvas sticky top-0 z-10 flex h-[68px] items-center gap-3 px-3 pt-3">
        <Link
          to="/"
          aria-label={da.tasting.exit}
          className="text-ink-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        >
          <Icon name="close" size={22} strokeWidth={2.2} />
        </Link>
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex justify-between text-xs font-extrabold tracking-[0.06em] uppercase">
            <span>{interpolate(da.home.dailyLabel, { number })}</span>
            <span className="text-ink-2">
              {isResult ? da.tasting.resultLabel : da.level.advanced}
            </span>
          </div>
          <ProgressBar value={isResult ? 1 : state.tierIndex / round.questions.length} />
        </div>
      </header>
      <div className="flex flex-col gap-3.5 px-4 pt-2 pb-6">
        {isResult ? (
          result
        ) : (
          <>
            <TastingCard tastingCase={round.tastingCase} catalog={catalog} />
            {question}
          </>
        )}
      </div>
    </div>
  )
}
