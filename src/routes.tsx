import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { NotFoundPage } from '@/components/NotFoundPage'
import { HomePage } from '@/features/home/HomePage'
import { TastingPage } from '@/features/tasting/TastingPage'
import { MapQuizPage } from '@/features/map-quiz/MapQuizPage'
import { DailyPage } from '@/features/daily/DailyPage'
import { LexiconEntryPlaceholder } from '@/features/lexicon/LexiconEntryPlaceholder'
import { LexiconPage } from '@/features/lexicon/LexiconPage'
import { ProgressPage } from '@/features/progress/ProgressPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="tasting" element={<TastingPage />} />
        <Route path="map" element={<MapQuizPage />} />
        <Route path="daily" element={<DailyPage />} />
        <Route path="lexicon" element={<LexiconPage />} />
        <Route path="lexicon/grapes/:id" element={<LexiconEntryPlaceholder kind="grapes" />} />
        <Route path="lexicon/regions/:id" element={<LexiconEntryPlaceholder kind="regions" />} />
        <Route path="lexicon/styles/:id" element={<LexiconEntryPlaceholder kind="styles" />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
