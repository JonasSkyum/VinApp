import { Link, useParams } from 'react-router-dom'
import { RangeBar } from '@/components/RangeBar'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import { rangeSeparation, styleNeighbours, type Catalog } from '@/engine'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { appearanceLabel } from '@/lib/labels'
import { structureKeys, type Style } from '@/schema'
import { entryPath } from './search'
import { Breadcrumb, EntryHeader, Fact, GrapeLinks, NotFound, Section } from './shared'

const NEIGHBOUR_COUNT = 3

export function StylePage({ catalog = defaultCatalog }: { catalog?: Catalog }) {
  const { id = '' } = useParams()
  const style = catalog.styles.find((s) => s.id === id)
  if (!style) return <NotFound />

  const region = catalog.region(style.regionId)
  const neighbours = styleNeighbours(style, catalog.styles, NEIGHBOUR_COUNT)

  return (
    <article className="space-y-6">
      <EntryHeader
        title={style.name}
        subtitle={<Breadcrumb region={region} catalog={catalog} />}
        verified={style.verified}
        note={style.note}
        sources={style.sources}
      />

      <dl className="space-y-1">
        <Fact label={da.colorFilter.labelName}>{da.lexicon.styleColor[style.color]}</Fact>
        <Fact label={da.lexicon.grapes_}>
          <GrapeLinks grapeIds={style.grapeIds} catalog={catalog} />
        </Fact>
        <Fact label={da.lexicon.oak}>{da.oak[style.oak]}</Fact>
        <Fact label={da.lexicon.difficulty}>{da.lexicon.difficultyLabel[style.difficulty]}</Fact>
        <Fact label={da.lexicon.aromas}>
          {style.descriptorIds.map((d) => catalog.descriptor(d).name.toLowerCase()).join(', ')}
        </Fact>
      </dl>

      <Section title={da.lexicon.profile}>
        <div className="border-wine-200 space-y-2 rounded-xl border bg-white p-4">
          <p className="text-sm">
            <span className="text-wine-900/80">{da.tastingCard.colour}: </span>
            <span className="font-medium">{appearanceLabel(style.profile.appearance)}</span>
          </p>
          {structureKeys.map((key) => {
            const range = style.profile[key]
            return range === null ? null : <RangeBar key={key} attribute={key} range={range} />
          })}
        </div>
      </Section>

      {neighbours.length > 0 && (
        <Section title={da.lexicon.confusedWith}>
          <div className="space-y-2">
            {neighbours.map(({ style: other }) => (
              <details key={other.id} className="border-wine-200 rounded-xl border bg-white">
                <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3">
                  <span>
                    <Link
                      to={entryPath({ kind: 'style', id: other.id })}
                      className="text-wine-700 font-medium underline"
                    >
                      {other.name}
                    </Link>
                    <span className="text-wine-900/70 ml-2 text-sm">
                      {catalog.region(other.regionId).name}
                    </span>
                  </span>
                  <span className="text-wine-900/70 text-sm">{da.lexicon.compare}</span>
                </summary>
                <Comparison a={style} b={other} catalog={catalog} />
              </details>
            ))}
          </div>
        </Section>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/tasting" className="text-wine-700 underline">
          {da.lexicon.playTasting}
        </Link>
        <Link to="/map" className="text-wine-700 underline">
          {da.lexicon.playMap}
        </Link>
      </div>
    </article>
  )
}

/** Side-by-side ranges; rows where the two styles differ are emphasised. */
export function Comparison({ a, b, catalog }: { a: Style; b: Style; catalog: Catalog }) {
  const shared = a.descriptorIds.filter((d) => b.descriptorIds.includes(d))
  const onlyA = a.descriptorIds.filter((d) => !shared.includes(d))
  const onlyB = b.descriptorIds.filter((d) => !shared.includes(d))
  const name = (id: string) => catalog.descriptor(id).name.toLowerCase()

  return (
    <div className="border-wine-100 border-t px-4 py-3">
      <table className="w-full text-sm">
        <thead className="text-wine-900/70 text-left text-xs uppercase">
          <tr>
            <th className="w-28 py-1 font-semibold"></th>
            <th className="py-1 pr-2 font-semibold">{a.name}</th>
            <th className="py-1 font-semibold">{b.name}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-wine-100 border-t">
            <td className="text-wine-900/80 py-2">{da.tastingCard.colour}</td>
            <td className="py-2 pr-2">{appearanceLabel(a.profile.appearance)}</td>
            <td className="py-2">{appearanceLabel(b.profile.appearance)}</td>
          </tr>
          {structureKeys.map((key) => {
            const ra = a.profile[key]
            const rb = b.profile[key]
            if (ra === null || rb === null) return null
            const differs = rangeSeparation(ra, rb) > 0 || ra[0] !== rb[0] || ra[1] !== rb[1]
            return (
              <tr key={key} className="border-wine-100 border-t">
                <td className={`text-wine-900/80 py-2 ${differs ? 'font-semibold' : ''}`}>
                  {da.attribute[key]}
                </td>
                <td className="py-2 pr-2">
                  <RangeBar attribute={key} range={ra} emphasis={differs} hideName />
                </td>
                <td className="py-2">
                  <RangeBar attribute={key} range={rb} emphasis={differs} hideName />
                </td>
              </tr>
            )
          })}
          <tr className="border-wine-100 border-t align-top">
            <td className="text-wine-900/80 py-2">{da.lexicon.aromas}</td>
            <td className="py-2 pr-2">
              {shared.map(name).join(', ')}
              {onlyA.length > 0 && (
                <span className="text-wine-700 font-semibold">
                  {shared.length > 0 && ', '}
                  {onlyA.map(name).join(', ')}
                </span>
              )}
            </td>
            <td className="py-2">
              {shared.map(name).join(', ')}
              {onlyB.length > 0 && (
                <span className="text-wine-700 font-semibold">
                  {shared.length > 0 && ', '}
                  {onlyB.map(name).join(', ')}
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <VerifiedBadge verified={b.verified} compact />
    </div>
  )
}
