import { idSchema, levelSchema, rangeSchema } from './common'

describe('levelSchema', () => {
  it('accepts integers 1–5', () => {
    for (const n of [1, 2, 3, 4, 5]) expect(levelSchema.safeParse(n).success).toBe(true)
  })
  it('rejects out-of-range and non-integer values', () => {
    for (const n of [0, 6, 2.5, -1]) expect(levelSchema.safeParse(n).success).toBe(false)
  })
})

describe('rangeSchema', () => {
  it('accepts min <= max', () => {
    expect(rangeSchema.safeParse([2, 4]).success).toBe(true)
    expect(rangeSchema.safeParse([3, 3]).success).toBe(true)
  })
  it('rejects min > max', () => {
    expect(rangeSchema.safeParse([4, 2]).success).toBe(false)
  })
})

describe('idSchema', () => {
  it('accepts kebab-case ASCII', () => {
    expect(idSchema.safeParse('chateauneuf-du-pape').success).toBe(true)
    expect(idSchema.safeParse('cote-de-nuits').success).toBe(true)
  })
  it('rejects accents, spaces and uppercase', () => {
    for (const id of ['Châteauneuf', 'cote de nuits', 'Barolo', 'a--b', '-a']) {
      expect(idSchema.safeParse(id).success).toBe(false)
    }
  })
})
