import { z } from 'zod'
import { grapeColorSchema, idSchema, verifiableSchema } from './common'
import { structureSchema } from './profile'

export const grapeSchema = verifiableSchema.extend({
  id: idSchema,
  /** Display name in original language, e.g. "Grüner Veltliner". */
  name: z.string().min(1),
  /** Synonyms, e.g. ["Shiraz"] for Syrah. */
  aliases: z.array(z.string()),
  color: grapeColorSchema,
  /** Region id of type `country` where the grape originates. */
  origin: idSchema,
  /** Typical structural ranges across classic expressions of the grape. */
  typicalProfile: structureSchema,
  /** Descriptor ids most often associated with the grape. */
  keyDescriptors: z.array(idSchema),
  /**
   * Short, user-facing background on the grape (origin, history, where it shines), in Danish.
   * One entry per paragraph. Facts only; anything uncertain belongs in `notes` instead.
   */
  story: z.array(z.string().min(1)).optional(),
  notes: z.string().optional(),
})
export type Grape = z.infer<typeof grapeSchema>
