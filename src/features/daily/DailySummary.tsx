import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CountUp } from '@/components/CountUp'
import { formatCountdown, outcomeRow, shareString, type Catalog, type DailyResult } from '@/engine'
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

export function DailySummary({ result, streak, catalog, now }: DailySummaryProps) {
  const [notice, setNotice] = useState<Notice>(null)
  const remaining = useCountdown(now)
  const style = catalog.style(result.styleId)

  const onShare = async () => {
    try {
      const how = await share(shareString(result, dailyUrl()))
      setNotice({ kind: 'ok', text: how === 'shared' ? da.daily.shared : da.daily.copied })
    } catch (error) {
      // The user closing the share sheet is not a failure worth a message.
      if (error instanceof DOMException && error.name === 'AbortError') return
      setNotice({ kind: 'error', text: da.daily.shareFailed })
    }
  }

  return (
    <section aria-labelledby="daily-summary-title" className="space-y-5">
      <h2 id="daily-summary-title" className="text-wine-800 text-2xl font-bold">
        {da.daily.done}
      </h2>

      <div className="border-wine-200 rounded-xl border bg-white p-5 text-center shadow-sm">
        <p className="text-wine-900/70 text-sm">{da.daily.wineWas}</p>
        <p className="text-wine-800 text-xl font-semibold">
          <Link to={`/lexicon/styles/${style.id}`} className="hover:underline">
            {style.name}
          </Link>
        </p>
        <p className="text-wine-900/70 mt-4 text-sm">{da.daily.score}</p>
        <p className="text-wine-800 text-5xl font-bold">
          <CountUp value={result.total} durationSeconds={1.2} />
          <span className="text-wine-900/60 text-xl font-normal"> / {result.max}</span>
        </p>
        <p className="mt-2 text-2xl tracking-wider" aria-hidden="true">
          {outcomeRow(result.tiers)}
        </p>
      </div>

      <div>
        <button
          type="button"
          onClick={onShare}
          className="bg-wine-700 hover:bg-wine-800 w-full rounded-lg px-4 py-3 text-lg font-semibold text-white"
        >
          {da.daily.share}
        </button>
        {notice && (
          <p
            role="status"
            className={`mt-2 text-center text-sm ${notice.kind === 'ok' ? 'text-green-800' : 'text-red-800'}`}
          >
            {notice.text}
          </p>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="border-wine-200 rounded-lg border bg-white p-3">
          <dt className="text-wine-900/70">{da.daily.streak}</dt>
          <dd className="text-wine-800 text-xl font-bold">
            {interpolate(da.daily.streakDays, { days: String(streak) })}
          </dd>
        </div>
        <div className="border-wine-200 rounded-lg border bg-white p-3">
          <dt className="text-wine-900/70">{da.daily.nextIn}</dt>
          <dd
            className="text-wine-800 text-xl font-bold tabular-nums"
            aria-label={da.daily.countdownLabel}
          >
            {formatCountdown(remaining)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
