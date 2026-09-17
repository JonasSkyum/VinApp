import { z } from 'zod'
import { climateSchema, difficultySchema, idSchema, storySchema, verifiableSchema } from './common'

export const regionTypeSchema = z.enum(['country', 'region', 'subregion', 'appellation'])
export type RegionType = z.infer<typeof regionTypeSchema>

/** [longitude, latitude] in WGS84, matching GeoJSON order. */
export const lngLatSchema = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
export type LngLat = z.infer<typeof lngLatSchema>

export const regionSchema = verifiableSchema.extend({
  id: idSchema,
  /** Display name in original language, e.g. "Châteauneuf-du-Pape". */
  name: z.string().min(1),
  type: regionTypeSchema,
  /** Parent in the hierarchy country > region > subregion > appellation. Null for countries. */
  parentId: idSchema.nullable(),
  /** Null only for countries, which span several climates. */
  climate: climateSchema.nullable(),
  center: lngLatSchema,
  /** Feature id in src/content/geo/*.json, when a polygon exists. */
  geoId: z.string().optional(),
  difficulty: difficultySchema,
  /** History, terroir and what the region is known for. */
  story: storySchema,
})
export type Region = z.infer<typeof regionSchema>
