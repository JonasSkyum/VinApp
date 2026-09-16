import { useCallback, useMemo, useReducer } from 'react'
import {
  buildQuestion,
  createRng,
  generateCase,
  pickStyles,
  scoreRound,
  tiersFor,
  type Answers,
  type Catalog,
  type Question,
  type RoundScore,
  type SessionOptions,
  type TastingCase,
  type Tier,
} from '@/engine'

export type Phase = 'setup' | 'question' | 'result' | 'summary'

export interface Round {
  tastingCase: TastingCase
  questions: Question[]
}

export interface SessionState {
  phase: Phase
  options: SessionOptions
  seed: string
  styleIds: string[]
  roundIndex: number
  round: Round | null
  tierIndex: number
  /** Answer chosen but not yet locked for the current tier. */
  pending: string | null
  answers: Answers
  scores: RoundScore[]
}

type Action =
  | { type: 'start'; options: SessionOptions; seed: string }
  | { type: 'select'; answer: string | null }
  | { type: 'lock' }
  | { type: 'nextRound' }
  | { type: 'restart'; seed: string }
  | { type: 'reset' }

export const DEFAULT_OPTIONS: SessionOptions = { difficulty: 'beginner', colors: 'both', rounds: 5 }

export function initialState(options: SessionOptions = DEFAULT_OPTIONS): SessionState {
  return {
    phase: 'setup',
    options,
    seed: '',
    styleIds: [],
    roundIndex: 0,
    round: null,
    tierIndex: 0,
    pending: null,
    answers: {},
    scores: [],
  }
}

/** Everything about a round derives from seed + round index, so replays are reproducible. */
export function createRound(
  catalog: Catalog,
  styleId: string,
  seed: string,
  roundIndex: number,
  options: SessionOptions,
): Round {
  const rng = createRng(`${seed}:round:${roundIndex}`)
  const style = catalog.style(styleId)
  const tastingCase = generateCase(style, options.difficulty, rng)
  const questions = tiersFor(options.difficulty).map((spec) =>
    buildQuestion(tastingCase, spec.tier, options.difficulty, catalog, rng),
  )
  return { tastingCase, questions }
}

export function createReducer(catalog: Catalog) {
  return function reducer(state: SessionState, action: Action): SessionState {
    switch (action.type) {
      case 'start': {
        const styleIds = pickStyles(
          catalog,
          action.options,
          createRng(`${action.seed}:styles`),
        ).map((s) => s.id)
        return {
          ...initialState(action.options),
          phase: 'question',
          seed: action.seed,
          styleIds,
          round: createRound(catalog, styleIds[0]!, action.seed, 0, action.options),
        }
      }
      case 'select':
        return state.phase === 'question' ? { ...state, pending: action.answer } : state
      case 'lock': {
        if (state.phase !== 'question' || !state.round) return state
        const question = state.round.questions[state.tierIndex]!
        const answers: Answers = { ...state.answers, [question.tier as Tier]: state.pending }
        const isLast = state.tierIndex === state.round.questions.length - 1
        if (!isLast) {
          return { ...state, answers, pending: null, tierIndex: state.tierIndex + 1 }
        }
        const score = scoreRound(
          state.round.tastingCase,
          answers,
          state.options.difficulty,
          catalog,
        )
        return {
          ...state,
          answers,
          pending: null,
          phase: 'result',
          scores: [...state.scores, score],
        }
      }
      case 'nextRound': {
        if (state.phase !== 'result') return state
        const roundIndex = state.roundIndex + 1
        if (roundIndex >= state.styleIds.length) return { ...state, phase: 'summary', round: null }
        return {
          ...state,
          phase: 'question',
          roundIndex,
          round: createRound(
            catalog,
            state.styleIds[roundIndex]!,
            state.seed,
            roundIndex,
            state.options,
          ),
          tierIndex: 0,
          pending: null,
          answers: {},
        }
      }
      case 'restart':
        return reducer(state, { type: 'start', options: state.options, seed: action.seed })
      case 'reset':
        return initialState(state.options)
    }
  }
}

export function newSeed(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`
}

export function useTastingSession(catalog: Catalog, seedFactory: () => string = newSeed) {
  const reducer = useMemo(() => createReducer(catalog), [catalog])
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState())

  const start = useCallback(
    (options: SessionOptions) => dispatch({ type: 'start', options, seed: seedFactory() }),
    [seedFactory],
  )
  const select = useCallback((answer: string | null) => dispatch({ type: 'select', answer }), [])
  const lock = useCallback(() => dispatch({ type: 'lock' }), [])
  const nextRound = useCallback(() => dispatch({ type: 'nextRound' }), [])
  const restart = useCallback(
    () => dispatch({ type: 'restart', seed: seedFactory() }),
    [seedFactory],
  )
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  return { state, start, select, lock, nextRound, restart, reset }
}
