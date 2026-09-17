import { content } from '@/content'
import { createCatalog } from './catalog'
import {
  DAILY_EPOCH,
  dailyDateKey,
  dailyNumber,
  dailyPool,
  dailyStreak,
  dateKeyToDays,
  formatCountdown,
  MIN_VERIFIED_POOL,
  msUntilNextDaily,
  outcomeRow,
  pickDailyStyle,
  shareString,
  toDailyResult,
  type DailyResult,
} from './daily'
import { eligibleStyles } from './session'
import type { RoundScore } from './types'

const catalog = createCatalog(content)

function keyPlusDays(dateKey: string, days: number): string {
  return new Date((dateKeyToDays(dateKey) + days) * 86_400_000).toISOString().slice(0, 10)
}

describe('dailyDateKey', () => {
  it('uses the Copenhagen calendar day, not UTC', () => {
    // 23:30 UTC on 1 July is 01:30 on 2 July in Copenhagen (CEST).
    expect(dailyDateKey(Date.UTC(2026, 6, 1, 23, 30))).toBe('2026-07-02')
    // 23:30 UTC on 1 January is 00:30 on 2 January (CET).
    expect(dailyDateKey(Date.UTC(2026, 0, 1, 23, 30))).toBe('2026-01-02')
    expect(dailyDateKey(Date.UTC(2026, 0, 1, 22, 30))).toBe('2026-01-01')
  })
})

describe('dailyNumber', () => {
  it('starts at #1 on the epoch and counts one per day', () => {
    expect(dailyNumber(DAILY_EPOCH)).toBe(1)
    expect(dailyNumber(keyPlusDays(DAILY_EPOCH, 41))).toBe(42)
  })
})

describe('pickDailyStyle', () => {
  it('gives the same style for the same date', () => {
    expect(pickDailyStyle(catalog, '2026-10-01').id).toBe(pickDailyStyle(catalog, '2026-10-01').id)
  })

  it('only serves styles playable on the daily level', () => {
    const allowed = new Set(
      eligibleStyles(catalog, { difficulty: 'advanced', colors: 'both' }).map((s) => s.id),
    )
    for (let i = 0; i < 30; i++) {
      expect(allowed.has(pickDailyStyle(catalog, keyPlusDays(DAILY_EPOCH, i)).id)).toBe(true)
    }
  })

  it('varies enough over 60 days', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 60; i++) ids.add(pickDailyStyle(catalog, keyPlusDays(DAILY_EPOCH, i)).id)
    const poolSize = dailyPool(catalog).length
    // At least half the pool (or 20 styles) should show up in two months.
    expect(ids.size).toBeGreaterThanOrEqual(Math.min(20, Math.ceil(poolSize / 2)))
  })

  it('prefers verified styles once enough exist, otherwise falls back to all', () => {
    const eligible = eligibleStyles(catalog, { difficulty: 'advanced', colors: 'both' })
    const verifiedIds = new Set(eligible.slice(0, MIN_VERIFIED_POOL).map((s) => s.id))
    const verifiedCatalog = createCatalog({
      ...content,
      styles: content.styles.map((s) => ({ ...s, verified: verifiedIds.has(s.id) })),
    })
    expect(
      dailyPool(verifiedCatalog)
        .map((s) => s.id)
        .sort(),
    ).toEqual([...verifiedIds].sort())

    const tooFew = createCatalog({
      ...content,
      styles: content.styles.map((s, i) => ({ ...s, verified: i === 0 })),
    })
    expect(dailyPool(tooFew)).toHaveLength(eligible.length)
  })

  it('throws when the catalog has nothing to serve', () => {
    expect(() => pickDailyStyle(createCatalog({ ...content, styles: [] }), '2026-10-01')).toThrow(
      'No styles',
    )
  })
})

describe('msUntilNextDaily', () => {
  it('counts down to midnight in Copenhagen', () => {
    // 22:00 UTC on 1 July = 00:00 CEST on 2 July, so 21:59:59 UTC has one second left.
    expect(msUntilNextDaily(Date.UTC(2026, 6, 1, 21, 59, 59))).toBe(1000)
    // 23:00 UTC on 1 January = 00:00 CET on 2 January.
    expect(msUntilNextDaily(Date.UTC(2026, 0, 1, 20))).toBe(3 * 60 * 60 * 1000)
  })

  it('is exact across a DST change', () => {
    // Clocks go forward on 29 March 2026 at 02:00 CET; that day is only 23 hours long.
    const midnightBefore = Date.UTC(2026, 2, 28, 23) // 00:00 CET on 29 March
    expect(msUntilNextDaily(midnightBefore)).toBe(23 * 60 * 60 * 1000)
  })

  it('formats a countdown as HH:MM:SS', () => {
    expect(formatCountdown(3 * 3600_000 + 7 * 60_000 + 9_000)).toBe('03:07:09')
    expect(formatCountdown(-5)).toBe('00:00:00')
  })
})

describe('shareString', () => {
  const score: RoundScore = {
    total: 8,
    max: 9,
    tiers: [
      { tier: 2, answer: 'cool', correctId: 'cool', points: 1, maxPoints: 1, outcome: 'correct' },
      { tier: 3, answer: 'x', correctId: 'y', points: 1, maxPoints: 3, outcome: 'partial' },
      { tier: 4, answer: 'x', correctId: 'y', points: 0, maxPoints: 2, outcome: 'wrong' },
      { tier: 5, answer: null, correctId: 'y', points: 0, maxPoints: 3, outcome: 'skipped' },
    ],
  }

  it('builds a Wordle-style line with one emoji per tier', () => {
    const result = toDailyResult(keyPlusDays(DAILY_EPOCH, 41), 'sancerre', score, 1)
    expect(outcomeRow(result.tiers)).toBe('🟩🟨⬛⬜')
    expect(shareString(result)).toBe('Vinspil #42 🍷 🟩🟨⬛⬜ 8/9')
    expect(shareString(result, 'https://example.test/#/daily')).toBe(
      'Vinspil #42 🍷 🟩🟨⬛⬜ 8/9\nhttps://example.test/#/daily',
    )
  })
})

describe('dailyStreak', () => {
  const played = (...keys: string[]): Record<string, DailyResult> =>
    Object.fromEntries(
      keys.map((k) => [k, { dateKey: k, styleId: 's', total: 0, max: 10, tiers: [], playedAt: 0 }]),
    )

  it('counts consecutive days back from today', () => {
    expect(dailyStreak(played('2026-10-01', '2026-10-02', '2026-10-03'), '2026-10-03')).toBe(3)
    expect(dailyStreak(played('2026-10-01', '2026-10-03'), '2026-10-03')).toBe(1)
  })

  it('keeps the streak alive until today is played', () => {
    expect(dailyStreak(played('2026-10-01', '2026-10-02'), '2026-10-03')).toBe(2)
    expect(dailyStreak(played('2026-10-01', '2026-10-02'), '2026-10-04')).toBe(0)
    expect(dailyStreak({}, '2026-10-04')).toBe(0)
  })
})
