import { useCallback } from 'react'
import { playSound, type SoundKind } from '@/lib/sound'
import { usePrefs } from './prefsContext'

/** Plays a sound effect only when the user has switched sounds on. */
export function useSound(): (kind: SoundKind) => void {
  const { prefs } = usePrefs()
  const enabled = prefs.sound
  return useCallback(
    (kind: SoundKind) => {
      if (enabled) playSound(kind)
    },
    [enabled],
  )
}
