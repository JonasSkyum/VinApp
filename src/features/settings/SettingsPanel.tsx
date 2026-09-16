import { ChoiceGroup } from '@/components/ChoiceGroup'
import { da } from '@/i18n/da'
import { playSound } from '@/lib/sound'
import { usePrefs } from './prefsContext'
import type { Theme } from './prefsStore'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'system', label: da.settings.themeSystem },
  { id: 'light', label: da.settings.themeLight },
  { id: 'dark', label: da.settings.themeDark },
]

/** Device preferences: theme and sound. Progress-related settings live on the progress page itself. */
export function SettingsPanel() {
  const { prefs, update } = usePrefs()
  return (
    <div className="space-y-4">
      <ChoiceGroup
        name={da.settings.theme}
        items={THEMES}
        value={prefs.theme}
        onChange={(theme) => update({ theme })}
      />
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={prefs.sound}
          onChange={(e) => {
            update({ sound: e.target.checked })
            // A click is a user gesture, so this also unlocks audio on iOS.
            if (e.target.checked) playSound('correct')
          }}
          className="mt-1"
        />
        <span>
          <span className="font-medium">{da.settings.sound}</span>
          <br />
          <span className="text-wine-900/70">{da.settings.soundHelp}</span>
        </span>
      </label>
    </div>
  )
}
