import { content } from '@/content'
import { structureKeys } from '@/schema'
import { createCatalog } from './catalog'
import { EXPERT_DEVIATION_PROBABILITY, generateCase } from './generateCase'
import { createRng } from './rng'
import { maxScore, tierSpec, tiersFor } from './tiers'

const catalog = createCatalog(content)

describe('generateCase', () => {
  it('is deterministic for the same seed', () => {
    const style = catalog.style('sancerre')
    const a = generateCase(style, 'beginner', createRng('seed'))
    const b = generateCase(style, 'beginner', createRng('seed'))
    expect(a).toEqual(b)
    const c = generateCase(style, 'beginner', createRng('other'))
    expect(c).not.toEqual(a)
  })

  it('keeps every value inside the style ranges and samples 3–5 of its descriptors', () => {
    for (const style of catalog.styles) {
      for (let i = 0; i < 20; i++) {
        const tastingCase = generateCase(style, 'beginner', createRng(`${style.id}-${i}`))
        expect(tastingCase.styleId).toBe(style.id)
        expect(tastingCase.profile.appearance).toBe(style.profile.appearance)
        expect(tastingCase.deviation).toBeNull()
        for (const key of structureKeys) {
          const range = style.profile[key]
          const value = tastingCase.profile[key]
          if (range === null) {
            expect(value).toBeNull()
          } else {
            expect(value).toBeGreaterThanOrEqual(range[0])
            expect(value).toBeLessThanOrEqual(range[1])
          }
        }
        expect(tastingCase.descriptorIds.length).toBeGreaterThanOrEqual(
          Math.min(3, style.descriptorIds.length),
        )
        expect(tastingCase.descriptorIds.length).toBeLessThanOrEqual(5)
        expect(new Set(tastingCase.descriptorIds).size).toBe(tastingCase.descriptorIds.length)
        for (const d of tastingCase.descriptorIds) expect(style.descriptorIds).toContain(d)
      }
    }
  })

  it('applies a ±1 deviation on one attribute for some expert cases only', () => {
    const style = catalog.style('barolo')
    let deviated = 0
    const runs = 400
    for (let i = 0; i < runs; i++) {
      const tastingCase = generateCase(style, 'expert', createRng(i))
      if (!tastingCase.deviation) continue
      deviated++
      const { attribute, delta } = tastingCase.deviation
      const range = style.profile[attribute]!
      const value = tastingCase.profile[attribute]!
      // Off by exactly one from the range at most, and still on the 1–5 scale.
      expect(value - delta).toBeGreaterThanOrEqual(range[0])
      expect(value - delta).toBeLessThanOrEqual(range[1])
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(5)
    }
    expect(deviated).toBeGreaterThan(0)
    expect(deviated / runs).toBeLessThan(EXPERT_DEVIATION_PROBABILITY + 0.05)
  })

  it('never deviates below beginner/advanced', () => {
    const style = catalog.style('barolo')
    for (let i = 0; i < 100; i++) {
      expect(generateCase(style, 'advanced', createRng(i)).deviation).toBeNull()
    }
  })

  it('drops a deviation that would leave the 1–5 scale', () => {
    // Barolo has acidity and tannin pinned at 5; with enough seeds some nudges get clamped.
    const style = catalog.style('barolo')
    const results = Array.from({ length: 400 }, (_, i) =>
      generateCase(style, 'expert', createRng(`clamp-${i}`)),
    )
    for (const tastingCase of results) {
      expect(tastingCase.profile.tannin).toBeLessThanOrEqual(5)
      expect(tastingCase.profile.acidity).toBeLessThanOrEqual(5)
    }
  })
})

describe('tiers', () => {
  it('unlocks tiers by level and sums points', () => {
    expect(tiersFor('beginner').map((t) => t.tier)).toEqual([1, 2, 3, 4])
    expect(tiersFor('advanced').map((t) => t.tier)).toEqual([1, 2, 3, 4, 5])
    expect(tiersFor('expert').map((t) => t.tier)).toEqual([1, 2, 3, 4, 5, 6])
    expect(maxScore('beginner')).toBe(7)
    expect(maxScore('advanced')).toBe(10)
    expect(maxScore('expert')).toBe(15)
  })

  it('rejects unknown tiers', () => {
    expect(tierSpec(6).field).toBe('styleId')
    expect(() => tierSpec(7 as never)).toThrow(RangeError)
  })
})
