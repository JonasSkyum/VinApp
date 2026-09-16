import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { da } from '@/i18n/da'
import { memoryStorage } from '@/lib/storage'
import { InstallPrompt } from './InstallPrompt'
import { PrefsProvider } from './PrefsProvider'
import { PREFS_KEY } from './prefsStore'

function fireInstallPrompt(outcome: 'accepted' | 'dismissed') {
  const event = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: string }>
  }
  event.prompt = vi.fn().mockResolvedValue(undefined)
  event.userChoice = Promise.resolve({ outcome })
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

describe('InstallPrompt', () => {
  it('renders nothing until the browser offers to install', () => {
    render(
      <PrefsProvider storage={memoryStorage()}>
        <InstallPrompt />
      </PrefsProvider>,
    )
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })

  it('shows the banner on beforeinstallprompt and calls prompt() on install', async () => {
    const u = userEvent.setup()
    render(
      <PrefsProvider storage={memoryStorage()}>
        <InstallPrompt />
      </PrefsProvider>,
    )
    const event = fireInstallPrompt('accepted')
    expect(screen.getByRole('region', { name: da.install.title })).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: da.install.button }))
    expect(event.prompt).toHaveBeenCalled()
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })

  it('snoozes for two weeks after "not now"', async () => {
    const u = userEvent.setup()
    const storage = memoryStorage()
    const first = render(
      <PrefsProvider storage={storage}>
        <InstallPrompt />
      </PrefsProvider>,
    )
    fireInstallPrompt('dismissed')
    await u.click(screen.getByRole('button', { name: da.install.later }))
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
    expect(JSON.parse(storage.getItem(PREFS_KEY)!).data.installDismissedAt).toBeTypeOf('number')
    first.unmount()

    render(
      <PrefsProvider storage={storage}>
        <InstallPrompt />
      </PrefsProvider>,
    )
    fireInstallPrompt('accepted')
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })
})
