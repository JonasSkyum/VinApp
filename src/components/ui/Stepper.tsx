import { Icon } from './Icon'

export interface Step {
  label: string
  /** Shown under the label on wide screens once the step is done. */
  answer?: string | null
}

interface StepperProps {
  steps: Step[]
  /** Index of the open step; everything before it is done. */
  current: number
  size?: 'sm' | 'lg'
}

/** Tier stepper: done = filled bordeaux with a check, open = outlined number, later = muted. */
export function Stepper({ steps, current, size = 'sm' }: StepperProps) {
  const dot = size === 'lg' ? 32 : 24
  return (
    <ol className="flex items-start" aria-label="Trin">
      {steps.map((step, i) => {
        const done = i < current
        const open = i === current
        const last = i === steps.length - 1
        return (
          <li
            key={step.label}
            aria-current={open ? 'step' : undefined}
            className="relative flex flex-1 flex-col items-center gap-1.5"
          >
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute left-1/2 h-0.5 w-full ${done ? 'bg-primary' : 'bg-line'}`}
                style={{ top: dot / 2 - 1 }}
              />
            )}
            <span
              className={`relative box-border flex items-center justify-center rounded-full border-2 ${
                done
                  ? 'border-primary bg-primary'
                  : open
                    ? 'border-primary-ink bg-surface'
                    : 'border-line bg-surface'
              }`}
              style={{ width: dot, height: dot }}
            >
              {done ? (
                <Icon
                  name="check"
                  size={size === 'lg' ? 14 : 12}
                  strokeWidth={3.4}
                  className="text-on-primary"
                />
              ) : (
                <span
                  className={`text-[11px] font-extrabold ${open ? 'text-primary-ink' : 'text-ink-3'}`}
                >
                  {i + 1}
                </span>
              )}
            </span>
            <span
              className={`text-[11px] ${open ? 'text-ink font-extrabold' : 'text-ink-2 font-semibold'}`}
            >
              {step.label}
            </span>
            {size === 'lg' && step.answer && (
              <span className="text-ink-2 max-w-full truncate px-1 text-xs font-bold">
                {step.answer}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
