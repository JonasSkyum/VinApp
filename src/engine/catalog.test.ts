import { content } from '@/content'
import { createCatalog } from './catalog'

const catalog = createCatalog(content)

describe('createCatalog', () => {
  it('looks up items by id and throws on unknown ids', () => {
    expect(catalog.style('barolo').name).toBe('Barolo')
    expect(catalog.grape('nebbiolo').color).toBe('red')
    expect(catalog.region('piemonte').type).toBe('region')
    expect(catalog.descriptor('tar').name).toBe('Tjære')
    expect(() => catalog.style('nope')).toThrow('Unknown style "nope"')
    expect(() => catalog.grape('nope')).toThrow('Unknown grape "nope"')
    expect(() => catalog.region('nope')).toThrow('Unknown region "nope"')
    expect(() => catalog.descriptor('nope')).toThrow('Unknown descriptor "nope"')
  })

  it('walks the hierarchy up to the country', () => {
    expect(catalog.ancestors('chateauneuf-du-pape').map((r) => r.id)).toEqual([
      'chateauneuf-du-pape',
      'southern-rhone',
      'france',
    ])
    expect(catalog.countryOf('chablis').id).toBe('france')
    expect(catalog.countryOf('france').id).toBe('france')
  })

  it('finds the region-level ancestor', () => {
    expect(catalog.regionLevelOf('cote-de-nuits').id).toBe('bourgogne')
    expect(catalog.regionLevelOf('sancerre').id).toBe('loire')
    expect(catalog.regionLevelOf('napa-valley').id).toBe('napa-valley')
    // A country has no region above it: falls back to itself.
    expect(catalog.regionLevelOf('france').id).toBe('france')
  })

  it('builds and caches the answer key', () => {
    const key = catalog.answerKey('sancerre')
    expect(key).toEqual({
      world: 'old',
      climate: 'cool',
      grapeId: 'sauvignon-blanc',
      countryId: 'france',
      regionId: 'loire',
      styleId: 'sancerre',
    })
    expect(catalog.answerKey('sancerre')).toBe(key)
    expect(catalog.answerKey('barossa-shiraz')).toMatchObject({
      world: 'new',
      climate: 'warm',
      grapeId: 'syrah',
      countryId: 'australia',
      regionId: 'barossa-valley',
    })
  })
})
