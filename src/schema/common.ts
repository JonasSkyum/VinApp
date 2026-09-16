import { z } from 'zod'

/** WSET SAT-like level: 1=low, 2=medium-, 3=medium, 4=medium+, 5=high (pronounced). */
export const levelSchema = z.number().int().min(1).max(5)
export type Level = z.infer<typeof levelSchema>

/** Inclusive [min, max] interval of levels. */
export const rangeSchema = z
  .tuple([levelSchema, levelSchema])
  .refine(([min, max]) => min <= max, { message: 'Range min must be <= max' })
export type Range = z.infer<typeof rangeSchema>

/** Kebab-case ASCII identifier, e.g. `chateauneuf-du-pape`. */
export const idSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Id must be kebab-case ASCII')
export type Id = z.infer<typeof idSchema>

/** Difficulty tier used to gate content by player level. */
export const difficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
export type Difficulty = z.infer<typeof difficultySchema>

/** Fields every piece of wine content carries so facts can be reviewed. */
export const verifiableSchema = z.object({
  verified: z.boolean(),
  sources: z.array(z.string()),
  /** Free-text note for the reviewer, e.g. why a value is uncertain. */
  note: z.string().optional(),
})

export const grapeColorSchema = z.enum(['red', 'white'])
export type GrapeColor = z.infer<typeof grapeColorSchema>

export const worldSchema = z.enum(['old', 'new'])
export type World = z.infer<typeof worldSchema>

export const climateSchema = z.enum(['cool', 'moderate', 'warm'])
export type Climate = z.infer<typeof climateSchema>
