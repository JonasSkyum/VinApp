import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap transition-[transform,box-shadow,background-color] duration-150 ease-out select-none disabled:cursor-not-allowed disabled:opacity-40'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'press bg-primary text-on-primary shadow-press hover:bg-primary-press',
  secondary: 'border-[1.5px] border-line bg-surface text-ink hover:bg-surface-2',
  soft: 'bg-primary-soft text-primary-ink hover:brightness-95',
  ghost: 'text-primary-ink hover:bg-primary-soft',
  danger: 'border-[1.5px] border-wrong text-wrong hover:bg-wrong-soft',
}

const SIZE: Record<ButtonSize, string> = {
  md: 'min-h-12 rounded-[14px] px-4 text-[15px]',
  lg: 'min-h-14 rounded-[18px] px-5 text-[17px] font-extrabold',
}

function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'lg',
  extra = '',
): string {
  return `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${extra}`.trim()
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  children: ReactNode
}

/** Tactile button: primary has the 3 px inner bottom edge that disappears on press. */
export function Button({
  variant = 'primary',
  size = 'lg',
  block = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, `${block ? 'w-full' : ''} ${className}`)}
      {...rest}
    >
      {children}
    </button>
  )
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  children: ReactNode
}

export function ButtonLink({
  variant = 'primary',
  size = 'lg',
  block = false,
  className = '',
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, `${block ? 'w-full' : ''} ${className}`)} {...rest}>
      {children}
    </Link>
  )
}

/** 44×44 round icon button (nav, close, zoom). */
export function IconButton({
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`border-line bg-surface text-ink-2 hover:text-ink inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
