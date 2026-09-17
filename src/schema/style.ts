import { z } from 'zod'
import { difficultySchema, idSchema, storySchema, verifiableSchema } from './common'
import { profileSchema } from './profile'

export const styleColorSchema = z.enum(['red', 'white', 'rosé', 'sparkling', 'sweet', 'fortified'])
export type StyleColor = z.infer<typeof styleColorSchema>

export const oakSchema = z.enum(['none', 'light', 'pronounced'])
export type Oak = z.infer<typeof oakSchema>

/** A classic grape × region combination, e.g. "Sancerre" or "Barossa Shiraz". */
export const styleSchema = verifiableSchema.extend({
  id: idSchema,
  name: z.string().min(1),
  color: styleColorSchema,
  /** Principal grapes, most important first. */
  grapeIds: z.array(idSchema).min(1),
  regionId: idSchema,
  profile: profileSchema,
  /** 3–8 descriptors the game samples aromas from. */
  descriptorIds: z.array(idSchema).min(3).max(8),
  oak: oakSchema,
  difficulty: difficultySchema,
  /** How the style came about and what makes it recognisable. */
  story: storySchema,
})
export type Style = z.infer<typeof styleSchema>
