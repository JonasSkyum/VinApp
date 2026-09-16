import { structureKeys, type Level, type Range, type Style, type StructureKey } from '@/schema'
import { pick, randomInt, sample, type Rng } from './rng'
import type { CaseProfile, Deviation, Difficulty, TastingCase } from './types'

export const MIN_CASE_DESCRIPTORS = 3
export const MAX_CASE_DESCRIPTORS = 5
/** Chance that an expert case gets one attribute nudged by ±1 (bottle variation). */
export const EXPERT_DEVIATION_PROBABILITY = 0.15

/**
 * Turns a style (ranges) into one concrete wine (points). Deterministic for a given rng.
 * Rng consumption order is fixed: attributes in structureKeys order, descriptor count,
 * descriptor sample, then the expert deviation roll.
 */
export function generateCase(style: Style, difficulty: Difficulty, rng: Rng): TastingCase {
  const p = style.profile
  const value = (range: Range): Level => randomInt(rng, range[0], range[1]) as Level
  const profile: CaseProfile = {
    appearance: p.appearance,
    intensity: value(p.intensity),
    sweetness: value(p.sweetness),
    acidity: value(p.acidity),
    tannin: p.tannin === null ? null : value(p.tannin),
    alcohol: value(p.alcohol),
    body: value(p.body),
    finish: value(p.finish),
  }

  const count = randomInt(
    rng,
    Math.min(MIN_CASE_DESCRIPTORS, style.descriptorIds.length),
    Math.min(MAX_CASE_DESCRIPTORS, style.descriptorIds.length),
  )
  const descriptorIds = sample(rng, style.descriptorIds, count)

  let deviation: Deviation | null = null
  if (difficulty === 'expert' && rng() < EXPERT_DEVIATION_PROBABILITY) {
    deviation = applyDeviation(profile, rng)
  }

  return { styleId: style.id, profile, descriptorIds, deviation }
}

/** Nudges one non-null attribute by ±1 within 1–5. Returns null if the nudge was clamped away. */
function applyDeviation(profile: CaseProfile, rng: Rng): Deviation | null {
  const values = profile as Record<StructureKey, Level | null>
  const candidates = structureKeys.filter((k) => values[k] !== null)
  const attribute = pick(rng, candidates)
  const delta: 1 | -1 = rng() < 0.5 ? -1 : 1
  const current = values[attribute] as Level
  const next = Math.min(5, Math.max(1, current + delta)) as Level
  if (next === current) return null
  values[attribute] = next
  return { attribute, delta }
}
