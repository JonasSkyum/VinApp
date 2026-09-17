import { content } from '@/content'
import { bottleCase, rankBottle, rankPosition } from './bottle'
import { createCatalog } from './catalog'
import type { BottleInput } from './bottle'

const catalog = createCatalog(content)

/** Notes that read like a textbook Barolo. */
const barolo: BottleInput = {
  profile: {
    appearance: 'garnet',
    intensity: 4,
    sweetness: 1,
    acidity: 5,
    tannin: 5,
    alcohol: 4,
    body: 4,
    finish: 5,
  },
  descriptorIds: ['rose', 'tar', 'red-cherry'],
}

describe('rankBottle', () => {
  it('puts the matching style first and limits the list', () => {
    const ranked = rankBottle(barolo, catalog)
    expect(ranked).toHaveLength(5)
    expect(ranked[0]!.style.id).toBe('barolo')
    expect(ranked.every((r) => r.style.color === 'red')).toBe(true)
  })

  it('ranks across every category, so sparkling notes find sparkling wines', () => {
    const ranked = rankBottle(
      {
        profile: {
          appearance: 'lemon',
          intensity: 3,
          sweetness: 1,
          acidity: 5,
          tannin: null,
          alcohol: 3,
          body: 2,
          finish: 3,
        },
        descriptorIds: ['brioche', 'green-apple', 'toast'],
      },
      catalog,
      3,
    )
    expect(ranked.map((r) => r.style.id)).toContain('champagne-brut')
  })

  it('builds a case with no hidden style', () => {
    expect(bottleCase(barolo)).toMatchObject({ styleId: '', deviation: null })
  })
})

describe('rankPosition', () => {
  it('is 1-based and null when absent', () => {
    const ranked = rankBottle(barolo, catalog)
    expect(rankPosition(ranked, 'barolo')).toBe(1)
    expect(rankPosition(ranked, 'sancerre')).toBeNull()
  })
})
