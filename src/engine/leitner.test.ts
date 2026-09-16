import {
  applyReview,
  BOX_INTERVAL_DAYS,
  boxOf,
  dueUnits,
  parseUnitKey,
  reviewCard,
  unitKey,
  type LeitnerState,
} from './leitner'

const DAY = 24 * 60 * 60 * 1000

describe('leitner', () => {
  it('builds and parses unit keys', () => {
    expect(unitKey('grape', 'syrah')).toBe('grape:syrah')
    expect(parseUnitKey('map-location:rias-baixas')).toEqual({
      kind: 'map-location',
      id: 'rias-baixas',
    })
  })

  it('moves up on correct, back to 1 on wrong, capped at 5', () => {
    const now = 1_000_000
    const first = reviewCard(undefined, true, now)
    expect(first).toEqual({ box: 1, reviewedAt: now, dueAt: now + BOX_INTERVAL_DAYS[1] * DAY })
    let card = first
    for (let i = 0; i < 10; i++) card = reviewCard(card, true, now)
    expect(card.box).toBe(5)
    expect(card.dueAt).toBe(now + 30 * DAY)
    expect(reviewCard(card, false, now).box).toBe(1)
    expect(reviewCard(undefined, false, now).box).toBe(1)
  })

  it('applyReview is immutable and boxOf reports 0 for unseen units', () => {
    const empty: LeitnerState = {}
    const next = applyReview(empty, 'grape', 'syrah', true, 5)
    expect(empty).toEqual({})
    expect(boxOf(next, 'grape', 'syrah')).toBe(1)
    expect(boxOf(next, 'grape', 'gamay')).toBe(0)
    const again = applyReview(next, 'grape', 'syrah', true, 6)
    expect(boxOf(again, 'grape', 'syrah')).toBe(2)
  })

  it('lists due units most overdue first', () => {
    let state: LeitnerState = {}
    state = applyReview(state, 'grape', 'a', true, 0) // due at 1 day
    state = applyReview(state, 'grape', 'b', true, 0)
    state = applyReview(state, 'grape', 'b', true, 0) // box 2, due at 3 days
    state = applyReview(state, 'region', 'c', true, 2 * DAY) // due at 3 days
    expect(dueUnits(state, 0.5 * DAY)).toEqual([])
    expect(dueUnits(state, 1 * DAY)).toEqual([{ kind: 'grape', id: 'a' }])
    expect(dueUnits(state, 3 * DAY).map((u) => u.id)).toEqual(['a', 'b', 'c'])
  })
})
