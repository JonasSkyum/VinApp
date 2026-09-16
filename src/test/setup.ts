import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// MapLibre needs WebGL, which jsdom lacks. Every test sees a clickable stub instead.
vi.mock('@/components/map/LazyWineMap', async () => {
  const { MockWineMap } = await import('./MockWineMap')
  return { LazyWineMap: MockWineMap }
})
