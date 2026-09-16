import { memoryStorage } from '@/lib/storage'
import {
  createProgressStore,
  exportProgress,
  importProgress,
  initialProgress,
  PROGRESS_KEY,
  PROGRESS_VERSION,
  type ProgressData,
} from './progressStore'

const sample: ProgressData = {
  log: [
    {
      kind: 'grape',
      itemId: 'syrah',
      tier: 3,
      correct: true,
      guessedId: null,
      points: 3,
      timestamp: 1000,
    },
  ],
  leitner: { 'grape:syrah': { box: 1, reviewedAt: 1000, dueAt: 2000 } },
  settings: { unlockingEnabled: true },
}

describe('progress store', () => {
  it('persists and validates', () => {
    const storage = memoryStorage()
    const store = createProgressStore(storage)
    expect(store.load()).toEqual(initialProgress())
    store.save(sample)
    expect(createProgressStore(storage).load()).toEqual(sample)

    storage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ version: PROGRESS_VERSION, data: { log: 'nope' } }),
    )
    expect(createProgressStore(storage).load()).toEqual(initialProgress())
  })
})

describe('export / import', () => {
  it('round-trips through the export file format', () => {
    const json = exportProgress(sample, new Date('2026-09-16T10:00:00Z'))
    const parsed = JSON.parse(json)
    expect(parsed).toMatchObject({ app: 'vinspil', version: PROGRESS_VERSION })
    expect(parsed.exportedAt).toBe('2026-09-16T10:00:00.000Z')
    expect(importProgress(json)).toEqual(sample)
  })

  it('rejects foreign, newer or malformed files', () => {
    expect(() => importProgress('{"foo":1}')).toThrow('Not a Vinspil export')
    expect(() =>
      importProgress(JSON.stringify({ app: 'vinspil', version: 99, data: sample })),
    ).toThrow('newer version')
    expect(() =>
      importProgress(JSON.stringify({ app: 'vinspil', version: 0, data: sample })),
    ).toThrow('No migration')
    expect(() =>
      importProgress(JSON.stringify({ app: 'vinspil', version: 1, data: { log: [] } })),
    ).toThrow()
    expect(() => importProgress('not json')).toThrow()
  })
})
