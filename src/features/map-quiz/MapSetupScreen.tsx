import { useState } from 'react'
import { ChoiceGroup } from '@/components/ChoiceGroup'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import type { Catalog, Difficulty, MapMode, MapQuizOptions } from '@/engine'
import { da } from '@/i18n/da'

interface MapSetupScreenProps {
  initial: MapQuizOptions
  catalog: Catalog
  onStart: (options: MapQuizOptions) => void
}

const MODES: MapMode[] = ['find', 'name', 'grape']
const WORLDS: MapQuizOptions['world'][] = ['all', 'old', 'new']
const LEVELS: Difficulty[] = ['beginner', 'advanced', 'expert']
const COUNTS = [5, 10, 20] as const

export function MapSetupScreen({ initial, catalog, onStart }: MapSetupScreenProps) {
  const [options, setOptions] = useState<MapQuizOptions>(initial)
  const countries = catalog.regions
    .filter((r) => r.type === 'country' && (options.world === 'all' || r.world === options.world))
    .sort((a, b) => a.name.localeCompare(b.name, 'da'))

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onStart(options)
      }}
    >
      <Card className="flex flex-col gap-5 rounded-[24px]">
        <div className="flex flex-col gap-2">
          <ChoiceGroup
            name={da.mapQuiz.mode.labelName}
            items={MODES.map((m) => ({ id: m, label: da.mapQuiz.mode[m] }))}
            value={options.mode}
            onChange={(mode) => setOptions({ ...options, mode })}
          />
          <p className="text-ink-2 text-[13px]">{da.mapQuiz.mode[`${options.mode}Help`]}</p>
        </div>

        <ChoiceGroup
          name={da.mapQuiz.world.labelName}
          items={WORLDS.map((w) => ({ id: w, label: da.mapQuiz.world[w] }))}
          value={options.world}
          onChange={(world) => setOptions({ ...options, world, countryId: 'all' })}
        />

        <label className="block">
          <span className="text-ink-2 mb-2 block text-xs font-extrabold tracking-[0.08em] uppercase">
            {da.mapQuiz.country.labelName}
          </span>
          <span className="relative block">
            <select
              value={options.countryId}
              onChange={(e) => setOptions({ ...options, countryId: e.target.value })}
              className="border-line bg-surface text-ink focus:border-primary-ink min-h-12 w-full appearance-none rounded-2xl border-[1.5px] px-4 pr-10 text-[15px] font-bold outline-none"
            >
              <option value="all">{da.mapQuiz.country.all}</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Icon
              name="chevronDown"
              size={18}
              strokeWidth={2.4}
              className="text-ink-2 pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
            />
          </span>
        </label>

        <ChoiceGroup
          name={da.level.labelName}
          items={LEVELS.map((d) => ({ id: d, label: da.level[d] }))}
          value={options.difficulty}
          onChange={(difficulty) => setOptions({ ...options, difficulty })}
        />
        <ChoiceGroup
          name={da.mapQuiz.count.labelName}
          items={COUNTS.map((c) => ({ id: c, label: String(c) }))}
          value={options.count}
          onChange={(count) => setOptions({ ...options, count })}
        />
      </Card>

      <Button type="submit" block>
        {da.common.start}
        <Icon name="arrowRight" size={18} strokeWidth={2.6} />
      </Button>
    </form>
  )
}
