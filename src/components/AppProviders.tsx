import type { ReactNode } from 'react'
import { MapQuizProvider } from '@/features/map-quiz/MapQuizProvider'
import { TastingSessionProvider } from '@/features/tasting/TastingSessionProvider'

interface AppProvidersProps {
  children: ReactNode
  seedFactory?: () => string
  now?: () => number
}

/** Game sessions live here so navigating between routes never resets them. */
export function AppProviders({ children, seedFactory, now }: AppProvidersProps) {
  return (
    <TastingSessionProvider seedFactory={seedFactory}>
      <MapQuizProvider seedFactory={seedFactory} now={now}>
        {children}
      </MapQuizProvider>
    </TastingSessionProvider>
  )
}
