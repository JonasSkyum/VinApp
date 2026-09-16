import { useState } from 'react'
import type { ColorFilter, Difficulty, SessionOptions } from '@/engine'
import { da } from '@/i18n/da'

interface SetupScreenProps {
  initial: SessionOptions
  onStart: (options: SessionOptions) => void
}

const LEVELS: Difficulty[] = ['beginner', 'advanced', 'expert']
const COLORS: ColorFilter[] = ['red', 'white', 'both']
const ROUNDS = [5, 10] as const

export function SetupScreen({ initial, onStart }: SetupScreenProps) {
  const [options, setOptions] = useState<SessionOptions>(initial)

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        onStart(options)
      }}
    >
      <Choice
        name={da.level.labelName}
        items={LEVELS.map((d) => ({ id: d, label: da.level[d] }))}
        value={options.difficulty}
        onChange={(difficulty) => setOptions({ ...options, difficulty })}
      />
      <Choice
        name={da.colorFilter.labelName}
        items={COLORS.map((c) => ({ id: c, label: da.colorFilter[c] }))}
        value={options.colors}
        onChange={(colors) => setOptions({ ...options, colors })}
      />
      <Choice
        name={da.rounds.labelName}
        items={ROUNDS.map((r) => ({ id: r, label: String(r) }))}
        value={options.rounds}
        onChange={(rounds) => setOptions({ ...options, rounds })}
      />
      <button
        type="submit"
        className="bg-wine-700 hover:bg-wine-800 w-full rounded-lg px-4 py-3 text-lg font-semibold text-white"
      >
        {da.common.start}
      </button>
    </form>
  )
}

interface ChoiceProps<T extends string | number> {
  name: string
  items: { id: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

function Choice<T extends string | number>({ name, items, value, onChange }: ChoiceProps<T>) {
  return (
    <fieldset>
      <legend className="text-wine-800 mb-2 text-sm font-semibold">{name}</legend>
      <div role="radiogroup" aria-label={name} className="flex gap-2">
        {items.map((item) => {
          const active = item.id === value
          return (
            <button
              key={String(item.id)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(item.id)}
              className={`flex-1 rounded-lg border px-3 py-3 text-base ${
                active
                  ? 'border-wine-700 bg-wine-700 text-white'
                  : 'border-wine-300 hover:border-wine-500 bg-white'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
