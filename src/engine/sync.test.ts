import type { DailyResult } from './daily'
import type { AnswerRecord } from './progress'
import type { SyncedProgress } from './sync'
import {
  isPushEmpty,
  mergeDaily,
  mergeLeitner,
  mergeLogs,
  mergeProgress,
  pendingPush,
  recordClientId,
} from './sync'

const rec = (over: Partial<AnswerRecord> = {}): AnswerRecord => ({
  kind: 'grape',
  itemId: 'syrah',
  tier: 3,
  correct: true,
  guessedId: null,
  points: 3,
  timestamp: 1000,
  ...over,
})

const daily = (dateKey: string, playedAt: number, total = 7): DailyResult => ({
  dateKey,
  styleId: 'sancerre',
  total,
  max: 10,
  tiers: [{ tier: 3, outcome: 'correct' }],
  playedAt,
})

describe('recordClientId', () => {
  it('is stable for equal records and differs when any field differs', () => {
    expect(recordClientId(rec())).toBe(recordClientId(rec()))
    expect(recordClientId(rec())).not.toBe(recordClientId(rec({ correct: false })))
    expect(recordClientId(rec())).not.toBe(recordClientId(rec({ itemId: 'gamay' })))
    expect(recordClientId(rec())).not.toBe(recordClientId(rec({ timestamp: 1001 })))
    expect(recordClientId(rec())).toMatch(/^1000-grape-syrah-3-[0-9a-f]+$/)
  })
})

describe('mergeLogs', () => {
  it('unions both sides without duplicates, in time order', () => {
    const shared = rec()
    const local = [rec({ timestamp: 3000, itemId: 'gamay' }), shared]
    const remote = [shared, rec({ timestamp: 2000, kind: 'region', itemId: 'rioja', tier: 5 })]
    const merged = mergeLogs(local, remote)
    expect(merged.map((r) => r.timestamp)).toEqual([1000, 2000, 3000])
  })
})

describe('mergeLeitner', () => {
  it('keeps the highest box, and the latest review on ties', () => {
    const merged = mergeLeitner(
      {
        'grape:syrah': { box: 2, reviewedAt: 10, dueAt: 20 },
        'grape:gamay': { box: 3, reviewedAt: 50, dueAt: 60 },
        'style:barolo': { box: 1, reviewedAt: 5, dueAt: 6 },
      },
      {
        'grape:syrah': { box: 4, reviewedAt: 5, dueAt: 30 },
        'grape:gamay': { box: 3, reviewedAt: 40, dueAt: 55 },
        'region:rioja': { box: 5, reviewedAt: 1, dueAt: 2 },
      },
    )
    expect(merged['grape:syrah']!.box).toBe(4)
    expect(merged['grape:gamay']!.reviewedAt).toBe(50)
    expect(merged['style:barolo']!.box).toBe(1)
    expect(merged['region:rioja']!.box).toBe(5)
  })
})

describe('mergeDaily', () => {
  it('unions days and keeps the earliest play for a day on both sides', () => {
    const merged = mergeDaily(
      { '2026-09-16': daily('2026-09-16', 200, 9), '2026-09-17': daily('2026-09-17', 300) },
      { '2026-09-16': daily('2026-09-16', 100, 4), '2026-09-15': daily('2026-09-15', 50) },
    )
    expect(Object.keys(merged).sort()).toEqual(['2026-09-15', '2026-09-16', '2026-09-17'])
    expect(merged['2026-09-16']!.total).toBe(4)
  })
})

describe('pendingPush', () => {
  it('lists only what the server lacks or holds differently', () => {
    const remote: SyncedProgress = {
      log: [rec()],
      leitner: { 'grape:syrah': { box: 2, reviewedAt: 10, dueAt: 20 } },
      daily: { '2026-09-16': daily('2026-09-16', 100) },
    }
    const local: SyncedProgress = {
      log: [rec(), rec({ timestamp: 2000 })],
      leitner: {
        'grape:syrah': { box: 3, reviewedAt: 30, dueAt: 40 },
        'grape:gamay': { box: 1, reviewedAt: 1, dueAt: 2 },
      },
      daily: { '2026-09-16': daily('2026-09-16', 100), '2026-09-17': daily('2026-09-17', 200) },
    }
    const merged = mergeProgress(local, remote)
    const push = pendingPush(merged, remote)
    expect(push.log.map((r) => r.timestamp)).toEqual([2000])
    expect(push.leitner.map((l) => l.key).sort()).toEqual(['grape:gamay', 'grape:syrah'])
    expect(push.daily.map((d) => d.dateKey)).toEqual(['2026-09-17'])
    expect(isPushEmpty(push)).toBe(false)
    expect(isPushEmpty(pendingPush(remote, remote))).toBe(true)
  })
})
