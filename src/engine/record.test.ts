import { content } from '@/content'
import { createCatalog } from './catalog'
import { generateCase } from './generateCase'
import { boxOf } from './leitner'
import type { MapResult } from './mapQuiz'
import { applyRecords, mapRecord, roundRecords } from './record'
import { createRng } from './rng'
import { scoreRound } from './score'
import { weakStyles } from './training'

const catalog = createCatalog(content)
const pauillac = generateCase(catalog.style('pauillac'), 'expert', createRng('r'))
const NOW = 1_700_000_000_000

describe('roundRecords', () => {
  it('creates one record per unit with confusions and points', () => {
    const score = scoreRound(
      pauillac,
      { 1: 'old', 2: 'moderate', 3: 'merlot', 4: 'france', 5: 'rioja', 6: 'saint-emilion' },
      'expert',
      catalog,
    )
    const records = roundRecords(pauillac, score, catalog, NOW)
    expect(records.map((r) => [r.kind, r.itemId, r.correct, r.guessedId, r.points])).toEqual([
      ['grape', 'cabernet-sauvignon', false, 'merlot', 1],
      ['region', 'france', true, null, 2],
      ['region', 'bordeaux', false, 'rioja', 0],
      ['style', 'pauillac', false, 'saint-emilion', 2 + 2], // partial + world/climate points
    ])
    expect(records.reduce((s, r) => s + r.points, 0)).toBe(score.total)
    expect(records.every((r) => r.timestamp === NOW)).toBe(true)
  })

  it('synthesises the style record on beginner from the played tiers', () => {
    const allRight = scoreRound(
      pauillac,
      { 1: 'old', 2: 'moderate', 3: 'cabernet-sauvignon', 4: 'france' },
      'beginner',
      catalog,
    )
    const records = roundRecords(pauillac, allRight, catalog, NOW)
    expect(records).toHaveLength(3)
    expect(records[2]).toMatchObject({
      kind: 'style',
      itemId: 'pauillac',
      correct: true,
      points: 2,
    })

    const skipped = scoreRound(pauillac, { 1: 'old' }, 'beginner', catalog)
    const rs = roundRecords(pauillac, skipped, catalog, NOW)
    expect(rs.find((r) => r.kind === 'grape')).toMatchObject({ correct: false, guessedId: null })
    expect(rs.find((r) => r.kind === 'style')).toMatchObject({ correct: false, points: 1 })
  })
})

describe('mapRecord', () => {
  it('keys on the target region and keeps the wrong name choice', () => {
    const base: MapResult = {
      question: { kind: 'name', regionId: 'rioja', answerKind: 'choice', options: [], points: 10 },
      answer: { kind: 'choice', regionId: 'priorat' },
      points: 0,
      maxPoints: 10,
      correct: false,
      targetRegionId: 'rioja',
      distanceKm: null,
    }
    expect(mapRecord(base, NOW)).toEqual({
      kind: 'map-location',
      itemId: 'rioja',
      tier: 'map',
      correct: false,
      guessedId: 'priorat',
      points: 0,
      timestamp: NOW,
    })
    const click: MapResult = {
      ...base,
      question: { kind: 'find', regionId: 'rioja', points: 10 },
      answer: { kind: 'click', lngLat: [0, 0], insideGeoId: null },
      points: 7,
      correct: true,
    }
    expect(mapRecord(click, NOW)).toMatchObject({ correct: true, guessedId: null, points: 7 })
  })
})

describe('applyRecords / weakStyles', () => {
  it('updates Leitner boxes from records', () => {
    const score = scoreRound(pauillac, { 3: 'cabernet-sauvignon', 4: 'italy' }, 'beginner', catalog)
    const state = applyRecords({}, roundRecords(pauillac, score, catalog, NOW))
    expect(boxOf(state, 'grape', 'cabernet-sauvignon')).toBe(1)
    expect(boxOf(state, 'region', 'france')).toBe(1)
    expect(boxOf(state, 'style', 'pauillac')).toBe(1)
    expect(boxOf(state, 'region', 'bordeaux')).toBe(0)
  })

  it('prefers unseen and confused styles, deterministically', () => {
    // Everything but Barolo is well known.
    let leitner = {}
    for (const s of catalog.styles) {
      if (s.id === 'barolo') continue
      for (let i = 0; i < 5; i++) {
        leitner = applyRecords(leitner, [
          {
            kind: 'style',
            itemId: s.id,
            tier: 6,
            correct: true,
            guessedId: null,
            points: 5,
            timestamp: NOW,
          },
          {
            kind: 'grape',
            itemId: s.grapeIds[0]!,
            tier: 3,
            correct: true,
            guessedId: null,
            points: 3,
            timestamp: NOW,
          },
        ])
      }
    }
    const options = { difficulty: 'expert', colors: 'red', rounds: 5 } as const
    const counts = new Map<string, number>()
    for (let i = 0; i < 40; i++) {
      const picked = weakStyles(catalog, leitner, [], options, createRng(i))
      expect(picked).toHaveLength(5)
      expect(new Set(picked.map((s) => s.id)).size).toBe(5)
      for (const s of picked) counts.set(s.id, (counts.get(s.id) ?? 0) + 1)
    }
    const barolo = counts.get('barolo') ?? 0
    const others = [...counts.entries()].filter(([id]) => id !== 'barolo').map(([, n]) => n)
    expect(barolo).toBeGreaterThan(Math.max(...others))

    const a = weakStyles(catalog, leitner, [], options, createRng('same'))
    const b = weakStyles(catalog, leitner, [], options, createRng('same'))
    expect(a.map((s) => s.id)).toEqual(b.map((s) => s.id))
    expect(() =>
      weakStyles(createCatalog({ ...content, styles: [] }), {}, [], options, createRng(1)),
    ).toThrow('No styles match')
  })
})
