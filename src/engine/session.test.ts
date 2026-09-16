import { content } from '@/content'
import { createCatalog } from './catalog'
import { createRng } from './rng'
import { eligibleStyles, pickStyles } from './session'

const catalog = createCatalog(content)

describe('eligibleStyles', () => {
  it('filters by level and colour and excludes sweet/sparkling', () => {
    const beginnerRed = eligibleStyles(catalog, { difficulty: 'beginner', colors: 'red' })
    expect(beginnerRed.length).toBeGreaterThan(0)
    for (const s of beginnerRed) {
      expect(s.color).toBe('red')
      expect(s.difficulty).toBe(1)
    }
    const expertBoth = eligibleStyles(catalog, { difficulty: 'expert', colors: 'both' })
    expect(expertBoth.map((s) => s.id)).not.toContain('sauternes')
    expect(expertBoth.length).toBeGreaterThan(beginnerRed.length)
  })
})

describe('pickStyles', () => {
  it('is deterministic and avoids repeats while the pool allows', () => {
    const options = { difficulty: 'beginner', colors: 'both', rounds: 5 } as const
    const a = pickStyles(catalog, options, createRng('session'))
    const b = pickStyles(catalog, options, createRng('session'))
    expect(a.map((s) => s.id)).toEqual(b.map((s) => s.id))
    expect(new Set(a.map((s) => s.id)).size).toBe(5)
  })

  it('cycles through the pool when more rounds than styles are requested', () => {
    const pool = eligibleStyles(catalog, { difficulty: 'beginner', colors: 'white' })
    const rounds = pool.length * 2 + 1
    const picked = pickStyles(
      catalog,
      { difficulty: 'beginner', colors: 'white', rounds },
      createRng('cycle'),
    )
    expect(picked).toHaveLength(rounds)
    const firstPass = picked.slice(0, pool.length).map((s) => s.id)
    expect(new Set(firstPass).size).toBe(pool.length)
  })

  it('throws when nothing matches', () => {
    const empty = createCatalog({ ...content, styles: [] })
    expect(() =>
      pickStyles(empty, { difficulty: 'expert', colors: 'both', rounds: 1 }, createRng(1)),
    ).toThrow('No styles match')
  })
})
