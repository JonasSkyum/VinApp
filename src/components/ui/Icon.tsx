import type { SVGProps } from 'react'

/** Stroke icons from the design system, all on a 24×24 grid. */
const PATHS = {
  glass: 'M8 3h8l-.6 6a3.4 3.4 0 0 1-6.8 0z M12 12.4V20 M8.5 20.5h7',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z M9 4v14 M15 6v14',
  star: 'M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z M5 17a3 3 0 0 1 3-3h11',
  chart: 'M5 20v-6 M12 20V9 M19 20V4 M3 21h18',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18',
  minus: 'M5 12h14',
  plus: 'M12 5v14M5 12h14',
  lock: 'M5 11h14v10H5z M8 11V8a4 4 0 0 1 8 0v3',
  chevronDown: 'M6 9l6 6 6-6',
  chevronUp: 'M6 15l6-6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  settings:
    'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  search: 'M11 4.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13z M16 16l4.5 4.5',
  share: 'M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
  copy: 'M9 9h12v12H9z M5 15V5a2 2 0 0 1 2-2h8',
  center: 'M12 5a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M12 2v3M12 19v3M2 12h3M19 12h3',
  clock: 'M12 5a8 8 0 1 0 0 16a8 8 0 1 0 0-16z M12 9v4l2.5 2M10 2h4',
  user: 'M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M4 21a8 8 0 0 1 16 0',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  info: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 11v5M12 8h.01',
  snow: 'M12 2v20M4 6l16 12M20 6L4 18',
  sun: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  home: 'M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z',
  download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  upload: 'M12 21V9M7 14l5-5 5 5M5 3h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  logout: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9',
  mail: 'M3 6h18v12H3z M3 7l9 6 9-6',
  swap: 'M8 7l-4 5 4 5M16 7l4 5-4 5',
  dice: 'M4 4h16v16H4z M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01',
  target: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z',
} as const

export type IconName = keyof typeof PATHS

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  strokeWidth?: number
  /** Accessible label; the icon is decorative when omitted. */
  label?: string
}

export function Icon({ name, size = 20, strokeWidth = 2, label, ...rest }: IconProps) {
  const fill = name === 'star' ? 'currentColor' : 'none'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

/** Half-filled circle for "partial", the flame for streaks. */
export function HalfIcon({ size = 20, label }: { size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
    </svg>
  )
}

export function FlameIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#E3A12F"
      stroke="#B3501F"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.5c1 3.2 5.5 5.3 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2.3 1.1-3.9 2.2-5 0 2.1 1 3.2 2.1 3.2 0-3.2-1-5.4 1.2-8.7z" />
    </svg>
  )
}
