import type { Catalog, TastingCase } from '@/engine'
import { da } from '@/i18n/da'
import type { StructureKey } from '@/schema'
import { appearanceLabel } from './labels'
import { ScaleBar } from './ScaleBar'

interface TastingCardProps {
  tastingCase: TastingCase
  catalog: Catalog
}

const PALATE: StructureKey[] = ['sweetness', 'acidity', 'tannin', 'alcohol', 'body', 'finish']

/** The case in WSET order: appearance, nose, palate. */
export function TastingCard({ tastingCase, catalog }: TastingCardProps) {
  const { profile, descriptorIds } = tastingCase
  return (
    <section
      aria-label={da.pages.tasting.title}
      className="border-wine-200 space-y-4 rounded-xl border bg-white p-4 shadow-sm"
    >
      <Block title={da.tastingCard.appearance}>
        <p className="text-sm">
          <span className="text-wine-900/80">{da.tastingCard.colour}: </span>
          <span className="font-medium">{appearanceLabel(profile.appearance)}</span>
        </p>
      </Block>

      <Block title={da.tastingCard.nose}>
        <ScaleBar attribute="intensity" value={profile.intensity} />
        <p className="text-sm">
          <span className="text-wine-900/80">{da.tastingCard.aromas}: </span>
          <span className="font-medium">
            {descriptorIds.map((id) => catalog.descriptor(id).name.toLowerCase()).join(', ')}
          </span>
        </p>
      </Block>

      <Block title={da.tastingCard.palate}>
        {PALATE.map((attribute) => {
          const value = profile[attribute]
          return value === null ? null : (
            <ScaleBar key={attribute} attribute={attribute} value={value} />
          )
        })}
      </Block>
    </section>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-wine-700 text-xs font-semibold tracking-wide uppercase">{title}</h3>
      {children}
    </div>
  )
}
