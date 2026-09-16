import { motion, useReducedMotion } from 'framer-motion'
import { PageTitle } from '@/components/PageTitle'
import type { Catalog } from '@/engine'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { QuestionPanel } from './QuestionPanel'
import { RoundResult } from './RoundResult'
import { SessionSummary } from './SessionSummary'
import { SetupScreen } from './SetupScreen'
import { TastingCard } from './TastingCard'
import { newSeed, useTastingSession } from './useTastingSession'

interface TastingPageProps {
  catalog?: Catalog
  /** Injectable for deterministic tests. */
  seedFactory?: () => string
}

export function TastingPage({ catalog = defaultCatalog, seedFactory = newSeed }: TastingPageProps) {
  const { state, start, select, lock, nextRound, restart, reset } = useTastingSession(
    catalog,
    seedFactory,
  )
  const reduced = useReducedMotion()

  if (state.phase === 'setup') {
    return (
      <>
        <PageTitle>{da.pages.tasting.title}</PageTitle>
        <SetupScreen initial={state.options} onStart={start} />
      </>
    )
  }

  if (state.phase === 'summary') {
    return (
      <>
        <PageTitle>{da.pages.tasting.title}</PageTitle>
        <SessionSummary scores={state.scores} onPlayAgain={restart} onNewSession={reset} />
      </>
    )
  }

  const round = state.round!
  const roundLabel = `${da.common.round} ${state.roundIndex + 1} ${da.common.of} ${state.styleIds.length}`

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <PageTitle>{da.pages.tasting.title}</PageTitle>
        <span className="text-wine-900/70 text-sm">{roundLabel}</span>
      </div>

      {state.phase === 'question' && (
        <TastingCard tastingCase={round.tastingCase} catalog={catalog} />
      )}

      {state.phase === 'question' ? (
        <motion.div
          key={`q-${state.roundIndex}-${state.tierIndex}`}
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
          key={`r-${state.roundIndex}`}
          tastingCase={round.tastingCase}
          score={state.scores[state.scores.length - 1]!}
          catalog={catalog}
          isLastRound={state.roundIndex === state.styleIds.length - 1}
          onNext={nextRound}
        />
      )}
    </div>
  )
}
