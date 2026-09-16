import { tierSpec, type Catalog, type Question } from '@/engine'
import { da } from '@/i18n/da'
import { Autocomplete } from './Autocomplete'
import { answerLabel, answerSearchText } from './labels'

interface QuestionPanelProps {
  question: Question
  pending: string | null
  catalog: Catalog
  onSelect: (id: string | null) => void
  onLock: () => void
  onSkip: () => void
}

/** One tier: multiple choice buttons or free text, then lock or skip. */
export function QuestionPanel({
  question,
  pending,
  catalog,
  onSelect,
  onLock,
  onSkip,
}: QuestionPanelProps) {
  const { field } = tierSpec(question.tier)

  return (
    <section aria-labelledby="question-title" className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 id="question-title" className="text-wine-800 text-lg font-semibold">
          {da.tier[question.tier]}
        </h2>
        <span className="text-wine-900/70 text-sm">
          {question.points} {da.common.points}
        </span>
      </div>

      {question.kind === 'choice' ? (
        <div role="radiogroup" aria-label={da.tier[question.tier]} className="grid gap-2">
          {question.options.map((id) => {
            const active = pending === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(id)}
                className={`rounded-lg border px-4 py-3 text-left text-base transition ${
                  active
                    ? 'border-wine-700 bg-wine-700 text-white'
                    : 'border-wine-300 hover:border-wine-500 bg-white'
                }`}
              >
                {answerLabel(field, id, catalog)}
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

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onLock}
          disabled={pending === null}
          className="bg-wine-700 hover:bg-wine-800 flex-1 rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-40"
        >
          {da.common.lockAnswer}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="border-wine-300 text-wine-800 rounded-lg border px-4 py-3"
        >
          {da.common.skip}
        </button>
      </div>
    </section>
  )
}
