import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Heading, Pill } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { ColorDot } from '@/components/ui/WineGlass'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import type { Catalog } from '@/engine'
import { da } from '@/i18n/da'
import { APPEARANCE_HEX } from '@/lib/palette'
import type { Region, Style } from '@/schema'
import { entryPath } from './search'

interface EntryHeaderProps {
  title: string
  /** Line under the title: "Pinot Noir · Bourgogne, Frankrig". */
  subtitle?: ReactNode
  /** Breadcrumb or category line above the title. */
  crumbs?: ReactNode
  /** Chips: colour, world, climate … */
  chips?: ReactNode
  verified: boolean
  note?: string | undefined
  sources?: string[]
}

/** Back link, breadcrumb, serif heading, chips (incl. the verification badge), note and sources. */
export function EntryHeader({
  title,
  subtitle,
  crumbs,
  chips,
  verified,
  note,
  sources = [],
}: EntryHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="flex flex-col gap-2.5">
      <div className="flex h-[52px] items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-ink -ml-2 flex min-h-11 items-center gap-0.5 px-2 text-[15px] font-bold"
        >
          <Icon name="chevronLeft" size={20} strokeWidth={2.4} />
          {da.lexicon.back}
        </button>
        <Link
          to="/lexicon"
          aria-label={da.lexicon.searchButton}
          className="border-line bg-surface text-ink flex h-11 w-11 items-center justify-center rounded-full border"
        >
          <Icon name="search" size={18} strokeWidth={2.2} />
        </Link>
      </div>
      {crumbs}
      <Heading as="h1" size="display">
        {title}
      </Heading>
      {subtitle && <div className="text-ink-2 text-[15px]">{subtitle}</div>}
      <div className="flex flex-wrap items-center gap-1.5">
        {chips}
        <VerifiedBadge verified={verified} compact />
      </div>
      {note && (
        <p className="text-ink-2 text-sm">
          <strong className="text-ink">{da.lexicon.note}:</strong> {note}
        </p>
      )}
      {sources.length > 0 && (
        <p className="text-ink-2 text-xs">
          {da.lexicon.sources}: {sources.join(' · ')}
        </p>
      )}
    </header>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <Heading size="lg">{title}</Heading>
      {children}
    </section>
  )
}

export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-line flex gap-2 border-b py-2 text-sm last:border-b-0">
      <dt className="text-ink-2 w-28 shrink-0">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  )
}

/** Neutral chip with an optional leading dot or icon. */
export function Chip({ children, dot }: { children: ReactNode; dot?: string }) {
  return (
    <Pill tone="neutral" className="font-bold">
      {dot && <ColorDot hex={dot} size={10} />}
      {children}
    </Pill>
  )
}

export function StyleList({ styles, catalog }: { styles: Style[]; catalog: Catalog }) {
  if (styles.length === 0) return <p className="text-ink-2 text-sm">{da.lexicon.noStyles}</p>
  return (
    <Card as="nav" flush>
      <ul className="divide-line divide-y">
        {styles.map((s) => (
          <li key={s.id}>
            <Link
              to={entryPath({ kind: 'style', id: s.id })}
              className="text-ink hover:bg-surface-2 flex min-h-14 items-center gap-2.5 px-3.5 py-2"
            >
              <ColorDot hex={APPEARANCE_HEX[s.profile.appearance]} size={14} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-serif text-base font-semibold">{s.name}</span>
                <span className="text-ink-2 text-xs">
                  {catalog.region(s.regionId).name} · {da.lexicon.styleColor[s.color]}
                </span>
              </span>
              <VerifiedBadge verified={s.verified} compact />
              <Icon name="chevronRight" size={18} strokeWidth={2.2} className="text-ink-2" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Country › region › appellation, each a link except the current one. */
export function Breadcrumb({ region, catalog }: { region: Region; catalog: Catalog }) {
  const chain = catalog.ancestors(region.id).reverse()
  return (
    <nav
      aria-label={da.lexicon.regions}
      className="text-ink-2 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold"
    >
      {chain.map((r, i) => (
        <span key={r.id} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden="true">›</span>}
          {r.id === region.id ? (
            <span className="text-ink font-extrabold">{r.name}</span>
          ) : (
            <Link
              to={entryPath({ kind: 'region', id: r.id })}
              className="text-ink-2 underline-offset-2 hover:underline"
            >
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
          <Link
            to={entryPath({ kind: 'grape', id })}
            className="text-primary-ink underline underline-offset-2"
          >
            {catalog.grape(id).name}
          </Link>
        </span>
      ))}
    </>
  )
}

export function NotFound() {
  return (
    <div className="flex flex-col items-start gap-2">
      <p>{da.lexicon.notFound}</p>
      <Link to="/lexicon" className="text-primary-ink underline underline-offset-2">
        {da.pages.lexicon.title}
      </Link>
    </div>
  )
}
