import { Link } from 'react-router-dom'
import { CountUp } from '@/components/CountUp'
import { Button } from '@/components/ui/Button'
import { Card, Heading } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
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
    <section aria-labelledby="map-summary-title" className="flex flex-col gap-4">
      <Heading as="h2" id="map-summary-title" size="lg">
        {t.title}
      </Heading>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center gap-1 rounded-[22px] text-center">
          <span className="text-ink-2 text-xs font-bold">{t.score}</span>
          <span className="text-primary-ink font-serif text-4xl font-semibold tabular-nums">
            <CountUp value={total} durationSeconds={1.2} />
            <span className="text-ink-2 text-lg"> / {max}</span>
          </span>
        </Card>
        <Card className="flex flex-col items-center gap-1 rounded-[22px] text-center">
          <span className="text-ink-2 text-xs font-bold">{t.time}</span>
          <span className="font-serif text-4xl font-semibold tabular-nums">
            {formatSeconds(seconds)}
          </span>
        </Card>
      </div>

      <Card as="section" className="flex flex-col gap-2.5 rounded-[22px]">
        <Heading as="h3" size="sm">
          {t.wrongTitle}
        </Heading>
        {wrong.length === 0 ? (
          <p className="text-ok flex items-center gap-2 text-sm font-bold">
            <Icon name="check" size={16} strokeWidth={2.8} />
            {t.noneWrong}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {wrong.map((r, i) => (
              <li key={i}>
                <Link
                  to={`/lexicon/regions/${r.targetRegionId}`}
                  className="bg-wrong-soft text-wrong flex min-h-12 items-center justify-between gap-2 rounded-2xl px-3.5 text-sm font-bold"
                >
                  {interpolate(t.wrongItem, {
                    name: catalog.region(r.targetRegionId).name,
                    points: r.points,
                    max: r.maxPoints,
                  })}
                  <Icon name="chevronRight" size={16} strokeWidth={2.4} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex gap-2.5">
        <Button className="flex-1" onClick={onPlayAgain}>
          {da.common.playAgain}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onNewQuiz}>
          {da.common.newSession}
        </Button>
      </div>
    </section>
  )
}
