import { lazy, Suspense } from 'react'
import type { WineMapProps } from './mapTypes'

// MapLibre is ~250 kB gzipped, so the map only loads on pages that show one.
const WineMap = lazy(() => import('./WineMap'))

export function LazyWineMap(props: WineMapProps) {
  return (
    <Suspense
      fallback={
        <div
          role="region"
          aria-label={props.label}
          aria-busy="true"
          className={`bg-wine-100 animate-pulse rounded-xl ${props.className ?? ''}`}
        />
      }
    >
      <WineMap {...props} />
    </Suspense>
  )
}
