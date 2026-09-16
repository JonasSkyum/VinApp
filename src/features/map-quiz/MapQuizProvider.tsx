import { useEffect, useRef, type ReactNode } from 'react'
import { mapRecord, type Catalog } from '@/engine'
import { useProgress } from '@/features/progress/progressContext'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { MapQuizContext } from './mapQuizContext'
import { newSeed, useMapQuiz } from './useMapQuiz'

interface MapQuizProviderProps {
  children: ReactNode
  catalog?: Catalog
  seedFactory?: () => string
  now?: () => number
}

/** Keeps the map quiz alive above the route and records every answered question into progress. */
export function MapQuizProvider({
  children,
  catalog = defaultCatalog,
  seedFactory = newSeed,
  now = Date.now,
}: MapQuizProviderProps) {
  const quiz = useMapQuiz(catalog, seedFactory, now)
  const progress = useProgress()
  const { state } = quiz

  const recorded = useRef({ seed: '', count: 0 })
  useEffect(() => {
    if (recorded.current.seed !== state.seed) recorded.current = { seed: state.seed, count: 0 }
    if (state.results.length <= recorded.current.count) return
    const result = state.results[state.results.length - 1]!
    recorded.current.count = state.results.length
    progress.record([mapRecord(result, now())])
  }, [state.results, state.seed, progress, now])

  return <MapQuizContext.Provider value={quiz}>{children}</MapQuizContext.Provider>
}
