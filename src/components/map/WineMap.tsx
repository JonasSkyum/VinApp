import type { FeatureCollection } from 'geojson'
import {
  GeoJSONSource,
  Map as MapLibreMap,
  type MapMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import countriesUrl from '@/content/geo/countries.json?url'
import type { Bounds } from '@/engine'
import type { MapMarker, MapPoint, WineMapProps } from './mapTypes'

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
    const map = new MapLibreMap({
      container: containerRef.current,
      style: baseStyle(),
      center: [10, 45],
      zoom: 3,
      interactive,
      attributionControl: { compact: true, customAttribution: 'Natural Earth' },
    })
    mapRef.current = map
    map.on('load', () => {
      addLayers(map)
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

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={label}
      className={`overflow-hidden rounded-xl ${className ?? ''}`}
    />
  )
}

function baseStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      countries: { type: 'geojson', data: countriesUrl },
      regions: { type: 'geojson', data: pointsToGeoJson([]) },
      markers: { type: 'geojson', data: markersToGeoJson([]) },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#dbe7f0' } },
      {
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: { 'fill-color': '#f5eee0', 'fill-opacity': 1 },
      },
      {
        id: 'countries-line',
        type: 'line',
        source: 'countries',
        paint: { 'line-color': '#b9a98c', 'line-width': 0.8 },
      },
    ],
  }
}

function addLayers(map: MapLibreMap) {
  map.addLayer({
    id: 'regions',
    type: 'circle',
    source: 'regions',
    paint: {
      'circle-radius': 5,
      'circle-color': '#a51a42',
      'circle-opacity': 0.75,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
    },
  })
  map.addLayer({
    id: 'highlight',
    type: 'circle',
    source: 'regions',
    filter: ['==', ['get', 'id'], ''],
    paint: {
      'circle-radius': 14,
      'circle-color': '#df4568',
      'circle-opacity': 0.9,
      'circle-stroke-color': '#5e0f2a',
      'circle-stroke-width': 2,
    },
  })
  map.addLayer({
    id: 'markers',
    type: 'circle',
    source: 'markers',
    paint: {
      'circle-radius': ['match', ['get', 'kind'], 'target', 12, 8],
      'circle-color': [
        'match',
        ['get', 'kind'],
        'clicked-correct',
        '#16a34a',
        'clicked-wrong',
        '#dc2626',
        'rgba(22,163,74,0.15)',
      ],
      'circle-stroke-color': ['match', ['get', 'kind'], 'target', '#16a34a', '#ffffff'],
      'circle-stroke-width': 2,
    },
  })
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
