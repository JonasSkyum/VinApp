import { content } from '@/content'
import { createCatalog } from './catalog'
import { generateCase } from './generateCase'
import { guessedStyle, nearestNeighbour } from './guessedStyle'
import { createRng } from './rng'
import { scoreRound } from './score'

const catalog = createCatalog(content)
const sancerre = generateCase(catalog.style('sancerre'), 'expert', createRng('gs'))

describe('guessedStyle', () => {
  it('returns the named style on expert', () => {
    const score = scoreRound(sancerre, { 6: 'chablis' }, 'expert', catalog)
    expect(guessedStyle(sancerre, score, catalog)?.id).toBe('chablis')
  })

  it('returns null when every identifying answer was right or skipped', () => {
    const allRight = scoreRound(
      sancerre,
      { 1: 'new', 3: 'sauvignon-blanc', 4: 'france', 5: 'loire', 6: 'sancerre' },
      'expert',
      catalog,
    )
    expect(guessedStyle(sancerre, allRight, catalog)).toBeNull()
    const skipped = scoreRound(sancerre, { 1: 'new' }, 'beginner', catalog)
    expect(guessedStyle(sancerre, skipped, catalog)).toBeNull()
  })

  it('derives a neighbouring style from a wrong grape on beginner', () => {
    const score = scoreRound(sancerre, { 3: 'riesling', 4: 'france' }, 'beginner', catalog)
    const guess = guessedStyle(sancerre, score, catalog)
    expect(guess).not.toBeNull()
    expect(guess!.grapeIds[0]).toBe('riesling')
    expect(guess!.color).toBe('white')
  })

  it('prefers the deepest wrong answer', () => {
    // Grape right, country wrong: explain against a Sauvignon-like style from the wrong country.
    const score = scoreRound(
      sancerre,
      { 3: 'sauvignon-blanc', 4: 'new-zealand', 5: 'marlborough' },
      'advanced',
      catalog,
    )
    expect(guessedStyle(sancerre, score, catalog)?.id).toBe('marlborough-sauvignon-blanc')
  })

  it('returns null for answers nothing in the catalog matches', () => {
    const score = scoreRound(sancerre, { 4: 'croatia' }, 'beginner', catalog)
    expect(guessedStyle(sancerre, score, catalog)).toBeNull()
    const junk = scoreRound(sancerre, { 6: 'not-a-style' }, 'expert', catalog)
    expect(guessedStyle(sancerre, junk, catalog)).toBeNull()
  })
})

describe('nearestNeighbour', () => {
  it('returns the closest other style of the same colour', () => {
    const neighbour = nearestNeighbour(sancerre, catalog)
    expect(neighbour).not.toBeNull()
    expect(neighbour!.id).not.toBe('sancerre')
    expect(neighbour!.color).toBe('white')
  })

  it('returns null when the style is alone in its colour', () => {
    const lonely = createCatalog({
      ...content,
      styles: content.styles.filter((s) => s.id === 'sancerre' || s.color === 'red'),
    })
    expect(nearestNeighbour(sancerre, lonely)).toBeNull()
  })
})
