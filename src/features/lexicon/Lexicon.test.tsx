import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'framer-motion'
import { MemoryRouter } from 'react-router-dom'
import { da } from '@/i18n/da'
import { AppProviders } from '@/components/AppProviders'
import { memoryStorage } from '@/lib/storage'
import { AppRoutes } from '@/routes'

function renderAt(path: string) {
  return render(
    <MotionConfig reducedMotion="always">
      <MemoryRouter initialEntries={[path]}>
        <AppProviders seedFactory={() => 'lexicon-test'} storage={memoryStorage()}>
          <AppRoutes />
        </AppProviders>
      </MemoryRouter>
    </MotionConfig>,
  )
}

const user = () => userEvent.setup()

describe('LexiconPage', () => {
  it('browses grapes, countries and styles when the query is empty', () => {
    renderAt('/lexicon')
    expect(screen.getByRole('heading', { name: da.lexicon.redGrapes })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: da.lexicon.countries })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Nebbiolo/ })).toHaveAttribute(
      'href',
      '/lexicon/grapes/nebbiolo',
    )
    // Unverified content is badged.
    expect(screen.getAllByText(da.lexicon.unverified).length).toBeGreaterThan(0)
  })

  it('searches across kinds, accent-insensitively', async () => {
    const u = user()
    renderAt('/lexicon')
    await u.type(screen.getByRole('searchbox'), 'rias')
    const hits = screen.getAllByRole('link', { name: /Rías Baixas/ })
    expect(hits[0]).toHaveAttribute('href', '/lexicon/regions/rias-baixas')
    expect(screen.queryByRole('heading', { name: da.lexicon.redGrapes })).not.toBeInTheDocument()
    await u.clear(screen.getByRole('searchbox'))
    await u.type(screen.getByRole('searchbox'), 'zzzz')
    expect(screen.getByText(/Ingen resultater/)).toBeInTheDocument()
  })
})

describe('GrapePage', () => {
  it('shows aliases, origin, profile bars and styles with the grape', () => {
    renderAt('/lexicon/grapes/syrah')
    expect(screen.getByRole('heading', { name: 'Syrah' })).toBeInTheDocument()
    expect(screen.getByText('Shiraz')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Frankrig' })).toHaveAttribute(
      'href',
      '/lexicon/regions/france',
    )
    expect(screen.getByRole('img', { name: /^Syre: / })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Barossa Shiraz/ })).toHaveAttribute(
      'href',
      '/lexicon/styles/barossa-shiraz',
    )
  })

  it('handles unknown ids', () => {
    renderAt('/lexicon/grapes/nope')
    expect(screen.getByText(da.lexicon.notFound)).toBeInTheDocument()
  })
})

describe('RegionPage', () => {
  it('shows breadcrumb, facts, mini-map, sub-regions and styles', () => {
    renderAt('/lexicon/regions/bourgogne')
    expect(screen.getByRole('heading', { name: 'Bourgogne' })).toBeInTheDocument()
    const crumbs = screen.getByRole('navigation', { name: da.lexicon.regions })
    expect(within(crumbs).getByRole('link', { name: 'Frankrig' })).toBeInTheDocument()
    expect(screen.getByText(da.climate.cool)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /^Kort: Bourgogne/ })).toHaveAttribute(
      'data-highlight',
      'bourgogne',
    )
    const subregions = screen.getByRole('heading', { name: da.lexicon.subregions })
      .nextElementSibling as HTMLElement
    expect(within(subregions).getByRole('link', { name: /^Chablis/ })).toHaveAttribute(
      'href',
      '/lexicon/regions/chablis',
    )
    expect(screen.getByRole('link', { name: /Bourgogne Rouge/ })).toBeInTheDocument()
  })
})

describe('StylePage', () => {
  it('shows the profile and side-by-side comparisons with neighbours', async () => {
    const u = user()
    renderAt('/lexicon/styles/barolo')
    expect(screen.getByRole('heading', { name: 'Barolo' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nebbiolo' })).toHaveAttribute(
      'href',
      '/lexicon/grapes/nebbiolo',
    )
    expect(screen.getByRole('heading', { name: da.lexicon.confusedWith })).toBeInTheDocument()
    const summaries = screen.getAllByText(da.lexicon.compare)
    expect(summaries).toHaveLength(3)
    await u.click(summaries[0]!)
    const table = screen.getAllByRole('table')[0]!
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(5)
    expect(within(table).getByText('Tannin')).toBeInTheDocument()
  })
})

describe('navigation from a game result', () => {
  it('goes from the tasting result to the lexicon and back', async () => {
    const u = user()
    renderAt('/tasting')
    await u.click(screen.getByRole('button', { name: da.common.start }))
    for (let i = 0; i < 4; i++) {
      await u.click(await screen.findByRole('button', { name: da.common.skip }))
    }
    const links = await screen.findAllByRole('link', { name: /Læs om/ })
    const grapeName = links[0]!.textContent!.replace('Læs om ', '')
    await u.click(links[0]!)
    expect(await screen.findByRole('heading', { name: grapeName })).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: `← ${da.lexicon.back}` }))
    expect(await screen.findByText(da.result.reveal)).toBeInTheDocument()
  })
})
