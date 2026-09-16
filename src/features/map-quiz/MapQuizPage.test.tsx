import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'framer-motion'
import { MemoryRouter } from 'react-router-dom'
import { da } from '@/i18n/da'
import { catalog } from '@/lib/catalog'
import { formatSeconds } from './format'
import { AppProviders } from '@/components/AppProviders'
import { memoryStorage } from '@/lib/storage'
import { MapQuizPage } from './MapQuizPage'

let clock = 0
function renderPage() {
  clock = 10_000
  return render(
    <MotionConfig reducedMotion="always">
      <MemoryRouter>
        <AppProviders
          seedFactory={() => 'map-component-test'}
          now={() => clock}
          storage={memoryStorage()}
        >
          <MapQuizPage now={() => clock} />
        </AppProviders>
      </MemoryRouter>
    </MotionConfig>,
  )
}

const user = () => userEvent.setup()

function regionIdByName(name: string): string {
  const region = catalog.regions.find((r) => r.name === name)
  if (!region) throw new Error(`unknown region name ${name}`)
  return region.id
}

describe('MapQuizPage', () => {
  it('runs a "find" quiz: correct click, wrong click, summary with wrong answers in red', async () => {
    const u = user()
    renderPage()
    await u.selectOptions(screen.getByRole('combobox'), 'france')
    await u.click(screen.getByRole('radio', { name: '5' }))
    await u.click(screen.getByRole('button', { name: da.common.start }))

    expect(screen.getByText(`${da.mapQuiz.question} 1/5 · ${da.mapQuiz.time} 0:00`)).toBeTruthy()
    const map = screen.getByRole('region', { name: da.mapQuiz.mapLabel })

    for (let i = 0; i < 5; i++) {
      const prompt = screen.getByText(/^Klik på /).textContent!
      const targetId = regionIdByName(prompt.replace('Klik på ', ''))
      if (i === 0) {
        await u.click(within(map).getByTestId(`point-${targetId}`))
        const status = await screen.findByRole('status')
        expect(status).toHaveTextContent(/Rigtigt! 10 point/)
        expect(within(map).getAllByRole('listitem')).toHaveLength(2)
      } else {
        await u.click(within(map).getByTestId('point-nowhere'))
        expect(await screen.findByRole('status')).toHaveTextContent(/Forkert/)
      }
      const label = i === 4 ? da.mapQuiz.summary.title : da.common.next
      await u.click(screen.getByRole('button', { name: label }))
    }

    expect(screen.getByRole('heading', { name: da.mapQuiz.summary.title })).toBeInTheDocument()
    expect(screen.getByText(da.mapQuiz.summary.wrongTitle)).toBeInTheDocument()
    expect(screen.getAllByText(/: 0\/10 point$/)).toHaveLength(4)
  })

  it('runs a "name" quiz with multiple choice and blinks the target', async () => {
    const u = user()
    renderPage()
    await u.click(screen.getByRole('radio', { name: da.mapQuiz.mode.name }))
    await u.selectOptions(screen.getByRole('combobox'), 'italy')
    await u.click(screen.getByRole('radio', { name: '5' }))
    await u.click(screen.getByRole('button', { name: da.common.start }))

    const map = screen.getByRole('region', { name: da.mapQuiz.mapLabel })
    const highlighted = map.getAttribute('data-highlight')!
    expect(highlighted).not.toBe('')
    const options = within(screen.getByRole('radiogroup')).getAllByRole('radio')
    expect(options).toHaveLength(4)
    expect(screen.getByRole('button', { name: da.common.lockAnswer })).toBeDisabled()

    await u.click(screen.getByRole('radio', { name: catalog.region(highlighted).name }))
    await u.click(screen.getByRole('button', { name: da.common.lockAnswer }))
    expect(await screen.findByRole('status')).toHaveTextContent(/Rigtigt! Det var/)
    expect(map.getAttribute('data-highlight')).toBe('')

    await u.click(screen.getByRole('button', { name: da.common.next }))
    await u.click(screen.getByRole('button', { name: da.common.skip }))
    expect(await screen.findByRole('status')).toHaveTextContent(/Sprunget over/)
  })

  it('runs a "grape" quiz and shows the timer', async () => {
    const u = user()
    renderPage()
    await u.click(screen.getByRole('radio', { name: da.mapQuiz.mode.grape }))
    await u.click(screen.getByRole('radio', { name: da.level.expert }))
    await u.click(screen.getByRole('radio', { name: '5' }))
    await u.click(screen.getByRole('button', { name: da.common.start }))

    expect(screen.getByText(/^Hvor kommer klassisk /)).toBeInTheDocument()
    clock += 65_000
    const map = screen.getByRole('region', { name: da.mapQuiz.mapLabel })
    await u.click(within(map).getByTestId('point-nowhere'))
    expect(await screen.findByRole('status')).toHaveTextContent(/Forkert/)
    expect(screen.getByText(new RegExp(`${da.mapQuiz.time} ${formatSeconds(65)}`))).toBeTruthy()
  })
})

describe('formatSeconds', () => {
  it('formats m:ss', () => {
    expect(formatSeconds(0)).toBe('0:00')
    expect(formatSeconds(65)).toBe('1:05')
    expect(formatSeconds(600)).toBe('10:00')
  })
})
