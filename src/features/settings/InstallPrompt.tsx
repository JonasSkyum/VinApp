import { useEffect, useState } from 'react'
import { da } from '@/i18n/da'
import { usePrefs } from './prefsContext'

/** Chrome/Edge fire this before showing their own install UI; Safari never does. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** After "not now", stay quiet for this long. */
const DISMISS_DAYS = 14

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * "Install app" toast, anchored above the bottom nav so it never shifts the page.
 * Uses the native prompt where the browser offers one, and explains the share-sheet route on iOS.
 */
export function InstallPrompt() {
  const { prefs, update } = usePrefs()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [ios] = useState(() => isIos() && !isStandalone())
  // Read once at mount: the snooze check does not need to tick.
  const [mountedAt] = useState(() => Date.now())

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setDeferred(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const snoozed =
    prefs.installDismissedAt !== null &&
    mountedAt - prefs.installDismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000
  if (snoozed || (!deferred && !ios)) return null

  const dismiss = () => update({ installDismissedAt: Date.now() })
  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    setDeferred(null)
    if (outcome === 'dismissed') dismiss()
  }

  return (
    <div
      role="region"
      aria-label={da.install.title}
      className="border-wine-200 bg-wine-100 fixed inset-x-4 bottom-20 z-10 mx-auto flex max-w-4xl flex-wrap items-center gap-3 rounded-xl border p-3 text-sm shadow-lg md:bottom-4"
    >
      <div className="min-w-0 flex-1">
        <p className="text-wine-800 font-semibold">{da.install.title}</p>
        <p className="text-wine-900/80">{deferred ? da.install.help : da.install.iosHelp}</p>
      </div>
      <div className="flex gap-2">
        {deferred && (
          <button
            type="button"
            onClick={install}
            className="bg-wine-700 hover:bg-wine-800 rounded-lg px-3 py-2 font-semibold text-white"
          >
            {da.install.button}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="border-wine-300 text-wine-800 hover:bg-wine-50 rounded-lg border px-3 py-2"
        >
          {da.install.later}
        </button>
      </div>
    </div>
  )
}
