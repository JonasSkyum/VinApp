import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, Heading, Label } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { ScaleRow } from '@/components/ui/SegmentScale'
import { TIERS } from '@/engine'
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
    <section
      aria-labelledby="onboarding-title"
      className="mx-auto flex w-full max-w-xl flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <Label>
          {interpolate(t.stepOf, { step: String(step + 1), total: String(STEP_COUNT) })}
        </Label>
        <div className="flex flex-1 gap-1">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-track'}`}
            />
          ))}
        </div>
      </div>
      <motion.div
        key={step}
        initial={reduced ? false : { opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18 }}
      >
        <Card className="flex flex-col gap-4 rounded-[24px] p-5">
          {step === 0 && (
            <>
              <Heading as="h2" id="onboarding-title" size="lg">
                {t.card.title}
              </Heading>
              <p className="text-[15px] leading-relaxed">{t.card.order}</p>
              <p className="text-[15px] leading-relaxed">{t.card.scale}</p>
              <div className="bg-surface-2 flex flex-col gap-2 rounded-2xl p-3">
                <ScaleRow attribute="acidity" value={4} />
                <ScaleRow attribute="tannin" value={2} />
                <ScaleRow attribute="body" value={3} />
              </div>
              <p className="text-ink-2 text-sm">{t.card.example}</p>
            </>
          )}
          {step === 1 && (
            <>
              <Heading as="h2" id="onboarding-title" size="lg">
                {t.deduction.title}
              </Heading>
              <p className="text-[15px] leading-relaxed">{t.deduction.idea}</p>
              <ol className="flex flex-col gap-1.5">
                {TIERS.map((spec) => (
                  <li key={spec.tier} className="flex items-center gap-3 text-[15px]">
                    <span className="bg-primary text-on-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold tabular-nums">
                      {spec.tier}
                    </span>
                    <span className="flex-1 font-semibold">{da.tier[spec.tier]}</span>
                    <span className="text-ink-2 shrink-0 text-xs font-bold tabular-nums">
                      {spec.points} {da.common.points}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="text-[15px] leading-relaxed">{t.deduction.clues}</p>
            </>
          )}
          {step === 2 && (
            <>
              <Heading as="h2" id="onboarding-title" size="lg">
                {t.improve.title}
              </Heading>
              <ul className="flex flex-col gap-2 text-[15px] leading-relaxed">
                {[t.improve.feedback, t.improve.training, t.improve.map, t.improve.daily].map(
                  (line) => (
                    <li key={line} className="flex gap-2.5">
                      <Icon
                        name="check"
                        size={18}
                        strokeWidth={2.8}
                        className="text-ok mt-0.5 shrink-0"
                      />
                      {line}
                    </li>
                  ),
                )}
              </ul>
              <p className="text-ink-2 text-sm">{t.improve.honest}</p>
            </>
          )}
        </Card>
      </motion.div>

      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)}>
            {t.back}
          </Button>
        )}
        <Button className="flex-1" onClick={() => (last ? onDone() : setStep(step + 1))}>
          {last ? t.finish : t.next}
          <Icon name="arrowRight" size={18} strokeWidth={2.6} />
        </Button>
      </div>
      {!last && (
        <button
          type="button"
          onClick={onDone}
          className="text-ink-2 self-center text-sm font-bold underline underline-offset-2"
        >
          {t.skip}
        </button>
      )}
    </section>
  )
}
