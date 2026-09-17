import { content } from '@/content'
import { createCatalog } from './catalog'
import { rangeSeparation } from './distance'
import { explain, MAX_ATTRIBUTE_EXPLANATIONS } from './explain'
import type { TastingCase } from './types'

const catalog = createCatalog(content)

describe('rangeSeparation', () => {
  it('is 0 for overlapping ranges and the gap otherwise', () => {
    expect(rangeSeparation([2, 4], [3, 5])).toBe(0)
    expect(rangeSeparation([2, 2], [4, 5])).toBe(2)
    expect(rangeSeparation([4, 5], [2, 2])).toBe(2)
  })
})

describe('explain', () => {
  it('returns nothing when the guess was right', () => {
    const barolo = catalog.style('barolo')
    const tastingCase: TastingCase = {
      styleId: 'barolo',
      profile: {
        ...barolo.profile,
        intensity: 3,
        sweetness: 1,
        acidity: 5,
        tannin: 5,
        alcohol: 4,
        body: 3,
        finish: 5,
      },
      descriptorIds: ['rose', 'tar'],
      deviation: null,
    }
    expect(explain(tastingCase, barolo, barolo)).toEqual([])
  })

  it('Barolo mistaken for Bourgogne Rouge: tannin, structure, colour and aromas', () => {
    const tastingCase: TastingCase = {
      styleId: 'barolo',
      profile: {
        appearance: 'garnet',
        intensity: 3,
        sweetness: 1,
        acidity: 5,
        tannin: 5,
        alcohol: 4,
        body: 3,
        finish: 5,
      },
      descriptorIds: ['rose', 'tar', 'red-cherry'],
      deviation: null,
    }
    const result = explain(
      tastingCase,
      catalog.style('barolo'),
      catalog.style('cote-de-nuits-rouge'),
    )
    const attributes = result.filter((e) => e.kind === 'attribute')
    expect(attributes).toHaveLength(MAX_ATTRIBUTE_EXPLANATIONS)
    expect(attributes[0]).toEqual({
      kind: 'attribute',
      attribute: 'tannin',
      caseValue: 5,
      correctRange: [5, 5],
      guessedRange: [2, 3],
    })
    // Acidity now overlaps ([4,5] vs [4,4]) so the other structural gaps rank above it.
    expect(attributes.map((a) => a.attribute)).toEqual(['tannin', 'alcohol', 'finish'])
    expect(result).toContainEqual({
      kind: 'appearance',
      caseValue: 'garnet',
      guessedAppearance: 'ruby',
    })
    expect(result).toContainEqual({ kind: 'descriptors', descriptorIds: ['rose', 'tar'] })
  })

  it('Sancerre mistaken for Marlborough: lower intensity and alcohol, different aromas', () => {
    const tastingCase: TastingCase = {
      styleId: 'sancerre',
      profile: {
        appearance: 'lemon-green',
        intensity: 3,
        sweetness: 1,
        acidity: 5,
        tannin: null,
        alcohol: 2,
        body: 2,
        finish: 3,
      },
      descriptorIds: ['flint', 'gooseberry', 'elderflower'],
      deviation: null,
    }
    const result = explain(
      tastingCase,
      catalog.style('sancerre'),
      catalog.style('marlborough-sauvignon-blanc'),
    )
    const attributes = result.filter((e) => e.kind === 'attribute').map((e) => e.attribute)
    expect(attributes).toEqual(['intensity', 'alcohol'])
    expect(result.find((e) => e.kind === 'appearance')).toBeUndefined()
    expect(result).toContainEqual({ kind: 'descriptors', descriptorIds: ['flint', 'elderflower'] })
  })

  it('still explains from range separation when the case value happens to fit the guess', () => {
    // Case sits at intensity 4, inside Marlborough's [4,5]; Sancerre is [3,4] so no separation.
    // Alcohol 3 fits Marlborough [3,3] too. Only aromas remain.
    const tastingCase: TastingCase = {
      styleId: 'sancerre',
      profile: {
        appearance: 'lemon-green',
        intensity: 4,
        sweetness: 1,
        acidity: 5,
        tannin: null,
        alcohol: 3,
        body: 3,
        finish: 4,
      },
      descriptorIds: ['gooseberry', 'grapefruit'],
      deviation: null,
    }
    const result = explain(
      tastingCase,
      catalog.style('sancerre'),
      catalog.style('marlborough-sauvignon-blanc'),
    )
    expect(result).toEqual([])
  })
})
