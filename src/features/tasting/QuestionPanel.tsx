import { useEffect } from 'react'
import { Autocomplete } from '@/components/Autocomplete'
import { Button } from '@/components/ui/Button'
import { Card, Divider, Heading, Label } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Stepper } from '@/components/ui/Stepper'
import { tierSpec, type Answers, type Catalog, type Question } from '@/engine'
import { da } from '@/i18n/da'
import { answerLabel, answerSearchText } from '@/lib/labels'
import { interpolate } from '@/lib/text'

interface QuestionPanelProps {
  /** All questions of the round, for the stepper. */
  questions: Question[]
  tierIndex: number
  /** Locked answers so far. */
  answers: Answers
  pending: string | null
  catalog: Catalog
  onSelect: (id: string | null) => void
  onLock: () => void
  onSkip: () => void
  /** Wide layout: three columns, keyboard hints. */
  wide?: boolean
}

/** One tier: the stepper, the locked answers, then choice buttons or free text, then lock/skip. */
export function QuestionPanel({
  questions,
  tierIndex,
  answers,
  pending,
  catalog,
  onSelect,
  onLock,
  onSkip,
  wide = false,
}: QuestionPanelProps) {
  const question = questions[tierIndex]!
  const { field } = tierSpec(question.tier)
  const label = (id: string | null) =>
    id === null ? da.outcome.skipped : answerLabel(field, id, catalog)
  const pickedLabel = pending === null ? null : answerLabel(field, pending, catalog)

  const locked = questions.slice(0, tierIndex).map((q) => {
    const id = answers[q.tier]
    return {
      tier: q.tier,
      key: da.tier.short[q.tier],
      value: id == null ? da.outcome.skipped : answerLabel(tierSpec(q.tier).field, id, catalog),
    }
  })
  const steps = questions.map((q) => ({
    label: da.tier.short[q.tier],
    answer: locked.find((l) => l.tier === q.tier)?.value ?? null,
  }))

  // Desktop: number keys pick, Enter locks.
  useEffect(() => {
    if (!wide || question.kind !== 'choice') return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const n = Number(e.key)
      if (n >= 1 && n <= question.options.length) onSelect(question.options[n - 1]!)
      else if (e.key === 'Enter' && pending !== null) onLock()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [wide, question, pending, onSelect, onLock])

  return (
    <Card
      as="section"
      aria-labelledby="question-title"
      elevation="float"
      className={`flex flex-col rounded-[24px] ${wide ? 'gap-5 p-7' : 'gap-3.5'}`}
    >
      <Stepper steps={steps} current={tierIndex} size={wide ? 'lg' : 'sm'} />

      {wide ? <Divider /> : null}

      {locked.length > 0 && !wide && (
        <ul aria-label={da.tasting.lockedAnswers} className="flex flex-wrap gap-1.5">
          {locked.map((l) => (
            <li
              key={l.tier}
              className="border-line bg-surface-2 flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-xs font-bold"
            >
              <Icon name="lock" size={12} strokeWidth={2.4} className="text-ink-2" />
              <span className="text-ink-2">{l.key}:</span> {l.value}
            </li>
          ))}
        </ul>
      )}

      <div className={`flex ${wide ? 'items-end justify-between' : 'flex-col gap-0.5'}`}>
        <div className="flex flex-col gap-1">
          {wide && (
            <Label className="text-primary-ink">
              {interpolate(da.tasting.stepOfShort, {
                step: tierIndex + 1,
                total: questions.length,
              })}
            </Label>
          )}
          <Heading
            as="h2"
            id="question-title"
            size={wide ? 'display' : 'lg'}
            className={wide ? 'text-[34px]' : 'text-[23px]'}
          >
            {da.tier[question.tier]}
          </Heading>
        </div>
        <span className="text-ink-2 text-[13px]">
          {wide && question.kind === 'choice'
            ? interpolate(da.tasting.keyboardHint, { count: question.options.length })
            : interpolate(da.tasting.stepOf, { step: tierIndex + 1, total: questions.length })}
          {' · '}
          {question.points} {da.common.points}
        </span>
      </div>

      {question.kind === 'choice' ? (
        <div
          role="radiogroup"
          aria-label={da.tier[question.tier]}
          className={`grid gap-2.5 ${wide ? 'grid-cols-3' : 'grid-cols-2'}`}
        >
          {question.options.map((id, i) => {
            const active = pending === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(id)}
                className={`flex items-center justify-between gap-1.5 rounded-2xl px-3 text-left text-[15px] transition-[background-color,border-color] ${
                  wide ? 'min-h-[72px] gap-3 px-4 text-[17px]' : 'min-h-14'
                } ${
                  active
                    ? 'border-primary-ink bg-primary-soft text-primary-ink border-2 font-extrabold'
                    : 'border-line bg-surface text-ink hover:border-ink-3 border-[1.5px] font-bold'
                }`}
                style={{
                  boxShadow: active
                    ? 'inset 0 -3px 0 rgba(122,31,61,.25)'
                    : 'inset 0 -3px 0 var(--line)',
                }}
              >
                {wide && (
                  <span
                    aria-hidden="true"
                    className="border-line bg-canvas text-ink-2 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg border-[1.5px] text-xs font-extrabold"
                  >
                    {i + 1}
                  </span>
                )}
                <span className="flex-1">{label(id)}</span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="border-primary-ink box-border h-[18px] w-[18px] shrink-0 rounded-full border-[5px]"
                  />
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <Autocomplete
          key={question.tier}
          value={pending}
          onChange={onSelect}
          options={question.options.map((id) => ({
            id,
            label: answerLabel(field, id, catalog),
            searchText: answerSearchText(field, id, catalog),
          }))}
        />
      )}

      <div className={`flex gap-2.5 ${wide ? 'justify-end' : 'flex-col'}`}>
        {wide && (
          <Button variant="secondary" onClick={onSkip}>
            {da.common.skip}
          </Button>
        )}
        <Button
          onClick={onLock}
          disabled={pending === null}
          aria-label={da.common.lockAnswer}
          className={wide ? 'px-7' : ''}
        >
          <Icon name="lock" size={18} strokeWidth={2.4} />
          {pickedLabel
            ? interpolate(da.tasting.lockWith, { answer: pickedLabel })
            : da.common.lockAnswer}
          {wide && (
            <span className="rounded-md bg-white/[0.18] px-2 py-0.5 text-xs font-bold">Enter</span>
          )}
        </Button>
        {!wide && (
          <Button variant="secondary" size="md" onClick={onSkip}>
            {da.common.skip}
          </Button>
        )}
      </div>
    </Card>
  )
}
