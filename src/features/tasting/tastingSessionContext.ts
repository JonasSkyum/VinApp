import { createContext, useContext } from 'react'
import type { SessionOptions } from '@/engine'
import type { useTastingSession } from './useTastingSession'

export type TastingSession = ReturnType<typeof useTastingSession> & {
  /** Starts a session whose styles are chosen from low Leitner boxes and confusions. */
  startWeak: (options: SessionOptions) => void
}

export const TastingSessionContext = createContext<TastingSession | null>(null)

export function useTastingSessionContext(): TastingSession {
  const session = useContext(TastingSessionContext)
  if (!session)
    throw new Error('useTastingSessionContext must be used inside TastingSessionProvider')
  return session
}
