import type { ReactNode } from 'react'
import { MapQuizProvider } from '@/features/map-quiz/MapQuizProvider'
import { ProgressProvider } from '@/features/progress/ProgressProvider'
import { PrefsProvider } from '@/features/settings/PrefsProvider'
import { TastingSessionProvider } from '@/features/tasting/TastingSessionProvider'
import type { StorageLike } from '@/lib/storage'

interface AppProvidersProps {
  children: ReactNode
  seedFactory?: () => string
  now?: () => number
  storage?: StorageLike
}

/** Preferences, progress (both persistent) and game sessions live here so routes never reset them. */
export function AppProviders({ children, seedFactory, now, storage }: AppProvidersProps) {
  return (
    <PrefsProvider storage={storage}>
      <ProgressProvider storage={storage}>
        <TastingSessionProvider seedFactory={seedFactory} now={now}>
          <MapQuizProvider seedFactory={seedFactory} now={now}>
            {children}
          </MapQuizProvider>
        </TastingSessionProvider>
      </ProgressProvider>
    </PrefsProvider>
  )
}
