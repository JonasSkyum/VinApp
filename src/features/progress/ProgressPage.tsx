import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { Button } from '@/components/ui/Button'
import { Card, Heading } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { ProgressBar, Ring } from '@/components/ui/Meters'
import {
  accuracyByTier,
  boxOf,
  confusionMatrix,
  levelProgress,
  longestStreak,
  masteryByItem,
  roundsPlayed,
  streakDays,
  totalXp,
  xpByDay,
  type AnswerRecord,
  type Catalog,
  type ConfusionPair,
  type LeitnerState,
  type TierAccuracy,
  type UnitKind,
} from '@/engine'
import { useTastingSessionContext } from '@/features/tasting/tastingSessionContext'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { masteryTone } from '@/lib/palette'
import { interpolate } from '@/lib/text'
import { useProgress } from './progressContext'

const HEAT_WEEKS = 18
const TOP_CONFUSIONS = 5
const MASTERY_KINDS: UnitKind[] = ['grape', 'region', 'style', 'map-location']
const WEAK_OPTIONS = { difficulty: 'advanced', colors: 'all', rounds: 5 } as const

interface ProgressPageProps {
  catalog?: Catalog
  now?: () => number
}

export function ProgressPage({ catalog = defaultCatalog, now = Date.now }: ProgressPageProps) {
  const { data } = useProgress()
  const { startWeak } = useTastingSessionContext()
  const navigate = useNavigate()
  const { log, leitner } = data
  const xp = totalXp(log)
  const level = levelProgress(xp)
  const streak = streakDays(log, now())
  const best = longestStreak(log)
  const wines = roundsPlayed(log)
  const confusions = confusionMatrix(log).slice(0, TOP_CONFUSIONS)
  const tiers = accuracyByTier(log)
  const xpLabel = interpolate(da.progress.xp, { current: level.current, needed: level.needed })
  const levelName =
    da.progress.levelNames[Math.min(level.level, da.progress.levelNames.length) - 1]!

  return (
    <div className="flex flex-col gap-4">
      <header className="flex h-12 items-center justify-between">
        <PageTitle className="mb-0">{da.pages.progress.title}</PageTitle>
        <Link
          to="/settings"
          aria-label={da.progress.profile}
          className="border-line bg-surface text-ink-2 flex h-11 w-11 items-center justify-center rounded-full border md:hidden"
        >
          <Icon name="user" size={20} />
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="bg-primary text-on-primary shadow-float flex flex-col gap-3 rounded-[24px] p-4">
          <div className="flex items-end justify-between">
            <h2 className="flex flex-col">
              <span className="text-xs font-extrabold tracking-[0.08em] opacity-85">
                {interpolate(da.progress.level, { level: level.level })}
              </span>
              <span className="font-serif text-[28px] leading-[1.1] font-semibold">
                {levelName}
              </span>
            </h2>
            <span className="text-[13px] font-bold tabular-nums">
              {interpolate(da.home.xpShort, { current: level.current, needed: level.needed })}
            </span>
          </div>
          <ProgressBar
            value={level.current / level.needed}
            height={10}
            inverted
            label={xpLabel}
            max={level.needed}
            now={level.current}
          />
          <dl className="grid grid-cols-3 gap-2 pt-1">
            <Stat
              value={interpolate(da.progress.streakDays, { days: streak })}
              label={da.progress.streak}
            />
            <Stat value={String(best)} label={da.progress.statBest} />
            <Stat value={String(wines)} label={da.progress.statWines} />
          </dl>
        </section>

        <Card as="section" aria-label={da.progress.activity} className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <Heading size="md">{da.progress.activity}</Heading>
            <span className="text-ink-2 text-xs font-bold">
              {interpolate(da.progress.activityRange, { weeks: HEAT_WEEKS })}
            </span>
          </div>
          <Heatmap log={log} now={now()} />
        </Card>
      </div>

      {log.length === 0 && <p className="text-ink-2 text-sm">{da.progress.noData}</p>}

      <MasteryCard log={log} leitner={leitner} catalog={catalog} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          as="section"
          aria-labelledby="confusions-title"
          className="flex flex-col gap-1 pb-1.5"
        >
          <Heading id="confusions-title" size="md" className="mb-1">
            {da.progress.confusions}
          </Heading>
          {confusions.length === 0 ? (
            <p className="text-ink-2 pb-2 text-sm">{da.progress.noConfusions}</p>
          ) : (
            <ol className="flex flex-col">
              {confusions.map((c, i) => (
                <ConfusionRow
                  key={`${c.kind}-${c.correctId}-${c.guessedId}`}
                  rank={i + 1}
                  pair={c}
                  catalog={catalog}
                />
              ))}
            </ol>
          )}
        </Card>

        <Card as="section" aria-labelledby="strengths-title" className="flex flex-col gap-2.5">
          <Heading id="strengths-title" size="md">
            {da.progress.strengthsTitle}
          </Heading>
          <StrengthsIntro tiers={tiers} />
          {tiers.map((t) => (
            <TierRow key={t.tier} stat={t} />
          ))}
          <Button
            block
            className="mt-1.5"
            disabled={log.length === 0}
            onClick={() => {
              startWeak(WEAK_OPTIONS)
              navigate('/tasting')
            }}
          >
            {da.progress.trainWeak}
          </Button>
        </Card>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-xs opacity-85">{label}</dt>
      <dd className="text-[22px] font-extrabold tabular-nums">{value}</dd>
    </div>
  )
}

/** GitHub-style activity grid: one column per week, Monday at the top. */
function Heatmap({ log, now }: { log: readonly AnswerRecord[]; now: number }) {
  const days = HEAT_WEEKS * 7
  const curve = xpByDay(log, now, days)
  // Shift so each column starts on a Monday: pad the first week with empty cells.
  const weekday = (new Date(now).getDay() + 6) % 7 // Monday = 0
  const lead = (((weekday - (days - 1)) % 7) + 7) % 7
  const cells = [...Array<{ xp: number } | null>(lead).fill(null), ...curve]
  const weeks: ({ xp: number } | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  const max = Math.max(1, ...curve.map((d) => d.xp))
  const level = (xp: number) => (xp === 0 ? 0 : Math.min(4, Math.ceil((4 * xp) / max)))
  const HEAT = [
    'bg-track',
    'bg-[var(--heat-1)]',
    'bg-[var(--heat-2)]',
    'bg-[var(--heat-3)]',
    'bg-[var(--heat-4)]',
  ]
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[14px_minmax(0,1fr)] gap-1.5">
        <div className="text-ink-2 grid grid-rows-7 gap-[3px] text-[9px] font-bold">
          {['M', '', 'O', '', 'F', '', 'S'].map((l, i) => (
            <span key={i} className="flex items-center">
              {l}
            </span>
          ))}
        </div>
        <div
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
        >
          {weeks.map((week, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, d) => {
                const cell = week[d]
                return (
                  <span
                    key={d}
                    title={cell ? `${cell.xp} XP` : undefined}
                    className={`aspect-square rounded-[3px] ${cell === undefined || cell === null ? 'bg-transparent' : HEAT[level(cell.xp)]}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="text-ink-2 flex items-center justify-end gap-1 text-[11px]">
        {da.progress.less}
        {HEAT.map((cls, i) => (
          <span key={i} className={`h-[11px] w-[11px] rounded-[3px] ${cls}`} />
        ))}
        {da.progress.more}
      </div>
    </div>
  )
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

function unitPath(kind: UnitKind, id: string): string {
  const folder = kind === 'grape' ? 'grapes' : kind === 'style' ? 'styles' : 'regions'
  return `/lexicon/${folder}/${id}`
}

interface MasteryCardProps {
  log: readonly AnswerRecord[]
  leitner: LeitnerState
  catalog: Catalog
}

function MasteryCard({ log, leitner, catalog }: MasteryCardProps) {
  const [kind, setKind] = useState<UnitKind>('grape')
  const items = masteryByItem(log, kind)
  return (
    <Card as="section" aria-labelledby="mastery-title" className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading id="mastery-title" size="md">
          {da.progress.mastery}
        </Heading>
        <div
          role="tablist"
          aria-label={da.progress.mastery}
          className="bg-surface-2 flex rounded-full p-[3px]"
        >
          {MASTERY_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === kind}
              onClick={() => setKind(k)}
              className={`min-h-9 rounded-full px-3.5 text-[13px] ${
                k === kind
                  ? 'bg-surface text-ink shadow-card font-extrabold'
                  : 'text-ink-2 font-bold'
              }`}
            >
              {da.progress.masteryTabs[k]}
            </button>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-ink-2 text-sm">{da.progress.empty}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 md:grid-cols-6">
          {items.map((m) => {
            const box = boxOf(leitner, kind, m.id)
            const name = unitName(kind, m.id, catalog)
            return (
              <li key={m.id} className="flex flex-col items-center gap-1.5 text-center">
                <Link to={unitPath(kind, m.id)} className="flex flex-col items-center gap-1.5">
                  <Ring percent={m.percent ?? 0} label={name} />
                  <span className="text-xs leading-tight font-bold">{name}</span>
                </Link>
                <span className="text-ink-2 text-[11px] tabular-nums">
                  {interpolate(da.progress.answers, { correct: m.correct, total: m.total })} ·{' '}
                  {box === 0 ? da.progress.unseen : interpolate(da.progress.box, { box })}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function ConfusionRow({
  rank,
  pair,
  catalog,
}: {
  rank: number
  pair: ConfusionPair
  catalog: Catalog
}) {
  const { kind, correctId, guessedId, count } = pair
  return (
    <li className="border-line flex items-center gap-2.5 border-t py-2.5">
      <span className="bg-surface-2 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-xs font-extrabold">
        {rank}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm leading-snug">
          {da.progress.confusionSentence
            .split(/\{(guessed|correct)\}/)
            .map((part, i) =>
              part === 'guessed' ? (
                <b key={i}>{unitName(kind, guessedId, catalog)}</b>
              ) : part === 'correct' ? (
                <b key={i}>{unitName(kind, correctId, catalog)}</b>
              ) : (
                part
              ),
            )}
        </span>
        <span className="text-partial text-xs font-bold">
          {interpolate(da.progress.confusionCount, { count })}
        </span>
      </div>
      <Link
        to={unitPath(kind, correctId)}
        aria-label={`${da.progress.compare}: ${interpolate(da.progress.confusionItem, {
          correct: unitName(kind, correctId, catalog),
          guessed: unitName(kind, guessedId, catalog),
        })}`}
        className="border-line text-ink flex min-h-11 shrink-0 items-center rounded-full border-[1.5px] px-3 text-[13px] font-extrabold"
      >
        {da.progress.compare}
      </Link>
    </li>
  )
}

function tierName(tier: TierAccuracy['tier']): string {
  return tier === 'map' ? da.progress.masteryTabs['map-location'] : da.tier.short[tier]
}

function StrengthsIntro({ tiers }: { tiers: TierAccuracy[] }) {
  if (tiers.length < 2) return <p className="text-ink-2 text-sm">{da.progress.strengthsNoData}</p>
  const sorted = [...tiers].sort((a, b) => b.percent - a.percent)
  return (
    <p className="text-ink-2 text-sm leading-snug">
      {interpolate(da.progress.strengthsIntro, {
        strong: tierName(sorted[0]!.tier),
        weak: tierName(sorted[sorted.length - 1]!.tier),
      })}
    </p>
  )
}

function TierRow({ stat }: { stat: TierAccuracy }) {
  const tone = masteryTone(stat.percent)
  const bar = tone === 'ok' ? 'bg-ok' : tone === 'partial' ? 'bg-partial-fill' : 'bg-scale-on'
  const tag =
    tone === 'ok'
      ? ['bg-ok-soft text-ok', da.progress.tagStrong]
      : tone === 'partial'
        ? ['bg-partial-soft text-partial', da.progress.tagWeak]
        : ['bg-surface-2 text-ink-2', da.progress.tagOk]
  return (
    <div
      role="img"
      aria-label={`${tierName(stat.tier)}: ${stat.percent} %`}
      className="grid min-h-[26px] grid-cols-[88px_minmax(0,1fr)_40px_58px] items-center gap-2"
    >
      <span className="truncate text-[13px] font-bold">{tierName(stat.tier)}</span>
      <div className="bg-track h-2.5 rounded-full">
        <div className={`h-2.5 rounded-full ${bar}`} style={{ width: `${stat.percent}%` }} />
      </div>
      <span className="text-right text-[13px] font-extrabold tabular-nums">{stat.percent}%</span>
      <span
        className={`justify-self-end rounded-full px-[7px] py-0.5 text-[11px] font-extrabold ${tag[0]}`}
      >
        {tag[1]}
      </span>
    </div>
  )
}
