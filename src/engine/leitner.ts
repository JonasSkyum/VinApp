/** What a Leitner card is about. */
export type UnitKind = 'grape' | 'region' | 'style' | 'map-location'

export type Box = 1 | 2 | 3 | 4 | 5

export interface LeitnerCard {
  box: Box
  /** Epoch ms of the last review. */
  reviewedAt: number
  /** Epoch ms when the card should be reviewed again. */
  dueAt: number
}

/** Keyed by `${kind}:${id}`. */
export type LeitnerState = Record<string, LeitnerCard>

const DAY_MS = 24 * 60 * 60 * 1000

/** Days until the next review, indexed by box. */
export const BOX_INTERVAL_DAYS: Record<Box, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 }

export function unitKey(kind: UnitKind, id: string): string {
  return `${kind}:${id}`
}

export function parseUnitKey(key: string): { kind: UnitKind; id: string } {
  const i = key.indexOf(':')
  return { kind: key.slice(0, i) as UnitKind, id: key.slice(i + 1) }
}

/** A correct answer moves the card up one box (max 5); a wrong one sends it back to box 1. */
export function reviewCard(
  card: LeitnerCard | undefined,
  correct: boolean,
  now: number,
): LeitnerCard {
  const box: Box = correct ? (Math.min(5, (card?.box ?? 0) + 1) as Box) : 1
  return { box, reviewedAt: now, dueAt: now + BOX_INTERVAL_DAYS[box] * DAY_MS }
}

/** Returns a new state with the unit's card reviewed. */
export function applyReview(
  state: LeitnerState,
  kind: UnitKind,
  id: string,
  correct: boolean,
  now: number,
): LeitnerState {
  const key = unitKey(kind, id)
  return { ...state, [key]: reviewCard(state[key], correct, now) }
}

/** Box of a unit; 0 when it has never been reviewed. */
export function boxOf(state: LeitnerState, kind: UnitKind, id: string): Box | 0 {
  return state[unitKey(kind, id)]?.box ?? 0
}

/** Units whose review is due, most overdue first. */
export function dueUnits(state: LeitnerState, now: number): { kind: UnitKind; id: string }[] {
  return Object.entries(state)
    .filter(([, card]) => card.dueAt <= now)
    .sort((a, b) => a[1].dueAt - b[1].dueAt)
    .map(([key]) => parseUnitKey(key))
}
