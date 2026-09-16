import type { AnswerRecord, DailyResult, LeitnerCard } from '@/engine'
import {
  fromAnswerRow,
  fromDailyRow,
  fromLeitnerRow,
  toAnswerRow,
  toDailyRow,
  toLeitnerRow,
} from './rows'

const USER = '11111111-1111-1111-1111-111111111111'
const NOW = Date.UTC(2026, 8, 16, 12, 34, 56)

describe('row conversions', () => {
  it('round-trip an answer record, including the map tier', () => {
    const grape: AnswerRecord = {
      kind: 'grape',
      itemId: 'syrah',
      tier: 3,
      correct: false,
      guessedId: 'grenache',
      points: 1,
      timestamp: NOW,
    }
    const map: AnswerRecord = { ...grape, kind: 'map-location', itemId: 'rioja', tier: 'map' }
    for (const r of [grape, map]) {
      const row = toAnswerRow(r, USER)
      expect(row.user_id).toBe(USER)
      expect(row.answered_at).toBe('2026-09-16T12:34:56.000Z')
      expect(
        fromAnswerRow({
          ...row,
          id: 1,
          created_at: row.answered_at,
          guessed_id: row.guessed_id ?? null,
        }),
      ).toEqual(r)
    }
  })

  it('round-trip a Leitner card and a daily result', () => {
    const card: LeitnerCard = { box: 4, reviewedAt: NOW, dueAt: NOW + 86_400_000 }
    const row = toLeitnerRow('grape:syrah', card, USER)
    expect(fromLeitnerRow({ ...row, updated_at: row.reviewed_at })).toEqual(['grape:syrah', card])

    const daily: DailyResult = {
      dateKey: '2026-09-16',
      styleId: 'sancerre',
      total: 7,
      max: 10,
      tiers: [{ tier: 3, outcome: 'correct' }],
      playedAt: NOW,
    }
    const drow = toDailyRow(daily, USER)
    expect(fromDailyRow({ ...drow, tiers: drow.tiers ?? [], created_at: drow.played_at })).toEqual(
      daily,
    )
  })
})
