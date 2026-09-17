import { content } from '@/content'
import { createCatalog } from './catalog'
import { generateCase } from './generateCase'
import { createRng } from './rng'
import { scoreRound } from './score'

const catalog = createCatalog(content)
const pauillac = generateCase(catalog.style('pauillac'), 'expert', createRng('p'))

describe('scoreRound', () => {
  it('gives full marks for all-correct answers', () => {
    const score = scoreRound(
      pauillac,
      {
        2: 'moderate',
        3: 'cabernet-sauvignon',
        4: 'france',
        5: 'bordeaux',
        6: 'pauillac',
      },
      'expert',
      catalog,
    )
    expect(score.total).toBe(14)
    expect(score.max).toBe(14)
    expect(score.tiers.every((t) => t.outcome === 'correct')).toBe(true)
  })

  it('only scores the tiers available at the level', () => {
    const score = scoreRound(pauillac, { 2: 'moderate' }, 'beginner', catalog)
    expect(score.tiers.map((t) => t.tier)).toEqual([2, 3, 4])
    expect(score.max).toBe(6)
    expect(score.total).toBe(1)
    expect(score.tiers[1]).toMatchObject({ tier: 3, answer: null, outcome: 'skipped', points: 0 })
  })

  it('marks wrong answers with zero points', () => {
    const score = scoreRound(
      pauillac,
      { 2: 'cool', 3: 'pinot-noir', 4: 'italy' },
      'beginner',
      catalog,
    )
    expect(score.tiers.find((t) => t.tier === 2)).toMatchObject({ outcome: 'wrong', points: 0 })
    expect(score.tiers.find((t) => t.tier === 3)).toMatchObject({ outcome: 'wrong', points: 0 })
    expect(score.tiers.find((t) => t.tier === 4)).toMatchObject({ outcome: 'wrong', points: 0 })
  })

  it('gives partial credit for a secondary grape of the style', () => {
    const score = scoreRound(pauillac, { 3: 'merlot' }, 'beginner', catalog)
    expect(score.tiers.find((t) => t.tier === 3)).toMatchObject({ outcome: 'partial', points: 1 })
  })

  it('gives partial credit for a region in the right country', () => {
    const right = scoreRound(pauillac, { 5: 'loire' }, 'advanced', catalog)
    expect(right.tiers.find((t) => t.tier === 5)).toMatchObject({ outcome: 'partial', points: 1 })
    const wrong = scoreRound(pauillac, { 5: 'rioja' }, 'advanced', catalog)
    expect(wrong.tiers.find((t) => t.tier === 5)).toMatchObject({ outcome: 'wrong', points: 0 })
    const junk = scoreRound(pauillac, { 5: 'not-a-region' }, 'advanced', catalog)
    expect(junk.tiers.find((t) => t.tier === 5)).toMatchObject({ outcome: 'wrong', points: 0 })
  })

  it('gives more partial credit for a style in the right region than the right country', () => {
    const sameRegion = scoreRound(pauillac, { 6: 'saint-emilion' }, 'expert', catalog)
    expect(sameRegion.tiers.find((t) => t.tier === 6)).toMatchObject({
      outcome: 'partial',
      points: 2,
    })
    const sameCountry = scoreRound(pauillac, { 6: 'cote-rotie' }, 'expert', catalog)
    expect(sameCountry.tiers.find((t) => t.tier === 6)).toMatchObject({
      outcome: 'partial',
      points: 1,
    })
    const other = scoreRound(pauillac, { 6: 'napa-cabernet-sauvignon' }, 'expert', catalog)
    expect(other.tiers.find((t) => t.tier === 6)).toMatchObject({ outcome: 'wrong', points: 0 })
    const junk = scoreRound(pauillac, { 6: 'not-a-style' }, 'expert', catalog)
    expect(junk.tiers.find((t) => t.tier === 6)).toMatchObject({ outcome: 'wrong', points: 0 })
  })
})
