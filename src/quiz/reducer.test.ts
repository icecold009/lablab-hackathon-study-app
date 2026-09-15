import { describe, expect, it } from 'vitest'
import type { QuizQuestion } from '../types'
import { createQuestion } from '../test/fixtures'
import { createInitialQuizState, quizReducer } from './reducer'

const firstQuestion = createQuestion({ id: 'question-1' })
const secondQuestion: QuizQuestion = createQuestion({
  id: 'question-2',
  type: 'short',
  options: undefined,
  correctAnswer: 'cell membrane',
})

function loadedState() {
  const started = quizReducer(createInitialQuizState(), {
    type: 'load_started',
    requestId: 1,
    topicId: 'topic-1',
    topicName: 'Cell Biology',
    retry: false,
  })
  return quizReducer(started, {
    type: 'questions_loaded',
    requestId: 1,
    questions: [firstQuestion, secondQuestion],
  })
}

describe('quizReducer', () => {
  it('ignores stale provider responses after a newer request starts', () => {
    const first = quizReducer(createInitialQuizState(), {
      type: 'load_started',
      requestId: 1,
      topicId: 'topic-1',
      topicName: 'Cell Biology',
      retry: false,
    })
    const second = quizReducer(first, {
      type: 'load_started',
      requestId: 2,
      topicId: 'topic-2',
      topicName: 'Genetics',
      retry: false,
    })

    expect(quizReducer(second, {
      type: 'questions_loaded',
      requestId: 1,
      questions: [firstQuestion],
    })).toBe(second)
  })

  it('keeps submitted answers in question order and enforces lifecycle transitions', () => {
    let state = loadedState()

    expect(quizReducer(state, { type: 'next' })).toBe(state)
    state = quizReducer(state, { type: 'answer_changed', questionId: secondQuestion.id, answer: 'cell membrane' })
    state = quizReducer(state, {
      type: 'answer_submitted',
      question: { ...secondQuestion, userAnswer: 'cell membrane', isCorrect: true },
    })
    state = quizReducer(state, { type: 'jump', index: 0 })
    state = quizReducer(state, { type: 'answer_changed', questionId: firstQuestion.id, answer: 'Mitochondria' })
    state = quizReducer(state, {
      type: 'answer_submitted',
      question: { ...firstQuestion, userAnswer: 'Mitochondria', isCorrect: true },
    })

    expect(state.submittedQuestions.map(question => question.id)).toEqual(['question-1', 'question-2'])
    expect(state.showExplanation).toBe(true)

    state = quizReducer(state, { type: 'finish' })
    expect(state.stage).toBe('results')
    expect(quizReducer(state, { type: 'finish' })).toBe(state)
  })

  it('supports previous/next navigation and resumes the submitted explanation', () => {
    let state = loadedState()
    state = quizReducer(state, { type: 'answer_changed', questionId: firstQuestion.id, answer: 'Mitochondria' })
    state = quizReducer(state, {
      type: 'answer_submitted',
      question: { ...firstQuestion, userAnswer: 'Mitochondria', isCorrect: true },
    })
    state = quizReducer(state, { type: 'next' })
    expect(state.currentQuestionIndex).toBe(1)
    expect(state.showExplanation).toBe(false)
    state = quizReducer(state, { type: 'previous' })
    expect(state.currentQuestionIndex).toBe(0)
    expect(state.showExplanation).toBe(true)
  })

  it('hydrates an in-progress session and clamps an invalid question index', () => {
    const state = createInitialQuizState()
    const hydrated = quizReducer(state, {
      type: 'hydrate',
      session: {
        topicId: 'topic-1',
        topicName: 'Cell Biology',
        questions: [firstQuestion, secondQuestion],
        currentQuestionIndex: 99,
        answers: { 'question-1': 'Mitochondria' },
        submittedQuestions: [],
        showExplanation: false,
      },
    })

    expect(hydrated.stage).toBe('taking')
    expect(hydrated.currentQuestionIndex).toBe(1)
    expect(hydrated.answers).toEqual({ 'question-1': 'Mitochondria' })
  })

  it('returns a recoverable error for the active request only', () => {
    const started = quizReducer(createInitialQuizState(), {
      type: 'load_started',
      requestId: 3,
      topicId: 'topic-1',
      topicName: 'Cell Biology',
      retry: true,
    })
    const failed = quizReducer(started, {
      type: 'questions_failed',
      requestId: 3,
      message: 'No valid questions',
    })

    expect(failed.stage).toBe('select')
    expect(failed.error).toBe('No valid questions')
    expect(failed.loading).toBe(false)
  })
})
