import type {
  QuizQuestion,
  QuizResult,
  SprintSetup,
  StudyPlan,
  TimerState,
  TimeBlock,
  TopicSetup,
} from '../types'
import type { QuizSession } from '../quiz/reducer'

export const STORAGE_VERSION = 1 as const

export const STORAGE_KEYS = {
  setup: 'icecold-setup',
  plan: 'icecold-plan',
  quizResults: 'icecold-quiz-results',
  activeTimer: 'icecold-active-timer',
  quizTopic: 'icecold-quiz-topic',
  activeQuiz: 'icecold-active-quiz',
} as const

export interface QuizTopicSelection {
  topicId: string
  topicName: string
}

export interface StorageEnvelope<T> {
  version: typeof STORAGE_VERSION
  data: T
  [key: string]: unknown
}

export interface UnknownStorageEnvelope {
  version: number
  data: unknown
  [key: string]: unknown
}

export type StorageValidator = (value: unknown) => boolean

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isStorageEnvelope(value: unknown): value is UnknownStorageEnvelope {
  return isRecord(value) && Number.isInteger(value.version) && 'data' in value
}

export function isCurrentStorageEnvelope(value: unknown): value is StorageEnvelope<unknown> {
  return isStorageEnvelope(value) && value.version === STORAGE_VERSION
}

function isConfidence(value: unknown): value is TopicSetup['confidence'] {
  return value === 'low' || value === 'medium' || value === 'high'
}

function isImportance(value: unknown): value is TopicSetup['importance'] {
  return value === 'low' || value === 'medium' || value === 'high'
}

function isTopicSetup(value: unknown): value is TopicSetup {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && isConfidence(value.confidence)
    && isImportance(value.importance)
}

function isSprintSetup(value: unknown): value is SprintSetup {
  return isRecord(value)
    && typeof value.examName === 'string'
    && typeof value.examHours === 'number'
    && Number.isFinite(value.examHours)
    && typeof value.studyHours === 'number'
    && Number.isFinite(value.studyHours)
    && Array.isArray(value.topics)
    && value.topics.every(isTopicSetup)
    && typeof value.generatedAt === 'string'
}

function isActivityLabel(value: unknown): value is TimeBlock['activityLabel'] {
  return value === 'learn'
    || value === 'review'
    || value === 'practice'
    || value === 'recall'
    || value === 'mistakes'
}

function isTimeBlock(value: unknown): value is TimeBlock {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.topicId === 'string'
    && typeof value.topicName === 'string'
    && typeof value.duration === 'number'
    && Number.isFinite(value.duration)
    && typeof value.startHour === 'number'
    && Number.isFinite(value.startHour)
    && typeof value.priority === 'string'
    && typeof value.priorityReason === 'string'
    && typeof value.recommendedActivity === 'string'
    && isActivityLabel(value.activityLabel)
    && typeof value.done === 'boolean'
    && (value.quizScore === undefined || (typeof value.quizScore === 'number' && Number.isFinite(value.quizScore)))
    && (value.substantiallyCovered === undefined || typeof value.substantiallyCovered === 'boolean')
}

function isStudyPlan(value: unknown): value is StudyPlan {
  return isRecord(value)
    && isSprintSetup(value.setup)
    && Array.isArray(value.blocks)
    && value.blocks.every(isTimeBlock)
    && typeof value.totalHours === 'number'
    && Number.isFinite(value.totalHours)
    && typeof value.generatedAt === 'string'
}

function isQuestionType(value: unknown): value is QuizQuestion['type'] {
  return value === 'mcq' || value === 'short'
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  return isRecord(value)
    && typeof value.id === 'string'
    && isQuestionType(value.type)
    && typeof value.question === 'string'
    && (value.options === undefined || (Array.isArray(value.options) && value.options.every(item => typeof item === 'string')))
    && typeof value.correctAnswer === 'string'
    && typeof value.explanation === 'string'
    && (value.userAnswer === undefined || typeof value.userAnswer === 'string')
    && (value.isCorrect === undefined || typeof value.isCorrect === 'boolean')
}

function isQuizResult(value: unknown): value is QuizResult {
  return isRecord(value)
    && typeof value.topicId === 'string'
    && typeof value.topicName === 'string'
    && Array.isArray(value.questions)
    && value.questions.every(isQuizQuestion)
    && typeof value.score === 'number'
    && Number.isFinite(value.score)
    && typeof value.total === 'number'
    && Number.isFinite(value.total)
    && typeof value.completedAt === 'string'
}

function isQuizSession(value: unknown): value is QuizSession {
  return isRecord(value)
    && typeof value.topicId === 'string'
    && typeof value.topicName === 'string'
    && Array.isArray(value.questions)
    && value.questions.length > 0
    && value.questions.every(isQuizQuestion)
    && typeof value.currentQuestionIndex === 'number'
    && Number.isInteger(value.currentQuestionIndex)
    && value.currentQuestionIndex >= 0
    && value.currentQuestionIndex < value.questions.length
    && isRecord(value.answers)
    && Object.values(value.answers).every(answer => typeof answer === 'string')
    && Array.isArray(value.submittedQuestions)
    && value.submittedQuestions.every(isQuizQuestion)
    && typeof value.showExplanation === 'boolean'
}

function isTimerState(value: unknown): value is TimerState {
  return isRecord(value)
    && typeof value.blockId === 'string'
    && typeof value.remainingSeconds === 'number'
    && Number.isFinite(value.remainingSeconds)
    && value.remainingSeconds >= 0
    && typeof value.running === 'boolean'
    && typeof value.updatedAt === 'number'
    && Number.isFinite(value.updatedAt)
}

function isQuizTopicSelection(value: unknown): value is QuizTopicSelection {
  return isRecord(value)
    && typeof value.topicId === 'string'
    && typeof value.topicName === 'string'
}

function nullable(validator: StorageValidator): StorageValidator {
  return (value) => value === null || validator(value)
}

export function getStorageValidator(key: string): StorageValidator | undefined {
  switch (key) {
    case STORAGE_KEYS.setup:
      return nullable(isSprintSetup)
    case STORAGE_KEYS.plan:
      return nullable(isStudyPlan)
    case STORAGE_KEYS.quizResults:
      return (value) => Array.isArray(value) && value.every(isQuizResult)
    case STORAGE_KEYS.activeTimer:
      return nullable(isTimerState)
    case STORAGE_KEYS.quizTopic:
      return nullable(isQuizTopicSelection)
    case STORAGE_KEYS.activeQuiz:
      return nullable(isQuizSession)
    default:
      return undefined
  }
}
