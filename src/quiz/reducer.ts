import type { QuizQuestion } from '../types'

export type QuizStage = 'select' | 'taking' | 'results'

export interface QuizSession {
  topicId: string
  topicName: string
  questions: QuizQuestion[]
  currentQuestionIndex: number
  answers: Record<string, string>
  submittedQuestions: QuizQuestion[]
  showExplanation: boolean
}

export interface QuizState extends QuizSession {
  stage: QuizStage
  loading: boolean
  error: string | null
  requestId: number
}

export type QuizEvent =
  | { type: 'load_started'; requestId: number; topicId: string; topicName: string; retry: boolean }
  | { type: 'questions_loaded'; requestId: number; questions: QuizQuestion[] }
  | { type: 'questions_failed'; requestId: number; message: string }
  | { type: 'answer_changed'; questionId: string; answer: string }
  | { type: 'answer_submitted'; question: QuizQuestion }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'jump'; index: number }
  | { type: 'finish' }
  | { type: 'back_to_select' }
  | { type: 'hydrate'; session: QuizSession | null }

export function createInitialQuizState(session: QuizSession | null = null): QuizState {
  if (!session || session.questions.length === 0) {
    return {
      stage: 'select',
      topicId: '',
      topicName: '',
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      submittedQuestions: [],
      showExplanation: false,
      loading: false,
      error: null,
      requestId: 0,
    }
  }

  return {
    ...session,
    currentQuestionIndex: Math.max(0, Math.min(session.currentQuestionIndex, session.questions.length - 1)),
    stage: 'taking',
    loading: false,
    error: null,
    requestId: 0,
  }
}

function withoutQuestionAnswer(question: QuizQuestion): QuizQuestion {
  const { userAnswer: _userAnswer, isCorrect: _isCorrect, ...freshQuestion } = question
  return freshQuestion
}

function submittedInQuestionOrder(questions: QuizQuestion[], submitted: QuizQuestion[]): QuizQuestion[] {
  const byId = new Map(submitted.map(question => [question.id, question]))
  return questions.flatMap(question => {
    const submittedQuestion = byId.get(question.id)
    return submittedQuestion ? [submittedQuestion] : []
  })
}

function hasSubmitted(state: QuizState, index: number): boolean {
  const question = state.questions[index]
  return !!question && state.submittedQuestions.some(submitted => submitted.id === question.id)
}

export function quizReducer(state: QuizState, event: QuizEvent): QuizState {
  switch (event.type) {
    case 'load_started':
      return {
        ...createInitialQuizState(),
        stage: event.retry ? 'taking' : 'select',
        topicId: event.topicId,
        topicName: event.topicName,
        loading: true,
        requestId: event.requestId,
      }

    case 'questions_loaded':
      if (event.requestId !== state.requestId) return state
      return {
        ...state,
        stage: 'taking',
        questions: event.questions.map(withoutQuestionAnswer),
        currentQuestionIndex: 0,
        answers: {},
        submittedQuestions: [],
        showExplanation: false,
        loading: false,
        error: null,
      }

    case 'questions_failed':
      if (event.requestId !== state.requestId) return state
      return {
        ...state,
        stage: 'select',
        questions: [],
        currentQuestionIndex: 0,
        answers: {},
        submittedQuestions: [],
        showExplanation: false,
        loading: false,
        error: event.message,
      }

    case 'answer_changed':
      if (state.stage !== 'taking' || state.loading || !state.questions.some(question => question.id === event.questionId)) return state
      return {
        ...state,
        answers: { ...state.answers, [event.questionId]: event.answer },
        showExplanation: state.showExplanation && state.answers[event.questionId] === event.answer,
      }

    case 'answer_submitted':
      if (state.stage !== 'taking' || state.loading || !state.questions.some(question => question.id === event.question.id)) return state
      return {
        ...state,
        submittedQuestions: submittedInQuestionOrder(
          state.questions,
          [...state.submittedQuestions.filter(question => question.id !== event.question.id), event.question],
        ),
        showExplanation: true,
      }

    case 'next':
      if (!state.showExplanation || state.currentQuestionIndex >= state.questions.length - 1) return state
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        showExplanation: false,
      }

    case 'previous': {
      if (state.currentQuestionIndex <= 0) return state
      const index = state.currentQuestionIndex - 1
      return {
        ...state,
        currentQuestionIndex: index,
        showExplanation: hasSubmitted(state, index),
      }
    }

    case 'jump':
      if (event.index < 0 || event.index >= state.questions.length) return state
      return {
        ...state,
        currentQuestionIndex: event.index,
        showExplanation: hasSubmitted(state, event.index),
      }

    case 'finish':
      if (state.stage !== 'taking' || !state.showExplanation || state.questions.length === 0) return state
      return { ...state, stage: 'results', loading: false }

    case 'back_to_select':
      return { ...createInitialQuizState(), requestId: state.requestId }

    case 'hydrate':
      return { ...createInitialQuizState(event.session), requestId: state.requestId }
  }
}
