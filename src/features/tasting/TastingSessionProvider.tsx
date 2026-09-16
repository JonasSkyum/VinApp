import type { ReactNode } from 'react'
import type { Catalog } from '@/engine'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { TastingSessionContext } from './tastingSessionContext'
import { newSeed, useTastingSession } from './useTastingSession'

interface TastingSessionProviderProps {
  children: ReactNode
  catalog?: Catalog
  /** Injectable for deterministic tests. */
  seedFactory?: () => string
}

/** Keeps the tasting session alive above the route, so a lexicon detour resumes where you left off. */
export function TastingSessionProvider({
  children,
  catalog = defaultCatalog,
  seedFactory = newSeed,
}: TastingSessionProviderProps) {
  const session = useTastingSession(catalog, seedFactory)
  return <TastingSessionContext.Provider value={session}>{children}</TastingSessionContext.Provider>
}
