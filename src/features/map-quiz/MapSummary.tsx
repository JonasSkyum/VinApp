import { Link } from 'react-router-dom'
import { CountUp } from '@/components/CountUp'
import type { Catalog, MapResult } from '@/engine'
import { da } from '@/i18n/da'
import { interpolate } from '@/lib/text'
import { formatSeconds } from './format'

interface MapSummaryProps {
  results: MapResult[]
  seconds: number
  catalog: Catalog
  onPlayAgain: () => void
  onNewQuiz: () => void
}

export function MapSummary({ results, seconds, catalog, onPlayAgain, onNewQuiz }: MapSummaryProps) {
  const total = results.reduce((sum, r) => sum + r.points, 0)
  const max = results.reduce((sum, r) => sum + r.maxPoints, 0)
  const wrong = results.filter((r) => !r.correct)
  const t = da.mapQuiz.summary

  return (
    <section aria-labelledby="map-summary-title" className="space-y-5">
      <h2 id="map-summary-title" className="text-wine-800 text-2xl font-bold">
        {t.title}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="border-wine-200 rounded-xl border bg-white p-4 text-center shadow-sm">
          <p className="text-wine-900/70 text-sm">{t.score}</p>
          <p className="text-wine-800 text-4xl font-bold">
            <CountUp value={total} durationSeconds={1.2} />
            <span className="text-wine-900/60 text-lg font-normal"> / {max}</span>
          </p>
        </div>
        <div className="border-wine-200 rounded-xl border bg-white p-4 text-center shadow-sm">
          <p className="text-wine-900/70 text-sm">{t.time}</p>
          <p className="text-wine-800 text-4xl font-bold tabular-nums">{formatSeconds(seconds)}</p>
        </div>
      </div>

      <div>
        <h3 className="text-wine-800 mb-2 font-semibold">{t.wrongTitle}</h3>
        {wrong.length === 0 ? (
          <p className="text-sm">{t.noneWrong}</p>
        ) : (
          <ul className="space-y-1">
            {wrong.map((r, i) => (
              <li key={i}>
                <Link
                  to={`/lexicon/regions/${r.targetRegionId}`}
                  className="block rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 underline"
                >
                  {interpolate(t.wrongItem, {
                    name: catalog.region(r.targetRegionId).name,
                    points: r.points,
                    max: r.maxPoints,
                  })}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPlayAgain}
          className="bg-wine-700 hover:bg-wine-800 flex-1 rounded-lg px-4 py-3 font-semibold text-white"
        >
          {da.common.playAgain}
        </button>
        <button
          type="button"
          onClick={onNewQuiz}
          className="border-wine-300 text-wine-800 flex-1 rounded-lg border px-4 py-3"
        >
          {da.common.newSession}
        </button>
      </div>
    </section>
  )
}
