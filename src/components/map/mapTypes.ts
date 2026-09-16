import type { Bounds } from '@/engine'
import type { LngLat } from '@/schema'

export interface MapPoint {
  id: string
  lngLat: LngLat
}

export type MarkerKind = 'clicked-correct' | 'clicked-wrong' | 'target'

export interface MapMarker {
  id: string
  lngLat: LngLat
  kind: MarkerKind
}

export interface WineMapProps {
  /** Unlabelled dots for regions. */
  points: MapPoint[]
  /** Point id to blink. */
  highlightId?: string | null
  markers?: MapMarker[]
  /** Fit the view to these bounds whenever they change. */
  bounds?: Bounds | null
  interactive?: boolean
  onClick?: (lngLat: LngLat, insideGeoId: string | null) => void
  className?: string
  /** Accessible name for the map region. */
  label: string
}
