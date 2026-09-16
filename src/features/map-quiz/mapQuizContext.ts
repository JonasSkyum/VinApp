import { createContext, useContext } from 'react'
import type { useMapQuiz } from './useMapQuiz'

export type MapQuizSession = ReturnType<typeof useMapQuiz>

export const MapQuizContext = createContext<MapQuizSession | null>(null)

export function useMapQuizContext(): MapQuizSession {
  const quiz = useContext(MapQuizContext)
  if (!quiz) throw new Error('useMapQuizContext must be used inside MapQuizProvider')
  return quiz
}
