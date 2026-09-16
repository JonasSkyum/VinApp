import type { Style } from '@/schema'
import type { Catalog } from './catalog'
import { boxOf, type LeitnerState } from './leitner'
import { confusionMatrix, type AnswerRecord } from './progress'
import type { Rng } from './rng'
import { eligibleStyles, type SessionOptions } from './session'

/**
 * How much a style wants to be trained: low Leitner boxes on the style and its
 * lead grape weigh most, plus every logged confusion involving either of them.
 * Unseen units (box 0) rank highest.
 */
export function trainingWeight(
  style: Style,
  leitner: LeitnerState,
  confusions: ReturnType<typeof confusionMatrix>,
): number {
  const grapeId = style.grapeIds[0]!
  const styleBox = boxOf(leitner, 'style', style.id)
  const grapeBox = boxOf(leitner, 'grape', grapeId)
  const confusionCount = confusions
    .filter(
      (c) =>
        (c.kind === 'style' && (c.correctId === style.id || c.guessedId === style.id)) ||
        (c.kind === 'grape' && (c.correctId === grapeId || c.guessedId === grapeId)),
    )
    .reduce((sum, c) => sum + c.count, 0)
  return 6 - styleBox + (6 - grapeBox) + 2 * confusionCount
}

/**
 * Picks styles for a "train weak points" session: weighted random without
 * replacement, so the weakest come up most but the session is not identical every time.
 */
export function weakStyles(
  catalog: Catalog,
  leitner: LeitnerState,
  log: readonly AnswerRecord[],
  options: SessionOptions,
  rng: Rng,
): Style[] {
  const pool = eligibleStyles(catalog, options)
  if (pool.length === 0) throw new Error('No styles match the session options')
  const confusions = confusionMatrix(log)
  const weighted = pool.map((style) => ({
    style,
    weight: trainingWeight(style, leitner, confusions),
  }))

  const picked: Style[] = []
  let remaining = [...weighted]
  while (picked.length < options.rounds) {
    if (remaining.length === 0) remaining = [...weighted]
    const total = remaining.reduce((sum, w) => sum + w.weight, 0)
    let roll = rng() * total
    let index = remaining.length - 1
    for (let i = 0; i < remaining.length; i++) {
      roll -= remaining[i]!.weight
      if (roll < 0) {
        index = i
        break
      }
    }
    picked.push(remaining[index]!.style)
    remaining.splice(index, 1)
  }
  return picked
}
