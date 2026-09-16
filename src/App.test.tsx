import { render, screen } from '@testing-library/react'
import App from '@/App'
import { da } from '@/i18n/da'

describe('App', () => {
  it('renders the home page inside the layout', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: da.pages.home.title })).toBeInTheDocument()
    // Both the top bar and the bottom bar render the tasting link.
    expect(screen.getAllByRole('link', { name: da.nav.tasting })).toHaveLength(2)
  })
})
