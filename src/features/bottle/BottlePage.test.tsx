import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'framer-motion'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/components/AppProviders'
import { da } from '@/i18n/da'
import { memoryStorage } from '@/lib/storage'
import { AppRoutes } from '@/routes'

function renderAt(path: string) {
  return render(
    <MotionConfig reducedMotion="always">
      <MemoryRouter initialEntries={[path]}>
        <AppProviders seedFactory={() => 'bottle-test'} storage={memoryStorage()}>
          <AppRoutes />
        </AppProviders>
      </MemoryRouter>
    </MotionConfig>,
  )
}

describe('BottlePage', () => {
  it('ranks the notes, reveals the bottle and explains the difference', async () => {
    const u = userEvent.setup()
    renderAt('/bottle')
    expect(screen.getByRole('heading', { name: da.pages.bottle.title })).toBeInTheDocument()

    // Textbook Barolo: garnet, high acidity and tannin, rose and tar.
    await u.click(screen.getByRole('radio', { name: /granatrød/i }))
    const acidity = screen.getByRole('radiogroup', { name: da.attribute.acidity })
    await u.click(within(acidity).getByRole('radio', { name: da.scale[5] }))
    const tannin = screen.getByRole('radiogroup', { name: da.attribute.tannin })
    await u.click(within(tannin).getByRole('radio', { name: da.scale[5] }))
    await u.click(screen.getByRole('button', { name: 'Rose' }))
    await u.click(screen.getByRole('button', { name: 'Tjære' }))
    expect(screen.getByText('2 valgt')).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: da.bottle.rank }))
    const ranking = screen.getByRole('region', { name: da.bottle.rankTitle })
    const rows = within(ranking).getAllByRole('listitem')
    expect(rows).toHaveLength(5)
    expect(rows[0]).toHaveTextContent('Barolo')
    expect(within(rows[0]!).getByText(da.bottle.bestGuess)).toBeInTheDocument()

    // The bottle turns out to be a Bourgogne Rouge: position (if listed) and explanations.
    await u.type(screen.getByRole('combobox'), 'bourgogne rouge')
    const option = screen.getByRole('option', { name: /Bourgogne Rouge/ })
    await u.click(within(option).getByRole('button'))
    await u.click(screen.getByRole('button', { name: da.bottle.revealButton }))
    expect(screen.getByText(/Appen havde den/)).toBeInTheDocument()
    expect(screen.getByText(da.bottle.whyTitle)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Læs om Bourgogne Rouge/ })).toHaveAttribute(
      'href',
      '/lexicon/styles/cote-de-nuits-rouge',
    )

    // Start over returns to the empty sheet.
    await u.click(screen.getByRole('button', { name: da.bottle.startOver }))
    expect(screen.getByText('0 valgt')).toBeInTheDocument()
  })
})
