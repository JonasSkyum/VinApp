import { Link, useParams } from 'react-router-dom'
import { AromaChips } from '@/components/ui/AromaChip'
import { Card, Heading } from '@/components/ui/Card'
import { ScaleRow } from '@/components/ui/SegmentScale'
import type { Catalog } from '@/engine'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { STYLE_COLOR_HEX } from '@/lib/palette'
import { interpolate } from '@/lib/text'
import { structureKeys } from '@/schema'
import { entryPath } from './search'
import { Chip, EntryHeader, Fact, NotFound, Section, StoryCard, StyleList } from './shared'

export function GrapePage({ catalog = defaultCatalog }: { catalog?: Catalog }) {
  const { id = '' } = useParams()
  const grape = catalog.grapes.find((g) => g.id === id)
  if (!grape) return <NotFound />

  const origin = catalog.region(grape.origin)
  const styles = catalog.stylesWithGrape(grape.id)

  return (
    <article className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <EntryHeader
        title={grape.name}
        crumbs={
          <span className="text-ink-2 text-[13px] font-semibold">
            {da.lexicon.grapes} › {da.lexicon.grapeColor[grape.color]}
          </span>
        }
        chips={
          <>
            <Chip dot={STYLE_COLOR_HEX[grape.color]}>{da.lexicon.grapeColor[grape.color]}</Chip>
            <Chip>{da.world[origin.world]}</Chip>
          </>
        }
        verified={grape.verified}
        note={grape.notes}
        sources={grape.sources}
      />

      <Card as="dl" className="flex flex-col py-2">
        <Fact label={da.lexicon.origin}>
          <Link
            to={entryPath({ kind: 'region', id: origin.id })}
            className="text-primary-ink underline underline-offset-2"
          >
            {origin.name}
          </Link>
        </Fact>
        {grape.aliases.length > 0 && (
          <Fact label={da.lexicon.aliases}>{grape.aliases.join(', ')}</Fact>
        )}
      </Card>

      <StoryCard title={da.lexicon.story.grape} story={grape.story} />

      <Card
        as="section"
        aria-label={da.lexicon.typicalProfile}
        className="flex flex-col gap-3 rounded-[24px]"
      >
        <Heading size="md">{da.lexicon.typicalProfile}</Heading>
        <div className="flex flex-col gap-1.5">
          <span className="text-ink-2 text-xs font-bold">{da.lexicon.keyAromas}</span>
          <AromaChips ids={grape.keyDescriptors} catalog={catalog} />
        </div>
        {structureKeys.map((key) => {
          const range = grape.typicalProfile[key]
          return range === null ? null : <ScaleRow key={key} attribute={key} value={range} />
        })}
      </Card>

      <Section title={interpolate(da.lexicon.stylesWithGrape, { name: grape.name })}>
        <StyleList styles={styles} catalog={catalog} />
      </Section>
    </article>
  )
}
