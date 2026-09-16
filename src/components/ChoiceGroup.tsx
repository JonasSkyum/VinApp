import { useRef, type KeyboardEvent } from 'react'

interface ChoiceGroupProps<T extends string | number> {
  name: string
  items: { id: T; label: string; disabled?: boolean }[]
  value: T
  onChange: (value: T) => void
}

/** Segmented single-choice control, thumb-friendly. Arrow keys move between options like native radios. */
export function ChoiceGroup<T extends string | number>({
  name,
  items,
  value,
  onChange,
}: ChoiceGroupProps<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0)
    if (enabled.length === 0) return
    const current = items.findIndex((item) => item.id === value)
    const pos = Math.max(0, enabled.indexOf(current))
    let next: number
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = enabled[(pos + 1) % enabled.length]!
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        next = enabled[(pos - 1 + enabled.length) % enabled.length]!
        break
      case 'Home':
        next = enabled[0]!
        break
      case 'End':
        next = enabled[enabled.length - 1]!
        break
      default:
        return
    }
    e.preventDefault()
    onChange(items[next]!.id)
    buttons.current[next]?.focus()
  }

  return (
    <fieldset>
      <legend className="text-wine-800 mb-2 text-sm font-semibold">{name}</legend>
      <div
        role="radiogroup"
        aria-label={name}
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-2"
      >
        {items.map((item, i) => {
          const active = item.id === value
          return (
            <button
              key={String(item.id)}
              ref={(el) => {
                buttons.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              disabled={item.disabled}
              onClick={() => onChange(item.id)}
              className={`flex-1 rounded-lg border px-3 py-3 text-base disabled:cursor-not-allowed disabled:opacity-40 ${
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
