import type { RoundScore, Tier } from '@/engine'

export interface TierStat {
  tier: Tier
  points: number
  max: number
}

/** Points per tier across all rounds, sorted by tier. */
export function tierStats(scores: RoundScore[]): TierStat[] {
  const byTier = new Map<Tier, TierStat>()
  for (const score of scores) {
    for (const t of score.tiers) {
      const stat = byTier.get(t.tier) ?? { tier: t.tier, points: 0, max: 0 }
      stat.points += t.points
      stat.max += t.maxPoints
      byTier.set(t.tier, stat)
    }
  }
  return [...byTier.values()].sort((a, b) => a.tier - b.tier)
}

export const ratio = (s: TierStat) => (s.max === 0 ? 0 : s.points / s.max)
