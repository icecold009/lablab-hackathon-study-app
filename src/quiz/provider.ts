import type { QuizQuestion } from '../types'
import { generateTopicQuiz } from '../utils/quizGenerator'

export interface QuizProvider {
  requestQuestions: (topicName: string, signal?: AbortSignal) => Promise<unknown>
}

export class QuizProviderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuizProviderError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string')
}

export function normalizeQuizQuestions(payload: unknown): QuizQuestion[] {
  const candidates = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.questions)
    ? payload.questions
    : []
  const seenIds = new Set<string>()
  const questions: QuizQuestion[] = []

  candidates.forEach((candidate, index) => {
    if (!isRecord(candidate)) return
    const type = candidate.type === 'mcq' || candidate.type === 'short' ? candidate.type : undefined
    const question = typeof candidate.question === 'string' && candidate.question.trim() ? candidate.question : undefined
    const correctAnswer = typeof candidate.correctAnswer === 'string' && candidate.correctAnswer.trim()
      ? candidate.correctAnswer
      : undefined
    const explanation = typeof candidate.explanation === 'string' ? candidate.explanation : undefined
    const options = isStringArray(candidate.options) ? candidate.options : undefined
    if (!type || !question || !correctAnswer || explanation === undefined || (type === 'mcq' && !options)) return

    const requestedId = typeof candidate.id === 'string' && candidate.id.trim()
      ? candidate.id
      : `provider-question-${index}`
    let id = requestedId
    let suffix = 1
    while (seenIds.has(id)) id = `${requestedId}-${suffix++}`
    seenIds.add(id)
    questions.push({
      id,
      type,
      question,
      ...(options ? { options } : {}),
      correctAnswer,
      explanation,
    })
  })

  if (questions.length === 0) {
    throw new QuizProviderError('The quiz provider returned no valid questions.')
  }
  return questions
}

function abortedError(): Error {
  const error = new Error('Quiz request was cancelled.')
  error.name = 'AbortError'
  return error
}

export function createSampleQuizProvider(delayMs = 400): QuizProvider {
  return {
    requestQuestions: (topicName, signal) => new Promise((resolve, reject) => {
      let settled = false
      const finish = (callback: () => void) => {
        if (settled) return
        settled = true
        signal?.removeEventListener('abort', handleAbort)
        callback()
      }
      const handleAbort = () => {
        clearTimeout(timeout)
        finish(() => reject(abortedError()))
      }
      const timeout = setTimeout(() => {
        finish(() => resolve(generateTopicQuiz(topicName, 5)))
      }, Math.max(0, delayMs))

      if (signal?.aborted) {
        handleAbort()
        return
      }
      signal?.addEventListener('abort', handleAbort, { once: true })
    }),
  }
}

export const sampleQuizProvider = createSampleQuizProvider()
