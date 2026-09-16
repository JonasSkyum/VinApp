import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { PageTitle } from '@/components/PageTitle'
import {
  DAILY_DIFFICULTY,
  dailyDateKey,
  dailyNumber,
  dailySeed,
  dailyStreak,
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
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { interpolate } from '@/lib/text'
import { DailySummary } from './DailySummary'

const DAILY_OPTIONS: SessionOptions = { difficulty: DAILY_DIFFICULTY, colors: 'both', rounds: 1 }

/**
 * One seeded round per calendar day (Europe/Copenhagen), the same for everyone.
 * The session is local to this page; the result is what persists.
 */
export function DailyPage() {
  const catalog = defaultCatalog
  const progress = useProgress()
  const reduced = useReducedMotion()
  // Fixed at mount so a game that straddles midnight still counts for the day it started.
  const [dateKey] = useState(() => dailyDateKey(Date.now()))
  const { state, startSeeded, select, lock, nextRound } = useTastingSession(catalog)

  const played = progress.data.daily[dateKey]
  const number = dailyNumber(dateKey)
  const streak = dailyStreak(progress.data.daily, dateKey)

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

  const heading = interpolate(da.daily.heading, { number: String(number) })

  if (played && (state.phase === 'setup' || state.phase === 'summary')) {
    return (
      <>
        <PageTitle>{da.pages.daily.title}</PageTitle>
        <p className="text-wine-900/70 mb-4 text-sm">{heading}</p>
        <DailySummary result={played} streak={streak} catalog={catalog} />
      </>
    )
  }

  if (state.phase === 'setup') {
    return (
      <>
        <PageTitle>{da.pages.daily.title}</PageTitle>
        <section className="space-y-4">
          <h2 className="text-wine-800 text-xl font-semibold">{heading}</h2>
          <p className="text-sm">{da.daily.intro}</p>
          {streak > 0 && (
            <p className="text-wine-900/70 text-sm">
              {da.daily.streak}: {interpolate(da.daily.streakDays, { days: String(streak) })}
            </p>
          )}
          <button
            type="button"
            onClick={start}
            className="bg-wine-700 hover:bg-wine-800 w-full rounded-lg px-4 py-3 text-lg font-semibold text-white"
          >
            {da.daily.start}
          </button>
        </section>
      </>
    )
  }

  const round = state.round!

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <PageTitle>{da.pages.daily.title}</PageTitle>
        <span className="text-wine-900/70 text-sm">#{number}</span>
      </div>

      {state.phase === 'question' && (
        <TastingCard tastingCase={round.tastingCase} catalog={catalog} />
      )}

      {state.phase === 'question' ? (
        <motion.div
          key={`q-${state.tierIndex}`}
          initial={reduced ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <QuestionPanel
            question={round.questions[state.tierIndex]!}
            pending={state.pending}
            catalog={catalog}
            onSelect={select}
            onLock={lock}
            onSkip={() => {
              select(null)
              lock()
            }}
          />
        </motion.div>
      ) : (
        <RoundResult
          tastingCase={round.tastingCase}
          score={state.scores[0]!}
          catalog={catalog}
          isLastRound
          onNext={nextRound}
        />
      )}
    </div>
  )
}
