import { PageTitle } from '@/components/PageTitle'
import { ButtonLink } from '@/components/ui/Button'
import { da } from '@/i18n/da'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-start gap-2">
      <PageTitle>{da.pages.notFound.title}</PageTitle>
      <ButtonLink to="/" variant="soft" size="md">
        {da.pages.notFound.back}
      </ButtonLink>
    </div>
  )
}
