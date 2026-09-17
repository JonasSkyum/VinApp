import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StreakPill } from '@/components/AppLayout'
import { PageTitle } from '@/components/PageTitle'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card, Heading, Pill } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { ProgressBar } from '@/components/ui/Meters'
import { GlassOutline } from '@/components/ui/WineGlass'
import {
  confusionMatrix,
  dailyDateKey,
  dailyNumber,
  dailyStreak,
  formatCountdown,
  levelProgress,
  totalXp,
  type Catalog,
  type ConfusionPair,
} from '@/engine'
import { useCountdown } from '@/features/daily/useCountdown'
import { Onboarding } from '@/features/onboarding/Onboarding'
import { useProgress } from '@/features/progress/progressContext'
import { usePrefs } from '@/features/settings/prefsContext'
import { useTastingSessionContext } from '@/features/tasting/tastingSessionContext'
import { da } from '@/i18n/da'
import { catalog as defaultCatalog } from '@/lib/catalog'
import { APPEARANCE_HEX, STYLE_COLOR_HEX } from '@/lib/palette'
import { interpolate } from '@/lib/text'

const WEAK_PAIRS = 3
const WEAK_OPTIONS = { difficulty: 'advanced', colors: 'both', rounds: 5 } as const

function greeting(hour: number): string {
  if (hour < 10) return da.home.greetingMorning
  if (hour < 17) return da.home.greetingDay
  return da.home.greetingEvening
}

/** Entry point: the introduction on first visit, otherwise today's challenge and the modes. */
export function HomePage({ catalog = defaultCatalog }: { catalog?: Catalog }) {
  const { prefs, update } = usePrefs()
  const [showGuide, setShowGuide] = useState(false)

  if (!prefs.onboardingDone || showGuide) {
    return (
      <>
        <PageTitle>{da.pages.home.title}</PageTitle>
        <Onboarding
          onDone={() => {
            update({ onboardingDone: true })
            setShowGuide(false)
          }}
        />
      </>
    )
  }

  return <Dashboard catalog={catalog} onShowGuide={() => setShowGuide(true)} />
}

function Dashboard({ catalog, onShowGuide }: { catalog: Catalog; onShowGuide: () => void }) {
  const { data } = useProgress()
  const { startWeak } = useTastingSessionContext()
  const navigate = useNavigate()
  const remaining = useCountdown()
  const [now] = useState(() => new Date())

  const todayKey = dailyDateKey(now.getTime())
  const playedToday = todayKey in data.daily
  const streak = dailyStreak(data.daily, todayKey)
  const level = levelProgress(totalXp(data.log))
  const confusions = confusionMatrix(data.log).slice(0, WEAK_PAIRS)

  return (
    <div className="flex flex-col gap-4">
      <header className="flex h-12 items-center justify-between md:hidden">
        <Link to="/" className="text-primary-ink font-serif text-2xl font-bold">
          {da.app.name}
        </Link>
        <div className="flex items-center gap-2">
          <StreakPill days={streak} />
          <Link
            to="/settings"
            aria-label={da.nav.settings}
            className="border-line bg-surface text-ink-2 flex h-11 w-11 items-center justify-center rounded-full border"
          >
            <Icon name="settings" size={20} strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      <section className="flex flex-col gap-2.5">
        <Heading as="h1" size="xl">
          {greeting(now.getHours())}
        </Heading>
        <div className="flex items-center gap-2.5">
          <span className="bg-primary-soft text-primary-ink shrink-0 rounded-lg px-2 py-[3px] text-xs font-extrabold whitespace-nowrap">
            {interpolate(da.home.levelShort, { level: level.level })}
          </span>
          <ProgressBar
            value={level.current / level.needed}
            label={interpolate(da.progress.xp, { current: level.current, needed: level.needed })}
            max={level.needed}
            now={level.current}
          />
          <span className="text-ink-2 shrink-0 text-xs font-bold tabular-nums">
            {interpolate(da.home.xpShort, { current: level.current, needed: level.needed })}
          </span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section
          aria-label={da.pages.daily.title}
          className="bg-primary text-on-primary shadow-float relative flex flex-col gap-3.5 overflow-hidden rounded-[24px] p-5"
        >
          <GlassOutline
            size={200}
            stroke="#FBF5E9"
            className="pointer-events-none absolute -top-2.5 -right-6 opacity-[0.16]"
          />
          <div className="relative flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-[0.08em]">
              {interpolate(da.home.dailyLabel, { number: dailyNumber(todayKey) })}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/[0.18] px-2.5 py-1 text-xs font-extrabold">
              <span
                aria-hidden="true"
                className={`h-[7px] w-[7px] rounded-full ${playedToday ? 'bg-ok' : 'bg-style-white'}`}
              />
              {playedToday ? da.home.dailyPlayed : da.home.dailyNotPlayed}
            </span>
          </div>
          <div className="relative flex flex-col gap-1">
            <span className="font-serif text-[27px] leading-[1.1] font-semibold">
              {da.home.dailyTitle}
            </span>
            <span className="text-sm opacity-90">{da.home.dailySubtitle}</span>
          </div>
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-semibold opacity-85">{da.home.dailyNextIn}</span>
              <span
                className="text-xl font-extrabold tabular-nums"
                aria-label={da.daily.countdownLabel}
              >
                {formatCountdown(remaining)}
              </span>
            </div>
            <Link
              to="/daily"
              className="press bg-paper text-bordeaux flex min-h-[52px] items-center gap-2 rounded-full px-6 text-base font-extrabold"
              style={{ boxShadow: 'inset 0 -3px 0 rgba(122,31,61,.2)' }}
            >
              {playedToday ? da.home.dailySeeResult : da.home.dailyPlay}
              <Icon name="arrowRight" size={16} strokeWidth={2.6} />
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <ModeCard
            to="/tasting"
            title={da.pages.tasting.title}
            help={da.pages.home.tastingHelp}
            icon="glass"
            tint="#F6EDB0"
            color="#6E5C00"
          />
          <ModeCard
            to="/map"
            title={da.pages.map.title}
            help={da.pages.home.mapHelp}
            icon="map"
            tint="#DCE2E6"
            color="#3E4C56"
          />
        </section>
      </div>

      <Card as="section" className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Heading size="md">{da.home.weakTitle}</Heading>
          <span className="text-ink-2 text-xs font-bold">{da.home.weakSubtitle}</span>
        </div>
        {confusions.length === 0 ? (
          <div className="border-line bg-canvas mt-2 flex flex-col items-center gap-2.5 rounded-[20px] border-[1.5px] border-dashed px-5 py-7 text-center">
            <GlassOutline size={64} dashed />
            <span className="font-serif text-xl font-semibold">{da.home.weakEmptyTitle}</span>
            <span className="text-ink-2 max-w-[260px] text-sm">{da.home.weakEmptyHelp}</span>
            <ButtonLink to="/tasting" size="md" className="mt-1 rounded-full px-[18px]">
              {da.home.weakEmptyButton}
            </ButtonLink>
          </div>
        ) : (
          <>
            {confusions.map((pair) => (
              <WeakRow
                key={`${pair.kind}-${pair.correctId}-${pair.guessedId}`}
                pair={pair}
                catalog={catalog}
              />
            ))}
            <Button
              variant="soft"
              size="md"
              block
              className="mt-2"
              onClick={() => {
                startWeak(WEAK_OPTIONS)
                navigate('/tasting')
              }}
            >
              {interpolate(da.home.weakTrain, { count: confusions.length })}
            </Button>
          </>
        )}
      </Card>

      <button
        type="button"
        onClick={onShowGuide}
        className="text-ink-2 self-center text-sm font-bold underline underline-offset-2"
      >
        {da.pages.home.howToPlay}
      </button>
    </div>
  )
}

function ModeCard({
  to,
  title,
  help,
  icon,
  tint,
  color,
}: {
  to: string
  title: string
  help: string
  icon: 'glass' | 'map'
  tint: string
  color: string
}) {
  return (
    <Link
      to={to}
      className="press border-line bg-surface text-ink shadow-tactile flex min-h-[140px] flex-col justify-between gap-3 rounded-[22px] border p-4"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-[14px]"
        style={{ background: tint, color }}
      >
        <Icon name={icon} size={26} strokeWidth={1.8} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-serif text-xl font-semibold">{title}</span>
        <span className="text-ink-2 text-[13px]">{help}</span>
      </span>
    </Link>
  )
}

function unitInfo(kind: ConfusionPair['kind'], id: string, catalog: Catalog) {
  try {
    if (kind === 'grape') {
      const g = catalog.grape(id)
      return { name: g.name, hex: STYLE_COLOR_HEX[g.color], path: `/lexicon/grapes/${id}` }
    }
    if (kind === 'style') {
      const s = catalog.style(id)
      return {
        name: s.name,
        hex: APPEARANCE_HEX[s.profile.appearance],
        path: `/lexicon/styles/${id}`,
      }
    }
    return { name: catalog.region(id).name, hex: '#BCA88A', path: `/lexicon/regions/${id}` }
  } catch {
    return { name: id, hex: '#BCA88A', path: '/lexicon' }
  }
}

function WeakRow({ pair, catalog }: { pair: ConfusionPair; catalog: Catalog }) {
  const a = unitInfo(pair.kind, pair.correctId, catalog)
  const b = unitInfo(pair.kind, pair.guessedId, catalog)
  return (
    <Link
      to={a.path}
      className="border-line text-ink flex min-h-[52px] items-center gap-2.5 border-b last:border-b-0"
    >
      <span className="flex" aria-hidden="true">
        <span
          className="h-4 w-4 rounded-full"
          style={{ background: a.hex, boxShadow: '0 0 0 2px var(--surface)' }}
        />
        <span
          className="-ml-[5px] h-4 w-4 rounded-full"
          style={{ background: b.hex, boxShadow: '0 0 0 2px var(--surface)' }}
        />
      </span>
      <span className="flex-1 text-[15px] font-bold">
        {a.name} <span className="text-ink-3 font-semibold">↔</span> {b.name}
      </span>
      <Pill tone="partial">{pair.count}×</Pill>
    </Link>
  )
}
