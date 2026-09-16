import { describe, expect, it } from 'vitest'
import { getSampleSetup } from '../../data/sampleData'
import { generatePlan } from '../../utils/planGenerator'
import type { QuizResult } from '../../types'
import { getProgressStats } from './model'

describe('getProgressStats', () => {
  it('returns the setup recommendation when no study data exists', () => {
    const stats = getProgressStats(null, null, [])

    expect(stats.totalTopics).toBe(0)
    expect(stats.completionPct).toBe(0)
    expect(stats.nextAction).toBe('Set up your exam to get started.')
    expect(stats.nextActionLink).toBe('/')
  })

  it('uses the latest quiz result to identify weak areas', () => {
    const setup = getSampleSetup()
    const plan = generatePlan(setup)
    const result: QuizResult = {
      topicId: setup.topics[0].id,
      topicName: setup.topics[0].name,
      questions: [],
      score: 1,
      total: 5,
      completedAt: '2026-09-16T10:00:00.000Z',
    }

    const stats = getProgressStats(setup, plan, [result])

    expect(stats.totalTopics).toBe(setup.topics.length)
    expect(stats.totalQuizzes).toBe(1)
    expect(stats.weakAreas).toEqual([setup.topics[0].name])
    expect(stats.nextActionLink).toBe('/quiz')
  })
})
