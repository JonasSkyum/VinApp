import { createContext, useContext } from 'react'
import type { AnswerRecord, DailyResult } from '@/engine'
import type { ProgressData } from './progressStore'

export interface ProgressApi {
  data: ProgressData
  /** Appends records and updates Leitner boxes. */
  record: (records: AnswerRecord[]) => void
  /** Stores a finished daily challenge under its date. */
  recordDaily: (result: DailyResult) => void
  setUnlockingEnabled: (enabled: boolean) => void
  /** Replaces everything with an imported file's data. */
  replace: (data: ProgressData) => void
  reset: () => void
}

export const ProgressContext = createContext<ProgressApi | null>(null)

export function useProgress(): ProgressApi {
  const api = useContext(ProgressContext)
  if (!api) throw new Error('useProgress must be used inside ProgressProvider')
  return api
}
