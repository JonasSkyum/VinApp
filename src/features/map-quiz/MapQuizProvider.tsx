import type { ReactNode } from 'react'
import type { Catalog } from '@/engine'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { MapQuizContext } from './mapQuizContext'
import { newSeed, useMapQuiz } from './useMapQuiz'

interface MapQuizProviderProps {
  children: ReactNode
  catalog?: Catalog
  seedFactory?: () => string
  now?: () => number
}

/** Keeps the map quiz alive above the route, so a lexicon detour does not reset it. */
export function MapQuizProvider({
  children,
  catalog = defaultCatalog,
  seedFactory = newSeed,
  now = Date.now,
}: MapQuizProviderProps) {
  const quiz = useMapQuiz(catalog, seedFactory, now)
  return <MapQuizContext.Provider value={quiz}>{children}</MapQuizContext.Provider>
}
