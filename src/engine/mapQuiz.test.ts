import { content } from '@/content'
import { createCatalog } from './catalog'
import { MAP_QUESTION_POINTS } from './geo'
import {
  buildMapQuiz,
  classicRegionsForGrape,
  mapQuizPool,
  nameDistractors,
  scoreMapQuestion,
  type MapQuestion,
  type MapQuizOptions,
} from './mapQuiz'
import { createRng } from './rng'

const catalog = createCatalog(content)
const base: MapQuizOptions = {
  mode: 'find',
  world: 'all',
  countryId: 'all',
  difficulty: 'expert',
  count: 10,
}

describe('mapQuizPool', () => {
  it('filters by level, world and country', () => {
    const all = mapQuizPool(catalog, base)
    expect(all.some((r) => r.type === 'country')).toBe(true)
    const beginner = mapQuizPool(catalog, { ...base, difficulty: 'beginner' })
    expect(beginner.every((r) => r.difficulty === 1)).toBe(true)
    const oldWorld = mapQuizPool(catalog, { ...base, world: 'old' })
    expect(oldWorld.every((r) => r.world === 'old')).toBe(true)
    const france = mapQuizPool(catalog, { ...base, countryId: 'france' })
    expect(france.length).toBeGreaterThan(5)
    expect(
      france.every((r) => r.type !== 'country' && catalog.countryOf(r.id).id === 'france'),
    ).toBe(true)
  })
})

describe('classicRegionsForGrape', () => {
  it('prefers Old World homes of styles led by the grape', () => {
    expect(classicRegionsForGrape(catalog, 'nebbiolo').map((r) => r.id)).toEqual(['barolo'])
    const cab = classicRegionsForGrape(catalog, 'cabernet-sauvignon').map((r) => r.id)
    expect(cab).toEqual(['pauillac'])
    // Malbec only leads a New World style, so that is what remains.
    expect(classicRegionsForGrape(catalog, 'malbec').map((r) => r.id)).toEqual(['mendoza'])
  })
})

describe('nameDistractors', () => {
  it('returns nearby regions of the same type first, never the target', () => {
    const pool = mapQuizPool(catalog, base)
    const sancerre = catalog.region('sancerre')
    const ids = nameDistractors(sancerre, pool, 3)
    expect(ids).toHaveLength(3)
    expect(ids).not.toContain('sancerre')
    for (const id of ids) expect(catalog.region(id).type).toBe('appellation')
    expect(ids).toContain('vouvray')
  })

  it('tops up from the fallback list when the pool is too small', () => {
    const pool = mapQuizPool(catalog, { ...base, difficulty: 'beginner', countryId: 'italy' })
    expect(pool).toHaveLength(3)
    const target = pool[0]!
    const ids = nameDistractors(target, pool, 5, catalog.regions)
    expect(ids).toHaveLength(5)
    expect(new Set(ids).size).toBe(5)
    expect(ids).not.toContain(target.id)
  })
})

describe('buildMapQuiz', () => {
  it('is deterministic and builds the requested number of questions', () => {
    const a = buildMapQuiz(catalog, base, createRng('map'))
    const b = buildMapQuiz(catalog, base, createRng('map'))
    expect(a).toEqual(b)
    expect(a).toHaveLength(10)
    expect(a.every((q) => q.kind === 'find')).toBe(true)
    expect(new Set(a.map((q) => (q.kind === 'find' ? q.regionId : ''))).size).toBe(10)
  })

  it('builds choice questions with the right option count and text questions on expert', () => {
    const beginner = buildMapQuiz(
      catalog,
      { ...base, mode: 'name', difficulty: 'beginner', countryId: 'france' },
      createRng('n'),
    )
    for (const q of beginner) {
      expect(q.kind).toBe('name')
      if (q.kind !== 'name') continue
      expect(q.answerKind).toBe('choice')
      expect(q.options).toHaveLength(4)
      expect(q.options).toContain(q.regionId)
      expect(new Set(q.options).size).toBe(4)
    }
    const expert = buildMapQuiz(catalog, { ...base, mode: 'name' }, createRng('n'))
    const q = expert[0]!
    expect(q.kind === 'name' && q.answerKind).toBe('text')
    expect(q.kind === 'name' && q.options.length).toBe(mapQuizPool(catalog, base).length)
  })

  it('builds grape questions whose regions respect the filters', () => {
    const qs = buildMapQuiz(catalog, { ...base, mode: 'grape', world: 'old' }, createRng('g'))
    expect(qs).toHaveLength(10)
    for (const q of qs) {
      expect(q.kind).toBe('grape')
      if (q.kind !== 'grape') continue
      expect(q.regionIds.length).toBeGreaterThan(0)
      for (const id of q.regionIds) expect(catalog.region(id).world).toBe('old')
    }
  })

  it('throws when nothing matches', () => {
    const empty = createCatalog({
      ...content,
      regions: content.regions.filter((r) => r.type === 'country'),
      styles: [],
    })
    expect(() => buildMapQuiz(empty, { ...base, countryId: 'france' }, createRng(1))).toThrow(
      'No regions match',
    )
    expect(() =>
      buildMapQuiz(empty, { ...base, mode: 'grape', countryId: 'france' }, createRng(1)),
    ).toThrow('No grape questions')
  })
})

describe('scoreMapQuestion', () => {
  const rioja = catalog.region('rioja')

  it('scores find questions by distance or polygon', () => {
    const q = { kind: 'find', regionId: 'rioja', points: MAP_QUESTION_POINTS } as const
    const hit = scoreMapQuestion(
      q,
      { kind: 'click', lngLat: rioja.center, insideGeoId: 'ESP' },
      catalog,
    )
    expect(hit).toMatchObject({ points: 10, correct: true, targetRegionId: 'rioja', distanceKm: 0 })
    const miss = scoreMapQuestion(
      q,
      { kind: 'click', lngLat: [138.95, -34.55], insideGeoId: 'AUS' },
      catalog,
    )
    expect(miss).toMatchObject({ points: 0, correct: false })
    expect(miss.distanceKm).toBeGreaterThan(10000)
    const wrongKind = scoreMapQuestion(q, { kind: 'choice', regionId: 'rioja' }, catalog)
    expect(wrongKind).toMatchObject({ points: 0, correct: false })
  })

  it('accepts a polygon hit for countries', () => {
    const q = { kind: 'find', regionId: 'spain', points: 10 } as const
    const far: [number, number] = [-8.5, 43.3] // A Coruña, far from Spain's centre but inside
    const inside = scoreMapQuestion(q, { kind: 'click', lngLat: far, insideGeoId: 'ESP' }, catalog)
    expect(inside.points).toBe(10)
    const outside = scoreMapQuestion(q, { kind: 'click', lngLat: far, insideGeoId: 'PRT' }, catalog)
    expect(outside.points).toBeLessThan(10)
  })

  it('scores name questions exactly', () => {
    const q = {
      kind: 'name',
      regionId: 'rioja',
      answerKind: 'choice',
      options: ['rioja', 'priorat'],
      points: 10,
    } satisfies MapQuestion
    expect(scoreMapQuestion(q, { kind: 'choice', regionId: 'rioja' }, catalog)).toMatchObject({
      points: 10,
      correct: true,
      distanceKm: null,
    })
    expect(scoreMapQuestion(q, { kind: 'choice', regionId: 'priorat' }, catalog).points).toBe(0)
    expect(scoreMapQuestion(q, { kind: 'choice', regionId: null }, catalog).correct).toBe(false)
  })

  it('takes the best of several accepted regions for grape questions', () => {
    const q = {
      kind: 'grape',
      grapeId: 'chardonnay',
      regionIds: ['chablis', 'cote-de-beaune'],
      points: 10,
    } satisfies MapQuestion
    const beaune = catalog.region('cote-de-beaune')
    const result = scoreMapQuestion(
      q,
      { kind: 'click', lngLat: beaune.center, insideGeoId: 'FRA' },
      catalog,
    )
    expect(result).toMatchObject({ points: 10, correct: true, targetRegionId: 'cote-de-beaune' })
  })
})
