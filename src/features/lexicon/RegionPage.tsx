import { Link, useParams } from 'react-router-dom'
import { LazyWineMap } from '@/components/map/LazyWineMap'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { boundsOf, type Catalog } from '@/engine'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { interpolate } from '@/lib/text'
import { entryPath } from './search'
import {
  Breadcrumb,
  Chip,
  EntryHeader,
  Fact,
  GrapeLinks,
  NotFound,
  Section,
  StoryCard,
  StyleList,
} from './shared'

/** Degrees shown around a region with no sub-regions. */
const MAP_PADDING_DEG = { country: 3, region: 2, subregion: 1.5, appellation: 1 } as const

export function RegionPage({ catalog = defaultCatalog }: { catalog?: Catalog }) {
  const { id = '' } = useParams()
  const region = catalog.regions.find((r) => r.id === id)
  if (!region) return <NotFound />

  const children = catalog.childrenOf(region.id)
  const descendants = catalog.descendantsOf(region.id)
  const styles = catalog.stylesIn(region.id)
  const grapeIds = [...new Set(styles.flatMap((s) => s.grapeIds))]
  const points = [region, ...descendants]
    .filter((r) => r.type !== 'country')
    .map((r) => ({ id: r.id, lngLat: r.center }))
  const bounds = boundsOf(
    [region.center, ...descendants.map((r) => r.center)],
    MAP_PADDING_DEG[region.type],
  )

  return (
    <article className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <EntryHeader
        title={region.name}
        crumbs={<Breadcrumb region={region} catalog={catalog} />}
        subtitle={da.lexicon.regionType[region.type]}
        chips={
          <>
            {region.climate && (
              <Chip>
                <Icon
                  name={region.climate === 'warm' ? 'sun' : 'snow'}
                  size={12}
                  strokeWidth={2.2}
                />
                {da.climate[region.climate]}
              </Chip>
            )}
            <Chip>{da.lexicon.difficultyLabel[region.difficulty]}</Chip>
          </>
        }
        verified={region.verified}
        note={region.note}
        sources={region.sources}
      />

      <Card flush className="rounded-[24px]">
        <LazyWineMap
          label={interpolate(da.result.miniMap, { name: region.name })}
          points={points}
          highlightId={region.type === 'country' ? null : region.id}
          bounds={bounds}
          interactive={false}
          className="h-48 rounded-none"
        />
        {grapeIds.length > 0 && (
          <dl className="px-3.5">
            <Fact label={da.lexicon.grapesInRegion}>
              <GrapeLinks grapeIds={grapeIds} catalog={catalog} />
            </Fact>
          </dl>
        )}
      </Card>

      <StoryCard title={da.lexicon.story.region} story={region.story} />

      {children.length > 0 && (
        <Section title={da.lexicon.subregions}>
          <Card as="nav" flush>
            <ul className="divide-line divide-y">
              {children.map((c) => (
                <li key={c.id}>
                  <Link
                    to={entryPath({ kind: 'region', id: c.id })}
                    className="text-ink hover:bg-surface-2 flex min-h-14 items-center justify-between gap-2 px-3.5"
                  >
                    <span className="flex flex-col">
                      <span className="font-serif text-base font-semibold">{c.name}</span>
                      <span className="text-ink-2 text-xs">{da.lexicon.regionType[c.type]}</span>
                    </span>
                    <Icon name="chevronRight" size={18} strokeWidth={2.2} className="text-ink-2" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}

      <Section title={da.lexicon.stylesInRegion}>
        <StyleList styles={styles} catalog={catalog} />
      </Section>
    </article>
  )
}
