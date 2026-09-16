import { createContext, useContext } from 'react'
import type { Prefs } from './prefsStore'

export interface PrefsApi {
  prefs: Prefs
  update: (patch: Partial<Prefs>) => void
}

export const PrefsContext = createContext<PrefsApi | null>(null)

export function usePrefs(): PrefsApi {
  const api = useContext(PrefsContext)
  if (!api) throw new Error('usePrefs must be used inside PrefsProvider')
  return api
}
