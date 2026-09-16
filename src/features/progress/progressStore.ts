import { z } from 'zod'
import type { AnswerRecord, LeitnerState } from '@/engine'
import { createStore, type StorageLike, type Store } from '@/lib/storage'

export const PROGRESS_KEY = 'vinspil:progress'
export const PROGRESS_VERSION = 1

const answerRecordSchema = z.object({
  kind: z.enum(['grape', 'region', 'style', 'map-location']),
  itemId: z.string(),
  tier: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal('map'),
  ]),
  correct: z.boolean(),
  guessedId: z.string().nullable(),
  points: z.number(),
  timestamp: z.number(),
})

const leitnerCardSchema = z.object({
  box: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  reviewedAt: z.number(),
  dueAt: z.number(),
})

export const progressDataSchema = z.object({
  log: z.array(answerRecordSchema),
  leitner: z.record(z.string(), leitnerCardSchema),
  settings: z.object({
    unlockingEnabled: z.boolean(),
  }),
})

export interface ProgressData {
  log: AnswerRecord[]
  leitner: LeitnerState
  settings: { unlockingEnabled: boolean }
}

export function initialProgress(): ProgressData {
  return { log: [], leitner: {}, settings: { unlockingEnabled: true } }
}

/** Parses untrusted data (storage or an imported file) into ProgressData, or throws. */
export function parseProgress(data: unknown): ProgressData {
  return progressDataSchema.parse(data) as ProgressData
}

/** Migrations from older stored versions land here as the format evolves. */
export function migrateProgress(_data: unknown, fromVersion: number): ProgressData {
  throw new Error(`No migration from progress version ${fromVersion}`)
}

export function createProgressStore(storage?: StorageLike): Store<ProgressData> {
  return createStore<ProgressData>(
    {
      key: PROGRESS_KEY,
      version: PROGRESS_VERSION,
      initial: initialProgress,
      migrate: migrateProgress,
      validate: parseProgress,
    },
    storage,
  )
}

/** Export file format. */
export interface ProgressExport {
  app: 'vinspil'
  version: number
  exportedAt: string
  data: ProgressData
}

export function exportProgress(data: ProgressData, now: Date = new Date()): string {
  const file: ProgressExport = {
    app: 'vinspil',
    version: PROGRESS_VERSION,
    exportedAt: now.toISOString(),
    data,
  }
  return JSON.stringify(file, null, 2)
}

/** Parses an exported file, migrating older versions. Throws on anything unusable. */
export function importProgress(json: string): ProgressData {
  const parsed = JSON.parse(json) as Partial<ProgressExport>
  if (parsed?.app !== 'vinspil' || typeof parsed.version !== 'number') {
    throw new Error('Not a Vinspil export')
  }
  if (parsed.version > PROGRESS_VERSION) throw new Error('Export is from a newer version')
  const data =
    parsed.version < PROGRESS_VERSION ? migrateProgress(parsed.data, parsed.version) : parsed.data
  return parseProgress(data)
}
