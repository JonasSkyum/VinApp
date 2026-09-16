import { createRng, hashString, mulberry32, pick, randomInt, sample, shuffle } from './rng'

describe('mulberry32 / createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng('vinspil')
    const b = createRng('vinspil')
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('differs between seeds', () => {
    const a = createRng('2026-01-01')
    const b = createRng('2026-01-02')
    expect(a()).not.toBe(b())
  })

  it('stays within [0, 1)', () => {
    const rng = mulberry32(42)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('hashString', () => {
  it('returns a stable unsigned 32-bit integer', () => {
    expect(hashString('')).toBe(0x811c9dc5)
    expect(hashString('a')).toBe(hashString('a'))
    expect(hashString('a')).not.toBe(hashString('b'))
    expect(hashString('Châteauneuf')).toBeGreaterThanOrEqual(0)
  })
})

describe('randomInt', () => {
  it('covers the inclusive range', () => {
    const rng = createRng(1)
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(randomInt(rng, 2, 4))
    expect([...seen].sort()).toEqual([2, 3, 4])
  })

  it('throws when max < min', () => {
    expect(() => randomInt(createRng(1), 3, 2)).toThrow(RangeError)
  })
})

describe('pick / shuffle / sample', () => {
  it('pick returns an element and throws on empty', () => {
    const rng = createRng(7)
    expect(['a', 'b', 'c']).toContain(pick(rng, ['a', 'b', 'c']))
    expect(() => pick(rng, [])).toThrow(RangeError)
  })

  it('shuffle is a permutation and leaves the input untouched', () => {
    const input = [1, 2, 3, 4, 5, 6]
    const out = shuffle(createRng('s'), input)
    expect(input).toEqual([1, 2, 3, 4, 5, 6])
    expect([...out].sort()).toEqual(input)
    expect(out).not.toEqual(input) // seed chosen so it actually moves something
  })

  it('sample returns distinct items and caps at the length', () => {
    const out = sample(createRng(3), ['a', 'b', 'c'], 2)
    expect(out).toHaveLength(2)
    expect(new Set(out).size).toBe(2)
    expect(sample(createRng(3), ['a', 'b'], 5)).toHaveLength(2)
    expect(sample(createRng(3), ['a', 'b'], -1)).toHaveLength(0)
  })
})
