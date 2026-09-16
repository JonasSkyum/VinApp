import type { AnswerRecord } from './progress'
import type { Difficulty } from './types'

/** Correct grape answers (tier 3) needed before "advanced" opens. */
export const ADVANCED_UNLOCK_GRAPES = 10
/** Correct region answers (tier 5) needed before "expert" opens. */
export const EXPERT_UNLOCK_REGIONS = 10

export interface UnlockStatus {
  unlocked: boolean
  /** Progress towards the requirement, capped at the requirement. */
  have: number
  need: number
}

export function correctAnswersOnTier(
  log: readonly AnswerRecord[],
  tier: AnswerRecord['tier'],
): number {
  return log.filter((r) => r.tier === tier && r.correct).length
}

/** Whether each tasting level is playable. Beginner always is; unlocking can be switched off. */
export function unlockStatus(
  log: readonly AnswerRecord[],
  unlockingEnabled: boolean,
): Record<Difficulty, UnlockStatus> {
  const grapes = correctAnswersOnTier(log, 3)
  const regions = correctAnswersOnTier(log, 5)
  const status = (have: number, need: number): UnlockStatus => ({
    unlocked: !unlockingEnabled || have >= need,
    have: Math.min(have, need),
    need,
  })
  return {
    beginner: { unlocked: true, have: 0, need: 0 },
    advanced: status(grapes, ADVANCED_UNLOCK_GRAPES),
    expert: status(regions, EXPERT_UNLOCK_REGIONS),
  }
}
