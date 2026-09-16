import { PageTitle } from '@/components/PageTitle'
import { da } from '@/i18n/da'

export function DailyPage() {
  return (
    <>
      <PageTitle>{da.pages.daily.title}</PageTitle>
      <p>{da.pages.daily.placeholder}</p>
    </>
  )
}
