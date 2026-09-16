# PLAN.md — Vinspil, step by step

Sæt `[x]` ved opgaver, efterhånden som de bliver færdige. Stop og giv et resumé efter hver fase.
Opgaver markeret **👤** skal udvikleren (Jonas) selv udføre, fordi de kræver login, konti eller vurdering af indhold.

---

## Fase 0 — Opsætning og deploy-pipeline
Mål: En tom app, der kører lokalt og automatisk bliver deployet til GitHub Pages.

- [x] 👤 Opret repo `vinspil` på GitHub (public, uden README) og clone det lokalt (oprettet som `JonasSkyum/VinApp`)
- [x] Scaffold Vite + React + TypeScript i repo-roden (`npm create vite@latest . -- --template react-ts`)
- [x] Slå `strict: true` til i tsconfig, og tilføj path-alias `@/` → `src/`
- [x] Installér og konfigurér Tailwind v4 via `@tailwindcss/vite`
- [x] Installér React Router, og opsæt `HashRouter` med tomme sider: `/`, `/tasting`, `/map`, `/daily`, `/lexicon`, `/progress`
- [x] Opsæt ESLint + Prettier
- [x] Opsæt Vitest + React Testing Library + én dummy-test
- [x] Tilføj npm scripts: `dev`, `build`, `test`, `lint`, `validate:content` (tomt script indtil videre)
- [x] Sæt `base: '/VinApp/'` i `vite.config.ts` (repoet hedder `VinApp`, ikke `vinspil`)
- [x] Opret `.github/workflows/deploy.yml`: på push til `main` køres install → lint → test → build → deploy til Pages
- [x] Opret `.github/workflows/ci.yml`: på pull requests køres lint + test + build
- [x] 👤 GitHub → Settings → Pages → Source: **GitHub Actions**
- [x] Opret `src/i18n/da.ts` til UI-tekster
- [x] Basis-layout: bundnavigation på mobil (Smag, Kort, Daglig, Leksikon, Fremskridt), topbar på desktop
- [x] Opret `README.md` med kort beskrivelse og kommandoer
- [x] ✅ Tjek: live URL `https://jonasskyum.github.io/VinApp/` viser appen, og navigationen virker

---

## Fase 1 — Datamodel og startindhold
Mål: Typestærke, validerede vindata, som resten af appen bygger på.

### 1.1 Skemaer (`src/schema/`)
- [x] `Level`-type: tal 1–5 og `Range = [min, max]` med refine `min <= max`
- [x] `Grape`: `id, name, aliases[], color ('red'|'white'), origin (countryId), typicalProfile (profil-intervaller), keyDescriptors[], notes, verified, sources[]`
- [x] `Region`: `id, name, type ('country'|'region'|'subregion'|'appellation'), parentId|null, world ('old'|'new'), climate ('cool'|'moderate'|'warm'), center [lng, lat], geoId?, difficulty (1–3), verified, sources[]`
- [x] `Style`: `id, name (fx "Sancerre"), color ('red'|'white'|'rosé'|'sparkling'|'sweet'|'fortified'), grapeIds[], regionId, profile, descriptorIds[], oak ('none'|'light'|'pronounced'), difficulty (1–3), verified, sources[], note?`
- [x] `Profile`: `appearance (white: 'lemon-green'|'lemon'|'gold'|'amber'; red: 'purple'|'ruby'|'garnet'|'tawny'), intensity: Range, sweetness: Range, acidity: Range, tannin: Range (null for hvid), alcohol: Range, body: Range, finish: Range`
- [x] `Descriptor`: `id, name (dansk), cluster ('citrus'|'green-fruit'|'stone-fruit'|'tropical'|'red-fruit'|'black-fruit'|'floral'|'herbal'|'spice'|'oak'|'earth'|'mineral'|'other'), primary|secondary|tertiary`
- [x] Eksportér afledte TS-typer via `z.infer`

### 1.2 Valideringsscript
- [x] `scripts/validate-content.ts` (kør med `tsx`): parser alt indhold mod skemaerne
- [x] Krydsreferencer: alle `grapeIds`, `regionId`, `parentId` og `descriptorIds` findes
- [x] Unikke id'er, kebab-case
- [x] Røde styles skal have tannin, hvide må ikke
- [x] Advarsel (ikke fejl): to styles med næsten identisk profil og samme farve. De bliver umulige at skelne i spillet
- [x] Udskriv statistik: antal verificerede/uverificerede pr. type
- [x] Kør scriptet i CI før build

### 1.3 Startindhold (alt `verified: false`)
- [x] `descriptors.ts`: ca. 60 aromaer fordelt på clusters
- [x] `grapes.ts`, 25 druer:
  - Rød: Cabernet Sauvignon, Merlot, Pinot Noir, Syrah/Shiraz, Grenache/Garnacha, Tempranillo, Sangiovese, Nebbiolo, Malbec, Zinfandel/Primitivo, Gamay, Cabernet Franc, Barbera
  - Hvid: Chardonnay, Sauvignon Blanc, Riesling, Chenin Blanc, Pinot Grigio/Gris, Gewürztraminer, Viognier, Albariño, Grüner Veltliner, Sémillon, Muscat, Garganega
- [x] `regions.ts`: lande + ca. 40 regioner/appellationer:
  - Frankrig: Bordeaux (Pauillac, Saint-Émilion, Sauternes), Bourgogne (Chablis, Côte de Nuits, Côte de Beaune), Beaujolais, Nordlige Rhône, Sydlige Rhône (Châteauneuf-du-Pape), Loire (Sancerre, Vouvray), Alsace, Champagne
  - Italien: Piemonte (Barolo), Toscana (Chianti Classico, Brunello di Montalcino), Veneto (Soave), Puglia
  - Spanien: Rioja, Ribera del Duero, Rías Baixas, Priorat
  - Portugal: Douro · Tyskland: Mosel, Rheingau · Østrig: Wachau
  - USA: Napa Valley, Sonoma, Willamette Valley
  - Australien: Barossa Valley, Clare Valley, Margaret River, Yarra Valley
  - New Zealand: Marlborough, Central Otago · Argentina: Mendoza · Chile: Maipo Valley · Sydafrika: Stellenbosch
- [x] `styles.ts`: ca. 50 klassiske stilarter (fx Sancerre, Chablis, Napa Cabernet, Barossa Shiraz, Mosel Riesling Kabinett, Marlborough Sauvignon Blanc, Barolo, Rioja Reserva, Beaujolais, Mendoza Malbec …). Hver drue skal indgå i mindst én style, og hvor det er muligt i både en Gamle Verden- og en Nye Verden-version, så eleven lærer klimaforskellen
- [x] Opret `docs/CONTENT-GUIDE.md`: skalaens betydning, hvordan man tilføjer en style, og hvordan man verificerer den
- [ ] 👤 Gennemgå de første 10 styles, ret værdier, sæt `verified: true` og tilføj kilder (WSET-materiale, Wine Folly, The World Atlas of Wine osv.)
- [x] ✅ Tjek: `npm run validate:content` er grøn

---

## Fase 2 — Spilmotor (`src/engine/`, ren TS, testet)
Mål: Al logik til blindsmagning uden UI.

- [x] `rng.ts`: seedbar PRNG (fx mulberry32) + `hashString(seed)`. Al tilfældighed skal gå gennem den, så tests og den daglige udfordring er deterministiske
- [x] `generateCase(style, difficulty, rng)`: vælger en konkret værdi inden for hvert interval og 3–5 descriptors fra stilens liste. På **Ekspert** kan der med lav sandsynlighed komme ±1 afvigelse på én attribut (flaskevariation)
- [x] `profileDistance(caseProfile, style)`: afstand mellem en case og en styles intervaller (0, hvis værdien ligger inden for intervallet), vægtet pr. attribut, plus descriptor-overlap
- [x] `rankCandidates(case, styles)`: sorteret liste over de mest sandsynlige styles. Bruges til distraktorer og feedback
- [x] `buildQuestion(case, tier, difficulty)`:
  - Begynder: multiple choice med 4 muligheder (korrekt + 3 nærmeste naboer af samme farve)
  - Øvet: 6 muligheder
  - Ekspert: fritekst med autocomplete over alle mulige svar
- [x] Trin (tiers) og point:
  | Trin | Spørgsmål | Point | Niveau |
  |---|---|---|---|
  | 1 | Gamle / Nye Verden | 1 | alle |
  | 2 | Klima (kølig/moderat/varm) | 1 | alle |
  | 3 | Drue | 3 | alle |
  | 4 | Land | 2 | alle |
  | 5 | Region | 3 | Øvet+ |
  | 6 | Appellation/stil | 5 | Ekspert |
- [x] `scoreRound(case, answers)`: point pr. trin + delvist korrekt (fx rigtigt land men forkert region, eller en region, der er "forælder" til den rigtige appellation)
- [x] `explain(case, correctStyle, guessedStyle)`: finder de 1–3 attributter, der mest adskiller den rigtige style fra den gættede, og returnerer strukturerede forklaringer (`{attribute, correct, guessed}`). UI oversætter dem til dansk tekst. Ingen fri tekst genereres fra hukommelsen
- [x] Tests: determinisme med samme seed, genererede værdier ligger altid i intervallerne, distraktorer har aldrig samme svar som det rigtige, scoring og explain på kendte par (Sancerre vs. Marlborough SB, Barolo vs. Bourgogne Rouge)
- [x] ✅ Tjek: `npm run test` er grøn med >90 % coverage i `engine/`

---

## Fase 3 — Blindsmagning UI (`features/tasting/`)
- [x] Startskærm: vælg niveau (Begynder/Øvet/Ekspert) + filter (rød/hvid/begge) + antal runder (5/10)
- [x] "Smagekort"-komponent, der viser casen i WSET-rækkefølge: Udseende → Næse → Gane. Skalaer vises som 5-trins visuelle bjælker med danske labels (lav, medium-, medium, medium+, høj)
- [x] Trinvis gætteflow: ét trin ad gangen, og svar låses, når man går videre. Profilen er synlig hele tiden
- [x] Resultatskærm pr. runde: rigtigt svar, point pr. trin og forklaringer fra `explain()` ("Syren var høj → det peger på køligt klima. Marlborough er varmere og mere tropisk end Sancerre")
- [x] Link fra resultatet til leksikon-siden for druen og regionen (placeholder-links indtil fase 5)
- [x] Mini-kort i resultatet, der viser, hvor vinen kommer fra (placeholder indtil fase 4)
- [x] Opsummering efter sessionen: total score, bedste/værste trin
- [x] Animationer med Framer Motion: flip ved afsløring, point der tæller op
- [x] Komponenttests for gætteflowet
- [ ] ✅ Tjek: 👤 spil 3 sessioner på mobil og notér, hvad der føles forkert

---

## Fase 4 — Kortquiz (`features/map-quiz/`)
- [x] Installér `maplibre-gl`. Brug en style **uden tile-server**: kun baggrundsfarve + egne GeoJSON-lag, så der ikke er labels, der afslører svaret
- [x] Hent lande-GeoJSON fra Natural Earth (public domain, 1:50m), forenkl filen (fx med mapshaper) og læg den i `src/content/geo/countries.json`
- [x] Regioner v1: vises som **punkter/cirkler** fra `region.center`. Polygoner kommer senere
- [ ] Regioner v2: 👤 tegn forenklede polygoner for de vigtigste regioner i geojson.io og læg dem i `src/content/geo/regions.json` med `geoId` → region
- [x] Tilstand A "Find": "Klik på Rioja". Point efter afstand til centrum/polygon (fuld point indenfor, aftagende med km)
- [x] Tilstand B "Navngiv": en region blinker, og brugeren vælger navnet (multiple choice eller autocomplete efter niveau)
- [x] Tilstand C "Drue → sted": "Hvor kommer klassisk Nebbiolo fra?"
- [x] Filtre: verden / land / sværhedsgrad. Start med zoom på det valgte land
- [x] Seterra-flow: fast sæt af spørgsmål, timer, og forkerte svar markeres rødt og vises til sidst
- [x] Genbrug kortkomponenten som mini-kort i blindsmagningens resultatskærm
- [x] Performance: lazy-load MapLibre, så appen starter hurtigt
- [ ] ✅ Tjek: kortet virker med touch (pinch-zoom, tap) på mobil

---

## Fase 5 — Leksikon (`features/lexicon/`)
- [x] `/lexicon/grapes/:id`: navn, aliaser, farve, typisk profil (samme bjælker som i spillet), nøglearomaer og liste over styles → links
- [x] `/lexicon/regions/:id`: breadcrumb (land > region > appellation), klima, Gamle/Nye Verden, mini-kort, druer og styles
- [x] `/lexicon/styles/:id`: fuld profil + "Forveksles ofte med" (de nærmeste naboer fra `rankCandidates`) med sammenligning side om side
- [x] Søgning på tværs af druer, regioner og styles
- [x] Badge for uverificeret indhold (`verified: false`), så man ved, hvad der endnu ikke er tjekket
- [x] Forbind alle links fra fase 3 og 4
- [x] ✅ Tjek: man kan navigere fra hvilket som helst spilresultat til relevant leksikon og tilbage

---

## Fase 6 — Fremskridt og træning (local-first)
- [x] `lib/storage.ts`: typed wrapper om localStorage med versionering og migrationer
- [x] `engine/leitner.ts`: 5 bokse pr. læringsenhed (grape, region, style, map-location). Rigtigt svar → op én boks, forkert → boks 1. Hver boks har et gentagelsesinterval
- [x] Log hvert svar: `{itemId, tier, correct, guessedId, timestamp}`
- [x] **Forvekslingsmatrix:** tæl (rigtig → gættet) par. Fremskridtssiden viser top 5 forvekslinger med link til sammenligning i leksikon
- [x] Tilstand "Træn svage punkter": en blindsmagningssession, hvor styles vælges ud fra lave Leitner-bokse og hyppige forvekslinger
- [x] Fremskridtsside: mestring pr. drue/region (procent), streak, XP-kurve og niveau
- [x] Oplåsning: Øvet låses op efter X korrekte druegæt på Begynder, Ekspert efter Y regioner. Kan slås fra i indstillinger
- [x] Eksport/import af fremskridt som JSON (backup, før der kommer synk)
- [x] ✅ Tjek: fremskridt overlever reload og deploy

---

## Fase 7 — Daglig udfordring (`features/daily/`)
- [x] Seed = dato i `Europe/Copenhagen` → `hashString` → vælg style blandt `verified: true` (fallback til alle, hvis der er for få)
- [x] Samme case for alle samme dag. Kan spilles én gang, og resultatet gemmes
- [x] Faste trin på Øvet-niveau
- [x] Delestreng i Wordle-stil, fx `Vinspil #42 🍷 🟩🟩🟩🟨⬛ 9/13`, via Web Share API med fallback til kopiering
- [x] Streak for daglige udfordringer
- [x] Nedtælling til næste udfordring
- [x] Tests: samme dato giver samme case, og forskellige datoer giver tilstrækkelig variation over 60 dage
- [ ] ✅ Tjek: 👤 del resultatet i en besked og se, at det ser pænt ud

---

## Fase 8 — Supabase: login og synk (valgfri)
- [ ] 👤 Opret Supabase-projekt (EU / Frankfurt), og læg `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` i `.env.local` og som GitHub Actions secrets
- [ ] Tabeller med RLS (bruger ser kun egne rækker): `profiles`, `answer_log`, `leitner_state`, `daily_results`
- [ ] Login med email + magic link (eller password)
- [ ] Synk-strategi: localStorage er primær. Ved login merges der (union af log, højeste boks vinder), hvorefter der pushes løbende med debounce
- [ ] Appen skal virke 100 % uden login
- [ ] Keep-alive, så gratisprojektet ikke pauses (fx planlagt GitHub Action, der pinger en simpel tabel)
- [ ] ✅ Tjek: fremskridt følger med fra telefon til computer

---

## Fase 9 — PWA og finpudsning
- [ ] `vite-plugin-pwa`: manifest, ikoner, offline cache af app + indhold + GeoJSON
- [ ] "Installer app"-prompt på mobil
- [ ] Mørkt tema (vinrødt/bordeaux-palet), og tjek kontrast
- [ ] Tilgængelighed: tastaturnavigation, aria-labels på skalaer, farver er ikke den eneste bærer af information
- [ ] Lydeffekter (valgfrit, slået fra som standard)
- [ ] Lighthouse: Performance og PWA ≥ 90
- [ ] Onboarding: 3 skærme, der forklarer skalaerne og deduktionsmetoden
- [ ] ✅ Tjek: appen kan installeres og spilles offline

---

## Fase 10 — Udvidelser (backlog, prioriteres senere)
- [ ] Flere stilarter: mousserende (Champagne, Cava, Prosecco), søde (Sauternes, Tokaji), hedvin (Port, Sherry), rosé
- [ ] Årgang/alder som trin 7 (primære → tertiære aromaer, farveudvikling)
- [ ] Producenter/vinhuse på kortet (Ekspert+)
- [ ] Progressive ledetråde som alternativ tilstand (bag et feature-flag, så det kan testes)
- [ ] **"Rigtig flaske"-tilstand:** brugeren udfylder smageskemaet for en vin, han faktisk smager, appen rangerer kandidater, og ejeren af flasken afslører svaret. God til vinaftener
- [ ] Multiplayer-vinaften: én vært og flere telefoner, der gætter samme case (Supabase Realtime)
- [ ] Jord og geologi, klassifikationer (Grand Cru, DOCG, Prädikat) som quiztemaer
- [ ] Indholdseditor i appen for admin (i stedet for at redigere TS-filer)
