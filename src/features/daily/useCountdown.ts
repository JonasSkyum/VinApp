import { useEffect, useState } from 'react'
import { msUntilNextDaily } from '@/engine'

/** Milliseconds until the next daily challenge, ticking once a second. */
export function useCountdown(now: () => number = Date.now): number {
  const [remaining, setRemaining] = useState(() => msUntilNextDaily(now()))
  useEffect(() => {
    const id = setInterval(() => setRemaining(msUntilNextDaily(now())), 1000)
    return () => clearInterval(id)
  }, [now])
  return remaining
}
