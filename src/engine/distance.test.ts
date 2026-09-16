import { content } from '@/content'
import { createCatalog } from './catalog'
import {
  appearanceDistance,
  DESCRIPTOR_WEIGHT,
  MISMATCH_PENALTY,
  profileDistance,
  rangeDistance,
  rankCandidates,
} from './distance'
import { generateCase } from './generateCase'
import { createRng } from './rng'
import type { TastingCase } from './types'

const catalog = createCatalog(content)

describe('rangeDistance', () => {
  it('is 0 inside and grows outside', () => {
    expect(rangeDistance(3, [2, 4])).toBe(0)
    expect(rangeDistance(2, [2, 4])).toBe(0)
    expect(rangeDistance(1, [2, 4])).toBe(1)
    expect(rangeDistance(5, [2, 4])).toBe(1)
  })
})

describe('appearanceDistance', () => {
  it('counts steps on the same scale and penalises family mismatches', () => {
    expect(appearanceDistance('lemon', 'lemon')).toBe(0)
    expect(appearanceDistance('lemon-green', 'gold')).toBe(2)
    expect(appearanceDistance('ruby', 'garnet')).toBe(1)
    expect(appearanceDistance('lemon', 'ruby')).toBe(MISMATCH_PENALTY)
    expect(appearanceDistance('pink', 'ruby')).toBe(MISMATCH_PENALTY)
  })
})

describe('profileDistance', () => {
  it('is 0 for a case generated from the style itself', () => {
    for (const style of catalog.styles) {
      const tastingCase = generateCase(style, 'beginner', createRng(style.id))
      expect(profileDistance(tastingCase, style)).toBe(0)
    }
  })

  it('penalises values outside the range by attribute weight', () => {
    const sancerre = catalog.style('sancerre')
    const tastingCase = generateCase(sancerre, 'beginner', createRng('x'))
    const lowAcid: TastingCase = {
      ...tastingCase,
      profile: { ...tastingCase.profile, acidity: 3 },
    }
    // Sancerre acidity is [5, 5]: 2 steps × weight 1.5
    expect(profileDistance(lowAcid, sancerre)).toBe(3)
  })

  it('charges for aromas the style does not list', () => {
    const sancerre = catalog.style('sancerre')
    const tastingCase = generateCase(sancerre, 'beginner', createRng('x'))
    const foreign: TastingCase = { ...tastingCase, descriptorIds: ['tar', 'rose'] }
    expect(profileDistance(foreign, sancerre)).toBe(DESCRIPTOR_WEIGHT)
    const half: TastingCase = { ...tastingCase, descriptorIds: ['gooseberry', 'tar'] }
    expect(profileDistance(half, sancerre)).toBe(DESCRIPTOR_WEIGHT / 2)
  })

  it('penalises tannin presence mismatch heavily', () => {
    const barolo = catalog.style('barolo')
    const tastingCase = generateCase(barolo, 'beginner', createRng('x'))
    const sancerre = catalog.style('sancerre')
    expect(profileDistance(tastingCase, sancerre)).toBeGreaterThanOrEqual(2 * MISMATCH_PENALTY)
  })
})

describe('rankCandidates', () => {
  it('puts the true style first for its own case', () => {
    for (const style of catalog.styles) {
      const tastingCase = generateCase(style, 'beginner', createRng(`rank-${style.id}`))
      const ranked = rankCandidates(tastingCase, catalog.styles)
      expect(ranked[0]!.distance).toBe(0)
      // Ties at 0 are possible for near-identical styles; the true style must be among them.
      const zero = ranked.filter((r) => r.distance === 0).map((r) => r.style.id)
      expect(zero).toContain(style.id)
    }
  })

  it('ranks a Marlborough Sauvignon Blanc close to Sancerre and far from Barolo', () => {
    const marlborough = catalog.style('marlborough-sauvignon-blanc')
    const tastingCase = generateCase(marlborough, 'beginner', createRng('nz'))
    const ranked = rankCandidates(tastingCase, catalog.styles)
    const position = (id: string) => ranked.findIndex((r) => r.style.id === id)
    expect(position('sancerre')).toBeLessThan(position('barolo'))
    expect(position('sancerre')).toBeLessThan(6)
  })

  it('is sorted ascending with stable id tie-break', () => {
    const tastingCase = generateCase(catalog.style('barolo'), 'beginner', createRng('b'))
    const ranked = rankCandidates(tastingCase, catalog.styles)
    for (let i = 1; i < ranked.length; i++) {
      const prev = ranked[i - 1]!
      const cur = ranked[i]!
      expect(cur.distance).toBeGreaterThanOrEqual(prev.distance)
      if (cur.distance === prev.distance) {
        expect(prev.style.id.localeCompare(cur.style.id)).toBeLessThan(0)
      }
    }
  })
})
