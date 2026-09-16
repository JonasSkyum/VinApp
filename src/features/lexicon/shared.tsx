import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import type { Catalog } from '@/engine'
import { da } from '@/i18n/da'
import type { Region, Style } from '@/schema'
import { entryPath } from './search'

interface EntryHeaderProps {
  title: string
  subtitle?: ReactNode
  verified: boolean
  note?: string | undefined
  sources?: string[]
}

/** Back link, heading, verification badge, reviewer note and sources. */
export function EntryHeader({ title, subtitle, verified, note, sources = [] }: EntryHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="space-y-2">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-wine-700 text-sm underline"
      >
        ← {da.lexicon.back}
      </button>
      <h1 className="text-wine-800 text-2xl font-bold">{title}</h1>
      {subtitle && <div className="text-wine-900/80 text-sm">{subtitle}</div>}
      <VerifiedBadge verified={verified} />
      {note && (
        <p className="text-wine-900/80 text-sm">
          <strong>{da.lexicon.note}:</strong> {note}
        </p>
      )}
      {sources.length > 0 && (
        <p className="text-wine-900/70 text-xs">
          {da.lexicon.sources}: {sources.join(' · ')}
        </p>
      )}
    </header>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-wine-800 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <dt className="text-wine-900/70 w-28 shrink-0">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export function StyleList({ styles, catalog }: { styles: Style[]; catalog: Catalog }) {
  if (styles.length === 0) return <p className="text-wine-900/70 text-sm">{da.lexicon.noStyles}</p>
  return (
    <ul className="divide-wine-100 border-wine-200 divide-y rounded-xl border bg-white">
      {styles.map((s) => (
        <li key={s.id}>
          <Link
            to={entryPath({ kind: 'style', id: s.id })}
            className="hover:bg-wine-50 flex items-center justify-between gap-2 px-4 py-3"
          >
            <span>
              <span className="font-medium">{s.name}</span>
              <span className="text-wine-900/60 ml-2 text-sm">
                {catalog.region(s.regionId).name} · {da.lexicon.styleColor[s.color]}
              </span>
            </span>
            <VerifiedBadge verified={s.verified} compact />
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** Country › region › appellation, each a link except the current one. */
export function Breadcrumb({ region, catalog }: { region: Region; catalog: Catalog }) {
  const chain = catalog.ancestors(region.id).reverse()
  return (
    <nav aria-label={da.lexicon.regions} className="text-sm">
      {chain.map((r, i) => (
        <span key={r.id}>
          {i > 0 && <span className="text-wine-900/50"> › </span>}
          {r.id === region.id ? (
            <span className="font-medium">{r.name}</span>
          ) : (
            <Link to={entryPath({ kind: 'region', id: r.id })} className="text-wine-700 underline">
              {r.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}

export function GrapeLinks({ grapeIds, catalog }: { grapeIds: string[]; catalog: Catalog }) {
  return (
    <>
      {grapeIds.map((id, i) => (
        <span key={id}>
          {i > 0 && ', '}
          <Link to={entryPath({ kind: 'grape', id })} className="text-wine-700 underline">
            {catalog.grape(id).name}
          </Link>
        </span>
      ))}
    </>
  )
}

export function NotFound() {
  return (
    <div className="space-y-2">
      <p>{da.lexicon.notFound}</p>
      <Link to="/lexicon" className="text-wine-700 underline">
        {da.pages.lexicon.title}
      </Link>
    </div>
  )
}
