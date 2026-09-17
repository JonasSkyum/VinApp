import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useImmersive } from '@/components/chrome'
import { PageTitle } from '@/components/PageTitle'
import { Heading } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { ProgressBar } from '@/components/ui/Meters'
import { unlockStatus, type SessionOptions } from '@/engine'
import { useProgress } from '@/features/progress/progressContext'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { interpolate } from '@/lib/text'
import { QuestionPanel } from './QuestionPanel'
import { RoundResult } from './RoundResult'
import { SessionSummary } from './SessionSummary'
import { SetupScreen } from './SetupScreen'
import { TastingCard } from './TastingCard'
import { useTastingSessionContext } from './tastingSessionContext'
import { useWide } from './useWide'

export function TastingPage() {
  const catalog = defaultCatalog
  const { state, start, startWeak, select, lock, nextRound, restart, reset } =
    useTastingSessionContext()
  const { data: progress } = useProgress()
  const reduced = useReducedMotion()
  const wide = useWide()
  const playing = state.phase === 'question' || state.phase === 'result'
  useImmersive(playing && !wide)

  if (state.phase === 'setup') {
    return (
      <div className="mx-auto w-full max-w-xl">
        <PageTitle className="mb-1">{da.pages.tasting.title}</PageTitle>
        <p className="text-ink-2 mb-5 text-[15px]">{da.tasting.setupIntro}</p>
        <SetupScreen
          initial={state.options}
          unlocks={unlockStatus(progress.log, progress.settings.unlockingEnabled)}
          canTrainWeak={progress.log.length > 0}
          onStart={start}
          onStartWeak={startWeak}
        />
      </div>
    )
  }

  if (state.phase === 'summary') {
    return (
      <div className="mx-auto w-full max-w-xl">
        <PageTitle>{da.pages.tasting.title}</PageTitle>
        <SessionSummary scores={state.scores} onPlayAgain={restart} onNewSession={reset} />
      </div>
    )
  }

  const round = state.round!
  const total = state.styleIds.length
  const score = state.scores.reduce((sum, s) => sum + s.total, 0)
  const isResult = state.phase === 'result'
  const progressShare = (state.roundIndex + (isResult ? 1 : 0)) / total

  const question = (
    <motion.div
      key={`q-${state.roundIndex}-${state.tierIndex}`}
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
      key={`r-${state.roundIndex}`}
      tastingCase={round.tastingCase}
      score={state.scores[state.scores.length - 1]!}
      catalog={catalog}
      isLastRound={state.roundIndex === total - 1}
      onNext={nextRound}
      wide={wide}
    />
  )

  if (wide) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-ink-2 text-xs font-extrabold tracking-[0.08em] uppercase">
              {da.pages.tasting.title} · {sessionLabel(state.options)}
            </span>
            <Heading as="h1" size="xl" className="text-[32px]">
              {da.common.round} {state.roundIndex + 1} {da.common.of} {total}
            </Heading>
          </div>
          <div
            className="grid flex-1 gap-1"
            style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full ${
                  i < state.roundIndex || (isResult && i === state.roundIndex)
                    ? 'bg-primary'
                    : i === state.roundIndex
                      ? 'bg-primary-ink'
                      : 'bg-track'
                }`}
              />
            ))}
          </div>
          <span
            aria-label={interpolate(da.tasting.scoreAria, { points: score })}
            className="border-line bg-surface flex h-10 items-center rounded-full border px-4 text-[17px] font-extrabold tabular-nums"
          >
            {score} p
          </span>
          <Link
            to="/"
            onClick={reset}
            className="border-line text-ink flex min-h-11 items-center rounded-full border-[1.5px] px-4 text-sm font-bold"
          >
            {da.tasting.exit}
          </Link>
        </div>
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
          onClick={reset}
          aria-label={da.tasting.exit}
          className="text-ink-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        >
          <Icon name="close" size={22} strokeWidth={2.2} />
        </Link>
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex justify-between text-xs font-extrabold tracking-[0.06em] uppercase">
            <span>
              {da.common.round} {state.roundIndex + 1} {da.common.of} {total}
            </span>
            <span className="text-ink-2">
              {isResult ? da.tasting.resultLabel : sessionLabel(state.options)}
            </span>
          </div>
          <ProgressBar value={progressShare} />
        </div>
        <span
          aria-label={interpolate(da.tasting.scoreAria, { points: score })}
          className={`flex h-9 shrink-0 items-center rounded-full px-3 text-[15px] font-extrabold tabular-nums ${
            isResult ? 'bg-ok-soft text-ok' : 'border-line bg-surface border'
          }`}
        >
          {score} p
        </span>
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

function sessionLabel(options: SessionOptions): string {
  const colour = options.colors === 'all' ? null : da.colorFilter[options.colors]
  return [da.level[options.difficulty], colour].filter(Boolean).join(' · ')
}
