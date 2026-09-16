import {
  redAppearanceSchema,
  roseAppearanceSchema,
  structureKeys,
  whiteAppearanceSchema,
  type Appearance,
  type Level,
  type Range,
  type Style,
  type StructureKey,
} from '@/schema'
import type { TastingCase } from './types'

/** How much a one-level miss on each attribute costs. Structure-defining attributes weigh more. */
export const ATTRIBUTE_WEIGHTS: Record<StructureKey, number> = {
  intensity: 0.75,
  sweetness: 1.5,
  acidity: 1.5,
  tannin: 1.5,
  alcohol: 1,
  body: 1,
  finish: 0.75,
}
/** Cost of the case's aromas being entirely absent from a style's list. */
export const DESCRIPTOR_WEIGHT = 2
/** Cost per step along the colour scale within the same colour family. */
export const APPEARANCE_STEP_WEIGHT = 1
/** Cost when colour families (white/rosé/red) or tannin presence differ. */
export const MISMATCH_PENALTY = 10

const appearanceFamilies: readonly (readonly Appearance[])[] = [
  whiteAppearanceSchema.options,
  roseAppearanceSchema.options,
  redAppearanceSchema.options,
]

/** 0 when the value is inside the range, otherwise the distance to the nearest edge. */
export function rangeDistance(value: Level, range: Range): number {
  if (value < range[0]) return range[0] - value
  if (value > range[1]) return value - range[1]
  return 0
}

/** Steps between two appearances on the same scale, or MISMATCH_PENALTY across families. */
export function appearanceDistance(a: Appearance, b: Appearance): number {
  for (const family of appearanceFamilies) {
    const ia = family.indexOf(a)
    const ib = family.indexOf(b)
    if (ia !== -1 && ib !== -1) return Math.abs(ia - ib) * APPEARANCE_STEP_WEIGHT
    if (ia !== -1 || ib !== -1) return MISMATCH_PENALTY
  }
  return MISMATCH_PENALTY
}

/**
 * How far a concrete case sits from a style's ranges. 0 means the case fits perfectly
 * and shows only aromas the style lists. Lower is more likely.
 */
export function profileDistance(tastingCase: TastingCase, style: Style): number {
  const { profile, descriptorIds } = tastingCase
  let distance = appearanceDistance(profile.appearance, style.profile.appearance)

  for (const key of structureKeys) {
    const value = profile[key]
    const range = style.profile[key]
    if (value === null && range === null) continue
    if (value === null || range === null) {
      distance += MISMATCH_PENALTY
      continue
    }
    distance += rangeDistance(value, range) * ATTRIBUTE_WEIGHTS[key]
  }

  if (descriptorIds.length > 0) {
    const shared = descriptorIds.filter((d) => style.descriptorIds.includes(d)).length
    distance += DESCRIPTOR_WEIGHT * (1 - shared / descriptorIds.length)
  }

  return distance
}

export interface RankedStyle {
  style: Style
  distance: number
}

/** Styles sorted from most to least likely for the case. Ties break on id for determinism. */
export function rankCandidates(tastingCase: TastingCase, styles: readonly Style[]): RankedStyle[] {
  return styles
    .map((style) => ({ style, distance: profileDistance(tastingCase, style) }))
    .sort((a, b) => a.distance - b.distance || a.style.id.localeCompare(b.style.id))
}

/** Gap between two ranges; 0 when they overlap. */
export function rangeSeparation(a: Range, b: Range): number {
  return Math.max(0, a[0] - b[1], b[0] - a[1])
}

const midpoint = (r: Range) => (r[0] + r[1]) / 2

/**
 * How different two styles are on paper: weighted range separation and midpoint
 * shift per attribute, colour steps, and how few aromas they share.
 * Used for "often confused with" lists; lower means easier to mix up.
 */
export function styleDistance(a: Style, b: Style): number {
  let distance = appearanceDistance(a.profile.appearance, b.profile.appearance)
  for (const key of structureKeys) {
    const ra = a.profile[key]
    const rb = b.profile[key]
    if (ra === null && rb === null) continue
    if (ra === null || rb === null) {
      distance += MISMATCH_PENALTY
      continue
    }
    const shift = Math.abs(midpoint(ra) - midpoint(rb))
    distance += (rangeSeparation(ra, rb) + shift / 2) * ATTRIBUTE_WEIGHTS[key]
  }
  const shared = a.descriptorIds.filter((d) => b.descriptorIds.includes(d)).length
  const union = new Set([...a.descriptorIds, ...b.descriptorIds]).size
  distance += DESCRIPTOR_WEIGHT * (union === 0 ? 0 : 1 - shared / union)
  return distance
}

/** The `count` styles of the same colour most easily confused with `style`, closest first. */
export function styleNeighbours(
  style: Style,
  styles: readonly Style[],
  count: number,
): RankedStyle[] {
  return styles
    .filter((s) => s.id !== style.id && s.color === style.color)
    .map((s) => ({ style: s, distance: styleDistance(style, s) }))
    .sort((x, y) => x.distance - y.distance || x.style.id.localeCompare(y.style.id))
    .slice(0, count)
}
