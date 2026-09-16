import type { WineMapProps } from '@/components/map/mapTypes'

/**
 * jsdom has no WebGL, so tests replace the map with a list of buttons:
 * clicking `point-<id>` reports that region's centre through onClick.
 */
export function MockWineMap({ points, highlightId, markers = [], onClick, label }: WineMapProps) {
  return (
    <div role="region" aria-label={label} data-highlight={highlightId ?? ''}>
      {points.map((p) => (
        <button
          key={p.id}
          type="button"
          data-testid={`point-${p.id}`}
          onClick={() => onClick?.(p.lngLat, null)}
        >
          {p.id}
        </button>
      ))}
      <button type="button" data-testid="point-nowhere" onClick={() => onClick?.([0, 0], null)}>
        nowhere
      </button>
      <ul data-testid="markers">
        {markers.map((m) => (
          <li key={m.id} data-kind={m.kind}>
            {m.id}
          </li>
        ))}
      </ul>
    </div>
  )
}
