import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, CheckCircle2, Circle, BookOpen, Brain,
  RefreshCw, Snowflake, Timer, AlertTriangle, Target,
  Coffee, GraduationCap, PenTool, ArrowRight,
  TrendingUp, ListChecks,
} from 'lucide-react';
import type { SprintSetup, StudyPlan, TimeBlock } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generatePlan, formatTime, formatDuration, getPlanSummary } from '../utils/planGenerator';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

/* ── Activity icon map ────────────────────────────────────── */
const activityMeta: Record<string, { icon: typeof BookOpen; color: string; bg: string }> = {
  learn:    { icon: GraduationCap, color: 'text-primary-light', bg: 'bg-primary/10' },
  review:   { icon: BookOpen,      color: 'text-warning',       bg: 'bg-warning/10' },
  practice: { icon: PenTool,       color: 'text-success',       bg: 'bg-success/10' },
  recall:   { icon: Brain,         color: 'text-primary-light', bg: 'bg-primary/10' },
  mistakes: { icon: AlertTriangle, color: 'text-danger',        bg: 'bg-danger/10' },
};

type BlockState = 'done' | 'current' | 'upcoming' | 'review';

function getBlockState(
  block: TimeBlock,
  firstUndoneIdx: number,
  index: number,
): BlockState {
  if (block.topicId === 'review-break') return 'review';
  if (block.done) return 'done';
  if (index === firstUndoneIdx) return 'current';
  return 'upcoming';
}

/* ── Page component ───────────────────────────────────────── */
export default function StudyPlanPage() {
  const navigate = useNavigate();
  const [setup] = useLocalStorage<SprintSetup | null>('icecold-setup', null);
  const [plan, setPlan] = useLocalStorage<StudyPlan | null>('icecold-plan', null);
  const [showRegenerate, setShowRegenerate] = useState(false);

  // Auto-generate plan when setup is ready but no plan exists yet
  useEffect(() => {
    if (!setup || plan) return;
    setPlan(generatePlan(setup));
  }, [setup, plan, setPlan]);

  const currentPlan = plan;

  const summary = useMemo(() => {
    if (!currentPlan) return null;
    return getPlanSummary(currentPlan);
  }, [currentPlan]);

  const coveredCount = useMemo(() => {
    if (!currentPlan) return 0;
    return currentPlan.blocks.filter(b => b.substantiallyCovered).length;
  }, [currentPlan]);

  const toggleBlock = (blockId: string) => {
    if (!currentPlan) return;
    setPlan({
      ...currentPlan,
      blocks: currentPlan.blocks.map(b =>
        b.id === blockId ? { ...b, done: !b.done } : b
      ),
    });
  };

  const handleStartQuiz = (block: TimeBlock) => {
    localStorage.setItem('icecold-quiz-topic', JSON.stringify({
      topicId: block.topicId,
      topicName: block.topicName,
    }));
    navigate('/quiz');
  };

  const handleRegenerate = () => {
    if (!setup) return;
    const generated = generatePlan(setup);
    setPlan(generated);
    setShowRegenerate(false);
  };

  if (!setup || !currentPlan) {
    return (
      <EmptyState
        icon={<Calendar size={28} className="text-primary" />}
        title="No Plan Yet"
        description="Set up your exam details and topics first, then come back to see your personalised study plan."
        action={{ label: 'Go to Setup', onClick: () => navigate('/'), icon: <ArrowRight size={16} /> }}
      />
    );
  }

  const firstUndoneIdx = currentPlan.blocks.findIndex(
    b => !b.done && b.topicId !== 'review-break'
  );

  const studiedHours = currentPlan.blocks
    .filter(b => b.done)
    .reduce((s, b) => s + b.duration, 0);

  const remainingTopics = currentPlan.blocks.filter(
    b => !b.substantiallyCovered && b.topicId !== 'review-break'
  ).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<Snowflake size={18} className="text-primary" />}
        title="Study Plan"
        subtitle={`${setup.examName} · ${setup.examHours}h until exam`}
        action={
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => setShowRegenerate(!showRegenerate)}
          >
            Regenerate
          </Button>
        }
      />

      {/* Sprint Progress — consolidated */}
      <div className="bg-bg-card border border-border rounded-xl p-5 mb-5 animate-slide-up">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Sprint Progress</h2>
          <span className="ml-auto text-xs font-medium text-muted">
            {summary?.doneBlocks ?? 0}/{summary?.totalBlocks ?? 0} blocks
          </span>
        </div>

        <ProgressBar value={summary?.completionPct ?? 0} size="md" className="mb-4" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Completed', value: `${summary?.doneBlocks ?? 0}/${summary?.totalBlocks ?? 0}`, icon: CheckCircle2, color: 'text-success' },
            { label: 'Studied', value: formatDuration(studiedHours), icon: Clock, color: 'text-primary' },
            { label: 'Total Time', value: formatDuration(setup.studyHours), icon: Timer, color: 'text-primary-light' },
            { label: 'Remaining', value: `${remainingTopics} topic${remainingTopics !== 1 ? 's' : ''}`, icon: ListChecks, color: remainingTopics > 0 ? 'text-warning' : 'text-success' },
          ].map(stat => (
            <div key={stat.label} className="bg-input-bg rounded-lg p-3 text-center">
              <stat.icon size={13} className={`mx-auto mb-1 ${stat.color}`} />
              <span className={`block text-sm font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-[10px] text-muted">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-border/50 text-[11px] text-muted">
          {summary?.highestPriorityTopic && (
            <span className="flex items-center gap-1">
              <Target size={11} className="text-primary" />
              Next: <strong className="text-foreground">{summary.highestPriorityTopic}</strong>
            </span>
          )}
          {summary && summary.reviewBreakHours > 0 && (
            <span className="flex items-center gap-1">
              <Coffee size={11} className="text-warning" />
              {formatDuration(summary.reviewBreakHours)} reserved for breaks
            </span>
          )}
          {coveredCount > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-success" />
              <strong className="text-success">{coveredCount}</strong> topic{coveredCount !== 1 ? 's' : ''} covered
            </span>
          )}
        </div>
      </div>

      {/* Regenerate Warning */}
      {showRegenerate && (
        <div className="bg-bg-elevated border border-warning/20 rounded-xl p-4 mb-5 animate-slide-scale">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Regenerate your plan?</p>
              <p className="text-xs text-muted mb-3">
                This will reset all progress and create a new plan based on your current setup.
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleRegenerate}>
                  Yes, Regenerate
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowRegenerate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Blocks */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
          <Timer size={15} className="text-primary" />
          Your Schedule
        </h2>

        {currentPlan.blocks.map((block, index) => {
          const blockState = getBlockState(block, firstUndoneIdx, index);
          return (
            <TimeBlockCard
              key={block.id}
              block={block}
              blockState={blockState}
              index={index}
              onToggle={() => toggleBlock(block.id)}
              onStartQuiz={() => handleStartQuiz(block)}
            />
          );
        })}

        {currentPlan.blocks.length === 0 && (
          <div className="text-center py-12 text-sm text-muted bg-bg-card border border-border rounded-xl">
            No blocks could be generated. Check your setup and try again.
          </div>
        )}
      </div>
    </div>
  );
}

/* ── TimeBlockCard ────────────────────────────────────────── */
function TimeBlockCard({
  block,
  blockState,
  index,
  onToggle,
  onStartQuiz,
}: {
  block: TimeBlock;
  blockState: BlockState;
  index: number;
  onToggle: () => void;
  onStartQuiz: () => void;
}) {
  const isDone = blockState === 'done';
  const isCurrent = blockState === 'current';
  const isReview = blockState === 'review';
  const meta = activityMeta[block.activityLabel] ?? activityMeta.review;
  const isCovered = block.substantiallyCovered;

  const borderClass = isCurrent
    ? 'border-primary/40'
    : isCovered
    ? 'border-success/30'
    : isDone
    ? 'border-success/20'
    : isReview
    ? 'border-warning/15'
    : 'border-border hover:border-primary/20';

  return (
    <div
      className={`bg-bg-card border rounded-xl overflow-hidden transition-all animate-slide-scale ${borderClass}`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Clickable header row */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
          isDone ? 'opacity-60 hover:opacity-100' : 'hover:bg-hover'
        } ${isCurrent ? 'bg-primary/[0.03]' : ''}`}
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
            {!isCovered && !isCurrent && !isReview && !isDone && (
              <Badge variant="default">Block {index + 1}</Badge>
            )}
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

      {/* Details */}
      <div className="px-4 pb-3 pt-1 border-t border-border/50 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={
            block.priority?.includes('Critical') ? 'danger' :
            block.priority?.includes('High') ? 'warning' :
            'default'
          }>
            {block.priority?.split(' — ')[0] || 'Scheduled'}
          </Badge>
          <p className="text-xs text-muted flex-1 min-w-0">{block.priorityReason}</p>
        </div>

        <div className={`flex items-start gap-2 p-2 rounded-lg ${meta.bg}`}>
          <meta.icon size={14} className={`${meta.color} flex-shrink-0 mt-0.5`} />
          <p className={`text-xs ${meta.color}`}>{block.recommendedActivity}</p>
        </div>

        {!isReview && (
          <Button
            onClick={(e) => { e.stopPropagation(); onStartQuiz(); }}
            variant={isCurrent ? 'primary' : 'secondary'}
            size="sm"
            className="w-full"
            icon={<Brain size={14} />}
          >
            {isCovered
              ? `Score: ${block.quizScore}% · Retake Quiz`
              : block.quizScore !== undefined
              ? `Score: ${block.quizScore}% · Retake Quiz`
              : `Start Quiz — ${block.topicName}`}
          </Button>
        )}
      </div>
    </div>
  );
}