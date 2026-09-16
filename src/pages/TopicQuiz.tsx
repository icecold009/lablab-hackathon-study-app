import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, BookOpen, Target } from 'lucide-react'
import type { QuizResult, StudyPlan, SprintSetup } from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { clearStoredValue, readStoredValue } from '../storage/browserStore'
import { STORAGE_KEYS, type QuizTopicSelection } from '../storage/schema'
import { getTopicPriorityScore } from '../utils/planGenerator'
import { useQuizController } from '../quiz/controller'
import { sampleQuizProvider } from '../quiz/provider'
import type { QuizSession } from '../quiz/reducer'
import TopicQuizView from '../features/quiz/TopicQuizView'

function readPersistedSetup(): SprintSetup | null {
  return readStoredValue<SprintSetup | null>(STORAGE_KEYS.setup, null).value
}

export default function TopicQuiz() {
  const navigate = useNavigate()
  const [plan, setPlan] = useLocalStorage<StudyPlan | null>(STORAGE_KEYS.plan, null)
  const [setup] = useLocalStorage<SprintSetup | null>(STORAGE_KEYS.setup, null)
  const [, setQuizResults] = useLocalStorage<QuizResult[]>(STORAGE_KEYS.quizResults, [])
  const [activeQuiz, setActiveQuiz] = useLocalStorage<QuizSession | null>(STORAGE_KEYS.activeQuiz, null)
  const autoStartHandledRef = useRef(false)

  const {
    model,
    selectTopic: handleSelectTopic,
    retry: handleRetry,
    answer: handleAnswer,
    submit: submitAnswer,
    next: handleNext,
    previous: handlePrev,
    jump: handleJump,
    finish: finishQuiz,
    backToSelect: controllerBackToSelect,
  } = useQuizController({
    initialSession: activeQuiz,
    provider: sampleQuizProvider,
    onSessionChange: setActiveQuiz,
    onResult: result => setQuizResults(previous => [...previous, result]),
    onProgress: ({ topicId, scorePct }) => {
      setPlan(previous => previous
        ? {
            ...previous,
            blocks: previous.blocks.map(block => block.topicId === topicId
              ? {
                  ...block,
                  quizScore: scorePct,
                  done: true,
                  substantiallyCovered: scorePct >= 80,
                }
              : block),
          }
        : previous)
    },
  })

  const {
    stage,
    topicName: selectedTopicName,
    questions,
    currentQuestionIndex: currentQ,
    answers,
    showExplanation,
    submittedQuestions,
    loading,
    error,
  } = model
  const quizScore = model.score

  const handleBackToSelect = () => {
    controllerBackToSelect()
    clearStoredValue(STORAGE_KEYS.quizTopic)
  }

  const topics = useMemo(() => setup?.topics || readPersistedSetup()?.topics || [], [setup])

  const handleBackToPlan = () => {
    clearStoredValue(STORAGE_KEYS.quizTopic)
    navigate('/plan')
  }

  const handleContinueToNextTopic = () => {
    if (plan && setup) {
      const undones = plan.blocks
        .filter(block => !block.substantiallyCovered && block.topicId !== 'review-break')
        .sort((a, b) => {
          const aTopic = setup.topics.find(topic => topic.id === a.topicId)
          const bTopic = setup.topics.find(topic => topic.id === b.topicId)
          if (!aTopic || !bTopic) return 0
          return getTopicPriorityScore(bTopic) - getTopicPriorityScore(aTopic)
        })
      if (undones.length > 0) {
        const next = undones[0]
        handleSelectTopic(next.topicId, next.topicName)
        return
      }
    }
    navigate('/plan')
  }

  useEffect(() => {
    if (stage !== 'taking' || loading || questions.length === 0) return

    const question = questions[currentQ]
    const userAnswer = question ? answers[question.id] : undefined
    const hasAnswer = !!userAnswer?.trim()
    const isSubmitted = submittedQuestions.some(item => item.id === question?.id)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        handlePrev()
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        if (showExplanation && currentQ < questions.length - 1) {
          handleNext()
        } else if (showExplanation && currentQ >= questions.length - 1) {
          finishQuiz()
        }
        return
      }
      if (event.key === 'Enter' && hasAnswer && !showExplanation && !isSubmitted) {
        event.preventDefault()
        submitAnswer()
        return
      }
      if (question?.type === 'mcq' && !showExplanation && !isSubmitted) {
        const number = parseInt(event.key)
        if (number >= 1 && number <= (question.options?.length || 0)) {
          event.preventDefault()
          handleAnswer(question.id, question.options![number - 1])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stage, loading, questions, currentQ, answers, showExplanation, submittedQuestions, handlePrev, handleNext, submitAnswer, finishQuiz, handleAnswer])

  useEffect(() => {
    if (stage !== 'select' || loading) return
    const persistedSetup = setup || readPersistedSetup()
    if (!persistedSetup) return
    const stored = readStoredValue<QuizTopicSelection | null>(STORAGE_KEYS.quizTopic, null).value
    if (!stored) return
    if (autoStartHandledRef.current) return
    const topic = persistedSetup.topics.find(item => item.id === stored.topicId)
    if (!topic) {
      clearStoredValue(STORAGE_KEYS.quizTopic)
      return
    }

    autoStartHandledRef.current = true
    handleSelectTopic(topic.id, topic.name)
  }, [handleSelectTopic, loading, setup, stage])

  const totalQ = questions.length || 5
  const pct = totalQ > 0 ? Math.round((quizScore / totalQ) * 100) : 0
  const grade = pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good job!' : 'Keep practising'
  const gradeColors = pct >= 80 ? 'text-success' : pct >= 60 ? 'text-warning' : 'text-danger'
  const isCovered = pct >= 80

  const recommendation = pct >= 80
    ? {
        title: 'Substantially Covered',
        text: 'Excellent work! You have demonstrated strong understanding. Move on to your next highest-priority topic.',
        Icon: Award,
        color: 'text-success',
        bg: 'bg-success/15',
        border: 'border-success/30',
      }
    : pct >= 60
    ? {
        title: 'Targeted Practice Needed',
        text: 'Good progress! Focus on the concepts you missed below. Review the explanations and try again.',
        Icon: Target,
        color: 'text-warning',
        bg: 'bg-warning/15',
        border: 'border-warning/30',
      }
    : {
        title: 'Review and Retry',
        text: 'Review the explanations below carefully. Each question has a detailed explanation to help you understand the concept. Retake the quiz when you feel more confident.',
        Icon: BookOpen,
        color: 'text-danger',
        bg: 'bg-danger/15',
        border: 'border-danger/30',
      }

  return (
    <TopicQuizView
      stage={stage}
      selectedTopicName={selectedTopicName}
      topics={topics}
      plan={plan}
      questions={questions}
      currentQ={currentQ}
      answers={answers}
      showExplanation={showExplanation}
      submittedQuestions={submittedQuestions}
      loading={loading}
      error={error}
      quizScore={quizScore}
      pct={pct}
      grade={grade}
      gradeColors={gradeColors}
      isCovered={isCovered}
      recommendation={recommendation}
      onSelectTopic={handleSelectTopic}
      onRetry={handleRetry}
      onAnswer={handleAnswer}
      onSubmit={submitAnswer}
      onNext={handleNext}
      onPrevious={handlePrev}
      onJump={handleJump}
      onFinish={finishQuiz}
      onBackToSelect={handleBackToSelect}
      onGoToSetup={() => navigate('/')}
      onBackToPlan={handleBackToPlan}
      onContinueToNextTopic={handleContinueToNextTopic}
    />
  )
}
