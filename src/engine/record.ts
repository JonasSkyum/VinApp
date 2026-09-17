import type { Catalog } from './catalog'
import { applyReview, type LeitnerState } from './leitner'
import type { MapResult } from './mapQuiz'
import type { AnswerRecord } from './progress'
import type { RoundScore, TastingCase } from './types'

/**
 * Turns a scored tasting round into answer records, one per learning unit:
 * grape (tier 3), country and region (tiers 4–5) and the style itself.
 * Climate points are folded into the style record so XP equals the round score.
 */
export function roundRecords(
  tastingCase: TastingCase,
  score: RoundScore,
  catalog: Catalog,
  now: number,
): AnswerRecord[] {
  const key = catalog.answerKey(tastingCase.styleId)
  const tier = (n: number) => score.tiers.find((t) => t.tier === n)
  const records: AnswerRecord[] = []

  const grape = tier(3)
  if (grape) records.push(record('grape', key.grapeId, 3, grape, now))
  const country = tier(4)
  if (country) records.push(record('region', key.countryId, 4, country, now))
  const region = tier(5)
  if (region) records.push(record('region', key.regionId, 5, region, now))

  const style = tier(6)
  const played = score.tiers.filter((t) => t.tier >= 3 && t.answer !== null)
  const basePoints = tier(2)?.points ?? 0
  if (style) {
    const r = record('style', key.styleId, 6, style, now)
    records.push({ ...r, points: r.points + basePoints })
  } else {
    records.push({
      kind: 'style',
      itemId: key.styleId,
      tier: 6,
      correct: played.length > 0 && played.every((t) => t.outcome === 'correct'),
      guessedId: null,
      points: basePoints,
      timestamp: now,
    })
  }
  return records
}

function record(
  kind: AnswerRecord['kind'],
  itemId: string,
  tier: AnswerRecord['tier'],
  result: RoundScore['tiers'][number],
  now: number,
): AnswerRecord {
  const correct = result.outcome === 'correct'
  return {
    kind,
    itemId,
    tier,
    correct,
    guessedId: correct || result.answer === null ? null : result.answer,
    points: result.points,
    timestamp: now,
  }
}

/** One record per map question, keyed on the region the player should have hit. */
export function mapRecord(result: MapResult, now: number): AnswerRecord {
  const guessedId =
    !result.correct && result.answer.kind === 'choice' ? result.answer.regionId : null
  return {
    kind: 'map-location',
    itemId: result.targetRegionId,
    tier: 'map',
    correct: result.correct,
    guessedId,
    points: result.points,
    timestamp: now,
  }
}

/** Applies every record to the Leitner state. */
export function applyRecords(state: LeitnerState, records: readonly AnswerRecord[]): LeitnerState {
  return records.reduce((s, r) => applyReview(s, r.kind, r.itemId, r.correct, r.timestamp), state)
}
