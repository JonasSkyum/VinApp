/**
 * All user-facing UI text lives here (Danish).
 * Code, identifiers and comments stay in English.
 */
export const da = {
  app: {
    name: 'Vinspil',
    tagline: 'Lær vin gennem spil',
  },
  nav: {
    home: 'Hjem',
    tasting: 'Smag',
    map: 'Kort',
    daily: 'Daglig',
    lexicon: 'Leksikon',
    progress: 'Fremskridt',
    ariaLabel: 'Hovedmenu',
  },
  pages: {
    home: {
      title: 'Velkommen til Vinspil',
      intro: 'Træn din vinsmag gennem blindsmagning, kortquiz og daglige udfordringer.',
    },
    tasting: {
      title: 'Blindsmagning',
      placeholder: 'Blindsmagning kommer i fase 3.',
    },
    map: {
      title: 'Kortquiz',
      placeholder: 'Kortquiz kommer i fase 4.',
    },
    daily: {
      title: 'Daglig udfordring',
      placeholder: 'Daglig udfordring kommer i fase 7.',
    },
    lexicon: {
      title: 'Leksikon',
      placeholder: 'Leksikon kommer i fase 5.',
    },
    progress: {
      title: 'Fremskridt',
      placeholder: 'Fremskridt og træning kommer i fase 6.',
    },
    notFound: {
      title: 'Siden findes ikke',
      back: 'Tilbage til forsiden',
    },
  },
} as const
