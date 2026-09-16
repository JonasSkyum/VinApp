import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { useEffect } from 'react'

interface CountUpProps {
  value: number
  durationSeconds?: number
  className?: string
}

/** Animates from 0 to `value`. Jumps straight to the final number when motion is reduced. */
export function CountUp({ value, durationSeconds = 0.8, className }: CountUpProps) {
  const reduced = useReducedMotion()
  const raw = useMotionValue(reduced ? value : 0)
  const rounded = useTransform(raw, (v) => Math.round(v))

  useEffect(() => {
    if (reduced) {
      raw.set(value)
      return
    }
    const controls = animate(raw, value, { duration: durationSeconds, ease: 'easeOut' })
    return () => controls.stop()
  }, [raw, value, durationSeconds, reduced])

  return <motion.span className={className}>{rounded}</motion.span>
}
