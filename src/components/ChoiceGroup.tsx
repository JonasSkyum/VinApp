import { useRef, type KeyboardEvent } from 'react'

interface ChoiceGroupProps<T extends string | number> {
  name: string
  items: { id: T; label: string; disabled?: boolean; hint?: string }[]
  value: T
  onChange: (value: T) => void
  /** Pills in a soft track (default) or full-width cards. */
  variant?: 'segmented' | 'cards'
}

/** Segmented single-choice control, thumb-friendly. Arrow keys move between options like native radios. */
export function ChoiceGroup<T extends string | number>({
  name,
  items,
  value,
  onChange,
  variant = 'segmented',
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

  const segmented = variant === 'segmented'

  return (
    <fieldset>
      <legend className="text-ink-2 mb-2 text-xs font-extrabold tracking-[0.08em] uppercase">
        {name}
      </legend>
      <div
        role="radiogroup"
        aria-label={name}
        onKeyDown={onKeyDown}
        className={segmented ? 'bg-surface-2 flex rounded-full p-[3px]' : 'grid grid-cols-3 gap-2'}
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
              className={
                segmented
                  ? `min-h-11 flex-1 rounded-full px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                      active
                        ? 'bg-surface text-ink shadow-card font-extrabold'
                        : 'text-ink-2 hover:text-ink font-bold'
                    }`
                  : `flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 text-[15px] disabled:cursor-not-allowed disabled:opacity-40 ${
                      active
                        ? 'border-primary-ink bg-primary-soft text-primary-ink border-2 font-extrabold'
                        : 'border-line bg-surface text-ink border-[1.5px] font-bold'
                    }`
              }
            >
              {item.label}
              {item.hint && !segmented && (
                <span className="text-ink-3 text-[11px] font-semibold">{item.hint}</span>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
