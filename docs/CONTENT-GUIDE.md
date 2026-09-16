# CONTENT-GUIDE.md — Sådan vedligeholder du vinindholdet

Alt vinindhold ligger i `src/content/` som TypeScript og er kilden til sandhed for hele appen.
Skemaerne i `src/schema/` afgør, hvad der er gyldigt. Kør altid `npm run validate:content`
efter ændringer — og `npm test`, som kører samme validering.

## Filer

| Fil | Indhold |
|---|---|
| `descriptors.ts` | Kontrolleret aromaordforråd (id på engelsk, `name` på dansk) |
| `grapes.ts` | Druer med typisk profil og nøglearomaer |
| `regions.ts` | Lande, regioner, subregioner og appellationer i et hierarki (`parentId`) |
| `styles.ts` | Klassiske stilarter = drue × region med fuld smagsprofil |
| `validate.ts` | Valideringslogik (ren funktion), bruges af script og tests |

## Skalaen (1–5)

Alle strukturelle værdier bruger en WSET SAT-lignende skala og angives som **intervaller** `[min, max]`:

| Værdi | Betydning | Eksempel (syre) |
|---|---|---|
| 1 | lav | Gewürztraminer |
| 2 | medium- | Viognier |
| 3 | medium | Napa Chardonnay |
| 4 | medium+ | Chablis |
| 5 | høj | Riesling, Sancerre |

Intervallet beskriver den *klassiske* stil, ikke alle mulige vine. `[3, 3]` betyder "næsten altid medium".
`[1, 5]` betyder "siger ingenting" og bør undgås i styles (det er okay i `grapes.typicalProfile`).

Attributter: `intensity` (aromaintensitet), `sweetness`, `acidity`, `tannin` (**null** for hvide),
`alcohol`, `body`, `finish`. Hertil `appearance` (farve) på styles.

### Farver (`appearance`)

- Hvid: `lemon-green` → `lemon` → `gold` → `amber`
- Rosé: `pink`, `salmon`, `orange`
- Rød: `purple` → `ruby` → `garnet` → `tawny`

Vælg den mest typiske farve for en ung-til-moden udgave af stilen.

### Eg (`oak`)

- `none`: ståltank/neutral beholder, ingen egnoter
- `light`: brugte fade eller store fustager, eg er til stede men ikke dominerende
- `pronounced`: nye fade, tydelig vanilje/ristet/kokos

## Sådan tilføjer du en style

1. Tjek, at druen findes i `grapes.ts` og regionen i `regions.ts`. Mangler regionen, tilføj den først med
   korrekt `parentId`, `world`, `climate` og `center` (`[lng, lat]`).
2. Tilføj et objekt i `styles.ts` med helper'en `s({...})`:

```ts
s({
  id: 'sancerre',                 // kebab-case ASCII, unik
  name: 'Sancerre',               // originalsprog med korrekte accenter
  color: 'white',                 // red | white | rosé | sparkling | sweet | fortified
  grapeIds: ['sauvignon-blanc'],  // vigtigste drue først
  regionId: 'sancerre',
  profile: {
    appearance: 'lemon-green',
    intensity: [3, 4], sweetness: [1, 1], acidity: [5, 5], tannin: null,
    alcohol: [2, 3], body: [2, 3], finish: [3, 4],
  },
  descriptorIds: ['gooseberry', 'grapefruit', 'grass', 'flint', 'elderflower'], // 3–8 stk.
  oak: 'none',
  difficulty: 1,                  // 1 = Begynder, 2 = Øvet, 3 = Ekspert
  note: 'Valgfri note til den, der skal verificere',
})
```

3. Kør `npm run validate:content`. Ret fejl. Læs advarsler: "near-identical profile" betyder, at to
   stilarter med samme farve næsten ikke kan skelnes i spillet — overvej om intervallerne kan strammes,
   eller om aromaerne bør adskille dem tydeligere.
4. Nyt indhold er altid `verified: false` (helperen sætter det). Find ikke på værdier — er du i tvivl,
   skriv en `note`.

## Regler, som validatoren håndhæver

- Alle id'er er unikke og kebab-case ASCII.
- Alle referencer (`grapeIds`, `regionId`, `parentId`, `descriptorIds`, `origin`) findes.
- Lande har `parentId: null` og `climate: null`; alle andre regioner har begge dele.
- Hierarkiet går kun nedad: country > region > subregion > appellation, og ender altid i et land.
- Røde styles har et `tannin`-interval, hvide har `tannin: null`.
- `appearance` passer til `color`, og druernes farve passer til stilens farve.
- Advarsel (ikke fejl): to styles med samme farve, hvis profiler ligger inden for et samlet gap på 2
  og deler mindst 2 aromaer — eller som har fuldstændig identisk struktur.
- Advarsel: en drue, som ikke indgår i nogen style.

## Sådan verificerer du en style

1. Slå stilen op i mindst én pålidelig kilde, fx WSET Level 3-materialet, *The World Atlas of Wine*,
   *Wine Folly* eller *The Oxford Companion to Wine*.
2. Ret intervaller, aromaer, `oak`, `climate` og `center`, så de matcher kilden.
3. Tilføj kilden i `sources` (fx `'WSET L3 Study Guide, 2022, s. 112'` eller en URL).
4. Sæt `verified: true` og fjern `note`, hvis den ikke længere er relevant.
5. Commit med prefix `content:`, fx `content: verify sancerre and chablis`.

Den daglige udfordring trækker kun på verificerede styles (når der er nok af dem), så verificering
har direkte betydning for spillet.
