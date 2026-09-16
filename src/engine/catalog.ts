import type { ContentBundle } from '@/content/validate'
import type { Descriptor, Grape, Region, Style } from '@/schema'
import type { AnswerKey } from './types'

/**
 * Indexed, read-only view of the content bundle with hierarchy helpers.
 * Build once (per content bundle) and pass to engine functions.
 */
export interface Catalog {
  readonly styles: readonly Style[]
  readonly grapes: readonly Grape[]
  readonly regions: readonly Region[]
  readonly descriptors: readonly Descriptor[]
  style(id: string): Style
  grape(id: string): Grape
  region(id: string): Region
  descriptor(id: string): Descriptor
  /** The region itself followed by its parents up to and including the country. */
  ancestors(regionId: string): Region[]
  countryOf(regionId: string): Region
  /** Nearest ancestor (or self) of type `region`; falls back to the country. */
  regionLevelOf(regionId: string): Region
  /** Correct answers for every tier of a style. */
  answerKey(styleId: string): AnswerKey
}

export function createCatalog(content: ContentBundle): Catalog {
  const stylesById = new Map(content.styles.map((s) => [s.id, s]))
  const grapesById = new Map(content.grapes.map((g) => [g.id, g]))
  const regionsById = new Map(content.regions.map((r) => [r.id, r]))
  const descriptorsById = new Map(content.descriptors.map((d) => [d.id, d]))
  const answerKeys = new Map<string, AnswerKey>()

  function lookup<T>(map: Map<string, T>, kind: string, id: string): T {
    const item = map.get(id)
    if (!item) throw new Error(`Unknown ${kind} "${id}"`)
    return item
  }

  const region = (id: string) => lookup(regionsById, 'region', id)

  function ancestors(regionId: string): Region[] {
    const chain: Region[] = []
    let current: Region | undefined = region(regionId)
    while (current) {
      chain.push(current)
      current = current.parentId === null ? undefined : region(current.parentId)
    }
    return chain
  }

  function countryOf(regionId: string): Region {
    const chain = ancestors(regionId)
    return chain[chain.length - 1]!
  }

  function regionLevelOf(regionId: string): Region {
    const chain = ancestors(regionId)
    return chain.find((r) => r.type === 'region') ?? chain[chain.length - 1]!
  }

  function answerKey(styleId: string): AnswerKey {
    const cached = answerKeys.get(styleId)
    if (cached) return cached
    const style = lookup(stylesById, 'style', styleId)
    const home = region(style.regionId)
    const key: AnswerKey = {
      world: home.world,
      climate: home.climate ?? regionLevelOf(home.id).climate ?? 'moderate',
      grapeId: style.grapeIds[0]!,
      countryId: countryOf(home.id).id,
      regionId: regionLevelOf(home.id).id,
      styleId: style.id,
    }
    answerKeys.set(styleId, key)
    return key
  }

  return {
    styles: content.styles,
    grapes: content.grapes,
    regions: content.regions,
    descriptors: content.descriptors,
    style: (id) => lookup(stylesById, 'style', id),
    grape: (id) => lookup(grapesById, 'grape', id),
    region,
    descriptor: (id) => lookup(descriptorsById, 'descriptor', id),
    ancestors,
    countryOf,
    regionLevelOf,
    answerKey,
  }
}
