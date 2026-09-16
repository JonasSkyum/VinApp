import { PageTitle } from '@/components/PageTitle'
import { da } from '@/i18n/da'

export function TastingPage() {
  return (
    <>
      <PageTitle>{da.pages.tasting.title}</PageTitle>
      <p>{da.pages.tasting.placeholder}</p>
    </>
  )
}
