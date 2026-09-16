import { PageTitle } from '@/components/PageTitle'
import { da } from '@/i18n/da'

export function ProgressPage() {
  return (
    <>
      <PageTitle>{da.pages.progress.title}</PageTitle>
      <p>{da.pages.progress.placeholder}</p>
    </>
  )
}
