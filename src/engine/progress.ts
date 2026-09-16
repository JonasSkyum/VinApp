import type { UnitKind } from './leitner'
import type { Tier } from './types'

/** One logged answer. Tier is 'map' for map quiz questions. */
export interface AnswerRecord {
  kind: UnitKind
  itemId: string
  tier: Tier | 'map'
  correct: boolean
  /** What the player answered when wrong; null when skipped or for click answers. */
  guessedId: string | null
  points: number
  timestamp: number
}

export interface ConfusionPair {
  kind: UnitKind
  correctId: string
  guessedId: string
  count: number
}

export interface Mastery {
  id: string
  correct: number
  total: number
  /** 0–100, or null when never answered. */
  percent: number | null
}

/** (correct → guessed) pairs, most frequent first. Skips and click answers are not confusions. */
export function confusionMatrix(log: readonly AnswerRecord[]): ConfusionPair[] {
  const counts = new Map<string, ConfusionPair>()
  for (const r of log) {
    if (r.correct || r.guessedId === null) continue
    const key = `${r.kind}|${r.itemId}|${r.guessedId}`
    const pair = counts.get(key) ?? {
      kind: r.kind,
      correctId: r.itemId,
      guessedId: r.guessedId,
      count: 0,
    }
    pair.count++
    counts.set(key, pair)
  }
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.correctId.localeCompare(b.correctId),
  )
}

/** Share of correct answers per item of a kind. */
export function masteryByItem(log: readonly AnswerRecord[], kind: UnitKind): Mastery[] {
  const byId = new Map<string, Mastery>()
  for (const r of log) {
    if (r.kind !== kind) continue
    const m = byId.get(r.itemId) ?? { id: r.itemId, correct: 0, total: 0, percent: null }
    m.total++
    if (r.correct) m.correct++
    m.percent = Math.round((100 * m.correct) / m.total)
    byId.set(r.itemId, m)
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Local calendar day index of a timestamp (days since epoch in local time). */
export function dayIndex(timestamp: number): number {
  const d = new Date(timestamp)
  return Math.floor((timestamp - d.getTimezoneOffset() * 60 * 1000) / DAY_MS)
}

/**
 * Consecutive days with at least one answer, counting back from today
 * (or from yesterday, so a streak is not lost before playing today).
 */
export function streakDays(log: readonly AnswerRecord[], now: number): number {
  const days = new Set(log.map((r) => dayIndex(r.timestamp)))
  const today = dayIndex(now)
  let day = days.has(today) ? today : today - 1
  let streak = 0
  while (days.has(day)) {
    streak++
    day--
  }
  return streak
}

/** Points earned per day for the last `days` days, oldest first. */
export function xpByDay(
  log: readonly AnswerRecord[],
  now: number,
  days: number,
): { day: number; xp: number }[] {
  const today = dayIndex(now)
  const totals = new Map<number, number>()
  for (const r of log) {
    const d = dayIndex(r.timestamp)
    if (d > today || d <= today - days) continue
    totals.set(d, (totals.get(d) ?? 0) + r.points)
  }
  return Array.from({ length: days }, (_, i) => {
    const day = today - days + 1 + i
    return { day, xp: totals.get(day) ?? 0 }
  })
}

export function totalXp(log: readonly AnswerRecord[]): number {
  return log.reduce((sum, r) => sum + r.points, 0)
}

/** XP needed to reach a level: 0, 50, 200, 450, 800 … (quadratic). */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) * (level - 1)
}

export function levelForXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1
}

export interface LevelProgress {
  level: number
  xp: number
  /** XP into the current level and the size of the level. */
  current: number
  needed: number
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp)
  const floor = xpForLevel(level)
  const next = xpForLevel(level + 1)
  return { level, xp, current: xp - floor, needed: next - floor }
}
