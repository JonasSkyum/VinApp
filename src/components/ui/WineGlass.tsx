import { APPEARANCE_HEX } from '@/lib/palette'
import type { Appearance, Level } from '@/schema'

interface WineGlassProps {
  appearance: Appearance
  /** Aroma intensity 1–5 drives how opaque the wine looks. */
  intensity?: Level
  /** Height in px; the glass keeps its 40:54 ratio. */
  size?: number
  /** Stroke colour; defaults to the muted ink. Use a light colour on bordeaux backgrounds. */
  stroke?: string
  className?: string
}

/** The wine glass from the design system, with the bowl filled in the appearance colour. */
export function WineGlass({
  appearance,
  intensity = 3,
  size = 54,
  stroke = 'var(--ink-2)',
  className,
}: WineGlassProps) {
  const opacity = [0.6, 0.75, 0.9, 1, 1][intensity - 1] ?? 1
  return (
    <svg
      width={(size * 40) / 54}
      height={size}
      viewBox="0 0 40 54"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M10.2 15h19.6l-.5 4c-.9 6.6-4.6 10-9.3 10s-8.4-3.4-9.3-10z"
        fill={APPEARANCE_HEX[appearance]}
        fillOpacity={opacity}
      />
      <path
        d="M8 4h24l-1.3 15c-.9 7.6-5 11-10.7 11S10.2 26.6 9.3 19z M20 30v16 M12 48h16"
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Faint outline glass for empty states and the hero card backdrop. */
export function GlassOutline({
  size = 64,
  stroke = 'var(--ink-3)',
  dashed = false,
  className,
  style,
}: {
  size?: number
  stroke?: string
  dashed?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      width={(size * 40) / 54}
      height={size}
      viewBox="0 0 40 54"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {!dashed && (
        <path
          d="M10.2 15h19.6l-.5 4c-.9 6.6-4.6 10-9.3 10s-8.4-3.4-9.3-10z"
          fill={stroke}
          fillOpacity={0.5}
        />
      )}
      <path
        d="M8 4h24l-1.3 15c-.9 7.6-5 11-10.7 11S10.2 26.6 9.3 19z M20 30v16 M12 48h16"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={dashed ? '3 3' : undefined}
      />
    </svg>
  )
}

/** 16 px colour dot used in lists ("Prik · 16 px i lister"). */
export function ColorDot({ hex, size = 16 }: { hex: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: hex,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)',
      }}
    />
  )
}
