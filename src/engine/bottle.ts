import type { Catalog } from './catalog'
import { rankCandidates, type RankedStyle } from './distance'
import type { CaseProfile, TastingCase } from './types'

/** What the player writes down about a real glass: the same sheet the game shows. */
export interface BottleInput {
  profile: CaseProfile
  descriptorIds: string[]
}

/** A tasting case built from the player's own notes; there is no hidden style behind it. */
export function bottleCase(input: BottleInput): TastingCase {
  return {
    styleId: '',
    profile: input.profile,
    descriptorIds: input.descriptorIds,
    deviation: null,
  }
}

/** The most likely styles for the notes, closest first, across the whole catalogue. */
export function rankBottle(input: BottleInput, catalog: Catalog, limit = 5): RankedStyle[] {
  return rankCandidates(bottleCase(input), catalog.styles).slice(0, limit)
}

/** 1-based position of a style in a ranking, or null when it is not listed. */
export function rankPosition(ranked: readonly RankedStyle[], styleId: string): number | null {
  const index = ranked.findIndex((r) => r.style.id === styleId)
  return index === -1 ? null : index + 1
}
