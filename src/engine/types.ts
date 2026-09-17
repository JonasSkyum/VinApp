import type { Appearance, Level, Range, StructureKey } from '@/schema'

/** Player level. UI labels: Begynder / Øvet / Ekspert. */
export type Difficulty = 'beginner' | 'advanced' | 'expert'

/** Content difficulty (1–3) a player level unlocks. */
export const DIFFICULTY_LEVEL: Record<Difficulty, 1 | 2 | 3> = {
  beginner: 1,
  advanced: 2,
  expert: 3,
}

/** Guessing steps, in order. See TIERS for points and availability. */
export type Tier = 2 | 3 | 4 | 5 | 6

/** One concrete wine as shown to the player: a point inside the style's ranges. */
export interface CaseProfile {
  appearance: Appearance
  intensity: Level
  sweetness: Level
  acidity: Level
  tannin: Level | null
  alcohol: Level
  body: Level
  finish: Level
}

/** Bottle variation applied on expert level: one attribute nudged by ±1. */
export interface Deviation {
  attribute: StructureKey
  delta: 1 | -1
}

export interface TastingCase {
  styleId: string
  profile: CaseProfile
  /** 3–5 descriptors sampled from the style. */
  descriptorIds: string[]
  deviation: Deviation | null
}

/** The correct answer for every tier of a given style. */
export interface AnswerKey {
  climate: string
  grapeId: string
  countryId: string
  regionId: string
  styleId: string
}

export type AnswerField = keyof AnswerKey

export interface Question {
  tier: Tier
  /** Multiple choice, or free text with `options` as the autocomplete universe. */
  kind: 'choice' | 'text'
  /** Answer ids. For climate these are enum values; otherwise content ids. */
  options: string[]
  correctId: string
  points: number
}

export type Outcome = 'correct' | 'partial' | 'wrong' | 'skipped'

export interface TierResult {
  tier: Tier
  answer: string | null
  correctId: string
  points: number
  maxPoints: number
  outcome: Outcome
}

export interface RoundScore {
  total: number
  max: number
  tiers: TierResult[]
}

export type Explanation =
  | {
      kind: 'attribute'
      attribute: StructureKey
      caseValue: Level
      correctRange: Range
      guessedRange: Range
    }
  | { kind: 'appearance'; caseValue: Appearance; guessedAppearance: Appearance }
  | {
      /** Aromas shown in the case that the guessed style does not list. */
      kind: 'descriptors'
      descriptorIds: string[]
    }
