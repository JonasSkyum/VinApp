import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { TIERS } from '@/engine'
import { ScaleBar } from '@/features/tasting/ScaleBar'
import { da } from '@/i18n/da'
import { interpolate } from '@/lib/text'

interface OnboardingProps {
  onDone: () => void
}

const STEP_COUNT = 3

/** Three screens: reading the tasting card, the deduction ladder, and how to keep improving. */
export function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const reduced = useReducedMotion()
  const t = da.onboarding
  const last = step === STEP_COUNT - 1

  return (
    <section aria-labelledby="onboarding-title" className="space-y-5">
      <p className="text-wine-900/70 text-sm">
        {interpolate(t.stepOf, { step: String(step + 1), total: String(STEP_COUNT) })}
      </p>
      <motion.div
        key={step}
        initial={reduced ? false : { opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="border-wine-200 space-y-4 rounded-xl border bg-white p-5 shadow-sm"
      >
        {step === 0 && (
          <>
            <h2 id="onboarding-title" className="text-wine-800 text-2xl font-bold">
              {t.card.title}
            </h2>
            <p className="text-sm">{t.card.order}</p>
            <p className="text-sm">{t.card.scale}</p>
            <div className="space-y-2">
              <ScaleBar attribute="acidity" value={4} />
              <ScaleBar attribute="tannin" value={2} />
              <ScaleBar attribute="body" value={3} />
            </div>
            <p className="text-wine-900/70 text-sm">{t.card.example}</p>
          </>
        )}
        {step === 1 && (
          <>
            <h2 id="onboarding-title" className="text-wine-800 text-2xl font-bold">
              {t.deduction.title}
            </h2>
            <p className="text-sm">{t.deduction.idea}</p>
            <ol className="space-y-1 text-sm">
              {TIERS.map((spec) => (
                <li key={spec.tier} className="flex items-baseline justify-between gap-3">
                  <span>
                    <span className="text-wine-700 mr-2 font-semibold tabular-nums">
                      {spec.tier}.
                    </span>
                    {da.tier[spec.tier]}
                  </span>
                  <span className="text-wine-900/70 shrink-0 text-xs">
                    {spec.points} {da.common.points}
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-sm">{t.deduction.clues}</p>
          </>
        )}
        {step === 2 && (
          <>
            <h2 id="onboarding-title" className="text-wine-800 text-2xl font-bold">
              {t.improve.title}
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>{t.improve.feedback}</li>
              <li>{t.improve.training}</li>
              <li>{t.improve.map}</li>
              <li>{t.improve.daily}</li>
            </ul>
            <p className="text-wine-900/70 text-sm">{t.improve.honest}</p>
          </>
        )}
      </motion.div>

      <div className="flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="border-wine-700 text-wine-800 hover:bg-wine-100 rounded-lg border px-4 py-3 font-semibold"
          >
            {t.back}
          </button>
        )}
        <button
          type="button"
          onClick={() => (last ? onDone() : setStep(step + 1))}
          className="bg-wine-700 hover:bg-wine-800 flex-1 rounded-lg px-4 py-3 text-lg font-semibold text-white"
        >
          {last ? t.finish : t.next}
        </button>
      </div>
      {!last && (
        <button
          type="button"
          onClick={onDone}
          className="text-wine-900/70 w-full text-center text-sm underline"
        >
          {t.skip}
        </button>
      )}
    </section>
  )
}
