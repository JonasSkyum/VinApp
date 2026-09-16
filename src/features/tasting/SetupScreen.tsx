import { useState } from 'react'
import { ChoiceGroup } from '@/components/ChoiceGroup'
import type { ColorFilter, Difficulty, SessionOptions, UnlockStatus } from '@/engine'
import { da } from '@/i18n/da'
import { interpolate } from '@/lib/text'

interface SetupScreenProps {
  initial: SessionOptions
  unlocks: Record<Difficulty, UnlockStatus>
  /** Whether there is enough progress to build a "weak points" session. */
  canTrainWeak: boolean
  onStart: (options: SessionOptions) => void
  onStartWeak: (options: SessionOptions) => void
}

const LEVELS: Difficulty[] = ['beginner', 'advanced', 'expert']
const COLORS: ColorFilter[] = ['red', 'white', 'both']
const ROUNDS = [5, 10] as const

export function SetupScreen({
  initial,
  unlocks,
  canTrainWeak,
  onStart,
  onStartWeak,
}: SetupScreenProps) {
  const [options, setOptions] = useState<SessionOptions>(() =>
    unlocks[initial.difficulty].unlocked ? initial : { ...initial, difficulty: 'beginner' },
  )
  const lockedHint = (level: Difficulty) => {
    const status = unlocks[level]
    if (status.unlocked) return null
    return interpolate(da.training.unlockHint, {
      have: status.have,
      need: status.need,
      what: level === 'advanced' ? da.training.unlockGrapes : da.training.unlockRegions,
    })
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        onStart(options)
      }}
    >
      <div>
        <ChoiceGroup
          name={da.level.labelName}
          items={LEVELS.map((d) => ({
            id: d,
            label: unlocks[d].unlocked ? da.level[d] : `${da.level[d]} 🔒`,
            disabled: !unlocks[d].unlocked,
          }))}
          value={options.difficulty}
          onChange={(difficulty) => setOptions({ ...options, difficulty })}
        />
        <ul className="text-wine-900/70 mt-1 text-xs">
          {LEVELS.map((d) => {
            const hint = lockedHint(d)
            return hint ? (
              <li key={d}>
                {da.level[d]}: {hint}
              </li>
            ) : null
          })}
        </ul>
      </div>
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
      {canTrainWeak && (
        <div>
          <button
            type="button"
            onClick={() => onStartWeak(options)}
            className="border-wine-700 text-wine-800 hover:bg-wine-100 w-full rounded-lg border px-4 py-3 font-semibold"
          >
            {da.training.weakButton}
          </button>
          <p className="text-wine-900/70 mt-1 text-xs">{da.training.weakHelp}</p>
        </div>
      )}
    </form>
  )
}
