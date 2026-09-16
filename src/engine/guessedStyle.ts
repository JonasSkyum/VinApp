import type { Style } from '@/schema'
import type { Catalog } from './catalog'
import { rankCandidates } from './distance'
import { tierSpec } from './tiers'
import type { RoundScore, TastingCase, Tier } from './types'

/** Tiers whose answer identifies a concrete place or grape, deepest first. */
const IDENTIFYING_TIERS: readonly Tier[] = [6, 5, 4, 3]

/**
 * The style the player effectively guessed, used as the counterpart in explain().
 * On expert that is the style they named. Otherwise it is the most likely
 * neighbouring style (same colour) consistent with their deepest wrong answer.
 * Returns null when every identifying answer was right or nothing matches.
 */
export function guessedStyle(
  tastingCase: TastingCase,
  score: RoundScore,
  catalog: Catalog,
): Style | null {
  const correct = catalog.style(tastingCase.styleId)
  const wrong = IDENTIFYING_TIERS.map((tier) => score.tiers.find((t) => t.tier === tier)).find(
    (t) => t !== undefined && t.answer !== null && t.outcome !== 'correct',
  )
  if (!wrong || wrong.answer === null) return null

  const field = tierSpec(wrong.tier).field
  if (field === 'styleId') {
    try {
      return catalog.style(wrong.answer)
    } catch {
      return null
    }
  }

  const answer = wrong.answer
  const neighbours = rankCandidates(
    tastingCase,
    catalog.styles.filter((s) => s.color === correct.color && s.id !== correct.id),
  )
  return neighbours.find((n) => catalog.answerKey(n.style.id)[field] === answer)?.style ?? null
}

/** The most likely wrong style, for "often confused with" hints when the player was right. */
export function nearestNeighbour(tastingCase: TastingCase, catalog: Catalog): Style | null {
  const correct = catalog.style(tastingCase.styleId)
  const neighbours = rankCandidates(
    tastingCase,
    catalog.styles.filter((s) => s.color === correct.color && s.id !== correct.id),
  )
  return neighbours[0]?.style ?? null
}
