import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generatePlan, getPlanSummary } from './planGenerator'
import { createSetup } from '../test/fixtures'

describe('plan generation characterization', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is deterministic for the same setup and keeps the schedule within the budget', () => {
    const setup = createSetup({
      studyHours: 6,
      topics: [
        ...createSetup().topics,
        { id: 'topic-ecology', name: 'Ecology', confidence: 'high', importance: 'medium' },
      ],
    })

    const first = generatePlan(setup)
    const second = generatePlan(setup)

    expect(second).toEqual(first)
    expect(first.blocks.reduce((total, block) => total + block.duration, 0)).toBeLessThanOrEqual(6)
    expect(first.generatedAt).toBe('2026-09-15T10:00:00.000Z')
  })

  it('prioritises low-confidence, high-importance topics and reports review reserve', () => {
    const plan = generatePlan(createSetup({ studyHours: 2 }))
    const summary = getPlanSummary(plan)

    expect(plan.blocks[0]?.topicName).toBe('Cell Biology')
    expect(summary.reviewBreakHours).toBeGreaterThan(0)
    expect(summary.totalTopics).toBe(2)
  })
})
