import type { LngLat, Region, RegionType } from '@/schema'

const EARTH_RADIUS_KM = 6371

/** Great-circle distance between two [lng, lat] points in kilometres. */
export function haversineKm(a: LngLat, b: LngLat): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1])
  const lat2 = toRad(b[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Radius (km) around a region's centre that still counts as a perfect hit. */
export const FULL_POINTS_RADIUS_KM: Record<RegionType, number> = {
  country: 300,
  region: 80,
  subregion: 50,
  appellation: 35,
}

/** Points fall linearly to zero this many radii away from the centre. */
export const ZERO_POINTS_AT_RADII = 4

export const MAP_QUESTION_POINTS = 10

/**
 * Points for a click on the map. Inside the region's polygon is always a full score;
 * otherwise the score decays linearly with distance from the centre.
 */
export function findScore(
  region: Region,
  clicked: LngLat,
  insidePolygon: boolean,
  maxPoints: number = MAP_QUESTION_POINTS,
): { points: number; distanceKm: number } {
  const distanceKm = haversineKm(region.center, clicked)
  if (insidePolygon) return { points: maxPoints, distanceKm }
  const full = FULL_POINTS_RADIUS_KM[region.type]
  if (distanceKm <= full) return { points: maxPoints, distanceKm }
  const zeroAt = full * ZERO_POINTS_AT_RADII
  const fraction = Math.max(0, 1 - (distanceKm - full) / (zeroAt - full))
  return { points: Math.round(maxPoints * fraction), distanceKm }
}

export interface Bounds {
  sw: LngLat
  ne: LngLat
}

/** Bounding box around a set of points, padded so markers do not sit on the edge. */
export function boundsOf(points: LngLat[], paddingDeg = 1): Bounds | null {
  if (points.length === 0) return null
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity
  for (const [lng, lat] of points) {
    minLng = Math.min(minLng, lng)
    minLat = Math.min(minLat, lat)
    maxLng = Math.max(maxLng, lng)
    maxLat = Math.max(maxLat, lat)
  }
  return {
    sw: [Math.max(-180, minLng - paddingDeg), Math.max(-85, minLat - paddingDeg)],
    ne: [Math.min(180, maxLng + paddingDeg), Math.min(85, maxLat + paddingDeg)],
  }
}
