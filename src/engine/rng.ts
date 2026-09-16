/**
 * Seedable randomness. All game randomness must go through an Rng so tests and
 * the daily challenge are deterministic.
 */

/** Returns a float in [0, 1). */
export type Rng = () => number

/** mulberry32: small, fast, good enough for games. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a 32-bit hash of a string, as an unsigned integer. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function createRng(seed: string | number): Rng {
  return mulberry32(typeof seed === 'number' ? seed : hashString(seed))
}

/** Integer in [min, max], inclusive. */
export function randomInt(rng: Rng, min: number, max: number): number {
  if (max < min) throw new RangeError(`randomInt: max ${max} < min ${min}`)
  return min + Math.floor(rng() * (max - min + 1))
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new RangeError('pick: empty array')
  return items[randomInt(rng, 0, items.length - 1)]!
}

/** Fisher–Yates shuffle into a new array. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(rng, 0, i)
    const tmp = result[i]!
    result[i] = result[j]!
    result[j] = tmp
  }
  return result
}

/** `count` distinct items in random order. Returns everything if `count` exceeds the length. */
export function sample<T>(rng: Rng, items: readonly T[], count: number): T[] {
  return shuffle(rng, items).slice(0, Math.max(0, count))
}
