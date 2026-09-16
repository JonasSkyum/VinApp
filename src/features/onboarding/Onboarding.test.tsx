import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'framer-motion'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/components/AppProviders'
import { PREFS_KEY } from '@/features/settings/prefsStore'
import { da } from '@/i18n/da'
import { memoryStorage, type StorageLike } from '@/lib/storage'
import { AppRoutes } from '@/routes'

function renderHome(storage: StorageLike) {
  return render(
    <MotionConfig reducedMotion="always">
      <MemoryRouter initialEntries={['/']}>
        <AppProviders storage={storage}>
          <AppRoutes />
        </AppProviders>
      </MemoryRouter>
    </MotionConfig>,
  )
}

describe('onboarding', () => {
  it('walks through three screens on the first visit and never again after finishing', async () => {
    const u = userEvent.setup()
    const storage = memoryStorage()
    const first = renderHome(storage)
    const t = da.onboarding

    expect(screen.getByRole('heading', { name: t.card.title })).toBeInTheDocument()
    expect(screen.getByText('Trin 1 af 3')).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: t.next }))
    expect(screen.getByRole('heading', { name: t.deduction.title })).toBeInTheDocument()
    expect(screen.getByText(da.tier[3])).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: t.back }))
    expect(screen.getByRole('heading', { name: t.card.title })).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: t.next }))
    await u.click(screen.getByRole('button', { name: t.next }))
    expect(screen.getByRole('heading', { name: t.improve.title })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: t.skip })).not.toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: t.finish }))

    expect(screen.getByRole('link', { name: /Gæt vinen ud fra smagsprofilen/ })).toBeInTheDocument()
    expect(JSON.parse(storage.getItem(PREFS_KEY)!).data.onboardingDone).toBe(true)
    first.unmount()

    renderHome(storage)
    expect(screen.queryByRole('heading', { name: t.card.title })).not.toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: da.pages.home.howToPlay }))
    expect(screen.getByRole('heading', { name: t.card.title })).toBeInTheDocument()
  })

  it('can be skipped', async () => {
    const u = userEvent.setup()
    renderHome(memoryStorage())
    await u.click(screen.getByRole('button', { name: da.onboarding.skip }))
    expect(screen.getByRole('button', { name: da.pages.home.howToPlay })).toBeInTheDocument()
  })
})
