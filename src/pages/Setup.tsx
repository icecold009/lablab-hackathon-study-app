import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SprintSetup, StudyPlan, QuizResult, TopicSetup } from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { clearStoredValue } from '../storage/browserStore'
import { STORAGE_KEYS } from '../storage/schema'
import { getSampleSetup } from '../data/sampleData'
import { generatePlan } from '../utils/planGenerator'
import SetupView from '../features/setup/SetupView'

function makeId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export default function Setup() {
  const navigate = useNavigate()
  const [setup, setSetup] = useLocalStorage<SprintSetup | null>(STORAGE_KEYS.setup, null)
  const [, setPlan] = useLocalStorage<StudyPlan | null>(STORAGE_KEYS.plan, null)
  const [, setQuizResults] = useLocalStorage<QuizResult[]>(STORAGE_KEYS.quizResults, [])

  const [examName, setExamName] = useState(setup?.examName || '')
  const [examHours, setExamHours] = useState(setup?.examHours || 48)
  const [studyHours, setStudyHours] = useState(setup?.studyHours || 10)
  const [topics, setTopics] = useState<TopicSetup[]>(setup?.topics || [])
  const [newTopicName, setNewTopicName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)

  const perTopicHours = useMemo(() => {
    if (topics.length === 0) return 0
    return Math.round((studyHours / topics.length) * 10) / 10
  }, [studyHours, topics.length])

  const clearError = (field: string) => {
    setErrors(previous => {
      const { [field]: _, ...rest } = previous
      return rest
    })
  }

  const addTopic = () => {
    const name = newTopicName.trim()
    if (!name) return
    if (topics.some(topic => topic.name.toLowerCase() === name.toLowerCase())) {
      setErrors(previous => ({ ...previous, newTopic: 'A topic with this name already exists.' }))
      return
    }
    setTopics(previous => [...previous, {
      id: makeId(),
      name,
      confidence: 'medium',
      importance: 'medium',
    }])
    setNewTopicName('')
    clearError('newTopic')
  }

  const updateTopic = (id: string, field: keyof TopicSetup, value: string) => {
    setTopics(previous => previous.map(topic =>
      topic.id === id ? { ...topic, [field]: value } : topic
    ))
  }

  const loadSample = () => {
    const sample = getSampleSetup()
    setExamName(sample.examName)
    setExamHours(sample.examHours)
    setStudyHours(sample.studyHours)
    setTopics(sample.topics)
  }

  const handleSampleSprint = () => {
    const sample = getSampleSetup()
    setExamName(sample.examName)
    setExamHours(sample.examHours)
    setStudyHours(sample.studyHours)
    setTopics(sample.topics)

    const sprintSetup: SprintSetup = {
      examName: sample.examName,
      examHours: sample.examHours,
      studyHours: sample.studyHours,
      topics: sample.topics.map(topic => ({ ...topic })),
      generatedAt: new Date().toISOString(),
    }
    setSetup(sprintSetup)
    setPlan(generatePlan(sprintSetup))
    setQuizResults([])
    clearStoredValue(STORAGE_KEYS.quizTopic)
    navigate('/plan')
  }

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!examName.trim()) nextErrors.examName = 'Enter your exam or subject name.'
    if (examHours < 1) nextErrors.examHours = 'Time until exam must be at least 1 hour.'
    if (studyHours < 1) nextErrors.studyHours = 'You need at least 1 hour to study.'
    if (studyHours > examHours) nextErrors.studyHours = 'Study hours cannot exceed time until the exam.'
    if (topics.length === 0) nextErrors.topics = 'Add at least one topic to generate a plan.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleGenerate = () => {
    if (!validate()) return
    setGenerating(true)

    const sprintSetup: SprintSetup = {
      examName: examName.trim(),
      examHours,
      studyHours,
      topics,
      generatedAt: new Date().toISOString(),
    }

    setSetup(sprintSetup)
    setPlan(generatePlan(sprintSetup))
    setQuizResults([])
    clearStoredValue(STORAGE_KEYS.quizTopic)

    setTimeout(() => {
      setGenerating(false)
      navigate('/plan')
    }, 600)
  }

  const handleReset = () => {
    setSetup(null)
    setPlan(null)
    setQuizResults([])
    clearStoredValue(STORAGE_KEYS.quizTopic)
    clearStoredValue(STORAGE_KEYS.activeTimer)
    clearStoredValue(STORAGE_KEYS.activeQuiz)
    setExamName('')
    setExamHours(48)
    setStudyHours(10)
    setTopics([])
    setNewTopicName('')
    setErrors({})
  }

  return (
    <SetupView
      setup={setup}
      examName={examName}
      examHours={examHours}
      studyHours={studyHours}
      topics={topics}
      newTopicName={newTopicName}
      errors={errors}
      generating={generating}
      perTopicHours={perTopicHours}
      reviewReservePct={topics.length > 0 ? 15 : 0}
      onExamNameChange={setExamName}
      onExamHoursChange={setExamHours}
      onStudyHoursChange={setStudyHours}
      onNewTopicNameChange={setNewTopicName}
      onClearError={clearError}
      onAddTopic={addTopic}
      onRemoveTopic={id => setTopics(previous => previous.filter(topic => topic.id !== id))}
      onUpdateTopic={updateTopic}
      onLoadSample={loadSample}
      onSampleSprint={handleSampleSprint}
      onGenerate={handleGenerate}
      onReset={handleReset}
    />
  )
}
