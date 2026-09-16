import { Link, useParams } from 'react-router-dom'
import { RangeBar } from '@/components/RangeBar'
import type { Catalog } from '@/engine'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { interpolate } from '@/lib/text'
import { structureKeys } from '@/schema'
import { entryPath } from './search'
import { EntryHeader, Fact, NotFound, Section, StyleList } from './shared'

export function GrapePage({ catalog = defaultCatalog }: { catalog?: Catalog }) {
  const { id = '' } = useParams()
  const grape = catalog.grapes.find((g) => g.id === id)
  if (!grape) return <NotFound />

  const origin = catalog.region(grape.origin)
  const styles = catalog.stylesWithGrape(grape.id)

  return (
    <article className="space-y-6">
      <EntryHeader
        title={grape.name}
        subtitle={da.lexicon.grapeColor[grape.color]}
        verified={grape.verified}
        note={grape.notes}
        sources={grape.sources}
      />

      <dl className="space-y-1">
        {grape.aliases.length > 0 && (
          <Fact label={da.lexicon.aliases}>{grape.aliases.join(', ')}</Fact>
        )}
        <Fact label={da.lexicon.origin}>
          <Link
            to={entryPath({ kind: 'region', id: origin.id })}
            className="text-wine-700 underline"
          >
            {origin.name}
          </Link>
        </Fact>
        <Fact label={da.lexicon.keyAromas}>
          {grape.keyDescriptors.map((d) => catalog.descriptor(d).name.toLowerCase()).join(', ')}
        </Fact>
      </dl>

      <Section title={da.lexicon.typicalProfile}>
        <div className="border-wine-200 space-y-2 rounded-xl border bg-white p-4">
          {structureKeys.map((key) => {
            const range = grape.typicalProfile[key]
            return range === null ? null : <RangeBar key={key} attribute={key} range={range} />
          })}
        </div>
      </Section>

      <Section title={interpolate(da.lexicon.stylesWithGrape, { name: grape.name })}>
        <StyleList styles={styles} catalog={catalog} />
      </Section>
    </article>
  )
}
