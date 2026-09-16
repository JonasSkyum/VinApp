import { createContext, useContext } from 'react'
import type { Session } from './backend'

export type SyncStatus = 'idle' | 'link-sent' | 'syncing' | 'synced' | 'error'

export interface SyncApi {
  /** False when the app runs without Supabase credentials. */
  available: boolean
  session: Session | null
  status: SyncStatus
  error: string | null
  signIn: (email: string) => Promise<void>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
}

export const SyncContext = createContext<SyncApi | null>(null)

export function useSync(): SyncApi {
  const api = useContext(SyncContext)
  if (!api) throw new Error('useSync must be used inside SyncProvider')
  return api
}
