import { Link } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import {
  boxOf,
  confusionMatrix,
  levelProgress,
  masteryByItem,
  streakDays,
  totalXp,
  xpByDay,
  type AnswerRecord,
  type Catalog,
  type ConfusionPair,
  type LeitnerState,
  type UnitKind,
} from '@/engine'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { interpolate } from '@/lib/text'
import { BackupPanel } from './BackupPanel'
import { useProgress } from './progressContext'

const XP_DAYS = 14
const TOP_CONFUSIONS = 5

interface ProgressPageProps {
  catalog?: Catalog
  now?: () => number
}

export function ProgressPage({ catalog = defaultCatalog, now = Date.now }: ProgressPageProps) {
  const { data, setUnlockingEnabled } = useProgress()
  const { log, leitner, settings } = data
  const xp = totalXp(log)
  const level = levelProgress(xp)
  const streak = streakDays(log, now())
  const curve = xpByDay(log, now(), XP_DAYS)
  const maxDay = Math.max(1, ...curve.map((d) => d.xp))
  const confusions = confusionMatrix(log).slice(0, TOP_CONFUSIONS)
  const xpLabel = interpolate(da.progress.xp, { current: level.current, needed: level.needed })

  return (
    <div className="space-y-8">
      <PageTitle>{da.pages.progress.title}</PageTitle>

      <section className="border-wine-200 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-wine-800 text-xl font-bold">
            {interpolate(da.progress.level, { level: level.level })}
          </h2>
          <span className="text-wine-900/70 text-sm">
            {interpolate(da.progress.totalXp, { xp })}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={level.needed}
          aria-valuenow={level.current}
          aria-label={xpLabel}
          className="bg-wine-100 mt-2 h-3 overflow-hidden rounded-full"
        >
          <div
            className="bg-wine-600 h-full rounded-full"
            style={{ width: `${Math.min(100, (100 * level.current) / level.needed)}%` }}
          />
        </div>
        <p className="text-wine-900/70 mt-1 text-xs">{xpLabel}</p>
        <p className="mt-3 text-sm">
          <span className="text-wine-900/70">{da.progress.streak}: </span>
          <span className="font-semibold">
            {interpolate(da.progress.streakDays, { days: streak })}
          </span>
        </p>
      </section>

      <section>
        <h2 className="text-wine-800 mb-2 text-lg font-semibold">
          {interpolate(da.progress.lastDays, { days: XP_DAYS })}
        </h2>
        <ul
          aria-label={interpolate(da.progress.lastDays, { days: XP_DAYS })}
          className="border-wine-200 flex h-24 items-end gap-1 rounded-xl border bg-white p-2"
        >
          {curve.map((d) => (
            <li
              key={d.day}
              title={`${d.xp} XP`}
              className="bg-wine-500 min-h-0.5 flex-1 rounded-t"
              style={{ height: `${(100 * d.xp) / maxDay}%` }}
            />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-wine-800 mb-2 text-lg font-semibold">{da.progress.confusions}</h2>
        {confusions.length === 0 ? (
          <p className="text-wine-900/70 text-sm">{da.progress.noConfusions}</p>
        ) : (
          <ul className="divide-wine-100 border-wine-200 divide-y rounded-xl border bg-white">
            {confusions.map((c) => (
              <ConfusionRow
                key={`${c.kind}-${c.correctId}-${c.guessedId}`}
                pair={c}
                catalog={catalog}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-wine-800 text-lg font-semibold">{da.progress.mastery}</h2>
        {log.length === 0 && <p className="text-wine-900/70 text-sm">{da.progress.noData}</p>}
        {(['grape', 'region', 'style', 'map-location'] as const).map((kind) => (
          <MasteryList key={kind} kind={kind} log={log} leitner={leitner} catalog={catalog} />
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-wine-800 text-lg font-semibold">{da.progress.settings}</h2>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={settings.unlockingEnabled}
            onChange={(e) => setUnlockingEnabled(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium">{da.progress.unlocking}</span>
            <br />
            <span className="text-wine-900/70">{da.progress.unlockingHelp}</span>
          </span>
        </label>
      </section>

      <BackupPanel />
    </div>
  )
}

const MASTERY_TITLE: Record<UnitKind, string> = {
  grape: da.progress.grapes,
  region: da.progress.regions,
  style: da.progress.styles,
  'map-location': da.progress.mapLocations,
}

function unitName(kind: UnitKind, id: string, catalog: Catalog): string {
  try {
    if (kind === 'grape') return catalog.grape(id).name
    if (kind === 'style') return catalog.style(id).name
    return catalog.region(id).name
  } catch {
    return id
  }
}

interface MasteryListProps {
  kind: UnitKind
  log: AnswerRecord[]
  leitner: LeitnerState
  catalog: Catalog
}

function MasteryList({ kind, log, leitner, catalog }: MasteryListProps) {
  const items = masteryByItem(log, kind)
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="text-wine-800 mb-1 font-semibold">{MASTERY_TITLE[kind]}</h3>
      <ul className="divide-wine-100 border-wine-200 divide-y rounded-xl border bg-white text-sm">
        {items.map((m) => {
          const box = boxOf(leitner, kind, m.id)
          const name = unitName(kind, m.id, catalog)
          return (
            <li key={m.id} className="flex items-center gap-3 px-3 py-2">
              <span className="w-32 shrink-0 truncate font-medium">{name}</span>
              <div
                role="img"
                aria-label={`${name}: ${m.percent ?? 0} %`}
                className="bg-wine-100 h-2 flex-1 overflow-hidden rounded-full"
              >
                <div className="bg-wine-600 h-full" style={{ width: `${m.percent ?? 0}%` }} />
              </div>
              <span className="text-wine-900/70 w-20 shrink-0 text-right text-xs tabular-nums">
                {interpolate(da.progress.answers, { correct: m.correct, total: m.total })}
              </span>
              <span className="text-wine-900/70 w-16 shrink-0 text-right text-xs">
                {box === 0 ? da.progress.unseen : interpolate(da.progress.box, { box })}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ConfusionRow({ pair, catalog }: { pair: ConfusionPair; catalog: Catalog }) {
  const { kind, correctId, guessedId, count } = pair
  const folder = kind === 'grape' ? 'grapes' : kind === 'style' ? 'styles' : 'regions'
  return (
    <li className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
      <Link to={`/lexicon/${folder}/${correctId}`} className="text-wine-700 underline">
        {interpolate(da.progress.confusionItem, {
          correct: unitName(kind, correctId, catalog),
          guessed: unitName(kind, guessedId, catalog),
        })}
      </Link>
      <span className="text-wine-900/70 shrink-0 text-xs">
        {interpolate(da.progress.confusionCount, { count })}
      </span>
    </li>
  )
}
