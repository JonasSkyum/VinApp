import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'framer-motion'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/components/AppProviders'
import type { AnswerRecord } from '@/engine'
import { PROGRESS_KEY, PROGRESS_VERSION } from '@/features/progress/progressStore'
import { da } from '@/i18n/da'
import { memoryStorage, type StorageLike } from '@/lib/storage'
import { AppRoutes } from '@/routes'
import { memoryBackend, type MemoryBackend } from './memoryBackend'

const NOW = Date.UTC(2026, 8, 16, 12)

const rec = (over: Partial<AnswerRecord>): AnswerRecord => ({
  kind: 'grape',
  itemId: 'syrah',
  tier: 3,
  correct: true,
  guessedId: null,
  points: 3,
  timestamp: NOW,
  ...over,
})

function seedStorage(storage: StorageLike, log: AnswerRecord[]) {
  storage.setItem(
    PROGRESS_KEY,
    JSON.stringify({
      version: PROGRESS_VERSION,
      data: { log, leitner: {}, daily: {}, settings: { unlockingEnabled: true } },
    }),
  )
}

function renderAt(path: string, storage: StorageLike, backend: MemoryBackend | null) {
  return render(
    <MotionConfig reducedMotion="always">
      <MemoryRouter initialEntries={[path]}>
        <AppProviders
          storage={storage}
          syncBackend={backend}
          syncDebounceMs={10}
          seedFactory={() => 'sync-test'}
          now={() => NOW}
        >
          <AppRoutes />
        </AppProviders>
      </MemoryRouter>
    </MotionConfig>,
  )
}

const storedLog = (storage: StorageLike): AnswerRecord[] =>
  JSON.parse(storage.getItem(PROGRESS_KEY)!).data.log

describe('sync', () => {
  it('hides the account panel when sync is not configured', () => {
    renderAt('/progress', memoryStorage(), null)
    expect(screen.queryByRole('heading', { name: da.account.title })).not.toBeInTheDocument()
  })

  it('sends a magic link, then merges local and server progress on login', async () => {
    const u = userEvent.setup()
    const storage = memoryStorage()
    seedStorage(storage, [rec({ itemId: 'syrah' })])
    const backend = memoryBackend({
      log: [rec({ itemId: 'gamay', timestamp: NOW - 1000 })],
      leitner: { 'grape:gamay': { box: 4, reviewedAt: NOW - 1000, dueAt: NOW + 1 } },
    })
    renderAt('/progress', storage, backend)

    await u.type(screen.getByLabelText(da.account.email), 'jonas@example.com')
    await u.click(screen.getByRole('button', { name: da.account.sendLink }))
    expect(await screen.findByRole('status')).toHaveTextContent(da.account.linkSent)
    expect(backend.sentLinks).toEqual(['jonas@example.com'])

    act(() => backend.completeSignIn())
    expect(await screen.findByText(/Logget ind som jonas@example.com/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(da.account.synced))

    // Both sides now hold the union.
    expect(storedLog(storage).map((r) => r.itemId)).toEqual(['gamay', 'syrah'])
    expect(backend.store.log.map((r) => r.itemId)).toEqual(['gamay', 'syrah'])
    expect(backend.pushes).toHaveLength(1)
    expect(backend.pushes[0]!.log.map((r) => r.itemId)).toEqual(['syrah'])
    // The server-side Leitner box shows up locally.
    expect(screen.getAllByText(/Boks 4/).length).toBeGreaterThan(0)
  })

  it('pushes new local answers after a debounce, and keeps local data on sign-out', async () => {
    const u = userEvent.setup()
    const storage = memoryStorage()
    const backend = memoryBackend()
    renderAt('/tasting', storage, backend)
    act(() => backend.completeSignIn())
    await waitFor(() => expect(backend.pushes.length).toBeGreaterThanOrEqual(0))

    // Play one beginner round: skip world/climate, answer grape and country.
    await u.click(screen.getByRole('button', { name: da.common.start }))
    await u.click(await screen.findByRole('button', { name: da.common.skip }))
    await u.click(await screen.findByRole('button', { name: da.common.skip }))
    for (let i = 0; i < 2; i++) {
      const group = await screen.findByRole('radiogroup')
      await u.click(within(group).getAllByRole('radio')[0]!)
      await u.click(screen.getByRole('button', { name: da.common.lockAnswer }))
    }
    await screen.findByText(da.result.reveal)

    await waitFor(() => expect(backend.store.log).toHaveLength(3)) // grape, country, style
    expect(backend.store.log).toEqual(storedLog(storage))

    await act(() => backend.signOut())
    expect(storedLog(storage)).toHaveLength(3)
  })
})
