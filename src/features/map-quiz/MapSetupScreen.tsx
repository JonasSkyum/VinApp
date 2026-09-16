import { useState } from 'react'
import { ChoiceGroup } from '@/components/ChoiceGroup'
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
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        onStart(options)
      }}
    >
      <ChoiceGroup
        name={da.mapQuiz.mode.labelName}
        items={MODES.map((m) => ({ id: m, label: da.mapQuiz.mode[m] }))}
        value={options.mode}
        onChange={(mode) => setOptions({ ...options, mode })}
      />
      <p className="text-wine-900/70 -mt-4 text-sm">{da.mapQuiz.mode[`${options.mode}Help`]}</p>

      <ChoiceGroup
        name={da.mapQuiz.world.labelName}
        items={WORLDS.map((w) => ({ id: w, label: da.mapQuiz.world[w] }))}
        value={options.world}
        onChange={(world) => setOptions({ ...options, world, countryId: 'all' })}
      />

      <label className="block">
        <span className="text-wine-800 mb-2 block text-sm font-semibold">
          {da.mapQuiz.country.labelName}
        </span>
        <select
          value={options.countryId}
          onChange={(e) => setOptions({ ...options, countryId: e.target.value })}
          className="border-wine-300 w-full rounded-lg border bg-white px-3 py-3 text-base"
        >
          <option value="all">{da.mapQuiz.country.all}</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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

      <button
        type="submit"
        className="bg-wine-700 hover:bg-wine-800 w-full rounded-lg px-4 py-3 text-lg font-semibold text-white"
      >
        {da.common.start}
      </button>
    </form>
  )
}
