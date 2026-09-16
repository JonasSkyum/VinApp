import { PageTitle } from '@/components/PageTitle'
import { da } from '@/i18n/da'

export function MapQuizPage() {
  return (
    <>
      <PageTitle>{da.pages.map.title}</PageTitle>
      <p>{da.pages.map.placeholder}</p>
    </>
  )
}
