import type { QuizResult, StudyPlan, SprintSetup } from '../../types'
import { getTopicPriorityScore } from '../../utils/planGenerator'

export interface ProgressStats {
  totalTopics: number
  doneBlocks: number
  totalBlocks: number
  completionPct: number
  totalQuizzes: number
  avgScore: number
  bestQuiz: number
  weakAreas: string[]
  substantiallyCovered: string[]
  coveredCount: number
  nextAction: string
  nextActionLink: string
}

export function getProgressStats(
  setup: SprintSetup | null,
  plan: StudyPlan | null,
  quizResults: QuizResult[],
): ProgressStats {
  const totalTopics = setup?.topics.length || 0
  const doneBlocks = plan?.blocks.filter(block => block.done).length || 0
  const totalBlocks = plan?.blocks.length || 0
  const completionPct = totalBlocks > 0 ? Math.round((doneBlocks / totalBlocks) * 100) : 0
  const totalQuizzes = quizResults.length
  const avgScore = totalQuizzes > 0
    ? Math.round(quizResults.reduce((sum, result) => sum + (result.score / result.total) * 100, 0) / totalQuizzes)
    : 0
  const bestQuiz = totalQuizzes > 0
    ? Math.max(...quizResults.map(result => Math.round((result.score / result.total) * 100)))
    : 0

  const latestByTopic = new Map<string, QuizResult>()
  for (const result of [...quizResults].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())) {
    if (!latestByTopic.has(result.topicName)) latestByTopic.set(result.topicName, result)
  }

  const weakAreas: string[] = []
  const substantiallyCovered: string[] = []
  for (const [topicName, result] of latestByTopic.entries()) {
    const pct = (result.score / result.total) * 100
    if (pct < 60) weakAreas.push(topicName)
    if (pct >= 80) substantiallyCovered.push(topicName)
  }

  const coveredCount = plan?.blocks.filter(block => block.substantiallyCovered).length || substantiallyCovered.length
  const findNextPriorityTopic = () => {
    if (!setup || !plan) return null
    const sorted = [...plan.blocks]
      .filter(block => !block.substantiallyCovered && block.topicId !== 'review-break')
      .sort((a, b) => {
        const aTopic = setup.topics.find(topic => topic.id === a.topicId)
        const bTopic = setup.topics.find(topic => topic.id === b.topicId)
        if (!aTopic || !bTopic) return 0
        return getTopicPriorityScore(bTopic) - getTopicPriorityScore(aTopic)
      })
    return sorted[0] || null
  }

  let nextAction = ''
  let nextActionLink = ''
  if (weakAreas.length > 0) {
    nextAction = `Review weak areas: ${weakAreas.join(', ')}. Retake these topic quizzes to improve your understanding.`
    nextActionLink = '/quiz'
  } else if (substantiallyCovered.length >= totalTopics && totalTopics > 0) {
    nextAction = 'All topics substantially covered! Do a final review before your exam. Great preparation!'
    nextActionLink = '/plan'
  } else if (totalQuizzes > 0) {
    const nextTopic = findNextPriorityTopic()
    if (nextTopic) {
      const isAlreadyTested = latestByTopic.has(nextTopic.topicName)
      const lastScore = latestByTopic.get(nextTopic.topicName)
      const scorePct = lastScore ? Math.round((lastScore.score / lastScore.total) * 100) : null
      if (isAlreadyTested && scorePct !== null && scorePct < 60) {
        nextAction = `You scored ${scorePct}% on ${nextTopic.topicName}. Review the explanations and retake the quiz.`
        nextActionLink = '/quiz'
      } else if (isAlreadyTested && scorePct !== null && scorePct >= 60 && scorePct < 80) {
        nextAction = `You scored ${scorePct}% on ${nextTopic.topicName}. A bit more practice needed — retake the quiz.`
        nextActionLink = '/quiz'
      } else {
        nextAction = `Continue with ${nextTopic.topicName} — your next highest-priority topic.`
        nextActionLink = '/plan'
      }
    } else {
      nextAction = 'Great progress! Keep reviewing to reinforce your knowledge.'
      nextActionLink = '/plan'
    }
  } else if (plan && plan.blocks.length > 0) {
    const firstBlock = plan.blocks[0]
    if (firstBlock && firstBlock.topicId !== 'review-break') {
      nextAction = `Take the quiz for ${firstBlock.topicName} to assess your knowledge.`
      nextActionLink = '/quiz'
    }
  } else {
    nextAction = 'Set up your exam to get started.'
    nextActionLink = '/'
  }

  return {
    totalTopics,
    doneBlocks,
    totalBlocks,
    completionPct,
    totalQuizzes,
    avgScore,
    bestQuiz,
    weakAreas,
    substantiallyCovered,
    coveredCount,
    nextAction,
    nextActionLink,
  }
}
