import type { DailyResult } from './daily'
import type { LeitnerCard, LeitnerState } from './leitner'
import type { AnswerRecord } from './progress'
import { hashString } from './rng'

/**
 * Merging local progress with what the server holds. localStorage stays the
 * primary copy; on login both sides are merged and the result is written back
 * to both. All functions are pure so the rules are testable without a network.
 */

/** The parts of progress that sync. Device settings stay on the device. */
export interface SyncedProgress {
  log: AnswerRecord[]
  leitner: LeitnerState
  daily: Record<string, DailyResult>
}

/**
 * Stable id for a record, derived from its content, so the same answer
 * pushed twice lands on the same server row instead of a duplicate.
 */
export function recordClientId(r: AnswerRecord): string {
  const hash = hashString(
    [r.kind, r.itemId, String(r.tier), r.correct, r.guessedId ?? '', r.points, r.timestamp].join(
      '|',
    ),
  )
  return `${r.timestamp}-${r.kind}-${r.itemId}-${r.tier}-${hash.toString(16)}`
}

function byTime(a: AnswerRecord, b: AnswerRecord): number {
  return a.timestamp - b.timestamp || recordClientId(a).localeCompare(recordClientId(b))
}

/** Union of two logs, deduplicated on client id, in time order. */
export function mergeLogs(
  local: readonly AnswerRecord[],
  remote: readonly AnswerRecord[],
): AnswerRecord[] {
  const byId = new Map<string, AnswerRecord>()
  for (const r of remote) byId.set(recordClientId(r), r)
  for (const r of local) byId.set(recordClientId(r), r)
  return [...byId.values()].sort(byTime)
}

/** The card that has come furthest wins; on equal boxes the most recent review. */
export function mergeCard(a: LeitnerCard | undefined, b: LeitnerCard | undefined): LeitnerCard {
  if (!a) return b!
  if (!b) return a
  if (a.box !== b.box) return a.box > b.box ? a : b
  return a.reviewedAt >= b.reviewedAt ? a : b
}

export function mergeLeitner(local: LeitnerState, remote: LeitnerState): LeitnerState {
  const merged: LeitnerState = {}
  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    merged[key] = mergeCard(local[key], remote[key])
  }
  return merged
}

/** A day can only be played once, so the earliest recorded play is the real one. */
export function mergeDaily(
  local: Record<string, DailyResult>,
  remote: Record<string, DailyResult>,
): Record<string, DailyResult> {
  const merged: Record<string, DailyResult> = { ...remote }
  for (const [key, result] of Object.entries(local)) {
    const other = merged[key]
    if (!other || result.playedAt < other.playedAt) merged[key] = result
  }
  return merged
}

export function mergeProgress(local: SyncedProgress, remote: SyncedProgress): SyncedProgress {
  return {
    log: mergeLogs(local.log, remote.log),
    leitner: mergeLeitner(local.leitner, remote.leitner),
    daily: mergeDaily(local.daily, remote.daily),
  }
}

/** What must be written to the server so it matches `merged`, given what it holds now. */
export interface PushSet {
  log: AnswerRecord[]
  leitner: { key: string; card: LeitnerCard }[]
  daily: DailyResult[]
}

function sameCard(a: LeitnerCard | undefined, b: LeitnerCard): boolean {
  return !!a && a.box === b.box && a.reviewedAt === b.reviewedAt && a.dueAt === b.dueAt
}

function sameDaily(a: DailyResult | undefined, b: DailyResult): boolean {
  return (
    !!a &&
    a.styleId === b.styleId &&
    a.total === b.total &&
    a.max === b.max &&
    a.playedAt === b.playedAt &&
    JSON.stringify(a.tiers) === JSON.stringify(b.tiers)
  )
}

export function pendingPush(merged: SyncedProgress, remote: SyncedProgress): PushSet {
  const remoteIds = new Set(remote.log.map(recordClientId))
  return {
    log: merged.log.filter((r) => !remoteIds.has(recordClientId(r))),
    leitner: Object.entries(merged.leitner)
      .filter(([key, card]) => !sameCard(remote.leitner[key], card))
      .map(([key, card]) => ({ key, card })),
    daily: Object.values(merged.daily).filter((d) => !sameDaily(remote.daily[d.dateKey], d)),
  }
}

export function isPushEmpty(push: PushSet): boolean {
  return push.log.length === 0 && push.leitner.length === 0 && push.daily.length === 0
}
