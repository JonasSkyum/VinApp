import type { Catalog } from './catalog'
import { tiersFor } from './tiers'
import type { Difficulty, Outcome, RoundScore, TastingCase, Tier, TierResult } from './types'

export type Answers = Partial<Record<Tier, string | null | undefined>>

/**
 * Scores a finished round. Partial credit:
 * - grape: another principal grape of the style (e.g. Merlot for Pauillac)
 * - region: a region in the correct country
 * - style: a style from the correct region (more) or correct country (less)
 */
export function scoreRound(
  tastingCase: TastingCase,
  answers: Answers,
  difficulty: Difficulty,
  catalog: Catalog,
): RoundScore {
  const style = catalog.style(tastingCase.styleId)
  const key = catalog.answerKey(style.id)

  const tiers: TierResult[] = tiersFor(difficulty).map((spec) => {
    const answer = answers[spec.tier] ?? null
    const correctId = key[spec.field]
    let outcome: Outcome
    let points = 0

    if (answer === null) {
      outcome = 'skipped'
    } else if (answer === correctId) {
      outcome = 'correct'
      points = spec.points
    } else {
      points = partialPoints(spec.field, answer, tastingCase.styleId, spec.points, catalog)
      outcome = points > 0 ? 'partial' : 'wrong'
    }

    return { tier: spec.tier, answer, correctId, points, maxPoints: spec.points, outcome }
  })

  return {
    total: tiers.reduce((sum, t) => sum + t.points, 0),
    max: tiers.reduce((sum, t) => sum + t.maxPoints, 0),
    tiers,
  }
}

function partialPoints(
  field: keyof ReturnType<Catalog['answerKey']>,
  answer: string,
  correctStyleId: string,
  points: number,
  catalog: Catalog,
): number {
  const style = catalog.style(correctStyleId)
  const key = catalog.answerKey(correctStyleId)
  const half = Math.floor(points / 2)

  switch (field) {
    case 'grapeId':
      return style.grapeIds.includes(answer) ? half : 0
    case 'regionId': {
      if (!exists(() => catalog.region(answer))) return 0
      return catalog.countryOf(answer).id === key.countryId ? half : 0
    }
    case 'styleId': {
      if (!exists(() => catalog.style(answer))) return 0
      const guessed = catalog.answerKey(answer)
      if (guessed.regionId === key.regionId) return half
      if (guessed.countryId === key.countryId) return Math.floor(half / 2)
      return 0
    }
    default:
      return 0
  }
}

function exists(lookup: () => unknown): boolean {
  try {
    lookup()
    return true
  } catch {
    return false
  }
}
