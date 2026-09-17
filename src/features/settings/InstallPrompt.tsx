import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
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
      className="bg-ink text-canvas shadow-float fixed inset-x-4 bottom-24 z-10 mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-sm md:bottom-4"
    >
      <Icon name="download" size={20} strokeWidth={2.2} className="text-primary-ink shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-extrabold">{da.install.title}</p>
        <p className="text-canvas/80">{deferred ? da.install.help : da.install.iosHelp}</p>
      </div>
      <div className="flex gap-2">
        {deferred && (
          <button
            type="button"
            onClick={install}
            className="bg-paper text-bordeaux min-h-11 rounded-full px-4 font-extrabold"
          >
            {da.install.button}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="text-primary-ink min-h-11 px-3 font-extrabold"
        >
          {da.install.later}
        </button>
      </div>
    </div>
  )
}
