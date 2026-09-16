import {
  AlertTriangle, ArrowRight, Award, BookOpen, Brain, CheckCircle2,
  Lightbulb, Snowflake, Target, TrendingUp,
} from 'lucide-react'
import type { QuizResult, SprintSetup } from '../../types'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import type { ProgressStats } from './model'

export interface ProgressViewProps {
  setup: SprintSetup | null
  quizResults: QuizResult[]
  stats: ProgressStats
  hasData: boolean
  onGetStarted: () => void
  onNavigate: (path: string) => void
  onRetakeTopic: (topicName: string) => void
}

export default function ProgressView({
  setup,
  quizResults,
  stats,
  hasData,
  onGetStarted,
  onNavigate,
  onRetakeTopic,
}: ProgressViewProps) {
  if (!hasData) {
    return (
      <EmptyState
        icon={<TrendingUp size={28} className="text-primary" />}
        title="No Progress Yet"
        description="Start by setting up your exam, following your study plan, and taking quizzes. Your progress will appear here."
        action={{ label: 'Get Started', onClick: onGetStarted, icon: <ArrowRight size={16} /> }}
      />
    )
  }

  const isAlert = stats.weakAreas.length > 0
  const isSuccess = stats.substantiallyCovered.length >= stats.totalTopics && stats.totalTopics > 0
  const nextActionVariant = isAlert ? 'danger' : isSuccess ? 'success' : 'secondary'
  const nextActionBorder = isAlert ? 'border-danger/30' : isSuccess ? 'border-success/30' : 'border-primary/20'
  const nextActionBg = isAlert ? 'bg-danger/15' : isSuccess ? 'bg-success/15' : 'bg-primary/15'
  const nextActionColor = isAlert ? 'text-danger' : isSuccess ? 'text-success' : 'text-primary'
  const NextActionIcon = isAlert ? AlertTriangle : isSuccess ? Award : Lightbulb

  return (
    <div className="animate-fade-in">
      <PageHeader icon={<Snowflake size={18} className="text-primary" />} title="Your Progress" subtitle={`${setup?.examName || 'Exam'} · ${stats.totalTopics} topics`} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-bg-card border border-border rounded-xl p-4"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><Target size={15} className="text-primary" /></div><span className="block text-xl font-bold text-foreground">{stats.completionPct}%</span><span className="block text-xs text-muted">Sprint Complete</span><span className="block text-[10px] text-muted mt-0.5">{stats.doneBlocks}/{stats.totalBlocks} blocks</span><ProgressBar value={stats.completionPct} size="sm" className="mt-2" /></div>
        <div className="bg-bg-card border border-border rounded-xl p-4"><div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mb-2"><Award size={15} className="text-success" /></div><span className="block text-xl font-bold text-foreground">{stats.bestQuiz}%</span><span className="block text-xs text-muted">Best Quiz</span><span className="block text-[10px] text-muted mt-0.5">{stats.totalQuizzes} quiz{stats.totalQuizzes !== 1 ? 'zes' : ''}</span>{stats.totalQuizzes > 0 && <ProgressBar value={stats.bestQuiz} size="sm" color="success" className="mt-2" />}</div>
        <div className="bg-bg-card border border-border rounded-xl p-4"><div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center mb-2"><Brain size={15} className="text-warning" /></div><span className="block text-xl font-bold text-foreground">{stats.avgScore}%</span><span className="block text-xs text-muted">Avg Score</span><span className="block text-[10px] text-muted mt-0.5">Across all quizzes</span>{stats.totalQuizzes > 0 && <ProgressBar value={stats.avgScore} size="sm" color="warning" className="mt-2" />}</div>
        <div className="bg-bg-card border border-border rounded-xl p-4"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><BookOpen size={15} className="text-primary" /></div><span className="block text-xl font-bold text-foreground">{stats.totalTopics}</span><span className="block text-xs text-muted">Topics</span><span className="block text-[10px] text-muted mt-0.5">{stats.coveredCount > 0 ? `${stats.coveredCount} covered · ${setup?.examHours || 0}h to exam` : `${setup?.examHours || 0}h to exam`}</span>{stats.totalTopics > 0 && <ProgressBar value={(stats.coveredCount / stats.totalTopics) * 100} size="sm" color={stats.coveredCount === stats.totalTopics ? 'success' : 'primary'} className="mt-2" />}</div>
      </div>

      <div className={`bg-bg-elevated border rounded-xl p-5 mb-5 animate-slide-up ${nextActionBorder}`}><div className="flex items-start gap-3"><div className={`w-9 h-9 rounded-lg ${nextActionBg} flex items-center justify-center flex-shrink-0`}><NextActionIcon size={18} className={nextActionColor} /></div><div className="flex-1"><h3 className="text-sm font-semibold text-foreground mb-1">Recommended Next Action</h3><p className="text-sm text-muted leading-relaxed">{stats.nextAction}</p>{stats.nextActionLink && <Button onClick={() => onNavigate(stats.nextActionLink)} variant={nextActionVariant} size="sm" className="mt-3" icon={<ArrowRight size={12} />}>Go there</Button>}</div></div></div>

      {stats.substantiallyCovered.length > 0 && <div className="mb-5"><h3 className="text-sm font-semibold text-foreground mb-3">Topics Covered</h3><div className="flex flex-wrap gap-2">{stats.substantiallyCovered.map(topic => <Badge key={topic} variant="success" icon={<CheckCircle2 size={12} />}>{topic}</Badge>)}</div></div>}

      {quizResults.length > 0 && <div className="mb-5"><h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Brain size={15} className="text-primary" />Quiz History</h3><div className="space-y-2">{[...quizResults].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()).map((result, index) => { const scorePct = Math.round((result.score / result.total) * 100); const isSuccessScore = scorePct >= 80; const isWarningScore = scorePct >= 60 && scorePct < 80; return <div key={`${result.topicId}-${result.completedAt}-${index}`} className="bg-bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isSuccessScore ? 'bg-success/10' : isWarningScore ? 'bg-warning/10' : 'bg-danger/10'}`}><Brain size={16} className={isSuccessScore ? 'text-success' : isWarningScore ? 'text-warning' : 'text-danger'} /></div><div className="min-w-0"><p className="text-sm font-medium text-foreground truncate">{result.topicName}</p><p className="text-xs text-muted">{result.score}/{result.total} correct</p></div></div><div className="text-right flex-shrink-0"><span className={`text-lg font-bold ${isSuccessScore ? 'text-success' : isWarningScore ? 'text-warning' : 'text-danger'}`}>{scorePct}%</span>{scorePct < 60 && <span className="block text-[10px] text-danger">Needs review</span>}{isSuccessScore && <span className="block text-[10px] text-success">Covered</span>}</div></div>{result.questions.length > 0 && <div className="flex items-center gap-1 mt-3 flex-wrap">{result.questions.map((question, questionIndex) => <span key={questionIndex} className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${question.isCorrect ? 'bg-success/20 text-success' : 'bg-danger/15 text-danger'}`} title={`Q${questionIndex + 1}: ${question.isCorrect ? 'Correct' : 'Incorrect'}`}>{question.isCorrect ? '✓' : '✗'}</span>)}<span className="text-[10px] text-muted ml-2">· {new Date(result.completedAt).toLocaleDateString()}</span></div>}</div> })}</div></div>}

      {stats.weakAreas.length > 0 && <div className="mb-5"><h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><AlertTriangle size={15} className="text-danger" />Areas to Review</h3><div className="space-y-2">{stats.weakAreas.map(area => <div key={area} className="bg-danger/5 border border-danger/20 rounded-xl p-3 flex items-center justify-between gap-2"><span className="text-sm text-foreground">{area}</span><Button onClick={() => onRetakeTopic(area)} variant="danger" size="sm">Retake Quiz <ArrowRight size={12} /></Button></div>)}</div></div>}

      <div className="flex items-center gap-3">{stats.weakAreas.length > 0 && <Button onClick={() => onRetakeTopic(stats.weakAreas[0])} variant="danger" className="flex-1" icon={<AlertTriangle size={15} />}>Review Weak Areas</Button>}<Button onClick={() => onNavigate('/plan')} variant="primary" className={stats.weakAreas.length > 0 ? 'flex-1' : 'w-full'} icon={<CheckCircle2 size={15} />}>Continue Sprint</Button></div>
    </div>
  )
}
