import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'framer-motion'
import { MemoryRouter } from 'react-router-dom'
import { da } from '@/i18n/da'
import { AppProviders } from '@/components/AppProviders'
import { memoryStorage, type StorageLike } from '@/lib/storage'
import { PROGRESS_KEY, PROGRESS_VERSION } from '@/features/progress/progressStore'
import { TastingPage } from './TastingPage'

function renderPage(storage: StorageLike = memoryStorage()) {
  return render(
    <MotionConfig reducedMotion="always">
      <MemoryRouter>
        <AppProviders seedFactory={() => 'component-test'} storage={storage}>
          <TastingPage />
        </AppProviders>
      </MemoryRouter>
    </MotionConfig>,
  )
}

const user = () => userEvent.setup()

async function startSession(u: ReturnType<typeof user>, level: string, color: string) {
  await u.click(screen.getByRole('radio', { name: level }))
  await u.click(screen.getByRole('radio', { name: color }))
  await u.click(screen.getByRole('button', { name: da.common.start }))
}

/** Answers the current tier with the first option and locks it. */
async function answerFirstOption(u: ReturnType<typeof user>) {
  const group = screen.getByRole('radiogroup')
  await u.click(within(group).getAllByRole('radio')[0]!)
  await u.click(screen.getByRole('button', { name: da.common.lockAnswer }))
}

describe('TastingPage', () => {
  it('shows the setup screen first', () => {
    renderPage()
    expect(screen.getByRole('radio', { name: da.level.beginner })).toBeChecked()
    expect(screen.getByRole('radio', { name: da.colorFilter.both })).toBeChecked()
    expect(screen.getByRole('radio', { name: '5' })).toBeChecked()
  })

  it('walks through a beginner round one tier at a time', async () => {
    const u = user()
    renderPage()
    await startSession(u, da.level.beginner, da.colorFilter.red)

    // Tasting card and first question.
    expect(screen.getByText(da.tastingCard.title)).toBeInTheDocument()
    expect(screen.getByText(`${da.common.round} 1 ${da.common.of} 5`)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: da.tier[1] })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: da.common.lockAnswer })).toBeDisabled()

    // Select, lock, move on; the answer is now locked (no way back).
    await u.click(screen.getByRole('radio', { name: da.world.old }))
    expect(screen.getByRole('button', { name: da.common.lockAnswer })).toBeEnabled()
    await u.click(screen.getByRole('button', { name: da.common.lockAnswer }))
    expect(await screen.findByRole('heading', { name: da.tier[2] })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: da.world.old })).not.toBeInTheDocument()

    // Skip climate, answer grape and country.
    await u.click(screen.getByRole('button', { name: da.common.skip }))
    expect(await screen.findByRole('heading', { name: da.tier[3] })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(4)
    await answerFirstOption(u)
    expect(await screen.findByRole('heading', { name: da.tier[4] })).toBeInTheDocument()
    await answerFirstOption(u)

    // Result screen.
    expect(await screen.findByText(da.result.reveal)).toBeInTheDocument()
    expect(screen.getByText(da.result.roundScore)).toBeInTheDocument()
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(5) // header + 4 tiers
    expect(within(table).getByText(da.outcome.skipped)).toBeInTheDocument()
    expect(screen.getByText(da.result.whyTitle)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Læs om/ })).toHaveLength(2)
    expect(screen.getByRole('region', { name: /^Kort: / })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: da.tasting.nextWine })).toBeInTheDocument()
  })

  it('reaches the summary after the last round and can start over', async () => {
    const u = user()
    renderPage()
    await startSession(u, da.level.beginner, da.colorFilter.white)

    for (let round = 1; round <= 5; round++) {
      for (let tier = 0; tier < 4; tier++) {
        await u.click(await screen.findByRole('button', { name: da.common.skip }))
      }
      const label = round === 5 ? da.summary.title : da.tasting.nextWine
      await u.click(await screen.findByRole('button', { name: label }))
    }

    expect(await screen.findByRole('heading', { name: da.summary.title })).toBeInTheDocument()
    expect(screen.getByText(da.summary.total)).toBeInTheDocument()
    expect(screen.getByText(da.summary.bestTier)).toBeInTheDocument()
    expect(screen.getAllByText(/Runde \d: 0\/7/)).toHaveLength(5)

    await u.click(screen.getByRole('button', { name: da.common.newSession }))
    expect(screen.getByRole('button', { name: da.common.start })).toBeInTheDocument()
  }, 15_000)

  it('locks advanced and expert until unlocked', () => {
    renderPage()
    expect(screen.getByRole('radio', { name: /Øvet/ })).toBeDisabled()
    expect(screen.getByRole('radio', { name: /Ekspert/ })).toBeDisabled()
    expect(screen.getByText('Øvet: 0/10 rigtige druegæt på lavere niveau')).toBeInTheDocument()
  })

  it('uses free text with autocomplete on expert', async () => {
    const u = user()
    const storage = memoryStorage()
    storage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        version: PROGRESS_VERSION,
        data: { log: [], leitner: {}, daily: {}, settings: { unlockingEnabled: false } },
      }),
    )
    renderPage(storage)
    await startSession(u, da.level.expert, da.colorFilter.red)

    await u.click(screen.getByRole('button', { name: da.common.skip })) // world
    await u.click(await screen.findByRole('button', { name: da.common.skip })) // climate
    expect(await screen.findByRole('heading', { name: da.tier[3] })).toBeInTheDocument()

    const input = screen.getByRole('combobox')
    expect(screen.getByRole('button', { name: da.common.lockAnswer })).toBeDisabled()
    await u.type(input, 'shiraz') // alias of Syrah
    const option = screen.getByRole('option', { name: 'Syrah' })
    await u.click(within(option).getByRole('button'))
    expect(input).toHaveValue('Syrah')
    expect(screen.getByRole('button', { name: da.common.lockAnswer })).toBeEnabled()

    // Editing the text clears the selection again.
    await u.type(input, 'x')
    expect(screen.getByRole('button', { name: da.common.lockAnswer })).toBeDisabled()
    await u.clear(input)
    await u.type(input, 'zzzz')
    expect(screen.getByText(da.autocomplete.noMatches)).toBeInTheDocument()
  })
})
