import { catalog } from '@/lib/catalog'
import { entryPath, lexiconIndex, searchLexicon } from './search'

const index = lexiconIndex(catalog)

describe('lexiconIndex', () => {
  it('covers every grape, region and style', () => {
    expect(index).toHaveLength(
      catalog.grapes.length + catalog.regions.length + catalog.styles.length,
    )
  })
})

describe('searchLexicon', () => {
  it('returns nothing for an empty query', () => {
    expect(searchLexicon(index, '   ')).toEqual([])
  })

  it('matches accents and aliases, exact/prefix first', () => {
    const rias = searchLexicon(index, 'rias')
    expect(rias[0]).toMatchObject({ kind: 'region', id: 'rias-baixas' })
    const shiraz = searchLexicon(index, 'shiraz')
    expect(shiraz.map((e) => e.id)).toContain('syrah')
    const pinot = searchLexicon(index, 'pinot noir')
    expect(pinot[0]).toMatchObject({ kind: 'grape', id: 'pinot-noir' })
    expect(pinot.some((e) => e.kind === 'style')).toBe(true) // styles led by the grape
  })

  it('finds styles by grape name and respects the limit', () => {
    const results = searchLexicon(index, 'chardonnay', 2)
    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({ kind: 'grape', id: 'chardonnay' })
  })
})

describe('entryPath', () => {
  it('builds hash-router paths', () => {
    expect(entryPath({ kind: 'grape', id: 'syrah' })).toBe('/lexicon/grapes/syrah')
    expect(entryPath({ kind: 'region', id: 'loire' })).toBe('/lexicon/regions/loire')
    expect(entryPath({ kind: 'style', id: 'barolo' })).toBe('/lexicon/styles/barolo')
  })
})
