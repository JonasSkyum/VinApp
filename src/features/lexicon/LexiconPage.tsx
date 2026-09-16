import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import type { Catalog } from '@/engine'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { interpolate } from '@/lib/text'
import { entryPath, lexiconIndex, searchLexicon, type LexiconEntry } from './search'

interface LexiconPageProps {
  catalog?: Catalog
}

/** Search across grapes, regions and styles; browse lists when the query is empty. */
export function LexiconPage({ catalog = defaultCatalog }: LexiconPageProps) {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const index = useMemo(() => lexiconIndex(catalog), [catalog])
  const results = useMemo(() => searchLexicon(index, query), [index, query])

  return (
    <>
      <PageTitle>{da.pages.lexicon.title}</PageTitle>
      <input
        type="search"
        aria-label={da.lexicon.searchLabel}
        placeholder={da.lexicon.searchPlaceholder}
        value={query}
        onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
        className="border-wine-300 focus:border-wine-600 mb-6 w-full rounded-lg border bg-white px-3 py-3 text-base outline-none"
      />

      {query.trim().length > 0 ? (
        results.length === 0 ? (
          <p className="text-wine-900/70">{interpolate(da.lexicon.noResults, { query })}</p>
        ) : (
          <EntryList entries={results} />
        )
      ) : (
        <Browse catalog={catalog} index={index} />
      )}
    </>
  )
}

function Browse({ catalog, index }: { catalog: Catalog; index: LexiconEntry[] }) {
  const byKind = (kind: LexiconEntry['kind']) => index.filter((e) => e.kind === kind)
  const grapes = byKind('grape')
  const red = grapes.filter((g) => catalog.grape(g.id).color === 'red')
  const white = grapes.filter((g) => catalog.grape(g.id).color === 'white')
  const countries = byKind('region').filter((r) => catalog.region(r.id).type === 'country')
  const styles = byKind('style')

  return (
    <div className="space-y-8">
      <Section title={da.lexicon.redGrapes}>
        <EntryList entries={red} />
      </Section>
      <Section title={da.lexicon.whiteGrapes}>
        <EntryList entries={white} />
      </Section>
      <Section title={da.lexicon.countries}>
        <EntryList entries={countries} />
      </Section>
      <Section title={da.lexicon.styles}>
        <EntryList entries={styles} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-wine-800 mb-2 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export function EntryList({ entries }: { entries: LexiconEntry[] }) {
  return (
    <ul className="divide-wine-100 border-wine-200 divide-y rounded-xl border bg-white">
      {entries.map((entry) => (
        <li key={`${entry.kind}-${entry.id}`}>
          <Link
            to={entryPath(entry)}
            className="hover:bg-wine-50 flex items-center justify-between gap-2 px-4 py-3"
          >
            <span>
              <span className="font-medium">{entry.name}</span>
              {entry.subtitle && (
                <span className="text-wine-900/70 ml-2 text-sm">{entry.subtitle}</span>
              )}
            </span>
            <VerifiedBadge verified={entry.verified} compact />
          </Link>
        </li>
      ))}
    </ul>
  )
}
