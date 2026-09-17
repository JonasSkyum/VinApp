import type { MapQuizOptions } from '@/engine'
import { catalog } from '@/lib/catalog'
import { createMapReducer, initialMapState } from './useMapQuiz'

const reducer = createMapReducer(catalog)
const options: MapQuizOptions = {
  mode: 'find',
  countryId: 'france',
  difficulty: 'advanced',
  count: 3,
}

const started = () =>
  reducer(initialMapState(), { type: 'start', options, seed: 'map-seed', now: 1000 })

describe('map quiz reducer', () => {
  it('starts with seeded questions and a start time', () => {
    const s = started()
    expect(s.phase).toBe('playing')
    expect(s.questions).toHaveLength(3)
    expect(s.startedAt).toBe(1000)
    expect(s.questions).toEqual(started().questions)
  })

  it('records feedback on answer, ignores double answers, and advances on next', () => {
    let s = started()
    const q = s.questions[0]!
    const target = catalog.region(q.kind === 'find' ? q.regionId : '')
    s = reducer(s, {
      type: 'answer',
      answer: { kind: 'click', lngLat: target.center, insideGeoId: 'FRA' },
      now: 2000,
    })
    expect(s.feedback?.correct).toBe(true)
    expect(s.results).toHaveLength(1)
    expect(s.finishedAt).toBeNull()
    const again = reducer(s, {
      type: 'answer',
      answer: { kind: 'click', lngLat: [0, 0], insideGeoId: null },
      now: 2500,
    })
    expect(again).toBe(s)
    s = reducer(s, { type: 'next' })
    expect(s.index).toBe(1)
    expect(s.feedback).toBeNull()
  })

  it('stamps finishedAt on the last answer and reaches the summary', () => {
    let s = started()
    for (let i = 0; i < 3; i++) {
      s = reducer(s, {
        type: 'answer',
        answer: { kind: 'click', lngLat: [0, 0], insideGeoId: null },
        now: 5000 + i,
      })
      if (i < 2) s = reducer(s, { type: 'next' })
    }
    expect(s.finishedAt).toBe(5002)
    s = reducer(s, { type: 'next' })
    expect(s.phase).toBe('summary')
    expect(s.results.every((r) => !r.correct)).toBe(true)

    const restarted = reducer(s, { type: 'restart', seed: 'other', now: 9000 })
    expect(restarted.phase).toBe('playing')
    expect(restarted.results).toEqual([])
    expect(reducer(s, { type: 'reset' }).phase).toBe('setup')
  })

  it('ignores next without feedback', () => {
    const s = started()
    expect(reducer(s, { type: 'next' })).toBe(s)
  })
})
