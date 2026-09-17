import { da } from '@/i18n/da'
import type { Appearance, DescriptorCluster, StyleColor } from '@/schema'

/** Glass colour for each appearance (design system "Vinstile og nuancer"). */
export const APPEARANCE_HEX: Record<Appearance, string> = {
  'lemon-green': '#DDE39A',
  lemon: '#EDD970',
  gold: '#DDB343',
  amber: '#C4832B',
  pink: '#F4B8C4',
  salmon: '#F2A594',
  orange: '#E8925A',
  purple: '#5A1E4E',
  ruby: '#9B1B30',
  garnet: '#7B2527',
  tawny: '#8E4A2A',
}

/** Accent dot for a style's colour category. */
export const STYLE_COLOR_HEX: Record<StyleColor, string> = {
  white: '#E8CF4E',
  red: '#B0213F',
  rosé: '#F2A594',
  sparkling: '#DDE39A',
  sweet: '#DDB343',
  fortified: '#8E4A2A',
}

export interface AromaFamily {
  /** Danish family name. */
  name: string
  /** Icon stroke colour. */
  color: string
  /** Icon background tint. */
  tint: string
  /** 24×24 stroke path. */
  path: string
}

/**
 * Twelve aroma families: the icon carries the family, the chip text carries the aroma.
 * Colours are the same in both themes; the tints are light enough to sit on dark surfaces.
 */
export const AROMA_FAMILY: Record<DescriptorCluster, AromaFamily> = {
  citrus: {
    name: 'Citrus',
    color: '#6E5C00',
    tint: '#F6EDB0',
    path: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 3v18 M3 12h18 M5.6 5.6l12.8 12.8 M18.4 5.6L5.6 18.4',
  },
  'green-fruit': {
    name: 'Grøn frugt',
    color: '#3F6A17',
    tint: '#DDEBC4',
    path: 'M12 7c-2-2-6-1.5-6.5 2.5C5 14 8 20 10.5 20c1 0 1-.6 1.5-.6s.5.6 1.5.6C16 20 19 14 18.5 9.5 18 5.5 14 5 12 7z M12 7c0-2 1-3.5 3-4',
  },
  'stone-fruit': {
    name: 'Stenfrugt',
    color: '#94490F',
    tint: '#F7D9BC',
    path: 'M12 5c4.5 0 8 3.5 8 8a7 7 0 0 1-8 7 7 7 0 0 1-8-7c0-4.5 3.5-8 8-8z M12 5c-1 3-1 9 0 15',
  },
  tropical: {
    name: 'Tropisk',
    color: '#855300',
    tint: '#F8E2A6',
    path: 'M8 13a4 5 0 1 0 8 0a4 5 0 1 0-8 0z M12 8V3 M12 8L9 5 M12 8l3-3 M9.5 12l5 5 M14.5 12l-5 5',
  },
  'red-fruit': {
    name: 'Rød frugt',
    color: '#9B1B30',
    tint: '#F5CCD4',
    path: 'M7 15a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M16 14a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M7 15c1-5 4-9 9-11 M16 14c-1-4-1-7 0-10',
  },
  'black-fruit': {
    name: 'Sort frugt',
    color: '#4A1F4F',
    tint: '#E0CCE3',
    path: 'M12 4a2 2 0 1 1 0 4a2 2 0 1 1 0-4z M9 8a2 2 0 1 1 0 4a2 2 0 1 1 0-4z M15 8a2 2 0 1 1 0 4a2 2 0 1 1 0-4z M12 12a2 2 0 1 1 0 4a2 2 0 1 1 0-4z M12 16a2 2 0 1 1 0 4a2 2 0 1 1 0-4z',
  },
  floral: {
    name: 'Blomster',
    color: '#8A3A7C',
    tint: '#EFD6EA',
    path: 'M12 10a2 2 0 1 0 0 4a2 2 0 1 0 0-4z M12 10c-2-3-1-6 0-7 1 1 2 4 0 7z M14 12c3-2 6-1 7 0-1 1-4 2-7 0z M12 14c2 3 1 6 0 7-1-1-2-4 0-7z M10 12c-3 2-6 1-7 0 1-1 4-2 7 0z',
  },
  herbal: {
    name: 'Urter',
    color: '#2F6B40',
    tint: '#D3E8D8',
    path: 'M5 19c0-8 5-14 14-14 0 9-6 14-14 14z M5 19l8-8',
  },
  spice: {
    name: 'Krydderi',
    color: '#7E3F22',
    tint: '#EED7C8',
    path: 'M12 3l2 6 6 .5-4.8 3.8 1.8 6.2L12 16l-5 3.5 1.8-6.2L4 9.5 10 9z',
  },
  oak: {
    name: 'Eg',
    color: '#6B4526',
    tint: '#E9DAC6',
    path: 'M7 3h10c1.5 3 1.5 15 0 18H7C5.5 18 5.5 6 7 3z M6 8h12 M6 16h12',
  },
  earth: {
    name: 'Jord',
    color: '#5E4E3A',
    tint: '#E4DCCF',
    path: 'M4 12a8 7 0 0 1 16 0z M10 12v6a2 2 0 0 0 4 0v-6',
  },
  mineral: {
    name: 'Mineral',
    color: '#4A5761',
    tint: '#DCE2E6',
    path: 'M7 4h10l4 6-9 11L3 10z M3 10h18 M10 4l-1 6 3 11 3-11-1-6',
  },
  other: {
    name: 'Andet',
    color: '#5E4E3A',
    tint: '#EDE4D6',
    path: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M9 10a3 3 0 0 1 6 0c0 2-3 2-3 4 M12 17.5h.01',
  },
}

/** "Rigtigt"/"Delvist"/"Forkert" colours as token names, so components can compose classes. */
export const OUTCOME_TONE = {
  correct: { fg: 'text-ok', bg: 'bg-ok-soft', label: da.outcome.correct, icon: 'check' },
  partial: { fg: 'text-partial', bg: 'bg-partial-soft', label: da.outcome.partial, icon: 'half' },
  wrong: { fg: 'text-wrong', bg: 'bg-wrong-soft', label: da.outcome.wrong, icon: 'x' },
  skipped: { fg: 'text-ink-2', bg: 'bg-surface-2', label: da.outcome.skipped, icon: 'minus' },
} as const

/** Ring/bar colour by mastery percentage: under 40 % amber, up to 75 % bordeaux, above green. */
export function masteryTone(percent: number): 'partial' | 'primary' | 'ok' {
  if (percent < 40) return 'partial'
  if (percent <= 75) return 'primary'
  return 'ok'
}
