import type {
  Confidence,
  Importance,
  QuizQuestion,
  QuizResult,
  SprintSetup,
  StudyPlan,
  TimeBlock,
  TopicSetup,
} from '../types'

const generatedAt = '2026-09-01T00:00:00.000Z'

export function createTopic(overrides: Partial<TopicSetup> = {}): TopicSetup {
  return {
    id: 'topic-cell-biology',
    name: 'Cell Biology',
    confidence: 'low' satisfies Confidence,
    importance: 'high' satisfies Importance,
    ...overrides,
  }
}

export function createSetup(overrides: Partial<SprintSetup> = {}): SprintSetup {
  return {
    examName: 'Biology',
    examHours: 24,
    studyHours: 4,
    topics: [
      createTopic(),
      createTopic({ id: 'topic-genetics', name: 'Genetics', confidence: 'medium', importance: 'high' }),
    ],
    generatedAt,
    ...overrides,
  }
}

export function createTimeBlock(overrides: Partial<TimeBlock> = {}): TimeBlock {
  return {
    id: 'block-cell-biology',
    topicId: 'topic-cell-biology',
    topicName: 'Cell Biology',
    duration: 1,
    startHour: 0,
    priority: 'Critical — low confidence, high importance',
    priorityReason: 'Focus here first.',
    recommendedActivity: 'Learn the concept.',
    activityLabel: 'learn',
    done: false,
    ...overrides,
  }
}

export function createPlan(overrides: Partial<StudyPlan> = {}): StudyPlan {
  const setup = createSetup()
  return {
    setup,
    blocks: [createTimeBlock()],
    totalHours: setup.studyHours,
    generatedAt,
    ...overrides,
  }
}

export function createQuestion(overrides: Partial<QuizQuestion> = {}): QuizQuestion {
  return {
    id: 'mcq-cell-biology-0',
    type: 'mcq',
    question: 'What is the powerhouse of the cell?',
    options: ['Mitochondria', 'Ribosome', 'Nucleus'],
    correctAnswer: 'Mitochondria',
    explanation: 'Mitochondria produce most cellular ATP.',
    ...overrides,
  }
}

export function createQuizResult(overrides: Partial<QuizResult> = {}): QuizResult {
  return {
    topicId: 'topic-cell-biology',
    topicName: 'Cell Biology',
    questions: [createQuestion({ userAnswer: 'Mitochondria', isCorrect: true })],
    score: 1,
    total: 1,
    completedAt: generatedAt,
    ...overrides,
  }
}
