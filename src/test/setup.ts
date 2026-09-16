import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// MapLibre needs WebGL, which jsdom lacks. Every test sees a clickable stub instead.
vi.mock('@/components/map/LazyWineMap', async () => {
  const { MockWineMap } = await import('./MockWineMap')
  return { LazyWineMap: MockWineMap }
})

// Never talk to Supabase from tests: sync is off unless a test injects a backend.
vi.mock('@/lib/supabase', () => ({ supabase: null, createSupabase: () => null }))
