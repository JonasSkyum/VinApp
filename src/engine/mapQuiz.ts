import type { LngLat, Region } from '@/schema'
import type { Catalog } from './catalog'
import { findScore, haversineKm, MAP_QUESTION_POINTS } from './geo'
import { OPTION_COUNT } from './question'
import { shuffle, type Rng } from './rng'
import { DIFFICULTY_LEVEL, type Difficulty } from './types'

/** find: click the named region · name: name the blinking region · grape: click where a grape is classic. */
export type MapMode = 'find' | 'name' | 'grape'

export interface MapQuizOptions {
  mode: MapMode
  world: 'old' | 'new' | 'all'
  /** Region id of a country, or 'all'. */
  countryId: string | 'all'
  difficulty: Difficulty
  count: number
}

export type MapQuestion =
  | { kind: 'find'; regionId: string; points: number }
  | {
      kind: 'name'
      regionId: string
      answerKind: 'choice' | 'text'
      options: string[]
      points: number
    }
  | { kind: 'grape'; grapeId: string; regionIds: string[]; points: number }

export type MapAnswer =
  | { kind: 'click'; lngLat: LngLat; insideGeoId: string | null }
  | { kind: 'choice'; regionId: string | null }

export interface MapResult {
  question: MapQuestion
  answer: MapAnswer
  points: number
  maxPoints: number
  correct: boolean
  /** The region the player should have hit (nearest accepted one for grape questions). */
  targetRegionId: string
  distanceKm: number | null
}

/** A click scoring above this share of the maximum counts as correct. */
export const CORRECT_SHARE = 0.5

/** Regions that can be asked about under the given filters. Countries only appear in the world-wide view. */
export function mapQuizPool(catalog: Catalog, options: MapQuizOptions): Region[] {
  const level = DIFFICULTY_LEVEL[options.difficulty]
  return catalog.regions.filter((r) => {
    if (r.difficulty > level) return false
    if (options.world !== 'all' && r.world !== options.world) return false
    if (options.countryId !== 'all') {
      if (r.type === 'country') return false
      return catalog.countryOf(r.id).id === options.countryId
    }
    return true
  })
}

/**
 * Regions where a grape is classically grown: homes of the styles that lead with it.
 * Old World regions when there are any, otherwise all of them.
 */
export function classicRegionsForGrape(catalog: Catalog, grapeId: string): Region[] {
  const homes = catalog.styles
    .filter((s) => s.grapeIds[0] === grapeId)
    .map((s) => catalog.region(s.regionId))
  const unique = [...new Map(homes.map((r) => [r.id, r])).values()]
  const oldWorld = unique.filter((r) => r.world === 'old')
  return oldWorld.length > 0 ? oldWorld : unique
}

/**
 * Nearest other regions by distance, preferring the same hierarchy type. When the
 * pool is too small (e.g. a country with three regions) the fallback list tops it up.
 */
export function nameDistractors(
  target: Region,
  pool: Region[],
  count: number,
  fallback: readonly Region[] = [],
): string[] {
  const byDistance = (a: Region, b: Region) =>
    haversineKm(target.center, a.center) - haversineKm(target.center, b.center) ||
    a.id.localeCompare(b.id)
  const pick = (candidates: readonly Region[], exclude: Set<string>) => {
    const others = candidates.filter((r) => r.id !== target.id && !exclude.has(r.id))
    const sameType = others.filter((r) => r.type === target.type).sort(byDistance)
    const rest = others.filter((r) => r.type !== target.type).sort(byDistance)
    return [...sameType, ...rest].map((r) => r.id)
  }
  const ids = pick(pool, new Set()).slice(0, count)
  if (ids.length < count) {
    ids.push(...pick(fallback, new Set(ids)).slice(0, count - ids.length))
  }
  return ids
}

export function buildMapQuiz(catalog: Catalog, options: MapQuizOptions, rng: Rng): MapQuestion[] {
  const pool = mapQuizPool(catalog, options)
  const points = MAP_QUESTION_POINTS

  if (options.mode === 'grape') {
    const poolIds = new Set(pool.map((r) => r.id))
    const candidates = catalog.grapes
      .map((g) => ({
        grapeId: g.id,
        regionIds: classicRegionsForGrape(catalog, g.id)
          .filter((r) => poolIds.has(r.id))
          .map((r) => r.id),
      }))
      .filter((c) => c.regionIds.length > 0)
    if (candidates.length === 0) throw new Error('No grape questions match the filters')
    return cycle(rng, candidates, options.count).map((c) => ({ kind: 'grape', ...c, points }))
  }

  if (pool.length === 0) throw new Error('No regions match the filters')
  const targets = cycle(rng, pool, options.count)

  if (options.mode === 'find') {
    return targets.map((r) => ({ kind: 'find', regionId: r.id, points }))
  }

  const wanted = OPTION_COUNT[options.difficulty]
  return targets.map((r) => {
    if (!Number.isFinite(wanted)) {
      return {
        kind: 'name',
        regionId: r.id,
        answerKind: 'text',
        options: pool.map((p) => p.id),
        points,
      }
    }
    const distractors = nameDistractors(
      r,
      pool,
      wanted - 1,
      catalog.regions.filter((x) => x.type !== 'country'),
    )
    return {
      kind: 'name',
      regionId: r.id,
      answerKind: 'choice',
      options: shuffle(rng, [r.id, ...distractors]),
      points,
    }
  })
}

export function scoreMapQuestion(
  question: MapQuestion,
  answer: MapAnswer,
  catalog: Catalog,
): MapResult {
  const maxPoints = question.points
  const base = { question, answer, maxPoints }

  if (question.kind === 'name') {
    const chosen = answer.kind === 'choice' ? answer.regionId : null
    const correct = chosen === question.regionId
    return {
      ...base,
      points: correct ? maxPoints : 0,
      correct,
      targetRegionId: question.regionId,
      distanceKm: null,
    }
  }

  const targetIds = question.kind === 'find' ? [question.regionId] : question.regionIds
  if (answer.kind !== 'click') {
    return { ...base, points: 0, correct: false, targetRegionId: targetIds[0]!, distanceKm: null }
  }

  let best: { region: Region; points: number; distanceKm: number } | null = null
  for (const id of targetIds) {
    const region = catalog.region(id)
    const inside = region.geoId !== undefined && region.geoId === answer.insideGeoId
    const scored = findScore(region, answer.lngLat, inside, maxPoints)
    if (
      !best ||
      scored.points > best.points ||
      (scored.points === best.points && scored.distanceKm < best.distanceKm)
    ) {
      best = { region, ...scored }
    }
  }
  return {
    ...base,
    points: best!.points,
    correct: best!.points > maxPoints * CORRECT_SHARE,
    targetRegionId: best!.region.id,
    distanceKm: Math.round(best!.distanceKm),
  }
}

/** `count` items, without repeats while possible, reshuffling when the pool runs out. */
function cycle<T>(rng: Rng, items: T[], count: number): T[] {
  const out: T[] = []
  while (out.length < count) out.push(...shuffle(rng, items))
  return out.slice(0, count)
}
