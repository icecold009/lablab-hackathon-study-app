import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { QuizResult, StudyPlan, SprintSetup } from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { persistStoredValue } from '../storage/browserStore'
import { STORAGE_KEYS } from '../storage/schema'
import ProgressView from '../features/progress/ProgressView'
import { getProgressStats } from '../features/progress/model'

export default function Progress() {
  const navigate = useNavigate()
  const [setup] = useLocalStorage<SprintSetup | null>(STORAGE_KEYS.setup, null)
  const [plan] = useLocalStorage<StudyPlan | null>(STORAGE_KEYS.plan, null)
  const [quizResults] = useLocalStorage<QuizResult[]>(STORAGE_KEYS.quizResults, [])

  const stats = useMemo(
    () => getProgressStats(setup, plan, quizResults),
    [plan, quizResults, setup],
  )
  const hasData = !!((plan && plan.blocks.length > 0) || quizResults.length > 0)

  const handleRetakeTopic = (topicName: string) => {
    const topicId = setup?.topics.find(topic => topic.name === topicName)?.id || ''
    if (!persistStoredValue(STORAGE_KEYS.quizTopic, { topicName, topicId })) return
    navigate('/quiz')
  }

  return (
    <ProgressView
      setup={setup}
      quizResults={quizResults}
      stats={stats}
      hasData={hasData}
      onGetStarted={() => navigate('/')}
      onNavigate={navigate}
      onRetakeTopic={handleRetakeTopic}
    />
  )
}
