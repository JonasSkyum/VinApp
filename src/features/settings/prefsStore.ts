import { z } from 'zod'
import { createStore, type StorageLike, type Store } from '@/lib/storage'

export const PREFS_KEY = 'vinspil:prefs'
export const PREFS_VERSION = 1

export type Theme = 'system' | 'light' | 'dark'

const prefsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
  sound: z.boolean(),
  onboardingDone: z.boolean(),
  /** Timestamp of the last "install app" dismissal, so the prompt is not nagging. */
  installDismissedAt: z.number().nullable(),
})

export type Prefs = z.infer<typeof prefsSchema>

export function initialPrefs(): Prefs {
  return { theme: 'system', sound: false, onboardingDone: false, installDismissedAt: null }
}

export function createPrefsStore(storage?: StorageLike): Store<Prefs> {
  return createStore<Prefs>(
    {
      key: PREFS_KEY,
      version: PREFS_VERSION,
      initial: initialPrefs,
      validate: (data) => prefsSchema.parse(data),
    },
    storage,
  )
}
