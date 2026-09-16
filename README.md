# Vinspil

En webapp (PWA), der lærer dig vin gennem spil: blindsmagning, kortquiz, daglig udfordring, leksikon og spaced repetition-træning.

Live: `https://jonasskyum.github.io/VinApp/` (deployes automatisk fra `main`).

## Stack

React 19 · Vite · TypeScript (strict) · Tailwind CSS v4 · React Router (HashRouter) · Vitest + Testing Library · GitHub Pages via GitHub Actions.

Se [`CLAUDE.md`](CLAUDE.md) for arkitektur og konventioner og [`docs/PLAN.md`](docs/PLAN.md) for den faseopdelte plan.

## Kommandoer

```
npm install
npm run dev              # dev-server
npm run build            # typecheck + build
npm run test             # vitest (én kørsel)
npm run test:watch       # vitest i watch-mode
npm run test:coverage    # vitest med coverage (src/engine)
npm run lint             # eslint + prettier --check
npm run format           # prettier --write
npm run validate:content # validerer vinindhold mod zod-skemaer (fase 1)
```

## Struktur

```
src/
  content/    # vindata (kilden til sandhed)
  schema/     # zod-skemaer + typer
  engine/     # ren spillogik, ingen React
  features/   # tasting, map-quiz, daily, lexicon, progress
  components/ # delte UI-komponenter
  i18n/da.ts  # al UI-tekst (dansk)
  lib/        # storage, utils
scripts/      # validate-content.ts
docs/         # PLAN.md, CONTENT-GUIDE.md
```
