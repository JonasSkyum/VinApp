import type { AnswerRecord, DailyResult, LeitnerCard, Tier } from '@/engine'
import { recordClientId } from '@/engine'
import type { Tables, TablesInsert } from '@/lib/database.types'

/** Conversions between engine types (epoch ms, unions) and database rows (ISO strings, text). */

const iso = (ms: number) => new Date(ms).toISOString()
const ms = (isoString: string) => Date.parse(isoString)

export function toAnswerRow(r: AnswerRecord, userId: string): TablesInsert<'answer_log'> {
  return {
    user_id: userId,
    client_id: recordClientId(r),
    kind: r.kind,
    item_id: r.itemId,
    tier: String(r.tier),
    correct: r.correct,
    guessed_id: r.guessedId,
    points: r.points,
    answered_at: iso(r.timestamp),
  }
}

export function fromAnswerRow(row: Tables<'answer_log'>): AnswerRecord {
  return {
    kind: row.kind as AnswerRecord['kind'],
    itemId: row.item_id,
    tier: row.tier === 'map' ? 'map' : (Number(row.tier) as Tier),
    correct: row.correct,
    guessedId: row.guessed_id,
    points: row.points,
    timestamp: ms(row.answered_at),
  }
}

export function toLeitnerRow(
  key: string,
  card: LeitnerCard,
  userId: string,
): TablesInsert<'leitner_state'> {
  return {
    user_id: userId,
    unit_key: key,
    box: card.box,
    reviewed_at: iso(card.reviewedAt),
    due_at: iso(card.dueAt),
  }
}

export function fromLeitnerRow(row: Tables<'leitner_state'>): [string, LeitnerCard] {
  return [
    row.unit_key,
    { box: row.box as LeitnerCard['box'], reviewedAt: ms(row.reviewed_at), dueAt: ms(row.due_at) },
  ]
}

export function toDailyRow(d: DailyResult, userId: string): TablesInsert<'daily_results'> {
  return {
    user_id: userId,
    date_key: d.dateKey,
    style_id: d.styleId,
    total: d.total,
    max: d.max,
    tiers: d.tiers,
    played_at: iso(d.playedAt),
  }
}

export function fromDailyRow(row: Tables<'daily_results'>): DailyResult {
  return {
    dateKey: row.date_key,
    styleId: row.style_id,
    total: row.total,
    max: row.max,
    tiers: row.tiers as DailyResult['tiers'],
    playedAt: ms(row.played_at),
  }
}
