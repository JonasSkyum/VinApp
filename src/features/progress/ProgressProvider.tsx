import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { applyRecords, type AnswerRecord, type DailyResult } from '@/engine'
import type { StorageLike } from '@/lib/storage'
import { ProgressContext, type ProgressApi } from './progressContext'
import { createProgressStore, type ProgressData } from './progressStore'

interface ProgressProviderProps {
  children: ReactNode
  /** Injectable for tests; defaults to localStorage. */
  storage?: StorageLike
}

/** Local-first progress: loaded from storage once, saved on every change. */
export function ProgressProvider({ children, storage }: ProgressProviderProps) {
  const store = useMemo(() => createProgressStore(storage), [storage])
  const [data, setData] = useState<ProgressData>(() => store.load())
  const first = useRef(true)

  useEffect(() => {
    // The initial value came from the store; only persist actual changes.
    if (first.current) {
      first.current = false
      return
    }
    store.save(data)
  }, [data, store])

  const record = useCallback((records: AnswerRecord[]) => {
    if (records.length === 0) return
    setData((d) => ({
      ...d,
      log: [...d.log, ...records],
      leitner: applyRecords(d.leitner, records),
    }))
  }, [])

  const recordDaily = useCallback((result: DailyResult) => {
    setData((d) => ({ ...d, daily: { ...d.daily, [result.dateKey]: result } }))
  }, [])

  const setUnlockingEnabled = useCallback((enabled: boolean) => {
    setData((d) => ({ ...d, settings: { ...d.settings, unlockingEnabled: enabled } }))
  }, [])

  const replace = useCallback((next: ProgressData) => setData(next), [])

  const reset = useCallback(() => {
    store.clear()
    setData(createProgressStore(storage).load())
  }, [store, storage])

  const api = useMemo<ProgressApi>(
    () => ({ data, record, recordDaily, setUnlockingEnabled, replace, reset }),
    [data, record, recordDaily, setUnlockingEnabled, replace, reset],
  )

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>
}
