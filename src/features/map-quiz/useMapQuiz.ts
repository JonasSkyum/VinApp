import { useCallback, useMemo, useReducer } from 'react'
import {
  buildMapQuiz,
  createRng,
  scoreMapQuestion,
  type Catalog,
  type MapAnswer,
  type MapQuestion,
  type MapQuizOptions,
  type MapResult,
} from '@/engine'

export type MapPhase = 'setup' | 'playing' | 'summary'

export interface MapQuizState {
  phase: MapPhase
  options: MapQuizOptions
  seed: string
  questions: MapQuestion[]
  index: number
  results: MapResult[]
  /** Result of the current question while feedback is shown; null while answering. */
  feedback: MapResult | null
  /** Epoch ms when the quiz started, for the timer. */
  startedAt: number
  finishedAt: number | null
}

type Action =
  | { type: 'start'; options: MapQuizOptions; seed: string; now: number }
  | { type: 'answer'; answer: MapAnswer; now: number }
  | { type: 'next' }
  | { type: 'restart'; seed: string; now: number }
  | { type: 'reset' }

export const DEFAULT_MAP_OPTIONS: MapQuizOptions = {
  mode: 'find',
  world: 'all',
  countryId: 'all',
  difficulty: 'beginner',
  count: 10,
}

export function initialMapState(options: MapQuizOptions = DEFAULT_MAP_OPTIONS): MapQuizState {
  return {
    phase: 'setup',
    options,
    seed: '',
    questions: [],
    index: 0,
    results: [],
    feedback: null,
    startedAt: 0,
    finishedAt: null,
  }
}

export function createMapReducer(catalog: Catalog) {
  return function reducer(state: MapQuizState, action: Action): MapQuizState {
    switch (action.type) {
      case 'start':
        return {
          ...initialMapState(action.options),
          phase: 'playing',
          seed: action.seed,
          questions: buildMapQuiz(catalog, action.options, createRng(action.seed)),
          startedAt: action.now,
        }
      case 'answer': {
        if (state.phase !== 'playing' || state.feedback) return state
        const question = state.questions[state.index]!
        const feedback = scoreMapQuestion(question, action.answer, catalog)
        const results = [...state.results, feedback]
        const isLast = state.index === state.questions.length - 1
        return { ...state, feedback, results, finishedAt: isLast ? action.now : null }
      }
      case 'next': {
        if (state.phase !== 'playing' || !state.feedback) return state
        const index = state.index + 1
        if (index >= state.questions.length) return { ...state, phase: 'summary', feedback: null }
        return { ...state, index, feedback: null }
      }
      case 'restart':
        return reducer(state, {
          type: 'start',
          options: state.options,
          seed: action.seed,
          now: action.now,
        })
      case 'reset':
        return initialMapState(state.options)
    }
  }
}

export function newSeed(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`
}

export function useMapQuiz(
  catalog: Catalog,
  seedFactory: () => string = newSeed,
  now: () => number = Date.now,
) {
  const reducer = useMemo(() => createMapReducer(catalog), [catalog])
  const [state, dispatch] = useReducer(reducer, undefined, () => initialMapState())

  const start = useCallback(
    (options: MapQuizOptions) =>
      dispatch({ type: 'start', options, seed: seedFactory(), now: now() }),
    [seedFactory, now],
  )
  const answer = useCallback(
    (a: MapAnswer) => dispatch({ type: 'answer', answer: a, now: now() }),
    [now],
  )
  const next = useCallback(() => dispatch({ type: 'next' }), [])
  const restart = useCallback(
    () => dispatch({ type: 'restart', seed: seedFactory(), now: now() }),
    [seedFactory, now],
  )
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  return { state, start, answer, next, restart, reset }
}
