import { useState } from 'react'
import { ChoiceGroup } from '@/components/ChoiceGroup'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
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
const COLORS: ColorFilter[] = ['red', 'white', 'other', 'all']
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
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onStart(options)
      }}
    >
      <Card className="flex flex-col gap-5 rounded-[24px]">
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
          <ul className="text-ink-2 mt-2 flex flex-col gap-1 text-xs">
            {LEVELS.map((d) => {
              const hint = lockedHint(d)
              return hint ? (
                <li key={d} className="flex items-center gap-1.5">
                  <Icon name="lock" size={12} strokeWidth={2.4} />
                  {da.level[d]}: {hint}
                </li>
              ) : null
            })}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <ChoiceGroup
            name={da.colorFilter.labelName}
            items={COLORS.map((c) => ({ id: c, label: da.colorFilter[c] }))}
            value={options.colors}
            onChange={(colors) => setOptions({ ...options, colors })}
          />
          {options.colors === 'other' && (
            <p className="text-ink-2 text-[13px]">{da.colorFilter.otherHelp}</p>
          )}
        </div>
        <ChoiceGroup
          name={da.rounds.labelName}
          items={ROUNDS.map((r) => ({ id: r, label: String(r) }))}
          value={options.rounds}
          onChange={(rounds) => setOptions({ ...options, rounds })}
        />
      </Card>

      <Button type="submit" block>
        {da.common.start}
        <Icon name="arrowRight" size={18} strokeWidth={2.6} />
      </Button>

      {canTrainWeak && (
        <div className="flex flex-col gap-1">
          <Button variant="soft" size="md" block onClick={() => onStartWeak(options)}>
            {da.training.weakButton}
          </Button>
          <p className="text-ink-2 text-center text-xs">{da.training.weakHelp}</p>
        </div>
      )}
    </form>
  )
}
