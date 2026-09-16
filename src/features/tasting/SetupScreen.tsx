import { useState } from 'react'
import { ChoiceGroup } from '@/components/ChoiceGroup'
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
      <ChoiceGroup
        name={da.level.labelName}
        items={LEVELS.map((d) => ({ id: d, label: da.level[d] }))}
        value={options.difficulty}
        onChange={(difficulty) => setOptions({ ...options, difficulty })}
      />
      <ChoiceGroup
        name={da.colorFilter.labelName}
        items={COLORS.map((c) => ({ id: c, label: da.colorFilter[c] }))}
        value={options.colors}
        onChange={(colors) => setOptions({ ...options, colors })}
      />
      <ChoiceGroup
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
