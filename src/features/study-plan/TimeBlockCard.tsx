import {
  AlertTriangle, BookOpen, Brain, CheckCircle2, Circle, Clock, Coffee,
  GraduationCap, PenTool, Timer,
} from 'lucide-react'
import type { TimeBlock, TimerState } from '../../types'
import { formatDuration, formatTime } from '../../utils/planGenerator'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

type BlockState = 'done' | 'current' | 'upcoming' | 'review'

const activityMeta: Record<string, { icon: typeof BookOpen; color: string; bg: string }> = {
  learn: { icon: GraduationCap, color: 'text-primary-light', bg: 'bg-primary/10' },
  review: { icon: BookOpen, color: 'text-warning', bg: 'bg-warning/10' },
  practice: { icon: PenTool, color: 'text-success', bg: 'bg-success/10' },
  recall: { icon: Brain, color: 'text-primary-light', bg: 'bg-primary/10' },
  mistakes: { icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10' },
}

export function getBlockState(block: TimeBlock, firstUndoneIdx: number, index: number): BlockState {
  if (block.topicId === 'review-break') return 'review'
  if (block.done) return 'done'
  if (index === firstUndoneIdx) return 'current'
  return 'upcoming'
}

export interface TimeBlockCardProps {
  block: TimeBlock
  blockState: BlockState
  index: number
  timer: TimerState | null
  onToggle: () => void
  onStartQuiz: () => void
  onToggleTimer: () => void
}

export default function TimeBlockCard({
  block,
  blockState,
  index,
  timer,
  onToggle,
  onStartQuiz,
  onToggleTimer,
}: TimeBlockCardProps) {
  const isDone = blockState === 'done'
  const isCurrent = blockState === 'current'
  const isReview = blockState === 'review'
  const meta = activityMeta[block.activityLabel] ?? activityMeta.review
  const isCovered = block.substantiallyCovered
  const borderClass = isCurrent
    ? 'border-primary/40'
    : isCovered
    ? 'border-success/30'
    : isDone
    ? 'border-success/20'
    : isReview
    ? 'border-warning/15'
    : 'border-border hover:border-primary/20'

  return (
    <div
      className={`bg-bg-card border rounded-xl overflow-hidden transition-all animate-slide-scale ${borderClass}`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${isDone ? 'opacity-60 hover:opacity-100' : 'hover:bg-hover'} ${isCurrent ? 'bg-primary/[0.03]' : ''}`}
      >
        {isDone ? (
          <CheckCircle2 size={20} className={`flex-shrink-0 transition-colors ${isCovered ? 'text-success' : 'text-muted/50'}`} />
        ) : (
          <Circle size={20} className={`flex-shrink-0 transition-colors ${isCurrent ? 'text-primary' : 'text-muted/30 hover:text-primary'}`} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium truncate ${isDone ? 'line-through text-muted' : 'text-foreground'}`}>
              {block.topicName}
            </span>
            {isCovered && <Badge variant="success" icon={<CheckCircle2 size={10} />}>Covered</Badge>}
            {isCurrent && <Badge variant="info">Current</Badge>}
            {isReview && <Badge variant="warning" icon={<Coffee size={10} />}>Break</Badge>}
            {!isCovered && !isCurrent && !isReview && !isDone && <Badge variant="default">Block {index + 1}</Badge>}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatTime(block.startHour)} – {formatTime(block.startHour + block.duration)}
            </span>
            <span>{formatDuration(block.duration)}</span>
          </div>
        </div>
      </button>

      <div className="px-4 pb-3 pt-1 border-t border-border/50 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={block.priority?.includes('Critical') ? 'danger' : block.priority?.includes('High') ? 'warning' : 'default'}>
            {block.priority?.split(' — ')[0] || 'Scheduled'}
          </Badge>
          <p className="text-xs text-muted flex-1 min-w-0">{block.priorityReason}</p>
        </div>
        <div className={`flex items-start gap-2 p-2 rounded-lg ${meta.bg}`}>
          <meta.icon size={14} className={`${meta.color} flex-shrink-0 mt-0.5`} />
          <p className={`text-xs ${meta.color}`}>{block.recommendedActivity}</p>
        </div>
        {!isReview && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={event => { event.stopPropagation(); onToggleTimer() }}
              variant={timer?.running ? 'danger' : 'ghost'}
              size="sm"
              className="min-w-28"
              icon={<Timer size={14} />}
            >
              {timer?.remainingSeconds === 0 ? 'Time complete' : timer?.running ? 'Pause timer' : timer ? 'Resume timer' : 'Start timer'}
            </Button>
            <Button
              onClick={event => { event.stopPropagation(); onStartQuiz() }}
              variant={isCurrent ? 'primary' : 'secondary'}
              size="sm"
              className="flex-1"
              icon={<Brain size={14} />}
            >
              {isCovered || block.quizScore !== undefined
                ? `Score: ${block.quizScore}% · Retake Quiz`
                : `Start Quiz — ${block.topicName}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
