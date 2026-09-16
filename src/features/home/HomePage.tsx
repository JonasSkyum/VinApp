import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { Onboarding } from '@/features/onboarding/Onboarding'
import { usePrefs } from '@/features/settings/prefsContext'
import { da } from '@/i18n/da'

const MODES = [
  { to: '/tasting', label: da.nav.tasting, help: da.pages.home.tastingHelp, icon: '🍷' },
  { to: '/map', label: da.nav.map, help: da.pages.home.mapHelp, icon: '🗺️' },
  { to: '/daily', label: da.nav.daily, help: da.pages.home.dailyHelp, icon: '📅' },
  { to: '/lexicon', label: da.nav.lexicon, help: da.pages.home.lexiconHelp, icon: '📖' },
] as const

/** Entry point: the introduction on first visit, otherwise the game modes. */
export function HomePage() {
  const { prefs, update } = usePrefs()
  const [showGuide, setShowGuide] = useState(false)

  if (!prefs.onboardingDone || showGuide) {
    return (
      <>
        <PageTitle>{da.pages.home.title}</PageTitle>
        <Onboarding
          onDone={() => {
            update({ onboardingDone: true })
            setShowGuide(false)
          }}
        />
      </>
    )
  }

  return (
    <>
      <PageTitle>{da.pages.home.title}</PageTitle>
      <p className="mb-4">{da.pages.home.intro}</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {MODES.map((mode) => (
          <li key={mode.to}>
            <Link
              to={mode.to}
              className="border-wine-200 hover:border-wine-500 flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm"
            >
              <span aria-hidden="true" className="text-3xl">
                {mode.icon}
              </span>
              <span>
                <span className="text-wine-800 block font-semibold">{mode.label}</span>
                <span className="text-wine-900/70 block text-sm">{mode.help}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="text-wine-700 mt-6 text-sm underline"
      >
        {da.pages.home.howToPlay}
      </button>
    </>
  )
}
