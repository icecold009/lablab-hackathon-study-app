import { describe, expect, it } from 'vitest'
import { getSampleSetup } from '../../data/sampleData'
import { generatePlan } from '../../utils/planGenerator'
import { getStudyPlanViewModel } from './model'

describe('getStudyPlanViewModel', () => {
  it('derives schedule metrics without React or storage dependencies', () => {
    const plan = generatePlan(getSampleSetup())
    const model = getStudyPlanViewModel(plan)

    expect(model.summary.totalBlocks).toBe(plan.blocks.length)
    expect(model.summary.doneBlocks).toBe(0)
    expect(model.studiedHours).toBe(0)
    expect(model.remainingTopics).toBeGreaterThan(0)
    expect(model.firstUndoneIdx).toBeGreaterThanOrEqual(0)
  })

  it('tracks completed and covered blocks separately', () => {
    const plan = generatePlan(getSampleSetup())
    const updatedPlan = {
      ...plan,
      blocks: plan.blocks.map((block, index) => index === 0
        ? { ...block, done: true, substantiallyCovered: true }
        : block),
    }

    const model = getStudyPlanViewModel(updatedPlan)

    expect(model.summary.doneBlocks).toBe(1)
    expect(model.coveredCount).toBe(1)
    expect(model.studiedHours).toBe(updatedPlan.blocks[0].duration)
  })
})
