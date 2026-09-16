import {
  ArrowLeft, ArrowRight, Brain, CheckCircle2, Lightbulb, Send, Sparkles,
  Snowflake, XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { QuizQuestion, StudyPlan, TopicSetup } from '../../types'
import type { QuizStage } from '../../quiz/reducer'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'

export interface QuizRecommendation {
  title: string
  text: string
  Icon: LucideIcon
  color: string
  bg: string
  border: string
}

export interface TopicQuizViewProps {
  stage: QuizStage
  selectedTopicName: string
  topics: TopicSetup[]
  plan: StudyPlan | null
  questions: QuizQuestion[]
  currentQ: number
  answers: Record<string, string>
  showExplanation: boolean
  submittedQuestions: QuizQuestion[]
  loading: boolean
  error: string | null
  quizScore: number
  pct: number
  grade: string
  gradeColors: string
  isCovered: boolean
  recommendation: QuizRecommendation
  onSelectTopic: (topicId: string, topicName: string) => void
  onRetry: () => void
  onAnswer: (questionId: string, answer: string) => void
  onSubmit: () => void
  onNext: () => void
  onPrevious: () => void
  onJump: (index: number) => void
  onFinish: () => void
  onBackToSelect: () => void
  onGoToSetup: () => void
  onBackToPlan: () => void
  onContinueToNextTopic: () => void
}

function QuizSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-64 w-full" />
      <div className="flex justify-between"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" /></div>
    </div>
  )
}

export default function TopicQuizView({
  stage,
  selectedTopicName,
  topics,
  plan,
  questions,
  currentQ,
  answers,
  showExplanation,
  submittedQuestions,
  loading,
  error,
  quizScore,
  pct,
  grade,
  gradeColors,
  isCovered,
  recommendation,
  onSelectTopic,
  onRetry,
  onAnswer,
  onSubmit,
  onNext,
  onPrevious,
  onJump,
  onFinish,
  onBackToSelect,
  onGoToSetup,
  onBackToPlan,
  onContinueToNextTopic,
}: TopicQuizViewProps) {
  const currentQuestion = questions[currentQ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<Snowflake size={18} className="text-primary" />}
        title="Topic Quiz"
        subtitle={stage === 'select' ? 'Choose a topic to test yourself' : `Testing: ${selectedTopicName}`}
        action={stage !== 'select' ? <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={onBackToSelect}>Topics</Button> : undefined}
      />

      {stage === 'select' && (
        <div>
          {error && !loading && <div role="alert" className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-4"><p className="text-sm text-danger mb-2">{error}</p><Button variant="danger" size="sm" onClick={onRetry}>Retry</Button></div>}
          {loading && <QuizSkeleton />}
          {!loading && topics.length === 0 && <EmptyState icon={<Brain size={28} className="text-muted/20" />} title="No topics yet" description="Set up your exam and topics first, then come back to test your knowledge." action={{ label: 'Go to Setup', onClick: onGoToSetup }} />}
          {!loading && topics.length > 0 && <div className="space-y-2"><p className="text-xs text-muted mb-2">Select a topic to start a 5-question quiz</p>{topics.map(topic => { const isCoveredTopic = plan?.blocks.find(block => block.topicId === topic.id)?.substantiallyCovered; return <button key={topic.id} onClick={() => onSelectTopic(topic.id, topic.name)} className="w-full flex items-center justify-between bg-bg-card border border-border hover:border-primary/30 hover:bg-hover rounded-xl px-4 py-3.5 text-left transition-all cursor-pointer group focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"><div className="flex items-center gap-2 min-w-0"><span className="text-sm font-medium text-foreground truncate">{topic.name}</span>{isCoveredTopic && <Badge variant="success" icon={<CheckCircle2 size={10} />}>Covered</Badge>}</div><span className="flex items-center gap-1.5 text-xs text-muted group-hover:text-primary-light transition-colors flex-shrink-0">Start Quiz <ArrowRight size={14} /></span></button> })}</div>}
        </div>
      )}

      {stage === 'taking' && (
        <div>
          {loading ? <QuizSkeleton /> : questions.length > 0 && currentQuestion && <>
            <div className="bg-bg-card border border-border rounded-xl p-4 mb-4"><div className="flex items-center justify-between mb-2"><span className="text-xs text-muted">{selectedTopicName}</span><span className="text-xs text-muted">{Object.keys(answers).length}/{questions.length} answered</span></div><ProgressBar value={(Object.keys(answers).length / questions.length) * 100} size="sm" /><div className="flex items-center gap-3 mt-2"><span className="text-[11px] text-muted">Correct: <span className="text-success font-medium">{quizScore}</span></span><span className="text-[11px] text-muted">Incorrect: <span className="text-danger font-medium">{submittedQuestions.filter(question => !question.isCorrect).length}</span></span></div></div>

            <div className="bg-bg-card border border-border rounded-xl p-4 sm:p-6 mb-4"><div className="flex items-center gap-2 mb-1 flex-wrap"><Badge variant="info">Question {currentQ + 1} of {questions.length}</Badge><Badge variant={currentQuestion.type === 'mcq' ? 'info' : 'warning'}>{currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}</Badge></div><h3 className="text-base font-semibold text-foreground mt-3 mb-5 leading-relaxed">{currentQuestion.question}</h3>

              {currentQuestion.type === 'mcq' && currentQuestion.options && <div className="space-y-2">{currentQuestion.options.map((option, optionIndex) => { const isSelected = answers[currentQuestion.id] === option; const isCorrectOption = option === currentQuestion.correctAnswer; let optionStyle = 'border-border hover:border-primary/30 hover:bg-hover text-foreground'; if (showExplanation) { if (isCorrectOption) optionStyle = 'border-success bg-success/5 text-success'; else if (isSelected) optionStyle = 'border-danger bg-danger/5 text-danger'; else optionStyle = 'border-border/50 text-muted' } else if (isSelected) optionStyle = 'border-primary bg-primary/5 text-foreground ring-1 ring-primary/20'; return <button key={optionIndex} onClick={() => !showExplanation && onAnswer(currentQuestion.id, option)} disabled={showExplanation} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all cursor-pointer ${optionStyle}`}><span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${showExplanation && isCorrectOption ? 'bg-success text-white' : showExplanation && isSelected && !isCorrectOption ? 'bg-danger text-white' : isSelected ? 'bg-primary text-white' : 'bg-border/50 text-muted'}`}>{String.fromCharCode(65 + optionIndex)}</span><span className="text-sm flex-1">{option}</span>{!showExplanation && !isSelected && <span className="text-[9px] text-muted/40 font-mono flex-shrink-0">{optionIndex + 1}</span>}</button> })}</div>}

              {currentQuestion.type === 'short' && <textarea value={answers[currentQuestion.id] || ''} onChange={event => !showExplanation && onAnswer(currentQuestion.id, event.target.value)} disabled={showExplanation} placeholder="Type your answer…" rows={3} className="w-full bg-input-bg border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none disabled:opacity-60" />}
              {!showExplanation && answers[currentQuestion.id]?.trim() && <Button onClick={onSubmit} variant="secondary" size="md" className="w-full mt-4" icon={<Send size={15} />}>Submit Answer</Button>}
            </div>

            {showExplanation && <div className={`bg-bg-card border rounded-xl p-4 sm:p-5 mb-4 animate-slide-scale ${submittedQuestions.find(question => question.id === currentQuestion.id)?.isCorrect ? 'border-success/30' : 'border-danger/30'}`}><div className="flex items-start gap-3"><div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${submittedQuestions.find(question => question.id === currentQuestion.id)?.isCorrect ? 'bg-success/15' : 'bg-danger/15'}`}>{submittedQuestions.find(question => question.id === currentQuestion.id)?.isCorrect ? <CheckCircle2 size={20} className="text-success" /> : <XCircle size={20} className="text-danger" />}</div><div className="flex-1 min-w-0"><p className={`text-base font-semibold mb-2 ${submittedQuestions.find(question => question.id === currentQuestion.id)?.isCorrect ? 'text-success' : 'text-danger'}`}>{submittedQuestions.find(question => question.id === currentQuestion.id)?.isCorrect ? 'Correct!' : 'Incorrect'}</p>{currentQuestion.type === 'short' && <div className="bg-input-bg rounded-lg px-3 py-2 mb-2 text-xs flex items-center gap-2"><span className="text-muted">Correct answer:</span><span className="text-foreground font-medium">{currentQuestion.correctAnswer}</span></div>}<div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3 border border-primary/10"><Lightbulb size={14} className="text-primary flex-shrink-0 mt-0.5" /><p className="text-xs text-muted leading-relaxed">{currentQuestion.explanation}</p></div></div></div></div>}

            <div className="flex items-center justify-between gap-2"><Button onClick={onPrevious} disabled={currentQ === 0} variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Previous</Button><div className="hidden sm:flex items-center gap-1">{questions.map((question, questionIndex) => <button key={question.id} onClick={() => onJump(questionIndex)} className={`w-7 h-7 rounded-full text-[11px] font-medium transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${questionIndex === currentQ ? 'bg-primary text-bg' : submittedQuestions.find(item => item.id === question.id)?.isCorrect ? 'bg-success/20 text-success' : submittedQuestions.find(item => item.id === question.id) ? 'bg-danger/20 text-danger' : answers[question.id] ? 'bg-primary/20 text-primary-light' : 'bg-border/50 text-muted hover:bg-border'}`}>{questionIndex + 1}</button>)}</div>{currentQ < questions.length - 1 ? <Button onClick={onNext} disabled={!showExplanation} variant="ghost" size="sm">Next <ArrowRight size={14} /></Button> : <Button onClick={onFinish} disabled={!showExplanation} variant="primary" size="sm" icon={<CheckCircle2 size={14} />}>Finish Quiz</Button>}</div>
          </>}
        </div>
      )}

      {stage === 'results' && <div className="animate-slide-up space-y-4"><div className="bg-bg-card border border-border rounded-xl p-6 text-center"><div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-3"><span className={`text-3xl font-bold ${gradeColors}`}>{pct}%</span></div><h2 className={`text-xl font-bold ${gradeColors} mb-1`}>{grade}</h2><p className="text-sm text-muted">{selectedTopicName}</p><p className="text-xs text-muted mt-1">{quizScore} of {questions.length} correct</p><div className="flex items-center justify-center gap-3 mt-5 flex-wrap"><Button variant="secondary" size="sm" icon={<CheckCircle2 size={14} />} onClick={onRetry}>Retry Quiz</Button>{isCovered ? <Button variant="primary" size="sm" icon={<Sparkles size={14} />} onClick={onContinueToNextTopic}>Next Topic</Button> : <Button variant="primary" size="sm" icon={<CheckCircle2 size={14} />} onClick={onBackToPlan}>Continue Sprint</Button>}</div></div>
        <div className={`bg-bg-card border rounded-xl p-4 sm:p-5 animate-slide-up ${recommendation.border}`}><div className="flex items-start gap-3"><div className={`w-9 h-9 rounded-lg ${recommendation.bg} flex items-center justify-center flex-shrink-0`}><recommendation.Icon size={18} className={recommendation.color} /></div><div className="flex-1"><h3 className={`text-sm font-semibold ${recommendation.color} mb-1`}>{recommendation.title}</h3><p className="text-xs text-muted leading-relaxed">{recommendation.text}</p></div></div></div>
        <div className="space-y-3"><h3 className="text-sm font-semibold text-foreground">Review Answers</h3>{submittedQuestions.map((question, questionIndex) => <div key={question.id} className={`bg-bg-card border rounded-xl p-4 ${question.isCorrect ? 'border-success/30' : 'border-danger/30'}`}><div className="flex items-start gap-3">{question.isCorrect ? <CheckCircle2 size={18} className="text-success flex-shrink-0 mt-0.5" /> : <XCircle size={18} className="text-danger flex-shrink-0 mt-0.5" />}<div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground mb-2"><span className="text-xs text-muted mr-1">Q{questionIndex + 1}.</span>{question.question}</p>{question.type === 'mcq' && question.options && <div className="space-y-1">{question.options.map((option, optionIndex) => { const isCorrectOption = option === question.correctAnswer; const isWrongSelection = option === question.userAnswer && !question.isCorrect; return <div key={optionIndex} className="flex items-center gap-2 text-xs"><span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${isCorrectOption ? 'bg-success/20 text-success' : isWrongSelection ? 'bg-danger/20 text-danger' : 'bg-border/50 text-muted'}`}>{String.fromCharCode(65 + optionIndex)}</span><span className={isCorrectOption ? 'text-success font-medium' : isWrongSelection ? 'text-danger font-medium' : 'text-muted'}>{option}</span></div> })}</div>}{question.type === 'short' && <div className="text-xs space-y-1"><p className="text-muted">Your answer: <span className={question.isCorrect ? 'text-success' : 'text-danger'}>{question.userAnswer || '(no answer)'}</span></p><p className="text-success">Correct: {question.correctAnswer}</p></div>}<div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-border/50"><Lightbulb size={12} className="text-primary flex-shrink-0 mt-0.5" /><p className="text-[11px] text-muted leading-relaxed">{question.explanation}</p></div></div></div></div>)}</div>
      </div>}
    </div>
  )
}
