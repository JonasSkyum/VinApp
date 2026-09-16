import { z } from 'zod'
import { rangeSchema } from './common'

export const whiteAppearanceSchema = z.enum(['lemon-green', 'lemon', 'gold', 'amber'])
export const roseAppearanceSchema = z.enum(['pink', 'salmon', 'orange'])
export const redAppearanceSchema = z.enum(['purple', 'ruby', 'garnet', 'tawny'])

export const appearanceSchema = z.union([
  whiteAppearanceSchema,
  roseAppearanceSchema,
  redAppearanceSchema,
])
export type Appearance = z.infer<typeof appearanceSchema>

/** Structural attributes as level intervals. Tannin is null for wines without it (whites). */
export const structureSchema = z.object({
  intensity: rangeSchema,
  sweetness: rangeSchema,
  acidity: rangeSchema,
  tannin: rangeSchema.nullable(),
  alcohol: rangeSchema,
  body: rangeSchema,
  finish: rangeSchema,
})
export type Structure = z.infer<typeof structureSchema>

/** Full tasting profile of a style: appearance + structure. */
export const profileSchema = structureSchema.extend({
  appearance: appearanceSchema,
})
export type Profile = z.infer<typeof profileSchema>

/** Attribute keys that are compared numerically by the engine. */
export const structureKeys = [
  'intensity',
  'sweetness',
  'acidity',
  'tannin',
  'alcohol',
  'body',
  'finish',
] as const satisfies readonly (keyof Structure)[]
export type StructureKey = (typeof structureKeys)[number]
