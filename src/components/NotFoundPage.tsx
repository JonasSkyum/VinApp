import { Link } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { da } from '@/i18n/da'

export function NotFoundPage() {
  return (
    <>
      <PageTitle>{da.pages.notFound.title}</PageTitle>
      <Link to="/" className="text-wine-700 underline">
        {da.pages.notFound.back}
      </Link>
    </>
  )
}
