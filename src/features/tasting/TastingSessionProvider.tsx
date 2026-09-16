import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { createRng, roundRecords, weakStyles, type Catalog, type SessionOptions } from '@/engine'
import { useProgress } from '@/features/progress/progressContext'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { TastingSessionContext, type TastingSession } from './tastingSessionContext'
import { newSeed, useTastingSession } from './useTastingSession'

interface TastingSessionProviderProps {
  children: ReactNode
  catalog?: Catalog
  /** Injectable for deterministic tests. */
  seedFactory?: () => string
  now?: () => number
}

/**
 * Keeps the tasting session alive above the route, records every finished round
 * into progress, and offers "train weak points" sessions built from that progress.
 */
export function TastingSessionProvider({
  children,
  catalog = defaultCatalog,
  seedFactory = newSeed,
  now = Date.now,
}: TastingSessionProviderProps) {
  const session = useTastingSession(catalog, seedFactory)
  const progress = useProgress()
  const { state } = session

  // Record each round once. A new seed means a new session, so the counter restarts.
  const recorded = useRef({ seed: '', count: 0 })
  useEffect(() => {
    if (recorded.current.seed !== state.seed) recorded.current = { seed: state.seed, count: 0 }
    const { count } = recorded.current
    if (state.scores.length <= count || !state.round) return
    const score = state.scores[state.scores.length - 1]!
    recorded.current.count = state.scores.length
    progress.record(roundRecords(state.round.tastingCase, score, catalog, now()))
  }, [state.scores, state.seed, state.round, catalog, progress, now])

  const { data } = progress
  const startWeak = useCallback(
    (options: SessionOptions) => {
      const seed = seedFactory()
      const styles = weakStyles(catalog, data.leitner, data.log, options, createRng(`${seed}:weak`))
      session.startSeeded(
        options,
        seed,
        styles.map((s) => s.id),
      )
    },
    [catalog, data.leitner, data.log, seedFactory, session],
  )

  const value = useMemo<TastingSession>(() => ({ ...session, startWeak }), [session, startWeak])
  return <TastingSessionContext.Provider value={value}>{children}</TastingSessionContext.Provider>
}
