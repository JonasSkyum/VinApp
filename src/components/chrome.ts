import { createContext, useContext, useEffect } from 'react'

export interface ChromeApi {
  /** Whether a page has asked for the app chrome (nav bars) to be hidden. */
  immersive: boolean
  setImmersive: (on: boolean) => void
}

export const ChromeContext = createContext<ChromeApi>({
  immersive: false,
  setImmersive: () => {},
})

/**
 * Game screens (a running round, the map) take the whole viewport: no bottom nav, no header.
 * Call with `true` while the screen is in that state; the chrome comes back on unmount.
 */
export function useImmersive(on: boolean) {
  const { setImmersive } = useContext(ChromeContext)
  useEffect(() => {
    setImmersive(on)
    return () => setImmersive(false)
  }, [on, setImmersive])
}
