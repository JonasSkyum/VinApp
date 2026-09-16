import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'framer-motion'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/components/AppProviders'
import { pickDailyStyle } from '@/engine'
import { PROGRESS_KEY } from '@/features/progress/progressStore'
import { da } from '@/i18n/da'
import { catalog } from '@/lib/catalog'
import { memoryStorage, type StorageLike } from '@/lib/storage'
import { AppRoutes } from '@/routes'

// 14:00 in Copenhagen on 16 September 2026 (challenge #1).
const NOW = Date.UTC(2026, 8, 16, 12)
const DAY = 24 * 60 * 60 * 1000

function renderAt(storage: StorageLike) {
  return render(
    <MotionConfig reducedMotion="always">
      <MemoryRouter initialEntries={['/daily']}>
        <AppProviders storage={storage}>
          <AppRoutes />
        </AppProviders>
      </MemoryRouter>
    </MotionConfig>,
  )
}

const user = () => userEvent.setup()

/** Plays the daily round: world/climate skipped, grape/country/region answered with the first option. */
async function playDaily(u: ReturnType<typeof user>) {
  await u.click(screen.getByRole('button', { name: da.daily.start }))
  await u.click(await screen.findByRole('button', { name: da.common.skip }))
  await u.click(await screen.findByRole('button', { name: da.common.skip }))
  for (let i = 0; i < 3; i++) {
    const group = await screen.findByRole('radiogroup')
    await u.click(within(group).getAllByRole('radio')[0]!)
    await u.click(screen.getByRole('button', { name: da.common.lockAnswer }))
  }
  await screen.findByText(da.result.reveal)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('daily challenge', () => {
  it('plays one seeded round, saves it, and cannot be played again the same day', async () => {
    const u = user()
    const storage = memoryStorage()
    const first = renderAt(storage)
    expect(screen.getByRole('heading', { name: 'Dagens udfordring #1' })).toBeInTheDocument()

    await playDaily(u)
    await u.click(screen.getByRole('button', { name: da.summary.title }))
    expect(await screen.findByRole('heading', { name: da.daily.done })).toBeInTheDocument()
    expect(screen.getByText(/1 dage/)).toBeInTheDocument() // streak

    const stored = JSON.parse(storage.getItem(PROGRESS_KEY)!)
    const result = stored.data.daily['2026-09-16']
    expect(result.styleId).toBe(pickDailyStyle(catalog, '2026-09-16').id)
    expect(result.tiers).toHaveLength(5)
    expect(result.max).toBe(10)
    expect(stored.data.log.length).toBeGreaterThan(0) // XP and Leitner get the round too
    first.unmount()

    renderAt(storage)
    expect(screen.getByRole('heading', { name: da.daily.done })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: da.daily.start })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: catalog.style(result.styleId).name })).toHaveAttribute(
      'href',
      `/lexicon/styles/${result.styleId}`,
    )
    expect(screen.getByLabelText(da.daily.countdownLabel)).toHaveTextContent(/^\d\d:\d\d:\d\d$/)
  })

  it('shares a Wordle-style string, copying when the share sheet is unavailable', async () => {
    const u = user()
    const storage = memoryStorage()
    renderAt(storage)
    await playDaily(u)
    await u.click(screen.getByRole('button', { name: da.summary.title }))

    await u.click(await screen.findByRole('button', { name: da.daily.share }))
    expect(await screen.findByRole('status')).toHaveTextContent(da.daily.copied)
    const text = await navigator.clipboard.readText()
    expect(text).toMatch(/^Vinspil #1 🍷 [🟩🟨⬛⬜]{5} \d+\/10\n.*#\/daily$/u)
  })

  it('uses the Web Share API when the browser has it', async () => {
    const u = user()
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: share, configurable: true })
    try {
      renderAt(memoryStorage())
      await playDaily(u)
      await u.click(screen.getByRole('button', { name: da.summary.title }))
      await u.click(await screen.findByRole('button', { name: da.daily.share }))
      expect(await screen.findByRole('status')).toHaveTextContent(da.daily.shared)
      expect(share).toHaveBeenCalledWith({ text: expect.stringMatching(/^Vinspil #1 🍷/u) })
    } finally {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    }
  })

  it('opens a new challenge the next day and keeps the streak', async () => {
    const u = user()
    const storage = memoryStorage()
    const first = renderAt(storage)
    await playDaily(u)
    first.unmount()

    vi.setSystemTime(NOW + DAY)
    renderAt(storage)
    expect(screen.getByRole('heading', { name: 'Dagens udfordring #2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: da.daily.start })).toBeInTheDocument()
    expect(screen.getByText(/1 dage/)).toBeInTheDocument()
  })
})
