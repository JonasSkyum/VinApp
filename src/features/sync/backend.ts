import type { PushSet, SyncedProgress } from '@/engine'

export interface Session {
  userId: string
  email: string | null
}

/**
 * The narrow slice of Supabase the app needs. Tests use an in-memory
 * implementation; production wraps the real client (see supabaseBackend).
 */
export interface SyncBackend {
  getSession(): Promise<Session | null>
  /** Returns an unsubscribe function. */
  onSessionChange(listener: (session: Session | null) => void): () => void
  /** Sends a magic link; the user finishes signing in from their inbox. */
  signInWithEmail(email: string, redirectTo: string): Promise<void>
  signOut(): Promise<void>
  pull(userId: string): Promise<SyncedProgress>
  push(userId: string, push: PushSet): Promise<void>
}
