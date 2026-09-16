import type { Style } from '@/schema'
import type { Catalog } from './catalog'
import { createRng, pick } from './rng'
import { eligibleStyles } from './session'
import type { Difficulty, Outcome, RoundScore, Tier } from './types'

/** The day rolls over at midnight in this zone, so everyone gets the same case. */
export const DAILY_TIMEZONE = 'Europe/Copenhagen'
export const DAILY_DIFFICULTY: Difficulty = 'advanced'
/** Date of challenge #1. */
export const DAILY_EPOCH = '2026-09-16'
/** Below this many verified styles the daily draws from every eligible style instead. */
export const MIN_VERIFIED_POOL = 10

const DAY_MS = 24 * 60 * 60 * 1000

/** Calendar date `YYYY-MM-DD` of a timestamp in the daily time zone. */
export function dailyDateKey(now: number, timeZone: string = DAILY_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(now))
  const get = (type: string) => parts.find((p) => p.type === type)!.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Days since the Unix epoch for a `YYYY-MM-DD` key (calendar arithmetic, no time zones). */
export function dateKeyToDays(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number) as [number, number, number]
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS)
}

/** Challenge number shown to players: #1 on DAILY_EPOCH, counting up one per day. */
export function dailyNumber(dateKey: string): number {
  return dateKeyToDays(dateKey) - dateKeyToDays(DAILY_EPOCH) + 1
}

export function dailySeed(dateKey: string): string {
  return `daily:${dateKey}`
}

/** Verified styles playable on the daily level, or every eligible style when too few are verified. */
export function dailyPool(catalog: Catalog): Style[] {
  const eligible = eligibleStyles(catalog, { difficulty: DAILY_DIFFICULTY, colors: 'both' })
  const verified = eligible.filter((s) => s.verified)
  return verified.length >= MIN_VERIFIED_POOL ? verified : eligible
}

/** The one style everyone tastes on a given day. */
export function pickDailyStyle(catalog: Catalog, dateKey: string): Style {
  const pool = dailyPool(catalog)
  if (pool.length === 0) throw new Error('No styles available for the daily challenge')
  return pick(createRng(`${dailySeed(dateKey)}:style`), pool)
}

/** Milliseconds until the next daily challenge unlocks (midnight in the daily zone). */
export function msUntilNextDaily(now: number, timeZone: string = DAILY_TIMEZONE): number {
  const today = dailyDateKey(now, timeZone)
  // Coarse guess, then tighten with shrinking steps so DST days come out exact too.
  let next = now + DAY_MS
  for (const step of [60 * 60 * 1000, 60 * 1000, 1000, 1]) {
    while (dailyDateKey(next - step, timeZone) !== today) next -= step
  }
  return next - now
}

/** Formats a duration as `HH:MM:SS`. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/** What is kept once a daily has been played. Enough to show the result again and to share it. */
export interface DailyResult {
  dateKey: string
  styleId: string
  total: number
  max: number
  tiers: { tier: Tier; outcome: Outcome }[]
  playedAt: number
}

export function toDailyResult(
  dateKey: string,
  styleId: string,
  score: RoundScore,
  playedAt: number,
): DailyResult {
  return {
    dateKey,
    styleId,
    total: score.total,
    max: score.max,
    tiers: score.tiers.map((t) => ({ tier: t.tier, outcome: t.outcome })),
    playedAt,
  }
}

export const OUTCOME_EMOJI: Record<Outcome, string> = {
  correct: '🟩',
  partial: '🟨',
  wrong: '⬛',
  skipped: '⬜',
}

export function outcomeRow(tiers: readonly { outcome: Outcome }[]): string {
  return tiers.map((t) => OUTCOME_EMOJI[t.outcome]).join('')
}

/** Wordle-style share text: `Vinspil #42 🍷 🟩🟩🟨⬛🟩 9/10`, with an optional link on a second line. */
export function shareString(result: DailyResult, url?: string): string {
  const line = `Vinspil #${dailyNumber(result.dateKey)} 🍷 ${outcomeRow(result.tiers)} ${result.total}/${result.max}`
  return url ? `${line}\n${url}` : line
}

/**
 * Consecutive daily challenges played, counting back from today
 * (or from yesterday, so the streak is not lost before playing today).
 */
export function dailyStreak(results: Record<string, DailyResult>, todayKey: string): number {
  const days = new Set(Object.keys(results).map(dateKeyToDays))
  const today = dateKeyToDays(todayKey)
  let day = days.has(today) ? today : today - 1
  let streak = 0
  while (days.has(day)) {
    streak++
    day--
  }
  return streak
}
