import { structureKeys, type Style } from '@/schema'
import { appearanceDistance, rangeDistance } from './distance'
import type { Explanation, TastingCase } from './types'

export const MAX_ATTRIBUTE_EXPLANATIONS = 3

/**
 * Why the guessed style was wrong, purely from data: the attributes where the case
 * value falls outside the guessed style's range (strongest first), then a colour
 * mismatch, then aromas the guessed style does not list. The UI turns these into
 * Danish sentences; no free text is generated here.
 */
export function explain(
  tastingCase: TastingCase,
  correctStyle: Style,
  guessedStyle: Style,
): Explanation[] {
  if (correctStyle.id === guessedStyle.id) return []
  const { profile, descriptorIds } = tastingCase
  const explanations: Explanation[] = []

  const scored: { explanation: Explanation; score: number }[] = []
  for (const attribute of structureKeys) {
    const caseValue = profile[attribute]
    const correctRange = correctStyle.profile[attribute]
    const guessedRange = guessedStyle.profile[attribute]
    if (caseValue === null || correctRange === null || guessedRange === null) continue

    const outside = rangeDistance(caseValue, guessedRange)
    const separation = rangeSeparation(correctRange, guessedRange)
    if (outside === 0 && separation === 0) continue
    scored.push({
      explanation: { kind: 'attribute', attribute, caseValue, correctRange, guessedRange },
      // The case value being outside the guess is what the player could have seen; weigh it most.
      score: outside * 10 + separation,
    })
  }
  scored.sort((a, b) => b.score - a.score)
  explanations.push(...scored.slice(0, MAX_ATTRIBUTE_EXPLANATIONS).map((s) => s.explanation))

  if (appearanceDistance(profile.appearance, guessedStyle.profile.appearance) > 0) {
    explanations.push({
      kind: 'appearance',
      caseValue: profile.appearance,
      guessedAppearance: guessedStyle.profile.appearance,
    })
  }

  const missing = descriptorIds.filter((d) => !guessedStyle.descriptorIds.includes(d))
  if (missing.length > 0) explanations.push({ kind: 'descriptors', descriptorIds: missing })

  return explanations
}

/** Gap between two ranges; 0 when they overlap. */
export function rangeSeparation(
  a: readonly [number, number],
  b: readonly [number, number],
): number {
  return Math.max(0, a[0] - b[1], b[0] - a[1])
}
