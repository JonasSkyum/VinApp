import { useEffect, useState } from 'react'

const QUERY = '(min-width: 1024px)'

/** True on wide screens, where the tasting card sits beside the guess panel. */
export function useWide(): boolean {
  const [wide, setWide] = useState(() => window.matchMedia?.(QUERY).matches ?? false)
  useEffect(() => {
    const mql = window.matchMedia?.(QUERY)
    if (!mql) return
    const onChange = () => setWide(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return wide
}
