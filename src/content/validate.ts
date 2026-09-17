import { z } from 'zod'
import { areTwins, profileGap } from '@/engine/distance'
import {
  descriptorSchema,
  grapeSchema,
  redAppearanceSchema,
  regionSchema,
  roseAppearanceSchema,
  styleSchema,
  whiteAppearanceSchema,
  type Descriptor,
  type Grape,
  type Region,
  type RegionType,
  type Style,
} from '@/schema'

export interface ContentBundle {
  descriptors: Descriptor[]
  grapes: Grape[]
  regions: Region[]
  styles: Style[]
}

export interface Issue {
  /** Which item the issue belongs to, e.g. `style:barolo`. */
  where: string
  message: string
}

export interface VerifiedCount {
  total: number
  verified: number
}

export interface ValidationResult {
  errors: Issue[]
  warnings: Issue[]
  stats: {
    descriptors: number
    grapes: VerifiedCount
    regions: VerifiedCount
    styles: VerifiedCount
  }
}

const hierarchyRank: Record<RegionType, number> = {
  country: 0,
  region: 1,
  subregion: 2,
  appellation: 3,
}

/**
 * Validates all content: schema shape, unique ids, cross references and wine-specific rules.
 * Pure function so it can run both from the CLI script and from tests.
 */
export function validateContent(content: ContentBundle): ValidationResult {
  const errors: Issue[] = []
  const warnings: Issue[] = []

  checkSchema('descriptor', descriptorSchema, content.descriptors, errors)
  checkSchema('grape', grapeSchema, content.grapes, errors)
  checkSchema('region', regionSchema, content.regions, errors)
  checkSchema('style', styleSchema, content.styles, errors)

  const descriptorIds = checkUniqueIds('descriptor', content.descriptors, errors)
  const grapeIds = checkUniqueIds('grape', content.grapes, errors)
  const regionIds = checkUniqueIds('region', content.regions, errors)
  checkUniqueIds('style', content.styles, errors)

  const grapeById = new Map(content.grapes.map((g) => [g.id, g]))
  const regionById = new Map(content.regions.map((r) => [r.id, r]))

  // ---- Grapes
  for (const grape of content.grapes) {
    const where = `grape:${grape.id}`
    const origin = regionById.get(grape.origin)
    if (!origin) errors.push({ where, message: `origin "${grape.origin}" is not a known region` })
    else if (origin.type !== 'country')
      errors.push({ where, message: `origin "${grape.origin}" must be a country` })
    for (const d of grape.keyDescriptors) {
      if (!descriptorIds.has(d)) errors.push({ where, message: `unknown descriptor "${d}"` })
    }
    if (grape.color === 'white' && grape.typicalProfile.tannin !== null)
      errors.push({ where, message: 'white grapes must have tannin: null' })
    if (grape.color === 'red' && grape.typicalProfile.tannin === null)
      errors.push({ where, message: 'red grapes must have a tannin range' })
  }

  // ---- Regions
  for (const region of content.regions) {
    const where = `region:${region.id}`
    if (region.type === 'country') {
      if (region.parentId !== null)
        errors.push({ where, message: 'countries must have parentId: null' })
      if (region.climate !== null)
        errors.push({ where, message: 'countries must have climate: null' })
    } else {
      if (region.climate === null)
        errors.push({ where, message: 'non-country regions need a climate' })
      if (region.parentId === null) {
        errors.push({ where, message: 'non-country regions need a parentId' })
      } else {
        const parent = regionById.get(region.parentId)
        if (!parent) {
          errors.push({ where, message: `parentId "${region.parentId}" is not a known region` })
        } else {
          if (hierarchyRank[parent.type] >= hierarchyRank[region.type])
            errors.push({
              where,
              message: `parent "${parent.id}" (${parent.type}) must be above ${region.type}`,
            })
        }
      }
    }
    if (!resolvesToCountry(region, regionById))
      errors.push({ where, message: 'parent chain does not end in a country (cycle or gap)' })
  }

  // ---- Styles
  const usedGrapes = new Set<string>()
  for (const style of content.styles) {
    const where = `style:${style.id}`
    for (const g of style.grapeIds) {
      if (!grapeIds.has(g)) errors.push({ where, message: `unknown grape "${g}"` })
      usedGrapes.add(g)
    }
    if (new Set(style.grapeIds).size !== style.grapeIds.length)
      errors.push({ where, message: 'duplicate grapeIds' })
    if (!regionIds.has(style.regionId))
      errors.push({ where, message: `unknown region "${style.regionId}"` })
    else if (regionById.get(style.regionId)?.type === 'country')
      errors.push({ where, message: 'style region must be more specific than a country' })
    for (const d of style.descriptorIds) {
      if (!descriptorIds.has(d)) errors.push({ where, message: `unknown descriptor "${d}"` })
    }
    if (new Set(style.descriptorIds).size !== style.descriptorIds.length)
      errors.push({ where, message: 'duplicate descriptorIds' })

    checkTannin(style, errors)
    checkAppearance(style, errors)
    checkGrapeColors(style, grapeById, errors)
  }

  for (const grape of content.grapes) {
    if (!usedGrapes.has(grape.id))
      warnings.push({ where: `grape:${grape.id}`, message: 'not used by any style' })
  }

  checkNearIdentical(content.styles, warnings)

  return {
    errors,
    warnings,
    stats: {
      descriptors: content.descriptors.length,
      grapes: count(content.grapes),
      regions: count(content.regions),
      styles: count(content.styles),
    },
  }
}

function checkSchema<T extends { id?: string }>(
  kind: string,
  schema: z.ZodType<T>,
  items: T[],
  errors: Issue[],
) {
  items.forEach((item, index) => {
    const result = schema.safeParse(item)
    if (result.success) return
    const where = `${kind}:${item.id ?? `#${index}`}`
    for (const issue of result.error.issues) {
      errors.push({ where, message: `${issue.path.join('.') || '(root)'}: ${issue.message}` })
    }
  })
}

function checkUniqueIds(kind: string, items: { id: string }[], errors: Issue[]): Set<string> {
  const seen = new Set<string>()
  for (const item of items) {
    if (seen.has(item.id)) errors.push({ where: `${kind}:${item.id}`, message: 'duplicate id' })
    seen.add(item.id)
  }
  return seen
}

function resolvesToCountry(region: Region, byId: Map<string, Region>): boolean {
  const visited = new Set<string>()
  let current: Region | undefined = region
  while (current) {
    if (visited.has(current.id)) return false
    visited.add(current.id)
    if (current.type === 'country') return true
    if (current.parentId === null) return false
    current = byId.get(current.parentId)
  }
  return false
}

function checkTannin(style: Style, errors: Issue[]) {
  const where = `style:${style.id}`
  const tannin = style.profile.tannin
  if (style.color === 'red' && tannin === null)
    errors.push({ where, message: 'red styles must have a tannin range' })
  if (style.color === 'white' && tannin !== null)
    errors.push({ where, message: 'white styles must have tannin: null' })
}

function checkAppearance(style: Style, errors: Issue[]) {
  const where = `style:${style.id}`
  const a = style.profile.appearance
  const isWhite = whiteAppearanceSchema.safeParse(a).success
  const isRose = roseAppearanceSchema.safeParse(a).success
  const isRed = redAppearanceSchema.safeParse(a).success
  const ok =
    (style.color === 'red' && isRed) ||
    (style.color === 'white' && isWhite) ||
    (style.color === 'rosé' && isRose) ||
    (style.color === 'sparkling' && (isWhite || isRose)) ||
    (style.color === 'sweet' && (isWhite || isRed)) ||
    style.color === 'fortified'
  if (!ok)
    errors.push({ where, message: `appearance "${a}" does not match color "${style.color}"` })
}

function checkGrapeColors(style: Style, grapeById: Map<string, Grape>, errors: Issue[]) {
  const where = `style:${style.id}`
  for (const id of style.grapeIds) {
    const grape = grapeById.get(id)
    if (!grape) continue
    if (style.color === 'red' && grape.color !== 'red')
      errors.push({ where, message: `red style uses white grape "${id}"` })
    if (style.color === 'white' && grape.color !== 'white')
      errors.push({ where, message: `white style uses red grape "${id}"` })
  }
}

function checkNearIdentical(styles: Style[], warnings: Issue[]) {
  for (let i = 0; i < styles.length; i++) {
    for (let j = i + 1; j < styles.length; j++) {
      const a = styles[i]!
      const b = styles[j]!
      if (!areTwins(a, b)) continue
      const gap = profileGap(a, b)
      const shared = a.descriptorIds.filter((d) => b.descriptorIds.includes(d)).length
      warnings.push({
        where: `style:${a.id}`,
        message: `near-identical profile to "${b.id}" (gap ${gap}, ${shared} shared descriptors)`,
      })
    }
  }
}

function count(items: { verified: boolean }[]): VerifiedCount {
  return { total: items.length, verified: items.filter((i) => i.verified).length }
}
