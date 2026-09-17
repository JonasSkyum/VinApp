import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CountUp } from '@/components/CountUp'
import { Button } from '@/components/ui/Button'
import { Card, Label, Pill } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { OutcomeTile } from '@/components/ui/Outcome'
import { WineGlass } from '@/components/ui/WineGlass'
import {
  dateKeyToDays,
  formatCountdown,
  shareString,
  type Catalog,
  type DailyResult,
} from '@/engine'
import { useProgress } from '@/features/progress/progressContext'
import { da } from '@/i18n/da'
import { interpolate } from '@/lib/text'
import { useCountdown } from './useCountdown'

interface DailySummaryProps {
  result: DailyResult
  streak: number
  catalog: Catalog
  now?: () => number
}

type Notice = { kind: 'ok' | 'error'; text: string } | null

/** Link back to today's challenge, built from wherever the app is hosted. */
function dailyUrl(): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/daily`
}

/** Web Share API when available (mostly mobile), otherwise the clipboard. */
async function share(text: string): Promise<'shared' | 'copied'> {
  if (typeof navigator.share === 'function') {
    await navigator.share({ text })
    return 'shared'
  }
  await navigator.clipboard.writeText(text)
  return 'copied'
}

/** Monday-first week around the result's date: which days were played. */
function weekDots(daily: Record<string, DailyResult>, dateKey: string): boolean[] {
  const day = dateKeyToDays(dateKey)
  // 1970-01-01 was a Thursday, so Monday-based weekday = (day + 3) % 7.
  const monday = day - ((day + 3) % 7)
  const played = new Set(Object.keys(daily).map(dateKeyToDays))
  return Array.from({ length: 7 }, (_, i) => played.has(monday + i))
}

export function DailySummary({ result, streak, catalog, now }: DailySummaryProps) {
  const [notice, setNotice] = useState<Notice>(null)
  const remaining = useCountdown(now)
  const { data } = useProgress()
  const style = catalog.style(result.styleId)
  const region = catalog.region(style.regionId)
  const country = catalog.countryOf(style.regionId)
  const text = shareString(result, dailyUrl())
  const week = weekDots(data.daily, result.dateKey)

  const onShare = async () => {
    try {
      const how = await share(text)
      setNotice({ kind: 'ok', text: how === 'shared' ? da.daily.shared : da.daily.copied })
    } catch (error) {
      // The user closing the share sheet is not a failure worth a message.
      if (error instanceof DOMException && error.name === 'AbortError') return
      setNotice({ kind: 'error', text: da.daily.shareFailed })
    }
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setNotice({ kind: 'ok', text: da.daily.copied })
    } catch {
      setNotice({ kind: 'error', text: da.daily.shareFailed })
    }
  }

  return (
    <section aria-labelledby="daily-summary-title" className="flex flex-col gap-3.5">
      <Card elevation="float" className="flex flex-col gap-4 rounded-[26px] p-[18px]">
        <div className="flex items-center justify-between">
          <h2 id="daily-summary-title" className="m-0">
            <Pill tone="ok">
              <Icon name="check" size={13} strokeWidth={3} />
              {da.daily.done}
            </Pill>
          </h2>
          <span className="text-ink-2 text-xs font-bold">{da.daily.level}</span>
        </div>

        <div className="flex items-center gap-3.5">
          <WineGlass appearance={style.profile.appearance} size={62} />
          <div className="flex flex-1 flex-col gap-0.5">
            <Link
              to={`/lexicon/styles/${style.id}`}
              className="font-serif text-[25px] leading-[1.1] font-semibold"
            >
              {style.name}
            </Link>
            <span className="text-ink-2 text-sm">
              {style.grapeIds.map((id) => catalog.grape(id).name).join(', ')} · {region.name}
              {region.id !== country.id && `, ${country.name}`}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[34px] leading-none font-extrabold tabular-nums">
              <CountUp value={result.total} durationSeconds={1.2} />
              <span className="text-ink-2 text-lg">/{result.max}</span>
            </span>
            <span className="text-ink-2 text-xs font-bold">{da.daily.points}</span>
          </div>
        </div>

        <div role="list" aria-label={da.daily.perTier} className="grid grid-cols-5 gap-2">
          {result.tiers.map((t) => (
            <OutcomeTile key={t.tier} outcome={t.outcome} label={da.tier.short[t.tier]} />
          ))}
        </div>

        <div className="bg-surface-2 flex flex-col gap-1.5 rounded-[14px] p-3">
          <Label>{da.daily.shareText}</Label>
          <span className="font-mono text-[15px] font-medium break-words">
            {text.split('\n')[0]}
          </span>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-2.5">
          <Button onClick={onShare}>
            <Icon name="share" size={18} strokeWidth={2.4} />
            {da.daily.share}
          </Button>
          <Button variant="secondary" onClick={onCopy}>
            <Icon name="copy" size={16} strokeWidth={2.2} />
            {da.daily.copy}
          </Button>
        </div>
        {notice && (
          <p
            role="status"
            className={`text-center text-sm font-bold ${notice.kind === 'ok' ? 'text-ok' : 'text-wrong'}`}
          >
            {notice.text}
          </p>
        )}
      </Card>

      <dl className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-2.5 rounded-[22px] p-3.5">
          <dt className="text-ink-2 text-xs font-bold">{da.daily.streak}</dt>
          <dd className="text-[26px] leading-none font-extrabold">
            {interpolate(da.daily.streakDays, { days: String(streak) })}
          </dd>
          <dd className="grid grid-cols-7 gap-[3px]">
            {week.map((on, i) => (
              <span key={i} className="flex flex-col items-center gap-[3px]">
                <span
                  aria-hidden="true"
                  className={`box-border h-4 w-4 rounded-full border-2 ${
                    on ? 'border-primary bg-primary' : 'border-line'
                  }`}
                />
                <span className="text-ink-2 text-[10px] font-bold">{da.daily.dayLetters[i]}</span>
              </span>
            ))}
          </dd>
        </Card>
        <Card className="flex flex-col gap-2.5 rounded-[22px] p-3.5">
          <dt className="text-ink-2 text-xs font-bold">{da.daily.nextInShort}</dt>
          <dd
            className="text-[26px] leading-none font-extrabold tabular-nums"
            aria-label={da.daily.countdownLabel}
          >
            {formatCountdown(remaining)}
          </dd>
          <dd className="text-ink-2 text-xs">{da.daily.resetTime}</dd>
        </Card>
      </dl>

      <Link
        to={`/lexicon/styles/${style.id}`}
        className="bg-primary-soft text-primary-ink flex min-h-14 items-center justify-between rounded-[18px] px-4 text-[15px] font-extrabold"
      >
        {da.daily.readAbout}
        <Icon name="chevronRight" size={18} strokeWidth={2.4} />
      </Link>
    </section>
  )
}
