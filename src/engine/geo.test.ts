import { content } from '@/content'
import { createCatalog } from './catalog'
import {
  boundsOf,
  findScore,
  FULL_POINTS_RADIUS_KM,
  haversineKm,
  MAP_QUESTION_POINTS,
  ZERO_POINTS_AT_RADII,
} from './geo'

const catalog = createCatalog(content)

describe('haversineKm', () => {
  it('is 0 for identical points and symmetric', () => {
    expect(haversineKm([2.35, 48.85], [2.35, 48.85])).toBe(0)
    const paris: [number, number] = [2.35, 48.85]
    const bordeaux: [number, number] = [-0.58, 44.84]
    expect(haversineKm(paris, bordeaux)).toBeCloseTo(haversineKm(bordeaux, paris), 6)
  })

  it('matches known distances roughly', () => {
    // Paris–Bordeaux is about 500 km as the crow flies.
    const km = haversineKm([2.35, 48.85], [-0.58, 44.84])
    expect(km).toBeGreaterThan(480)
    expect(km).toBeLessThan(520)
  })
})

describe('findScore', () => {
  const rioja = catalog.region('rioja')

  it('gives full points inside the polygon regardless of distance', () => {
    const far: [number, number] = [rioja.center[0] + 5, rioja.center[1]]
    expect(findScore(rioja, far, true).points).toBe(MAP_QUESTION_POINTS)
  })

  it('gives full points within the radius and decays to zero', () => {
    const r = FULL_POINTS_RADIUS_KM.region
    const at = (km: number): [number, number] => [rioja.center[0], rioja.center[1] + km / 111.2]
    expect(findScore(rioja, at(r * 0.9), false).points).toBe(MAP_QUESTION_POINTS)
    const mid = findScore(rioja, at(r * (1 + (ZERO_POINTS_AT_RADII - 1) / 2)), false)
    expect(mid.points).toBeGreaterThan(0)
    expect(mid.points).toBeLessThan(MAP_QUESTION_POINTS)
    expect(findScore(rioja, at(r * ZERO_POINTS_AT_RADII + 10), false).points).toBe(0)
  })

  it('uses a tighter radius for appellations than countries', () => {
    expect(FULL_POINTS_RADIUS_KM.appellation).toBeLessThan(FULL_POINTS_RADIUS_KM.region)
    expect(FULL_POINTS_RADIUS_KM.region).toBeLessThan(FULL_POINTS_RADIUS_KM.country)
  })
})

describe('boundsOf', () => {
  it('returns null for no points and pads otherwise', () => {
    expect(boundsOf([])).toBeNull()
    const b = boundsOf(
      [
        [0, 0],
        [10, 5],
      ],
      1,
    )!
    expect(b.sw).toEqual([-1, -1])
    expect(b.ne).toEqual([11, 6])
  })

  it('clamps to the valid lng/lat range', () => {
    const b = boundsOf([[179.5, 84.5]], 2)!
    expect(b.ne).toEqual([180, 85])
  })
})
