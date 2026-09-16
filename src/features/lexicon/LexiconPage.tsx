import { PageTitle } from '@/components/PageTitle'
import { da } from '@/i18n/da'

export function LexiconPage() {
  return (
    <>
      <PageTitle>{da.pages.lexicon.title}</PageTitle>
      <p>{da.pages.lexicon.placeholder}</p>
    </>
  )
}
