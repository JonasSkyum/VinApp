import { mergeProgress, type PushSet, type SyncedProgress } from '@/engine'
import type { Session, SyncBackend } from './backend'

export interface MemoryBackend extends SyncBackend {
  store: SyncedProgress
  pushes: PushSet[]
  sentLinks: string[]
  /** Simulates the user clicking the magic link. */
  completeSignIn(userId?: string): void
}

/** In-memory backend for tests: sign-in completes when the test says so. */
export function memoryBackend(initial?: Partial<SyncedProgress>): MemoryBackend {
  const store: SyncedProgress = { log: [], leitner: {}, daily: {}, ...initial }
  const listeners = new Set<(s: Session | null) => void>()
  let session: Session | null = null
  const emit = () => listeners.forEach((l) => l(session))

  const backend: MemoryBackend = {
    store,
    pushes: [],
    sentLinks: [],
    getSession: async () => session,
    onSessionChange(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async signInWithEmail(email) {
      backend.sentLinks.push(email)
    },
    completeSignIn(userId = 'user-1') {
      session = { userId, email: backend.sentLinks.at(-1) ?? 'test@example.com' }
      emit()
    },
    async signOut() {
      session = null
      emit()
    },
    async pull() {
      return { log: [...store.log], leitner: { ...store.leitner }, daily: { ...store.daily } }
    },
    async push(_userId, push) {
      backend.pushes.push(push)
      const merged = mergeProgress(
        {
          log: push.log,
          leitner: Object.fromEntries(push.leitner.map((l) => [l.key, l.card])),
          daily: Object.fromEntries(push.daily.map((d) => [d.dateKey, d])),
        },
        store,
      )
      store.log = merged.log
      store.leitner = merged.leitner
      store.daily = merged.daily
    },
  }
  return backend
}
