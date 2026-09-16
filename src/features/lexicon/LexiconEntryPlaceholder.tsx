import { Link, useParams } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { da } from '@/i18n/da'
import { catalog } from '@/lib/catalog'
import { interpolate } from '@/lib/text'

interface LexiconEntryPlaceholderProps {
  kind: 'grapes' | 'regions' | 'styles'
}

/** Stand-in for the lexicon pages until phase 5, so links from the games already resolve. */
export function LexiconEntryPlaceholder({ kind }: LexiconEntryPlaceholderProps) {
  const { id = '' } = useParams()
  const name = lookupName(kind, id)
  return (
    <>
      <PageTitle>{name ?? da.pages.notFound.title}</PageTitle>
      <p>{name ? interpolate(da.pages.lexicon.entryPlaceholder, { name }) : null}</p>
      <Link to="/lexicon" className="text-wine-700 underline">
        {da.pages.lexicon.title}
      </Link>
    </>
  )
}

function lookupName(kind: LexiconEntryPlaceholderProps['kind'], id: string): string | null {
  try {
    if (kind === 'grapes') return catalog.grape(id).name
    if (kind === 'regions') return catalog.region(id).name
    return catalog.style(id).name
  } catch {
    return null
  }
}
