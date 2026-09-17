import type { FeatureCollection } from 'geojson'
import {
  GeoJSONSource,
  Map as MapLibreMap,
  setWorkerUrl,
  type MapMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import countriesUrl from '@/content/geo/countries.json?url'
import type { Bounds } from '@/engine'
import { da } from '@/i18n/da'
import { Icon } from '../ui/Icon'
import type { MapMarker, MapPoint, WineMapProps } from './mapTypes'

// MapLibre resolves its worker with a dynamic URL that bundlers cannot follow, so
// without this the built site requests a file that does not exist and nothing but
// the background renders. Vite copies the worker as an asset and gives us its URL.
setWorkerUrl(workerUrl)

/** Atlas colours from the design tokens, resolved from CSS so the map follows the theme. */
interface MapColors {
  sea: string
  land: string
  border: string
  region: string
  surface: string
  primary: string
  primaryInk: string
  ok: string
  wrong: string
  wrongSoft: string
}

function readColors(): MapColors {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  return {
    sea: v('--map-sea', '#DCE5E2'),
    land: v('--map-land', '#F4ECDD'),
    border: v('--map-border', '#C9B99F'),
    region: v('--map-region', '#BCA88A'),
    surface: v('--surface', '#FFFCF7'),
    primary: v('--primary', '#7A1F3D'),
    primaryInk: v('--primary-ink', '#7A1F3D'),
    ok: v('--ok', '#2E7447'),
    wrong: v('--wrong', '#9E3A3A'),
    wrongSoft: v('--wrong-soft', '#F4E0DE'),
  }
}

/**
 * Label-free map: a plain background plus our own country polygons and region dots,
 * so nothing on the map gives an answer away. No external tile server.
 */
export default function WineMap({
  points,
  highlightId = null,
  markers = [],
  bounds = null,
  interactive = true,
  controls = false,
  onClick,
  className,
  label,
}: WineMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const onClickRef = useRef(onClick)
  const [loaded, setLoaded] = useState(false)
  // Effects key on serialised props so callers need not memoise arrays.
  const pointsKey = JSON.stringify(points)
  const markersKey = JSON.stringify(markers)
  const boundsKey = JSON.stringify(bounds)

  useEffect(() => {
    onClickRef.current = onClick
  }, [onClick])

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return
    const colors = readColors()
    const map = new MapLibreMap({
      container: containerRef.current,
      style: baseStyle(colors),
      center: [10, 45],
      zoom: 3,
      interactive,
      attributionControl: { compact: true, customAttribution: 'Natural Earth' },
    })
    mapRef.current = map
    map.on('load', () => {
      addLayers(map, colors)
      setLoaded(true)
    })
    map.on('click', (e: MapMouseEvent) => {
      const handler = onClickRef.current
      if (!handler) return
      const hit = map.queryRenderedFeatures(e.point, { layers: ['countries-fill'] })[0]
      const geoId = typeof hit?.properties?.id === 'string' ? hit.properties.id : null
      handler([e.lngLat.lng, e.lngLat.lat], geoId)
    })
    return () => {
      map.remove()
      mapRef.current = null
      setLoaded(false)
    }
  }, [interactive])

  // Follow theme changes (data-theme attribute or system preference).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return
    const repaint = () => applyColors(map, readColors())
    const observer = new MutationObserver(repaint)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
    mql?.addEventListener('change', repaint)
    return () => {
      observer.disconnect()
      mql?.removeEventListener('change', repaint)
    }
  }, [loaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return
    setSourceData(map, 'regions', pointsToGeoJson(JSON.parse(pointsKey) as MapPoint[]))
  }, [pointsKey, loaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return
    setSourceData(map, 'markers', markersToGeoJson(JSON.parse(markersKey) as MapMarker[]))
  }, [markersKey, loaded])

  // Blink the highlighted point.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return
    map.setFilter('highlight', ['==', ['get', 'id'], highlightId ?? ''])
    if (!highlightId) return
    let on = true
    const timer = window.setInterval(() => {
      on = !on
      if (map.getLayer('highlight'))
        map.setPaintProperty('highlight', 'circle-opacity', on ? 0.9 : 0.15)
    }, 450)
    return () => window.clearInterval(timer)
  }, [highlightId, loaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return
    const b = JSON.parse(boundsKey) as Bounds | null
    if (!b) return
    map.fitBounds([b.sw, b.ne], { padding: 24, duration: 500 })
  }, [boundsKey, loaded])

  const recenter = () => {
    const map = mapRef.current
    const b = JSON.parse(boundsKey) as Bounds | null
    if (map && b) map.fitBounds([b.sw, b.ne], { padding: 24, duration: 500 })
  }

  return (
    <div
      role="region"
      aria-label={label}
      className={`relative overflow-hidden rounded-xl ${className ?? ''}`}
    >
      <div ref={containerRef} className="h-full w-full" />
      {controls && (
        <div className="bg-surface shadow-float absolute top-1/2 right-3 z-[1] flex -translate-y-1/2 flex-col overflow-hidden rounded-2xl">
          <MapButton label={da.mapQuiz.zoomIn} onClick={() => mapRef.current?.zoomIn()}>
            <Icon name="plus" size={18} strokeWidth={2.4} />
          </MapButton>
          <MapButton label={da.mapQuiz.zoomOut} onClick={() => mapRef.current?.zoomOut()}>
            <Icon name="minus" size={18} strokeWidth={2.4} />
          </MapButton>
          <MapButton label={da.mapQuiz.recenter} onClick={recenter} last>
            <Icon name="center" size={18} strokeWidth={2.2} />
          </MapButton>
        </div>
      )}
    </div>
  )
}

function MapButton({
  label,
  onClick,
  last = false,
  children,
}: {
  label: string
  onClick: () => void
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`text-ink flex h-11 w-11 items-center justify-center ${last ? '' : 'border-line border-b'}`}
    >
      {children}
    </button>
  )
}

function baseStyle(c: MapColors): StyleSpecification {
  return {
    version: 8,
    sources: {
      countries: { type: 'geojson', data: countriesUrl },
      regions: { type: 'geojson', data: pointsToGeoJson([]) },
      markers: { type: 'geojson', data: markersToGeoJson([]) },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': c.sea } },
      {
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: { 'fill-color': c.land, 'fill-opacity': 1 },
      },
      {
        id: 'countries-line',
        type: 'line',
        source: 'countries',
        paint: { 'line-color': c.border, 'line-width': 1 },
      },
    ],
  }
}

function addLayers(map: MapLibreMap, c: MapColors) {
  map.addLayer({
    id: 'regions',
    type: 'circle',
    source: 'regions',
    paint: {
      'circle-radius': 6,
      'circle-color': c.region,
      'circle-opacity': 1,
      'circle-stroke-color': c.land,
      'circle-stroke-width': 2,
    },
  })
  map.addLayer({
    id: 'highlight',
    type: 'circle',
    source: 'regions',
    filter: ['==', ['get', 'id'], ''],
    paint: {
      'circle-radius': 14,
      'circle-color': c.primary,
      'circle-opacity': 0.9,
      'circle-stroke-color': c.surface,
      'circle-stroke-width': 2,
    },
  })
  // The target gets a soft green halo behind the solid dot.
  map.addLayer({
    id: 'markers-halo',
    type: 'circle',
    source: 'markers',
    filter: ['==', ['get', 'kind'], 'target'],
    paint: {
      'circle-radius': 24,
      'circle-color': c.ok,
      'circle-opacity': 0.18,
    },
  })
  map.addLayer({
    id: 'markers',
    type: 'circle',
    source: 'markers',
    paint: {
      'circle-radius': ['match', ['get', 'kind'], 'target', 10, 12],
      'circle-color': [
        'match',
        ['get', 'kind'],
        'clicked-correct',
        c.ok,
        'clicked-wrong',
        c.wrongSoft,
        c.ok,
      ],
      'circle-stroke-color': ['match', ['get', 'kind'], 'clicked-wrong', c.wrong, c.surface],
      'circle-stroke-width': 2.5,
    },
  })
}

function applyColors(map: MapLibreMap, c: MapColors) {
  const set = (layer: string, prop: string, value: unknown) => {
    if (map.getLayer(layer)) map.setPaintProperty(layer, prop as never, value as never)
  }
  set('background', 'background-color', c.sea)
  set('countries-fill', 'fill-color', c.land)
  set('countries-line', 'line-color', c.border)
  set('regions', 'circle-color', c.region)
  set('regions', 'circle-stroke-color', c.land)
  set('highlight', 'circle-color', c.primary)
  set('highlight', 'circle-stroke-color', c.surface)
  set('markers-halo', 'circle-color', c.ok)
  set('markers', 'circle-color', [
    'match',
    ['get', 'kind'],
    'clicked-correct',
    c.ok,
    'clicked-wrong',
    c.wrongSoft,
    c.ok,
  ])
  set('markers', 'circle-stroke-color', [
    'match',
    ['get', 'kind'],
    'clicked-wrong',
    c.wrong,
    c.surface,
  ])
}

function setSourceData(map: MapLibreMap, id: string, data: FeatureCollection) {
  const source = map.getSource(id)
  if (source instanceof GeoJSONSource) source.setData(data)
}

function pointsToGeoJson(points: MapPoint[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      properties: { id: p.id },
      geometry: { type: 'Point', coordinates: p.lngLat },
    })),
  }
}

function markersToGeoJson(markers: MapMarker[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: markers.map((m) => ({
      type: 'Feature',
      properties: { id: m.id, kind: m.kind },
      geometry: { type: 'Point', coordinates: m.lngLat },
    })),
  }
}
