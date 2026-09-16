import { z } from 'zod'
import { idSchema } from './common'

export const descriptorClusterSchema = z.enum([
  'citrus',
  'green-fruit',
  'stone-fruit',
  'tropical',
  'red-fruit',
  'black-fruit',
  'floral',
  'herbal',
  'spice',
  'oak',
  'earth',
  'mineral',
  'other',
])
export type DescriptorCluster = z.infer<typeof descriptorClusterSchema>

/** WSET stage: primary (grape/fermentation), secondary (oak/lees/MLF), tertiary (age). */
export const descriptorStageSchema = z.enum(['primary', 'secondary', 'tertiary'])
export type DescriptorStage = z.infer<typeof descriptorStageSchema>

/** Controlled vocabulary entry for aromas/flavours. `name` is the Danish UI label. */
export const descriptorSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  cluster: descriptorClusterSchema,
  stage: descriptorStageSchema,
})
export type Descriptor = z.infer<typeof descriptorSchema>
