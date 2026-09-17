import type { ReactNode } from 'react'
import { Heading } from './ui/Card'

interface PageTitleProps {
  children: ReactNode
  className?: string
}

export function PageTitle({ children, className = '' }: PageTitleProps) {
  return (
    <Heading as="h1" size="xl" className={`mb-4 ${className}`}>
      {children}
    </Heading>
  )
}
