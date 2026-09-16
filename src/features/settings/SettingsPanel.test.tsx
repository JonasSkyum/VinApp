import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { da } from '@/i18n/da'
import { memoryStorage } from '@/lib/storage'
import { PrefsProvider } from './PrefsProvider'
import { PREFS_KEY } from './prefsStore'
import { SettingsPanel } from './SettingsPanel'

describe('SettingsPanel', () => {
  it('applies the chosen theme to <html> and persists it', async () => {
    const u = userEvent.setup()
    const storage = memoryStorage()
    render(
      <PrefsProvider storage={storage}>
        <SettingsPanel />
      </PrefsProvider>,
    )
    expect(document.documentElement).not.toHaveAttribute('data-theme')
    await u.click(screen.getByRole('radio', { name: da.settings.themeDark }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(JSON.parse(storage.getItem(PREFS_KEY)!).data.theme).toBe('dark')
    await u.click(screen.getByRole('radio', { name: da.settings.themeSystem }))
    expect(document.documentElement).not.toHaveAttribute('data-theme')
  })

  it('has sound off by default and remembers switching it on', async () => {
    const u = userEvent.setup()
    const storage = memoryStorage()
    render(
      <PrefsProvider storage={storage}>
        <SettingsPanel />
      </PrefsProvider>,
    )
    const box = screen.getByRole('checkbox', { name: /Lydeffekter/ })
    expect(box).not.toBeChecked()
    await u.click(box) // jsdom has no AudioContext, so the preview sound is a silent no-op
    expect(box).toBeChecked()
    expect(JSON.parse(storage.getItem(PREFS_KEY)!).data.sound).toBe(true)
  })
})
