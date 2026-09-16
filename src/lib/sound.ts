/**
 * Tiny synthesised sound effects (no audio files to ship). Off by default;
 * every call is a no-op when the browser has no Web Audio or the user has not opted in.
 */

export type SoundKind = 'correct' | 'partial' | 'wrong'

/** Notes as [frequency Hz, start s, length s] — a rising arpeggio, a single tone, a falling pair. */
const PATTERNS: Record<SoundKind, [number, number, number][]> = {
  correct: [
    [523, 0, 0.12],
    [659, 0.12, 0.12],
    [784, 0.24, 0.2],
  ],
  partial: [[587, 0, 0.18]],
  wrong: [
    [330, 0, 0.15],
    [262, 0.15, 0.25],
  ],
}

let context: AudioContext | null = null

function audioContext(): AudioContext | null {
  if (context) return context
  const Ctor = window.AudioContext
  if (!Ctor) return null
  context = new Ctor()
  return context
}

export function playSound(kind: SoundKind): void {
  const ctx = audioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const now = ctx.currentTime
  for (const [freq, start, length] of PATTERNS[kind]) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, now + start)
    gain.gain.exponentialRampToValueAtTime(0.2, now + start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + start)
    osc.stop(now + start + length + 0.05)
  }
}
