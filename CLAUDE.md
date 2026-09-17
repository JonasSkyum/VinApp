# CLAUDE.md — Vinspil

## Hvad er projektet
Vinspil er en webapp (PWA), der lærer vin gennem spil. Den skal kunne tage en nybegynder hele vejen til at være skarp. Det er et hobbyprojekt uden krav om indtjening.

Spiltilstande:
1. **Blindsmagning (deduktion):** Appen viser en smagsprofil (farve, aroma, sødme, syre, tannin, alkohol, krop, eg, finish). Brugeren gætter sig trinvis frem: klima → drue → land → region → appellation. (Trinnet Gamle/Nye Verden er fjernet fra spillet; feltet `world` findes stadig i regionsdata.) Der gives point pr. trin og forklaring bagefter.
2. **Kortquiz (Seterra-stil):** "Klik på Barolo" eller "Hvilken region er markeret?". Kortet har INGEN labels.
3. **Daglig udfordring:** Én blindsmagning pr. dag, som er ens for alle, og som kan deles som en emoji-streng.
4. **Leksikon:** Sider for druer og regioner, som feedback fra spillene linker til.
5. **Træning:** Spaced repetition (Leitner) på druer, regioner og stilarter, plus en forvekslingsstatistik ("du forveksler Pinot Noir med Gamay").

Den fulde plan ligger i `docs/PLAN.md`. **Læs den før du starter på en opgave.**

## Stack
- React 19 + Vite + **TypeScript (strict)**
- Tailwind CSS v4 (`@tailwindcss/vite`)
- React Router med `HashRouter` (fordi appen hostes på GitHub Pages)
- MapLibre GL JS til kortet, med egne GeoJSON-lag og uden ekstern tile-server
- Zod til validering af indholdsdata
- Framer Motion til animationer
- Vitest + React Testing Library til tests
- vite-plugin-pwa
- Hosting: GitHub Pages via GitHub Actions (repo `JonasSkyum/VinApp`, så `base: '/VinApp/'`)
- Supabase (auth + synk af fremskridt) kommer først i fase 8. Indtil da er alt local-first med localStorage.

## Arkitektur
```
src/
  content/          # Vindata som TS/JSON — kilden til sandhed, versioneret i git
    grapes.ts
    regions.ts      # hierarki: country > region > subregion > appellation (parentId)
    styles.ts       # drue × region-kombinationer med profil-intervaller
    descriptors.ts  # kontrolleret ordforråd til aromaer
    geo/            # GeoJSON (lande + regioner)
  schema/           # Zod-skemaer + afledte TS-typer
  engine/           # REN logik, ingen React: case-generering, scoring, afstand, distraktorer, daglig seed, Leitner
  features/
    tasting/        # blindsmagning UI
    map-quiz/
    daily/
    lexicon/
    progress/
  components/       # delte UI-komponenter
  lib/              # storage, utils
  routes.tsx
scripts/
  validate-content.ts
docs/
  PLAN.md
  CONTENT-GUIDE.md
```

**Regel:** Al spillogik ligger i `src/engine/` som rene funktioner med tests. UI-komponenter kalder engine og indeholder ikke selv regler.

## Kommandoer
```
npm run dev              # dev-server
npm run build            # typecheck + build
npm run test             # vitest
npm run lint
npm run validate:content # validerer alt indhold mod zod-skemaer og krydsreferencer
```

## Miljø
- Udvikleren sidder på **Windows / PowerShell**. Brug PowerShell-kompatible kommandoer (ingen `&&`-kæder, som kræver bash, ingen `rm -rf`). Brug npm scripts, hvor det er muligt.
- Node LTS.

## Konventioner
- Kode, variabelnavne, commits og kommentarer skrives på **engelsk**. Al UI-tekst skrives på **dansk**.
- UI-tekster samles i `src/i18n/da.ts`, så de ikke hardcodes rundt omkring.
- Vinnavne står i originalsprog (Châteauneuf-du-Pape, Rías Baixas) med korrekte accenter. Id'er er kebab-case ASCII (`chateauneuf-du-pape`).
- Mobile-first. Alt skal kunne spilles med én tommelfinger.
- Små commits med én opgave pr. commit, Conventional Commits (`feat:`, `fix:`, `content:`, `test:`).
- Tilføj ikke nye afhængigheder uden at nævne det og begrunde det.

## Regler for vinindhold (VIGTIGT)
- **Du må ikke finde på vinfakta.** Hvis du er usikker på en værdi, skal du sætte `verified: false` og skrive en `note`.
- Alle styles, druer og regioner har felterne `verified: boolean` og `sources: string[]`. Nyt indhold er `verified: false`, indtil udvikleren har gennemgået det.
- Profilværdier bruger WSET SAT-lignende skala som **intervaller** `[min, max]` på 1–5 (1=lav, 2=medium-, 3=medium, 4=medium+, 5=høj).
- Hold dig til klassiske stilarter i starten (fx Sancerre = Sauvignon Blanc, Barolo = Nebbiolo). Tag ikke kanttilfælde med.
- Kør `npm run validate:content` efter enhver ændring i `src/content/`.
- Rækkefølgen i spillet og feedbacken må kun bygge på data. Forklaringer genereres ud fra de attributter, der adskiller stilarterne, og skrives ikke i fri tekst fra hukommelsen.

## Arbejdsgang
1. Find næste uafkrydsede opgave i `docs/PLAN.md`.
2. Beskriv kort, hvad du vil gøre, og gå så i gang.
3. Skriv tests til engine-kode, før eller mens du implementerer.
4. Kør `npm run test`, `npm run lint` og `npm run build`. Alle skal være grønne.
5. Sæt kryds ved opgaven i `docs/PLAN.md` og commit.
6. Stop ved slutningen af hver **fase** og giv et kort resumé: hvad er lavet, hvad udvikleren skal teste manuelt, og åbne spørgsmål.

## Ikke-mål (lige nu)
- Ingen monetisering, ingen reklamer.
- Ingen producenter/vinhuse før fase 11.
- Ingen native apps. PWA rækker.
- Ingen backend før fase 8.
