import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { isPushEmpty, mergeProgress, pendingPush, type SyncedProgress } from '@/engine'
import { useProgress } from '@/features/progress/progressContext'
import type { ProgressData } from '@/features/progress/progressStore'
import { supabase } from '@/lib/supabase'
import type { Session, SyncBackend } from './backend'
import { supabaseBackend } from './supabaseBackend'
import { SyncContext, type SyncApi, type SyncStatus } from './syncContext'

interface SyncProviderProps {
  children: ReactNode
  /** Injectable for tests. Defaults to Supabase when configured, otherwise sync is off. */
  backend?: SyncBackend | null
  /** Delay between a local change and the push that follows it. */
  debounceMs?: number
}

const DEFAULT_DEBOUNCE_MS = 2000

function synced(data: ProgressData): SyncedProgress {
  return { log: data.log, leitner: data.leitner, daily: data.daily }
}

/** Where the magic link lands: the app root, so both the Pages site and localhost work. */
function redirectUrl(): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}`
}

/**
 * Local-first sync. localStorage stays primary. On login the two copies are
 * merged and written back to both sides; afterwards every local change is
 * pushed after a short debounce. Signing out keeps the local copy untouched.
 */
export function SyncProvider({
  children,
  backend = supabase ? supabaseBackend(supabase) : null,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: SyncProviderProps) {
  const progress = useProgress()
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  /** What we believe the server holds; pushes are diffed against it. */
  const remote = useRef<SyncedProgress | null>(null)
  const data = useRef(progress.data)
  useEffect(() => {
    data.current = progress.data
  }, [progress.data])

  const fail = useCallback((e: unknown) => {
    setStatus('error')
    setError(e instanceof Error ? e.message : String(e))
  }, [])

  // Track the session. A change event that arrives before the initial lookup
  // resolves is the newer truth, so the lookup must not overwrite it.
  useEffect(() => {
    if (!backend) return
    let active = true
    let seenChange = false
    const unsubscribe = backend.onSessionChange((s) => {
      seenChange = true
      setSession((prev) => (prev?.userId === s?.userId ? prev : s))
    })
    backend.getSession().then((s) => {
      if (active && !seenChange) setSession(s)
    }, fail)
    return () => {
      active = false
      unsubscribe()
    }
  }, [backend, fail])

  // Full merge on login.
  const fullSync = useCallback(async () => {
    if (!backend || !session) return
    setStatus('syncing')
    try {
      const server = await backend.pull(session.userId)
      const merged = mergeProgress(synced(data.current), server)
      const push = pendingPush(merged, server)
      if (!isPushEmpty(push)) await backend.push(session.userId, push)
      remote.current = merged
      progress.replace({ ...data.current, ...merged })
      setStatus('synced')
      setError(null)
    } catch (e) {
      fail(e)
    }
  }, [backend, session, progress, fail])

  useEffect(() => {
    // Deferred a tick so the status update never lands in the same render pass.
    if (session) queueMicrotask(() => void fullSync())
    else remote.current = null
    // fullSync changes identity with progress.replace, which is stable; keyed on the user only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId])

  // Debounced push of local changes while signed in.
  useEffect(() => {
    if (!backend || !session || !remote.current) return
    const push = pendingPush(synced(progress.data), remote.current)
    if (isPushEmpty(push)) return
    const id = setTimeout(async () => {
      const snapshot = synced(progress.data)
      try {
        setStatus('syncing')
        await backend.push(session.userId, push)
        remote.current = mergeProgress(snapshot, remote.current ?? snapshot)
        setStatus('synced')
        setError(null)
      } catch (e) {
        fail(e)
      }
    }, debounceMs)
    return () => clearTimeout(id)
  }, [backend, session, progress.data, debounceMs, fail])

  const signIn = useCallback(
    async (email: string) => {
      if (!backend) return
      try {
        await backend.signInWithEmail(email.trim(), redirectUrl())
        setStatus('link-sent')
        setError(null)
      } catch (e) {
        fail(e)
      }
    },
    [backend, fail],
  )

  const signOut = useCallback(async () => {
    if (!backend) return
    try {
      await backend.signOut()
      setSession(null)
      setStatus('idle')
      setError(null)
    } catch (e) {
      fail(e)
    }
  }, [backend, fail])

  const api = useMemo<SyncApi>(
    () => ({
      available: backend !== null,
      session,
      status,
      error,
      signIn,
      signOut,
      syncNow: fullSync,
    }),
    [backend, session, status, error, signIn, signOut, fullSync],
  )

  return <SyncContext.Provider value={api}>{children}</SyncContext.Provider>
}
