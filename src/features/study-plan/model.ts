import type { StudyPlan } from '../../types'
import { getPlanSummary } from '../../utils/planGenerator'

export type StudyPlanSummary = ReturnType<typeof getPlanSummary>

export interface StudyPlanViewModel {
  summary: StudyPlanSummary
  coveredCount: number
  firstUndoneIdx: number
  studiedHours: number
  remainingTopics: number
}

export function getStudyPlanViewModel(
  plan: StudyPlan,
): StudyPlanViewModel {
  return {
    summary: getPlanSummary(plan),
    coveredCount: plan.blocks.filter(block => block.substantiallyCovered).length,
    firstUndoneIdx: plan.blocks.findIndex(block => !block.done && block.topicId !== 'review-break'),
    studiedHours: plan.blocks
      .filter(block => block.done)
      .reduce((total, block) => total + block.duration, 0),
    remainingTopics: plan.blocks.filter(
      block => !block.substantiallyCovered && block.topicId !== 'review-break',
    ).length,
  }
}
