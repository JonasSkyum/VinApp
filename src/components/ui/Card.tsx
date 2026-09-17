import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'nav' | 'dl' | 'ul' | 'ol'
  /** `float` gets the deeper shadow used for the active panel. */
  elevation?: 'flat' | 'card' | 'float'
  /** Remove the inner padding, e.g. for lists that draw their own rows. */
  flush?: boolean
  children: ReactNode
}

/** Parchment surface with a 1 px line and rounded 22–24 px corners. */
export function Card({
  as: Tag = 'div',
  elevation = 'card',
  flush = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  const shadow = elevation === 'float' ? 'shadow-float' : elevation === 'card' ? 'shadow-card' : ''
  return (
    <Tag
      className={`border-line bg-surface rounded-[22px] border ${shadow} ${flush ? 'overflow-hidden' : 'p-4'} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3'
  size?: 'display' | 'xl' | 'lg' | 'md' | 'sm'
  children: ReactNode
}

const HEADING_SIZE = {
  display: 'text-[36px] leading-[1.05]',
  xl: 'text-[30px] leading-[1.1]',
  lg: 'text-[24px] leading-[1.15]',
  md: 'text-[21px] leading-[1.2]',
  sm: 'text-[18px] leading-[1.25]',
} as const

/** Serif heading (Fraunces 600), the "wine list" voice of the app. */
export function Heading({
  as: Tag = 'h2',
  size = 'md',
  className = '',
  children,
  ...rest
}: HeadingProps) {
  return (
    <Tag className={`font-serif font-semibold ${HEADING_SIZE[size]} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

/** Small uppercase label: "RUNDE 3 AF 10", "2 · NÆSE". */
export function Label({ className = '', children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`text-ink-2 text-[11px] font-extrabold tracking-[0.08em] uppercase ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
}

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'primary' | 'ok' | 'partial' | 'wrong' | 'dark'
  children: ReactNode
}

const PILL_TONE = {
  neutral: 'border border-line bg-surface text-ink',
  primary: 'bg-primary-soft text-primary-ink',
  ok: 'bg-ok-soft text-ok',
  partial: 'bg-partial-soft text-partial',
  wrong: 'bg-wrong-soft text-wrong',
  dark: 'bg-ink text-canvas',
} as const

export function Pill({ tone = 'neutral', className = '', children, ...rest }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${PILL_TONE[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
}

/** Horizontal rule inside cards. */
export function Divider({ className = '' }: { className?: string }) {
  return <div className={`bg-line h-px ${className}`} />
}
