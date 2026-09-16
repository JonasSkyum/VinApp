import { Link, useParams } from 'react-router-dom'
import { LazyWineMap } from '@/components/map/LazyWineMap'
import { boundsOf, type Catalog } from '@/engine'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { interpolate } from '@/lib/text'
import { entryPath } from './search'
import { Breadcrumb, EntryHeader, Fact, GrapeLinks, NotFound, Section, StyleList } from './shared'

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
    <article className="space-y-6">
      <EntryHeader
        title={region.name}
        subtitle={<Breadcrumb region={region} catalog={catalog} />}
        verified={region.verified}
        note={region.note}
        sources={region.sources}
      />

      <dl className="space-y-1">
        <Fact label={da.lexicon.regionType.region}>{da.lexicon.regionType[region.type]}</Fact>
        <Fact label={da.lexicon.world}>{da.world[region.world]}</Fact>
        {region.climate && <Fact label={da.lexicon.climate}>{da.climate[region.climate]}</Fact>}
        <Fact label={da.lexicon.difficulty}>{da.lexicon.difficultyLabel[region.difficulty]}</Fact>
        {grapeIds.length > 0 && (
          <Fact label={da.lexicon.grapesInRegion}>
            <GrapeLinks grapeIds={grapeIds} catalog={catalog} />
          </Fact>
        )}
      </dl>

      <LazyWineMap
        label={interpolate(da.result.miniMap, { name: region.name })}
        points={points}
        highlightId={region.type === 'country' ? null : region.id}
        bounds={bounds}
        interactive={false}
        className="border-wine-200 h-48 border"
      />

      {children.length > 0 && (
        <Section title={da.lexicon.subregions}>
          <ul className="divide-wine-100 border-wine-200 divide-y rounded-xl border bg-white">
            {children.map((c) => (
              <li key={c.id}>
                <Link
                  to={entryPath({ kind: 'region', id: c.id })}
                  className="hover:bg-wine-50 flex justify-between px-4 py-3"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-wine-900/60 text-sm">{da.lexicon.regionType[c.type]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={da.lexicon.stylesInRegion}>
        <StyleList styles={styles} catalog={catalog} />
      </Section>
    </article>
  )
}
