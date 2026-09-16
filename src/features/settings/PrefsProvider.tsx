import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { StorageLike } from '@/lib/storage'
import { PrefsContext, type PrefsApi } from './prefsContext'
import { createPrefsStore, type Prefs } from './prefsStore'

interface PrefsProviderProps {
  children: ReactNode
  storage?: StorageLike
}

/** Device preferences (theme, sound, onboarding). Applies the theme to <html>. */
export function PrefsProvider({ children, storage }: PrefsProviderProps) {
  const store = useMemo(() => createPrefsStore(storage), [storage])
  const [prefs, setPrefs] = useState<Prefs>(() => store.load())
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    store.save(prefs)
  }, [prefs, store])

  useEffect(() => {
    const root = document.documentElement
    if (prefs.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', prefs.theme)
  }, [prefs.theme])

  const update = useCallback((patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch })), [])

  const api = useMemo<PrefsApi>(() => ({ prefs, update }), [prefs, update])
  return <PrefsContext.Provider value={api}>{children}</PrefsContext.Provider>
}
