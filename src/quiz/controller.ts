import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { QuizQuestion, QuizResult } from '../types'
import { calculateScore, checkAnswer } from '../utils/quizGenerator'
import {
  normalizeQuizQuestions,
  sampleQuizProvider,
  type QuizProvider,
} from './provider'
import {
  createInitialQuizState,
  quizReducer,
  type QuizSession,
  type QuizState,
} from './reducer'

export interface QuizProgressUpdate {
  topicId: string
  scorePct: number
}

export interface QuizControllerOptions {
  initialSession?: QuizSession | null
  provider?: QuizProvider
  onSessionChange?: (session: QuizSession | null) => void
  onResult?: (result: QuizResult) => void
  onProgress?: (update: QuizProgressUpdate) => void
  now?: () => string
}

export interface QuizControllerModel extends QuizState {
  currentQuestion: QuizQuestion | null
  score: number
}

export interface QuizController {
  model: QuizControllerModel
  selectTopic: (topicId: string, topicName: string) => void
  retry: () => void
  answer: (questionId: string, answer: string) => void
  submit: () => void
  next: () => void
  previous: () => void
  jump: (index: number) => void
  finish: () => void
  backToSelect: () => void
  hydrate: (session: QuizSession | null) => void
}

const defaultNow = () => new Date().toISOString()

function toSession(state: QuizState): QuizSession {
  return {
    topicId: state.topicId,
    topicName: state.topicName,
    questions: state.questions,
    currentQuestionIndex: state.currentQuestionIndex,
    answers: state.answers,
    submittedQuestions: state.submittedQuestions,
    showExplanation: state.showExplanation,
  }
}

export function buildQuizResult(state: QuizState, completedAt: string): QuizResult | null {
  if (!state.topicId || !state.topicName || state.questions.length === 0) return null

  const submittedById = new Map(state.submittedQuestions.map(question => [question.id, question]))
  const questions = state.questions.map(question => submittedById.get(question.id) ?? {
    ...question,
    userAnswer: '',
    isCorrect: false,
  })
  const score = calculateScore(questions)

  return {
    topicId: state.topicId,
    topicName: state.topicName,
    questions,
    score,
    total: questions.length,
    completedAt,
  }
}

function eventError(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'The quiz provider could not load questions. Please retry.'
}

export function useQuizController(options: QuizControllerOptions = {}): QuizController {
  const {
    initialSession = null,
    provider = sampleQuizProvider,
    onSessionChange,
    onResult,
    onProgress,
    now = defaultNow,
  } = options
  const [state, dispatch] = useReducer(quizReducer, initialSession, createInitialQuizState)
  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const finishLockRef = useRef(false)
  const persistenceInitializedRef = useRef(false)
  const providerRef = useRef(provider)
  const onSessionChangeRef = useRef(onSessionChange)
  const onResultRef = useRef(onResult)
  const onProgressRef = useRef(onProgress)
  const nowRef = useRef(now)

  providerRef.current = provider
  onSessionChangeRef.current = onSessionChange
  onResultRef.current = onResult
  onProgressRef.current = onProgress
  nowRef.current = now

  const loadQuestions = useCallback((topicId: string, topicName: string, retry: boolean) => {
    abortRef.current?.abort()
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    finishLockRef.current = false
    dispatch({ type: 'load_started', requestId, topicId, topicName, retry })

    const abortController = new AbortController()
    abortRef.current = abortController
    let request: Promise<unknown>
    try {
      request = providerRef.current.requestQuestions(topicName, abortController.signal)
    } catch (error) {
      dispatch({ type: 'questions_failed', requestId, message: eventError(error) })
      return
    }
    request
      .then((payload) => {
        if (abortController.signal.aborted) return
        try {
          dispatch({
            type: 'questions_loaded',
            requestId,
            questions: normalizeQuizQuestions(payload),
          })
        } catch (error) {
          dispatch({ type: 'questions_failed', requestId, message: eventError(error) })
        }
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) return
        dispatch({ type: 'questions_failed', requestId, message: eventError(error) })
      })
  }, [])

  useEffect(() => () => {
    abortRef.current?.abort()
  }, [])

  useEffect(() => {
    if (!persistenceInitializedRef.current) {
      persistenceInitializedRef.current = true
      return
    }

    if (state.stage === 'taking' && !state.loading && state.questions.length > 0) {
      onSessionChangeRef.current?.(toSession(state))
    } else if (state.stage !== 'taking') {
      onSessionChangeRef.current?.(null)
    }
  }, [state])

  const selectTopic = useCallback((topicId: string, topicName: string) => {
    loadQuestions(topicId, topicName, false)
  }, [loadQuestions])

  const retry = useCallback(() => {
    if (state.topicId && state.topicName) loadQuestions(state.topicId, state.topicName, true)
  }, [loadQuestions, state.topicId, state.topicName])

  const answer = useCallback((questionId: string, value: string) => {
    dispatch({ type: 'answer_changed', questionId, answer: value })
  }, [])

  const submit = useCallback(() => {
    const question = state.questions[state.currentQuestionIndex]
    if (!question || state.stage !== 'taking' || state.loading) return
    const userAnswer = state.answers[question.id]
    if (!userAnswer?.trim() || (state.showExplanation && state.submittedQuestions.some(item => item.id === question.id))) return

    dispatch({
      type: 'answer_submitted',
      question: { ...question, userAnswer, isCorrect: checkAnswer(question, userAnswer) },
    })
  }, [state])

  const next = useCallback(() => dispatch({ type: 'next' }), [])
  const previous = useCallback(() => dispatch({ type: 'previous' }), [])
  const jump = useCallback((index: number) => dispatch({ type: 'jump', index }), [])

  const finish = useCallback(() => {
    if (finishLockRef.current || state.stage !== 'taking' || !state.showExplanation) return
    const result = buildQuizResult(state, nowRef.current())
    if (!result) return

    finishLockRef.current = true
    dispatch({ type: 'finish' })
    onResultRef.current?.(result)
    onProgressRef.current?.({
      topicId: result.topicId,
      scorePct: Math.round((result.score / result.total) * 100),
    })
  }, [state])

  const backToSelect = useCallback(() => {
    abortRef.current?.abort()
    requestIdRef.current += 1
    finishLockRef.current = false
    dispatch({ type: 'back_to_select' })
  }, [])

  const hydrate = useCallback((session: QuizSession | null) => {
    dispatch({ type: 'hydrate', session })
  }, [])

  return {
    model: {
      ...state,
      currentQuestion: state.questions[state.currentQuestionIndex] ?? null,
      score: calculateScore(state.submittedQuestions),
    },
    selectTopic,
    retry,
    answer,
    submit,
    next,
    previous,
    jump,
    finish,
    backToSelect,
    hydrate,
  }
}
