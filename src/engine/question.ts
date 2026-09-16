import { climateSchema, worldSchema, type Style } from '@/schema'
import type { Catalog } from './catalog'
import { rankCandidates } from './distance'
import { shuffle, type Rng } from './rng'
import { tierSpec } from './tiers'
import type { AnswerField, Difficulty, Question, TastingCase, Tier } from './types'

/** Number of multiple-choice options per level. Expert gets free text instead. */
export const OPTION_COUNT: Record<Difficulty, number> = {
  beginner: 4,
  advanced: 6,
  expert: Number.POSITIVE_INFINITY,
}

/**
 * Builds the question for one tier. Distractors are the answers of the nearest
 * neighbouring styles of the same colour, so wrong options are plausible.
 * World and climate are always a full multiple choice (2 and 3 options).
 */
export function buildQuestion(
  tastingCase: TastingCase,
  tier: Tier,
  difficulty: Difficulty,
  catalog: Catalog,
  rng: Rng,
): Question {
  const spec = tierSpec(tier)
  const correctStyle = catalog.style(tastingCase.styleId)
  const correctId = catalog.answerKey(correctStyle.id)[spec.field]
  const universe = answerUniverse(spec.field, correctStyle, catalog)

  const isFixedChoice = spec.field === 'world' || spec.field === 'climate'
  if (isFixedChoice || difficulty === 'expert') {
    return {
      tier,
      kind: isFixedChoice ? 'choice' : 'text',
      options: universe,
      correctId,
      points: spec.points,
    }
  }

  const wanted = OPTION_COUNT[difficulty] - 1
  const neighbours = rankCandidates(
    tastingCase,
    catalog.styles.filter((s) => s.color === correctStyle.color && s.id !== correctStyle.id),
  )
  const distractors: string[] = []
  for (const { style } of neighbours) {
    const id = catalog.answerKey(style.id)[spec.field]
    if (id !== correctId && !distractors.includes(id)) distractors.push(id)
    if (distractors.length === wanted) break
  }
  // Not enough neighbours of this colour: fill from the remaining universe at random.
  if (distractors.length < wanted) {
    const rest = universe.filter((id) => id !== correctId && !distractors.includes(id))
    distractors.push(...shuffle(rng, rest).slice(0, wanted - distractors.length))
  }

  return {
    tier,
    kind: 'choice',
    options: shuffle(rng, [correctId, ...distractors]),
    correctId,
    points: spec.points,
  }
}

/** Every answer id that could be correct for this field, given the style's colour. */
export function answerUniverse(field: AnswerField, style: Style, catalog: Catalog): string[] {
  switch (field) {
    case 'world':
      return [...worldSchema.options]
    case 'climate':
      return [...climateSchema.options]
    case 'grapeId': {
      const color = style.color === 'red' ? 'red' : style.color === 'white' ? 'white' : null
      return catalog.grapes.filter((g) => color === null || g.color === color).map((g) => g.id)
    }
    case 'countryId':
      return catalog.regions.filter((r) => r.type === 'country').map((r) => r.id)
    case 'regionId':
      return catalog.regions.filter((r) => r.type === 'region').map((r) => r.id)
    case 'styleId':
      return catalog.styles.filter((s) => s.color === style.color).map((s) => s.id)
  }
}
