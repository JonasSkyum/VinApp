import type { ReactNode } from 'react'

interface PageTitleProps {
  children: ReactNode
}

export function PageTitle({ children }: PageTitleProps) {
  return <h1 className="text-wine-800 mb-4 text-2xl font-bold">{children}</h1>
}
