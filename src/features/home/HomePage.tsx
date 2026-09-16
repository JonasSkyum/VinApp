import { PageTitle } from '@/components/PageTitle'
import { da } from '@/i18n/da'

export function HomePage() {
  return (
    <>
      <PageTitle>{da.pages.home.title}</PageTitle>
      <p>{da.pages.home.intro}</p>
    </>
  )
}
