import { createContext, useContext } from 'react'
import type { useTastingSession } from './useTastingSession'

export type TastingSession = ReturnType<typeof useTastingSession>

export const TastingSessionContext = createContext<TastingSession | null>(null)

export function useTastingSessionContext(): TastingSession {
  const session = useContext(TastingSessionContext)
  if (!session)
    throw new Error('useTastingSessionContext must be used inside TastingSessionProvider')
  return session
}
