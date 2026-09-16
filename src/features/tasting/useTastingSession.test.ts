import { catalog } from '@/lib/catalog'
import { createReducer, createRound, initialState, type SessionState } from './useTastingSession'

const reducer = createReducer(catalog)
const options = { difficulty: 'beginner', colors: 'red', rounds: 2 } as const

function started(): SessionState {
  return reducer(initialState(), { type: 'start', options, seed: 'seed-1' })
}

function playRound(state: SessionState, answer: (tier: number) => string | null): SessionState {
  let s = state
  while (s.phase === 'question') {
    const question = s.round!.questions[s.tierIndex]!
    s = reducer(s, { type: 'select', answer: answer(question.tier) })
    s = reducer(s, { type: 'lock' })
  }
  return s
}

describe('session reducer', () => {
  it('starts deterministically from a seed', () => {
    const a = started()
    const b = started()
    expect(a.phase).toBe('question')
    expect(a.styleIds).toHaveLength(2)
    expect(a.styleIds).toEqual(b.styleIds)
    expect(a.round).toEqual(b.round)
    expect(a.round!.questions).toHaveLength(4)
    for (const id of a.styleIds) expect(catalog.style(id).color).toBe('red')
  })

  it('locks one tier at a time and scores the round on the last tier', () => {
    let s = started()
    const q1 = s.round!.questions[0]!
    s = reducer(s, { type: 'select', answer: q1.correctId })
    expect(s.pending).toBe(q1.correctId)
    s = reducer(s, { type: 'lock' })
    expect(s.tierIndex).toBe(1)
    expect(s.pending).toBeNull()
    expect(s.answers).toEqual({ 1: q1.correctId })

    s = playRound(s, (tier) => (tier === 3 ? null : s.round!.questions[tier - 1]!.correctId))
    expect(s.phase).toBe('result')
    expect(s.scores).toHaveLength(1)
    const score = s.scores[0]!
    expect(score.total).toBe(score.max - 3) // grape skipped
    expect(score.tiers.find((t) => t.tier === 3)?.outcome).toBe('skipped')
  })

  it('ignores lock and select outside the question phase', () => {
    const s = initialState()
    expect(reducer(s, { type: 'lock' })).toBe(s)
    expect(reducer(s, { type: 'select', answer: 'x' })).toBe(s)
    expect(reducer(s, { type: 'nextRound' })).toBe(s)
  })

  it('moves through rounds to the summary, then restarts or resets', () => {
    let s = playRound(started(), () => null)
    s = reducer(s, { type: 'nextRound' })
    expect(s.phase).toBe('question')
    expect(s.roundIndex).toBe(1)
    expect(s.answers).toEqual({})
    s = playRound(s, () => null)
    s = reducer(s, { type: 'nextRound' })
    expect(s.phase).toBe('summary')
    expect(s.scores).toHaveLength(2)

    const restarted = reducer(s, { type: 'restart', seed: 'seed-2' })
    expect(restarted.phase).toBe('question')
    expect(restarted.seed).toBe('seed-2')
    expect(restarted.options).toEqual(options)
    expect(restarted.scores).toEqual([])

    const reset = reducer(s, { type: 'reset' })
    expect(reset.phase).toBe('setup')
    expect(reset.options).toEqual(options)
  })
})

describe('createRound', () => {
  it('derives case and questions from seed and round index', () => {
    const a = createRound(catalog, 'barolo', 'seed', 0, { ...options, difficulty: 'expert' })
    const b = createRound(catalog, 'barolo', 'seed', 0, { ...options, difficulty: 'expert' })
    const c = createRound(catalog, 'barolo', 'seed', 1, { ...options, difficulty: 'expert' })
    expect(a).toEqual(b)
    expect(a.questions.map((q) => q.tier)).toEqual([1, 2, 3, 4, 5, 6])
    expect(a.tastingCase).not.toEqual(c.tastingCase)
  })
})
