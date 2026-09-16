import type { Catalog } from '@/engine'
import { da } from '@/i18n/da'
import { normalize } from '@/lib/text'

export type EntryKind = 'grape' | 'region' | 'style'

export interface LexiconEntry {
  kind: EntryKind
  id: string
  name: string
  /** Secondary line: grape colour, region country, style region. */
  subtitle: string
  verified: boolean
  /** Lower-cased, accent-free text the query is matched against. */
  searchText: string
}

/** Flat index of everything the lexicon can show. Build once per catalog. */
export function lexiconIndex(catalog: Catalog): LexiconEntry[] {
  const grapes = catalog.grapes.map<LexiconEntry>((g) => ({
    kind: 'grape',
    id: g.id,
    name: g.name,
    subtitle: da.lexicon.grapeColor[g.color],
    verified: g.verified,
    searchText: normalize([g.name, ...g.aliases].join(' ')),
  }))
  const regions = catalog.regions.map<LexiconEntry>((r) => ({
    kind: 'region',
    id: r.id,
    name: r.name,
    subtitle: r.type === 'country' ? '' : catalog.countryOf(r.id).name,
    verified: r.verified,
    searchText: normalize(r.name),
  }))
  const styles = catalog.styles.map<LexiconEntry>((s) => ({
    kind: 'style',
    id: s.id,
    name: s.name,
    subtitle: catalog.region(s.regionId).name,
    verified: s.verified,
    searchText: normalize([s.name, ...s.grapeIds.map((g) => catalog.grape(g).name)].join(' ')),
  }))
  return [...grapes, ...regions, ...styles]
}

/**
 * Case- and accent-insensitive search. Entries whose name starts with the query
 * rank before those that merely contain it; ties keep index order.
 */
export function searchLexicon(index: LexiconEntry[], query: string, limit = 30): LexiconEntry[] {
  const needle = normalize(query)
  if (needle.length === 0) return []
  const scored: { entry: LexiconEntry; score: number }[] = []
  for (const entry of index) {
    if (!entry.searchText.includes(needle)) continue
    const name = normalize(entry.name)
    const score = name === needle ? 0 : name.startsWith(needle) ? 1 : 2
    scored.push({ entry, score })
  }
  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((s) => s.entry)
}

export function entryPath(entry: Pick<LexiconEntry, 'kind' | 'id'>): string {
  return `/lexicon/${entry.kind}s/${entry.id}`
}
