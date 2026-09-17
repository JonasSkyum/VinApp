import {
  accuracyByTier,
  confusionMatrix,
  longestStreak,
  roundsPlayed,
  dayIndex,
  levelForXp,
  levelProgress,
  masteryByItem,
  streakDays,
  totalXp,
  xpByDay,
  xpForLevel,
  type AnswerRecord,
} from './progress'
import { ADVANCED_UNLOCK_GRAPES, EXPERT_UNLOCK_REGIONS, unlockStatus } from './unlock'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 8, 16, 12) // noon, avoids timezone edge cases

function rec(partial: Partial<AnswerRecord>): AnswerRecord {
  return {
    kind: 'grape',
    itemId: 'pinot-noir',
    tier: 3,
    correct: false,
    guessedId: null,
    points: 0,
    timestamp: NOW,
    ...partial,
  }
}

describe('confusionMatrix', () => {
  it('counts wrong answers with a guess, most frequent first', () => {
    const log = [
      rec({ itemId: 'pinot-noir', guessedId: 'gamay' }),
      rec({ itemId: 'pinot-noir', guessedId: 'gamay' }),
      rec({ itemId: 'syrah', guessedId: 'malbec' }),
      rec({ itemId: 'pinot-noir', guessedId: 'gamay', correct: true }), // correct: ignored
      rec({ itemId: 'nebbiolo' }), // skipped: ignored
    ]
    expect(confusionMatrix(log)).toEqual([
      { kind: 'grape', correctId: 'pinot-noir', guessedId: 'gamay', count: 2 },
      { kind: 'grape', correctId: 'syrah', guessedId: 'malbec', count: 1 },
    ])
  })
})

describe('masteryByItem', () => {
  it('computes percentages per item of a kind', () => {
    const log = [
      rec({ correct: true }),
      rec({ correct: false }),
      rec({ correct: true }),
      rec({ kind: 'region', itemId: 'loire', tier: 5, correct: true }),
    ]
    expect(masteryByItem(log, 'grape')).toEqual([
      { id: 'pinot-noir', correct: 2, total: 3, percent: 67 },
    ])
    expect(masteryByItem(log, 'style')).toEqual([])
  })
})

describe('streakDays', () => {
  it('counts consecutive days back from today or yesterday', () => {
    expect(streakDays([], NOW)).toBe(0)
    const threeDays = [
      rec({ timestamp: NOW }),
      rec({ timestamp: NOW - DAY }),
      rec({ timestamp: NOW - 2 * DAY }),
      rec({ timestamp: NOW - 5 * DAY }), // gap: not counted
    ]
    expect(streakDays(threeDays, NOW)).toBe(3)
    // Nothing yet today: yesterday's streak still stands.
    expect(streakDays(threeDays.slice(1), NOW)).toBe(2)
    // Two days ago only: streak is broken.
    expect(streakDays([rec({ timestamp: NOW - 2 * DAY })], NOW)).toBe(0)
  })
})

describe('xp', () => {
  it('sums points, buckets by day and derives levels', () => {
    const log = [
      rec({ points: 3, timestamp: NOW }),
      rec({ points: 2, timestamp: NOW }),
      rec({ points: 7, timestamp: NOW - DAY }),
      rec({ points: 9, timestamp: NOW - 20 * DAY }), // outside the window
    ]
    expect(totalXp(log)).toBe(21)
    const curve = xpByDay(log, NOW, 3)
    expect(curve.map((d) => d.xp)).toEqual([0, 7, 5])
    expect(curve[2]!.day).toBe(dayIndex(NOW))

    expect(xpForLevel(1)).toBe(0)
    expect(xpForLevel(2)).toBe(50)
    expect(xpForLevel(3)).toBe(200)
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(49)).toBe(1)
    expect(levelForXp(50)).toBe(2)
    expect(levelForXp(200)).toBe(3)
    expect(levelProgress(75)).toEqual({ level: 2, xp: 75, current: 25, needed: 150 })
  })
})

describe('unlockStatus', () => {
  it('unlocks advanced by grape answers and expert by region answers', () => {
    const grapes = Array.from({ length: ADVANCED_UNLOCK_GRAPES }, () => rec({ correct: true }))
    const regions = Array.from({ length: EXPERT_UNLOCK_REGIONS - 1 }, () =>
      rec({ kind: 'region', itemId: 'loire', tier: 5, correct: true }),
    )
    const status = unlockStatus([...grapes, ...regions], true)
    expect(status.beginner.unlocked).toBe(true)
    expect(status.advanced).toEqual({ unlocked: true, have: 10, need: 10 })
    expect(status.expert).toEqual({ unlocked: false, have: 9, need: 10 })
    expect(unlockStatus([], true).advanced).toEqual({ unlocked: false, have: 0, need: 10 })
  })

  it('unlocks everything when unlocking is disabled', () => {
    const status = unlockStatus([], false)
    expect(status.advanced.unlocked).toBe(true)
    expect(status.expert.unlocked).toBe(true)
  })
})

describe('accuracyByTier', () => {
  it('groups by tier in order with map last', () => {
    const log = [
      rec({ tier: 5, correct: true }),
      rec({ tier: 3, correct: true }),
      rec({ tier: 3 }),
      rec({ tier: 'map', kind: 'map-location', correct: true }),
    ]
    expect(accuracyByTier(log)).toEqual([
      { tier: 3, correct: 1, total: 2, percent: 50 },
      { tier: 5, correct: 1, total: 1, percent: 100 },
      { tier: 'map', correct: 1, total: 1, percent: 100 },
    ])
  })

  it('is empty for an empty log', () => {
    expect(accuracyByTier([])).toEqual([])
  })
})

describe('longestStreak', () => {
  it('finds the longest run of consecutive days', () => {
    const log = [
      rec({ timestamp: NOW }),
      rec({ timestamp: NOW - DAY }),
      rec({ timestamp: NOW - DAY }), // same day twice
      rec({ timestamp: NOW - 4 * DAY }),
      rec({ timestamp: NOW - 5 * DAY }),
      rec({ timestamp: NOW - 6 * DAY }),
    ]
    expect(longestStreak(log)).toBe(3)
    expect(longestStreak([])).toBe(0)
  })
})

describe('roundsPlayed', () => {
  it('counts style records', () => {
    expect(
      roundsPlayed([rec({ kind: 'style', tier: 6 }), rec({ kind: 'style', tier: 6 }), rec({})]),
    ).toBe(2)
  })
})
