import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { Card, Heading } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { ColorDot } from '@/components/ui/WineGlass'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import type { Catalog } from '@/engine'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { APPEARANCE_HEX, STYLE_COLOR_HEX } from '@/lib/palette'
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
    <div className="flex flex-col gap-5">
      <PageTitle className="mb-0">{da.pages.lexicon.title}</PageTitle>
      <label className="relative block">
        <Icon
          name="search"
          size={18}
          strokeWidth={2.2}
          className="text-ink-2 pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
        />
        <input
          type="search"
          aria-label={da.lexicon.searchLabel}
          placeholder={da.lexicon.searchPlaceholder}
          value={query}
          onChange={(e) =>
            setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })
          }
          className="border-line bg-surface placeholder:text-ink-3 focus:border-primary-ink min-h-14 w-full rounded-full border-[1.5px] pr-4 pl-11 text-base font-semibold outline-none"
        />
      </label>

      {query.trim().length > 0 ? (
        results.length === 0 ? (
          <p className="text-ink-2">{interpolate(da.lexicon.noResults, { query })}</p>
        ) : (
          <EntryList entries={results} catalog={catalog} />
        )
      ) : (
        <Browse catalog={catalog} index={index} />
      )}
    </div>
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
    <div className="grid gap-6 md:grid-cols-2">
      <Section title={da.lexicon.redGrapes}>
        <EntryList entries={red} catalog={catalog} />
      </Section>
      <Section title={da.lexicon.whiteGrapes}>
        <EntryList entries={white} catalog={catalog} />
      </Section>
      <Section title={da.lexicon.countries}>
        <EntryList entries={countries} catalog={catalog} />
      </Section>
      <Section title={da.lexicon.styles}>
        <EntryList entries={styles} catalog={catalog} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <Heading size="lg">{title}</Heading>
      {children}
    </section>
  )
}

function entryDot(entry: LexiconEntry, catalog: Catalog): string | null {
  if (entry.kind === 'grape') return STYLE_COLOR_HEX[catalog.grape(entry.id).color]
  if (entry.kind === 'style') return APPEARANCE_HEX[catalog.style(entry.id).profile.appearance]
  return null
}

export function EntryList({ entries, catalog }: { entries: LexiconEntry[]; catalog: Catalog }) {
  return (
    <Card as="nav" flush>
      <ul className="divide-line divide-y">
        {entries.map((entry) => {
          const dot = entryDot(entry, catalog)
          return (
            <li key={`${entry.kind}-${entry.id}`}>
              <Link
                to={entryPath(entry)}
                className="text-ink hover:bg-surface-2 flex min-h-14 items-center gap-2.5 px-3.5 py-2"
              >
                {dot ? (
                  <ColorDot hex={dot} size={14} />
                ) : (
                  <Icon name="map" size={16} className="text-ink-2 shrink-0" />
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-serif text-base font-semibold">{entry.name}</span>
                  {entry.subtitle && <span className="text-ink-2 text-xs">{entry.subtitle}</span>}
                </span>
                <VerifiedBadge verified={entry.verified} compact />
                <Icon name="chevronRight" size={18} strokeWidth={2.2} className="text-ink-2" />
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
