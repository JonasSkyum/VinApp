import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { NotFoundPage } from '@/components/NotFoundPage'
import { HomePage } from '@/features/home/HomePage'
import { TastingPage } from '@/features/tasting/TastingPage'
import { MapQuizPage } from '@/features/map-quiz/MapQuizPage'
import { DailyPage } from '@/features/daily/DailyPage'
import { GrapePage } from '@/features/lexicon/GrapePage'
import { LexiconPage } from '@/features/lexicon/LexiconPage'
import { RegionPage } from '@/features/lexicon/RegionPage'
import { StylePage } from '@/features/lexicon/StylePage'
import { ProgressPage } from '@/features/progress/ProgressPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="tasting" element={<TastingPage />} />
        <Route path="map" element={<MapQuizPage />} />
        <Route path="daily" element={<DailyPage />} />
        <Route path="lexicon" element={<LexiconPage />} />
        <Route path="lexicon/grapes/:id" element={<GrapePage />} />
        <Route path="lexicon/regions/:id" element={<RegionPage />} />
        <Route path="lexicon/styles/:id" element={<StylePage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
