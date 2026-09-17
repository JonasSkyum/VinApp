import { ChoiceGroup } from '@/components/ChoiceGroup'
import { da } from '@/i18n/da'
import { playSound } from '@/lib/sound'
import { usePrefs } from './prefsContext'
import type { Theme } from './prefsStore'
import { Toggle } from './Toggle'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'system', label: da.settings.themeSystem },
  { id: 'light', label: da.settings.themeLight },
  { id: 'dark', label: da.settings.themeDark },
]

/** Device preferences: theme and sound. Progress-related settings live on the settings page itself. */
export function SettingsPanel() {
  const { prefs, update } = usePrefs()
  return (
    <div className="flex flex-col gap-4">
      <ChoiceGroup
        name={da.settings.theme}
        items={THEMES}
        value={prefs.theme}
        onChange={(theme) => update({ theme })}
      />
      <Toggle
        checked={prefs.sound}
        onChange={(sound) => {
          update({ sound })
          // A click is a user gesture, so this also unlocks audio on iOS.
          if (sound) playSound('correct')
        }}
        label={da.settings.sound}
        help={da.settings.soundHelp}
      />
    </div>
  )
}
