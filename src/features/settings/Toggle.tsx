interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  help?: string
}

/** Labelled checkbox drawn as a switch; the native input keeps keyboard and screen-reader semantics. */
export function Toggle({ checked, onChange, label, help }: ToggleProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      <span className="flex flex-1 flex-col">
        <span className="text-[15px] font-bold">{label}</span>
        {help && <span className="text-ink-2 text-[13px]">{help}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="bg-track peer-checked:bg-primary peer-focus-visible:outline-primary-ink block h-7 w-12 rounded-full transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
        />
        <span
          aria-hidden="true"
          className="bg-surface shadow-card absolute top-0.5 left-0.5 h-6 w-6 rounded-full transition peer-checked:translate-x-5"
        />
      </span>
    </label>
  )
}
