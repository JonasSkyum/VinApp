import type { AnswerField, Difficulty, Tier } from './types'
import { DIFFICULTY_LEVEL } from './types'

export interface TierSpec {
  tier: Tier
  /** Which field of the AnswerKey this tier asks for. */
  field: AnswerField
  points: number
  /** Lowest player level that gets this tier. */
  minLevel: Difficulty
}

export const TIERS: readonly TierSpec[] = [
  { tier: 1, field: 'world', points: 1, minLevel: 'beginner' },
  { tier: 2, field: 'climate', points: 1, minLevel: 'beginner' },
  { tier: 3, field: 'grapeId', points: 3, minLevel: 'beginner' },
  { tier: 4, field: 'countryId', points: 2, minLevel: 'beginner' },
  { tier: 5, field: 'regionId', points: 3, minLevel: 'advanced' },
  { tier: 6, field: 'styleId', points: 5, minLevel: 'expert' },
]

export function tierSpec(tier: Tier): TierSpec {
  const spec = TIERS.find((t) => t.tier === tier)
  if (!spec) throw new RangeError(`Unknown tier ${tier}`)
  return spec
}

/** Tiers a player at the given level plays, in order. */
export function tiersFor(difficulty: Difficulty): TierSpec[] {
  const level = DIFFICULTY_LEVEL[difficulty]
  return TIERS.filter((t) => DIFFICULTY_LEVEL[t.minLevel] <= level)
}

/** Maximum points per round at the given level. */
export function maxScore(difficulty: Difficulty): number {
  return tiersFor(difficulty).reduce((sum, t) => sum + t.points, 0)
}
