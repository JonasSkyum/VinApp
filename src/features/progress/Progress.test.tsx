import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'framer-motion'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/components/AppProviders'
import { da } from '@/i18n/da'
import { memoryStorage, type StorageLike } from '@/lib/storage'
import { AppRoutes } from '@/routes'
import { exportProgress, PROGRESS_KEY, PROGRESS_VERSION, type ProgressData } from './progressStore'

const NOW = Date.UTC(2026, 8, 16, 12)

function renderAt(path: string, storage: StorageLike) {
  return render(
    <MotionConfig reducedMotion="always">
      <MemoryRouter initialEntries={[path]}>
        <AppProviders seedFactory={() => 'progress-test'} now={() => NOW} storage={storage}>
          <AppRoutes />
        </AppProviders>
      </MemoryRouter>
    </MotionConfig>,
  )
}

const user = () => userEvent.setup()

/** Plays one beginner round: world/climate skipped, grape and country answered with the first option. */
async function playOneRound(u: ReturnType<typeof user>) {
  await u.click(screen.getByRole('button', { name: da.common.start }))
  await u.click(await screen.findByRole('button', { name: da.common.skip }))
  await u.click(await screen.findByRole('button', { name: da.common.skip }))
  for (let i = 0; i < 2; i++) {
    const group = await screen.findByRole('radiogroup')
    await u.click(within(group).getAllByRole('radio')[0]!)
    await u.click(screen.getByRole('button', { name: da.common.lockAnswer }))
  }
  await screen.findByText(da.result.reveal)
}

describe('progress', () => {
  it('records a played round, persists it, and shows it on the progress page after a remount', async () => {
    const u = user()
    const storage = memoryStorage()
    const first = renderAt('/tasting', storage)
    await playOneRound(u)

    const stored = JSON.parse(storage.getItem(PROGRESS_KEY)!)
    expect(stored.version).toBe(PROGRESS_VERSION)
    expect(stored.data.log).toHaveLength(3) // grape, country, style
    expect(Object.keys(stored.data.leitner)).toHaveLength(3)
    first.unmount()

    renderAt('/progress', storage)
    expect(screen.getByRole('heading', { name: /Niveau 1/ })).toBeInTheDocument()
    expect(screen.getByText(/1 dage/)).toBeInTheDocument() // streak
    expect(screen.getByRole('heading', { name: da.progress.grapes })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: da.progress.regions })).toBeInTheDocument()
    expect(screen.getAllByText(/Boks 1/).length).toBeGreaterThan(0)
  })

  it('shows confusions with lexicon links and offers weak-point training', async () => {
    const storage = memoryStorage()
    const data: ProgressData = {
      log: [
        {
          kind: 'grape',
          itemId: 'pinot-noir',
          tier: 3,
          correct: false,
          guessedId: 'gamay',
          points: 0,
          timestamp: NOW,
        },
        {
          kind: 'grape',
          itemId: 'pinot-noir',
          tier: 3,
          correct: false,
          guessedId: 'gamay',
          points: 0,
          timestamp: NOW,
        },
      ],
      leitner: {},
      daily: {},
      settings: { unlockingEnabled: true },
    }
    storage.setItem(PROGRESS_KEY, JSON.stringify({ version: PROGRESS_VERSION, data }))
    const u = user()
    renderAt('/progress', storage)
    const link = screen.getByRole('link', { name: /Du forveksler Pinot Noir med Gamay/ })
    expect(link).toHaveAttribute('href', '/lexicon/grapes/pinot-noir')
    expect(screen.getByText('2 gange')).toBeInTheDocument()

    // Weak-point training starts a session straight away.
    await u.click(screen.getAllByRole('link', { name: da.nav.tasting })[0]!)
    await u.click(screen.getByRole('button', { name: da.training.weakButton }))
    expect(await screen.findByRole('heading', { name: da.tier[1] })).toBeInTheDocument()
  })

  it('imports an exported file and can reset with confirmation', async () => {
    const u = user()
    const storage = memoryStorage()
    renderAt('/progress', storage)
    expect(screen.getByText(da.progress.noData)).toBeInTheDocument()

    const data: ProgressData = {
      log: [
        {
          kind: 'style',
          itemId: 'barolo',
          tier: 6,
          correct: true,
          guessedId: null,
          points: 60,
          timestamp: NOW,
        },
      ],
      leitner: { 'style:barolo': { box: 2, reviewedAt: NOW, dueAt: NOW + 1 } },
      daily: {},
      settings: { unlockingEnabled: false },
    }
    const file = new File([exportProgress(data)], 'backup.json', { type: 'application/json' })
    await u.upload(screen.getByLabelText(da.progress.importButton), file)
    expect(await screen.findByRole('status')).toHaveTextContent(da.progress.importSuccess)
    expect(screen.getByRole('heading', { name: /Niveau 2/ })).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(JSON.parse(storage.getItem(PROGRESS_KEY)!).data.settings.unlockingEnabled).toBe(false)

    const bad = new File(['{"nope":true}'], 'bad.json', { type: 'application/json' })
    await u.upload(screen.getByLabelText(da.progress.importButton), bad)
    expect(await screen.findByRole('status')).toHaveTextContent(da.progress.importError)

    await u.click(screen.getByRole('button', { name: da.progress.resetButton }))
    await u.click(screen.getByRole('button', { name: da.progress.resetNo }))
    expect(screen.getByRole('heading', { name: /Niveau 2/ })).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: da.progress.resetButton }))
    await u.click(screen.getByRole('button', { name: da.progress.resetYes }))
    expect(screen.getByRole('heading', { name: /Niveau 1/ })).toBeInTheDocument()
    expect(screen.getByText(da.progress.noData)).toBeInTheDocument()
    expect(JSON.parse(storage.getItem(PROGRESS_KEY)!).data.log).toEqual([])
  })

  it('toggles unlocking', async () => {
    const u = user()
    const storage = memoryStorage()
    renderAt('/progress', storage)
    await u.click(screen.getByRole('checkbox'))
    expect(JSON.parse(storage.getItem(PROGRESS_KEY)!).data.settings.unlockingEnabled).toBe(false)
  })
})
