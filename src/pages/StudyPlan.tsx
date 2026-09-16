import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { QuizResult, SprintSetup, StudyPlan, TimeBlock, TimerState } from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { clearStoredValue, persistStoredValue } from '../storage/browserStore'
import { STORAGE_KEYS } from '../storage/schema'
import { useTimer } from '../timer/useTimer'
import { generatePlan } from '../utils/planGenerator'
import StudyPlanView from '../features/study-plan/StudyPlanView'
import { getStudyPlanViewModel } from '../features/study-plan/model'

export default function StudyPlanPage() {
  const navigate = useNavigate()
  const [setup] = useLocalStorage<SprintSetup | null>(STORAGE_KEYS.setup, null)
  const [plan, setPlan] = useLocalStorage<StudyPlan | null>(STORAGE_KEYS.plan, null)
  const [, setQuizResults] = useLocalStorage<QuizResult[]>(STORAGE_KEYS.quizResults, [])
  const [timer, setTimer] = useLocalStorage<TimerState | null>(STORAGE_KEYS.activeTimer, null)
  const { toggle: toggleTimer } = useTimer(timer, setTimer)
  const [showRegenerate, setShowRegenerate] = useState(false)

  useEffect(() => {
    if (!setup || plan) return
    setPlan(generatePlan(setup))
  }, [setup, plan, setPlan])

  const model = useMemo(
    () => setup && plan ? getStudyPlanViewModel(plan) : null,
    [plan, setup],
  )

  const toggleBlock = (blockId: string) => {
    if (!plan) return
    setPlan({
      ...plan,
      blocks: plan.blocks.map(block =>
        block.id === blockId ? { ...block, done: !block.done } : block,
      ),
    })
  }

  const handleStartQuiz = (blockId: string) => {
    const block = plan?.blocks.find(candidate => candidate.id === blockId)
    if (!block) return
    if (!persistStoredValue(STORAGE_KEYS.quizTopic, {
      topicId: block.topicId,
      topicName: block.topicName,
    })) return
    navigate('/quiz')
  }

  const handleRegenerate = () => {
    if (!setup) return
    setPlan(generatePlan(setup))
    setQuizResults([])
    setTimer(null)
    clearStoredValue(STORAGE_KEYS.quizTopic)
    setShowRegenerate(false)
  }

  return (
    <StudyPlanView
      setup={setup}
      plan={plan}
      model={model}
      timer={timer}
      showRegenerate={showRegenerate}
      onNavigateSetup={() => navigate('/')}
      onToggleRegenerate={() => setShowRegenerate(previous => !previous)}
      onRegenerate={handleRegenerate}
      onCancelRegenerate={() => setShowRegenerate(false)}
      onToggleBlock={toggleBlock}
      onStartQuiz={handleStartQuiz}
      onToggleTimer={(block: TimeBlock) => toggleTimer(block.id, Math.max(60, Math.round(block.duration * 3600)))}
    />
  )
}
