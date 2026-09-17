import type { Style } from '@/schema'
import type { Catalog } from './catalog'
import { shuffle, type Rng } from './rng'
import { DIFFICULTY_LEVEL, type Difficulty } from './types'

/** red/white: still wines of that colour · other: rosé, sparkling, sweet and fortified · all: everything. */
export type ColorFilter = 'red' | 'white' | 'other' | 'all'

export function matchesColorFilter(style: Style, filter: ColorFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'other') return style.color !== 'red' && style.color !== 'white'
  return style.color === filter
}

export interface SessionOptions {
  difficulty: Difficulty
  colors: ColorFilter
  rounds: number
}

/** Styles a player at this level may be served. */
export function eligibleStyles(catalog: Catalog, options: Omit<SessionOptions, 'rounds'>): Style[] {
  const level = DIFFICULTY_LEVEL[options.difficulty]
  return catalog.styles.filter(
    (s) => s.difficulty <= level && matchesColorFilter(s, options.colors),
  )
}

/**
 * Picks the styles for a session without repeats while the pool allows it;
 * once exhausted it reshuffles and continues.
 */
export function pickStyles(catalog: Catalog, options: SessionOptions, rng: Rng): Style[] {
  const pool = eligibleStyles(catalog, options)
  if (pool.length === 0) throw new Error('No styles match the session options')
  const picked: Style[] = []
  while (picked.length < options.rounds) {
    picked.push(...shuffle(rng, pool))
  }
  return picked.slice(0, options.rounds)
}
