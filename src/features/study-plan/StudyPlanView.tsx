import {
  AlertTriangle, ArrowRight, Calendar, CheckCircle2, Clock, Coffee,
  ListChecks, RefreshCw, Snowflake, Target, Timer, TrendingUp,
} from 'lucide-react'
import type { StudyPlan, SprintSetup, TimeBlock, TimerState } from '../../types'
import Button from '../../components/ui/Button'
import ProgressBar from '../../components/ui/ProgressBar'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import TimeBlockCard, { getBlockState } from './TimeBlockCard'
import type { StudyPlanViewModel } from './model'
import { formatDuration } from '../../utils/planGenerator'

export interface StudyPlanViewProps {
  setup: SprintSetup | null
  plan: StudyPlan | null
  model: StudyPlanViewModel | null
  timer: TimerState | null
  showRegenerate: boolean
  onNavigateSetup: () => void
  onToggleRegenerate: () => void
  onRegenerate: () => void
  onCancelRegenerate: () => void
  onToggleBlock: (blockId: string) => void
  onStartQuiz: (blockId: string) => void
  onToggleTimer: (block: TimeBlock) => void
}

export default function StudyPlanView({
  setup,
  plan,
  model,
  timer,
  showRegenerate,
  onNavigateSetup,
  onToggleRegenerate,
  onRegenerate,
  onCancelRegenerate,
  onToggleBlock,
  onStartQuiz,
  onToggleTimer,
}: StudyPlanViewProps) {
  if (!setup || !plan || !model) {
    return (
      <EmptyState
        icon={<Calendar size={28} className="text-primary" />}
        title="No Plan Yet"
        description="Set up your exam details and topics first, then come back to see your personalised study plan."
        action={{ label: 'Go to Setup', onClick: onNavigateSetup, icon: <ArrowRight size={16} /> }}
      />
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<Snowflake size={18} className="text-primary" />}
        title="Study Plan"
        subtitle={`${setup.examName} · ${setup.examHours}h until exam`}
        action={<Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={onToggleRegenerate}>Regenerate</Button>}
      />

      <div className="bg-bg-card border border-border rounded-xl p-5 mb-5 animate-slide-up">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Sprint Progress</h2>
          <span className="ml-auto text-xs font-medium text-muted">{model.summary.doneBlocks}/{model.summary.totalBlocks} blocks</span>
        </div>
        <ProgressBar value={model.summary.completionPct} size="md" className="mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Completed', value: `${model.summary.doneBlocks}/${model.summary.totalBlocks}`, icon: CheckCircle2, color: 'text-success' },
            { label: 'Studied', value: formatDuration(model.studiedHours), icon: Clock, color: 'text-primary' },
            { label: 'Total Time', value: formatDuration(setup.studyHours), icon: Timer, color: 'text-primary-light' },
            { label: 'Remaining', value: `${model.remainingTopics} topic${model.remainingTopics !== 1 ? 's' : ''}`, icon: ListChecks, color: model.remainingTopics > 0 ? 'text-warning' : 'text-success' },
          ].map(stat => (
            <div key={stat.label} className="bg-input-bg rounded-lg p-3 text-center">
              <stat.icon size={13} className={`mx-auto mb-1 ${stat.color}`} />
              <span className={`block text-sm font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-[10px] text-muted">{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-border/50 text-[11px] text-muted">
          {model.summary.highestPriorityTopic && <span className="flex items-center gap-1"><Target size={11} className="text-primary" />Next: <strong className="text-foreground">{model.summary.highestPriorityTopic}</strong></span>}
          {model.summary.reviewBreakHours > 0 && <span className="flex items-center gap-1"><Coffee size={11} className="text-warning" />{formatDuration(model.summary.reviewBreakHours)} reserved for breaks</span>}
          {model.coveredCount > 0 && <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-success" /><strong className="text-success">{model.coveredCount}</strong> topic{model.coveredCount !== 1 ? 's' : ''} covered</span>}
        </div>
      </div>

      {showRegenerate && (
        <div className="bg-bg-elevated border border-warning/20 rounded-xl p-4 mb-5 animate-slide-scale">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Regenerate your plan?</p>
              <p className="text-xs text-muted mb-3">This will reset all progress and create a new plan based on your current setup.</p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={onRegenerate}>Yes, Regenerate</Button>
                <Button variant="ghost" size="sm" onClick={onCancelRegenerate}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2"><Timer size={15} className="text-primary" />Your Schedule</h2>
        {plan.blocks.map((block, index) => (
          <TimeBlockCard
            key={block.id}
            block={block}
            blockState={getBlockState(block, model.firstUndoneIdx, index)}
            index={index}
            onToggle={() => onToggleBlock(block.id)}
            onStartQuiz={() => onStartQuiz(block.id)}
            timer={timer?.blockId === block.id ? timer : null}
            onToggleTimer={() => onToggleTimer(block)}
          />
        ))}
        {plan.blocks.length === 0 && <div className="text-center py-12 text-sm text-muted bg-bg-card border border-border rounded-xl">No blocks could be generated. Check your setup and try again.</div>}
      </div>
    </div>
  )
}
