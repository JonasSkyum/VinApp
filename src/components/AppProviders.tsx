import type { ReactNode } from 'react'
import { MapQuizProvider } from '@/features/map-quiz/MapQuizProvider'
import { ProgressProvider } from '@/features/progress/ProgressProvider'
import { PrefsProvider } from '@/features/settings/PrefsProvider'
import type { SyncBackend } from '@/features/sync/backend'
import { SyncProvider } from '@/features/sync/SyncProvider'
import { TastingSessionProvider } from '@/features/tasting/TastingSessionProvider'
import type { StorageLike } from '@/lib/storage'

interface AppProvidersProps {
  children: ReactNode
  seedFactory?: () => string
  now?: () => number
  storage?: StorageLike
  /** Sync backend; undefined = Supabase when configured, null = sync off. */
  syncBackend?: SyncBackend | null
  syncDebounceMs?: number
}

/** Preferences, progress (both persistent) and game sessions live here so routes never reset them. */
export function AppProviders({
  children,
  seedFactory,
  now,
  storage,
  syncBackend,
  syncDebounceMs,
}: AppProvidersProps) {
  return (
    <PrefsProvider storage={storage}>
      <ProgressProvider storage={storage}>
        <SyncProvider backend={syncBackend} debounceMs={syncDebounceMs}>
          <TastingSessionProvider seedFactory={seedFactory} now={now}>
            <MapQuizProvider seedFactory={seedFactory} now={now}>
              {children}
            </MapQuizProvider>
          </TastingSessionProvider>
        </SyncProvider>
      </ProgressProvider>
    </PrefsProvider>
  )
}
