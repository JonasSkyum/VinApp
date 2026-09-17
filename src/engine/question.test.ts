import { content } from '@/content'
import { createCatalog } from './catalog'
import { generateCase } from './generateCase'
import { answerUniverse, buildQuestion, OPTION_COUNT } from './question'
import { createRng } from './rng'
import { tiersFor } from './tiers'
import type { Difficulty, Tier } from './types'

const catalog = createCatalog(content)

describe('buildQuestion', () => {
  it('is deterministic for the same seed', () => {
    const tastingCase = generateCase(catalog.style('barolo'), 'beginner', createRng('q'))
    const a = buildQuestion(tastingCase, 3, 'beginner', catalog, createRng('opts'))
    const b = buildQuestion(tastingCase, 3, 'beginner', catalog, createRng('opts'))
    expect(a).toEqual(b)
  })

  it('always includes the correct answer and never duplicates options', () => {
    const levels: Difficulty[] = ['beginner', 'advanced', 'expert']
    for (const style of catalog.styles) {
      for (const difficulty of levels) {
        const tastingCase = generateCase(style, difficulty, createRng(style.id))
        for (const spec of tiersFor(difficulty)) {
          const q = buildQuestion(tastingCase, spec.tier, difficulty, catalog, createRng('o'))
          expect(q.options).toContain(q.correctId)
          expect(new Set(q.options).size).toBe(q.options.length)
          expect(q.points).toBe(spec.points)
          expect(q.tier).toBe(spec.tier)
        }
      }
    }
  })

  it('gives 4 options on beginner and 6 on advanced for tiers 3+', () => {
    const tastingCase = generateCase(catalog.style('rioja-reserva'), 'advanced', createRng('r'))
    for (const tier of [3, 4, 5] as Tier[]) {
      const beginner = buildQuestion(tastingCase, tier, 'beginner', catalog, createRng('a'))
      const advanced = buildQuestion(tastingCase, tier, 'advanced', catalog, createRng('a'))
      if (tier <= 4) expect(beginner.options).toHaveLength(OPTION_COUNT.beginner)
      expect(advanced.options).toHaveLength(OPTION_COUNT.advanced)
      expect(beginner.kind).toBe('choice')
    }
  })

  it('always offers the full climate choice', () => {
    const tastingCase = generateCase(catalog.style('chablis'), 'expert', createRng('c'))
    const climate = buildQuestion(tastingCase, 2, 'expert', catalog, createRng('w'))
    expect(climate.kind).toBe('choice')
    expect([...climate.options].sort()).toEqual(['cool', 'moderate', 'warm'])
    expect(climate.correctId).toBe('cool')
  })

  it('uses free text with the whole universe on expert', () => {
    const tastingCase = generateCase(catalog.style('chablis'), 'expert', createRng('c'))
    const grape = buildQuestion(tastingCase, 3, 'expert', catalog, createRng('g'))
    expect(grape.kind).toBe('text')
    expect(grape.options).toEqual(answerUniverse('grapeId', catalog.style('chablis'), catalog))
    // Only white grapes for a white wine.
    for (const id of grape.options) expect(catalog.grape(id).color).toBe('white')
    const style = buildQuestion(tastingCase, 6, 'expert', catalog, createRng('g'))
    expect(style.kind).toBe('text')
    expect(style.correctId).toBe('chablis')
    for (const id of style.options) expect(catalog.style(id).color).toBe('white')
  })

  it('picks distractors from the nearest neighbours of the same colour', () => {
    const tastingCase = generateCase(catalog.style('sancerre'), 'beginner', createRng('s'))
    const grape = buildQuestion(tastingCase, 3, 'beginner', catalog, createRng('d'))
    for (const id of grape.options) expect(catalog.grape(id).color).toBe('white')
    expect(grape.options).toContain('sauvignon-blanc')
    // Nebbiolo can never be a distractor for a white wine.
    expect(grape.options).not.toContain('nebbiolo')
  })

  it('fills from the universe when there are too few neighbours', () => {
    // A catalog with a single white style has no neighbours of the same colour.
    const small = createCatalog({
      ...content,
      styles: content.styles.filter((s) => s.id === 'sancerre' || s.color === 'red'),
    })
    const tastingCase = generateCase(small.style('sancerre'), 'beginner', createRng('s'))
    const country = buildQuestion(tastingCase, 4, 'beginner', small, createRng('f'))
    expect(country.options).toHaveLength(4)
    expect(country.options).toContain('france')
  })
})

describe('answerUniverse', () => {
  it('lists all grapes for non red/white styles', () => {
    const sauternes = catalog.style('sauternes')
    expect(answerUniverse('grapeId', sauternes, catalog)).toHaveLength(catalog.grapes.length)
    expect(answerUniverse('countryId', sauternes, catalog)).toContain('argentina')
    expect(answerUniverse('regionId', sauternes, catalog)).not.toContain('france')
    expect(answerUniverse('regionId', sauternes, catalog)).toContain('bordeaux')
  })
})
