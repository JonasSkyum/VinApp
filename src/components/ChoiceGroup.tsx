interface ChoiceGroupProps<T extends string | number> {
  name: string
  items: { id: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

/** Segmented single-choice control, thumb-friendly. */
export function ChoiceGroup<T extends string | number>({
  name,
  items,
  value,
  onChange,
}: ChoiceGroupProps<T>) {
  return (
    <fieldset>
      <legend className="text-wine-800 mb-2 text-sm font-semibold">{name}</legend>
      <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
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
