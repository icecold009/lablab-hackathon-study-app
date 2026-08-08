import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Brain, Target, Award, CheckCircle2, AlertTriangle,
  ArrowRight, Lightbulb, Snowflake, BookOpen,
} from 'lucide-react';
import type { QuizResult, StudyPlan, SprintSetup } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

export default function Progress() {
  const navigate = useNavigate();
  const [setup] = useLocalStorage<SprintSetup | null>('icecold-setup', null);
  const [plan] = useLocalStorage<StudyPlan | null>('icecold-plan', null);
  const [quizResults] = useLocalStorage<QuizResult[]>('icecold-quiz-results', []);

  const hasData = (plan && plan.blocks.length > 0) || quizResults.length > 0;

  const stats = useMemo(() => {
    const totalTopics = setup?.topics.length || 0;
    const doneBlocks = plan?.blocks.filter(b => b.done).length || 0;
    const totalBlocks = plan?.blocks.length || 0;
    const completionPct = totalBlocks > 0 ? Math.round((doneBlocks / totalBlocks) * 100) : 0;

    const totalQuizzes = quizResults.length;
    const avgScore = totalQuizzes > 0
      ? Math.round(quizResults.reduce((s, r) => s + (r.score / r.total) * 100, 0) / totalQuizzes)
      : 0;
    const bestQuiz = totalQuizzes > 0
      ? Math.max(...quizResults.map(r => Math.round((r.score / r.total) * 100)))
      : 0;

    const latestByTopic = new Map<string, QuizResult>();
    for (const result of [...quizResults].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())) {
      if (!latestByTopic.has(result.topicName)) {
        latestByTopic.set(result.topicName, result);
      }
    }

    const weakAreas: string[] = [];
    const substantiallyCovered: string[] = [];
    for (const [topicName, result] of latestByTopic.entries()) {
      const pct = (result.score / result.total) * 100;
      if (pct < 60) weakAreas.push(topicName);
      if (pct >= 80) substantiallyCovered.push(topicName);
    }

    const coveredCount = plan?.blocks.filter(b => b.substantiallyCovered).length || substantiallyCovered.length;

    const findNextPriorityTopic = () => {
      if (!setup || !plan) return null;
      const priorityOrder: Record<string, number> = { 'low': 0, 'medium': 1, 'high': 2 };
      const sorted = [...plan.blocks]
        .filter(b => !b.substantiallyCovered && b.topicId !== 'review-break')
        .sort((a, b) => {
          const aTopic = setup.topics.find(t => t.id === a.topicId);
          const bTopic = setup.topics.find(t => t.id === b.topicId);
          if (!aTopic || !bTopic) return 0;
          const aScore = priorityOrder[aTopic.confidence] + priorityOrder[aTopic.importance] * 3;
          const bScore = priorityOrder[bTopic.confidence] + priorityOrder[bTopic.importance] * 3;
          return aScore - bScore;
        });
      return sorted[0] || null;
    };

    let nextAction = '';
    let nextActionLink = '';

    if (weakAreas.length > 0) {
      nextAction = `Review weak areas: ${weakAreas.join(', ')}. Retake these topic quizzes to improve your understanding.`;
      nextActionLink = '/quiz';
    } else if (substantiallyCovered.length >= totalTopics && totalTopics > 0) {
      nextAction = 'All topics substantially covered! Do a final review before your exam. Great preparation!';
      nextActionLink = '/plan';
    } else if (totalQuizzes > 0) {
      const nextTopic = findNextPriorityTopic();
      if (nextTopic) {
        const isAlreadyTested = latestByTopic.has(nextTopic.topicName);
        const lastScore = latestByTopic.get(nextTopic.topicName);
        const scorePct = lastScore ? Math.round((lastScore.score / lastScore.total) * 100) : null;

        if (isAlreadyTested && scorePct !== null && scorePct < 60) {
          nextAction = `You scored ${scorePct}% on ${nextTopic.topicName}. Review the explanations and retake the quiz.`;
          nextActionLink = '/quiz';
        } else if (isAlreadyTested && scorePct !== null && scorePct >= 60 && scorePct < 80) {
          nextAction = `You scored ${scorePct}% on ${nextTopic.topicName}. A bit more practice needed — retake the quiz.`;
          nextActionLink = '/quiz';
        } else {
          nextAction = `Continue with ${nextTopic.topicName} — your next highest-priority topic.`;
          nextActionLink = '/plan';
        }
      } else {
        nextAction = 'Great progress! Keep reviewing to reinforce your knowledge.';
        nextActionLink = '/plan';
      }
    } else if (plan && plan.blocks.length > 0) {
      const firstBlock = plan.blocks[0];
      if (firstBlock && firstBlock.topicId !== 'review-break') {
        nextAction = `Take the quiz for ${firstBlock.topicName} to assess your knowledge.`;
        nextActionLink = '/quiz';
      }
    } else {
      nextAction = 'Set up your exam to get started.';
      nextActionLink = '/';
    }

    return {
      totalTopics,
      doneBlocks,
      totalBlocks,
      completionPct,
      totalQuizzes,
      avgScore,
      bestQuiz,
      weakAreas,
      substantiallyCovered,
      coveredCount,
      nextAction,
      nextActionLink,
    };
  }, [setup, plan, quizResults]);

  if (!hasData) {
    return (
      <EmptyState
        icon={<TrendingUp size={28} className="text-primary" />}
        title="No Progress Yet"
        description="Start by setting up your exam, following your study plan, and taking quizzes. Your progress will appear here."
        action={{ label: 'Get Started', onClick: () => navigate('/'), icon: <ArrowRight size={16} /> }}
      />
    );
  }

  // Determine next-action tone based on situation
  const isAlert = stats.weakAreas.length > 0;
  const isSuccess = stats.substantiallyCovered.length >= stats.totalTopics && stats.totalTopics > 0;
  const nextActionVariant = isAlert ? 'danger' : isSuccess ? 'success' : 'secondary';
  const nextActionBorder = isAlert ? 'border-danger/30' : isSuccess ? 'border-success/30' : 'border-primary/20';
  const nextActionBg = isAlert ? 'bg-danger/15' : isSuccess ? 'bg-success/15' : 'bg-primary/15';
  const nextActionColor = isAlert ? 'text-danger' : isSuccess ? 'text-success' : 'text-primary';
  const NextActionIcon = isAlert ? AlertTriangle : isSuccess ? Award : Lightbulb;

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<Snowflake size={18} className="text-primary" />}
        title="Your Progress"
        subtitle={`${setup?.examName || 'Exam'} · ${stats.totalTopics} topics`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {/* Sprint Complete */}
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Target size={15} className="text-primary" />
          </div>
          <span className="block text-xl font-bold text-foreground">{stats.completionPct}%</span>
          <span className="block text-xs text-muted">Sprint Complete</span>
          <span className="block text-[10px] text-muted mt-0.5">{stats.doneBlocks}/{stats.totalBlocks} blocks</span>
          <ProgressBar value={stats.completionPct} size="sm" className="mt-2" />
        </div>

        {/* Best Quiz */}
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mb-2">
            <Award size={15} className="text-success" />
          </div>
          <span className="block text-xl font-bold text-foreground">{stats.bestQuiz}%</span>
          <span className="block text-xs text-muted">Best Quiz</span>
          <span className="block text-[10px] text-muted mt-0.5">{stats.totalQuizzes} quiz{stats.totalQuizzes !== 1 ? 'zes' : ''}</span>
          {stats.totalQuizzes > 0 && <ProgressBar value={stats.bestQuiz} size="sm" color="success" className="mt-2" />}
        </div>

        {/* Avg Score */}
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center mb-2">
            <Brain size={15} className="text-warning" />
          </div>
          <span className="block text-xl font-bold text-foreground">{stats.avgScore}%</span>
          <span className="block text-xs text-muted">Avg Score</span>
          <span className="block text-[10px] text-muted mt-0.5">Across all quizzes</span>
          {stats.totalQuizzes > 0 && <ProgressBar value={stats.avgScore} size="sm" color="warning" className="mt-2" />}
        </div>

        {/* Topics */}
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <BookOpen size={15} className="text-primary" />
          </div>
          <span className="block text-xl font-bold text-foreground">{stats.totalTopics}</span>
          <span className="block text-xs text-muted">Topics</span>
          <span className="block text-[10px] text-muted mt-0.5">
            {stats.coveredCount > 0
              ? `${stats.coveredCount} covered · ${setup?.examHours || 0}h to exam`
              : `${setup?.examHours || 0}h to exam`}
          </span>
          {stats.totalTopics > 0 && (
            <ProgressBar
              value={(stats.coveredCount / stats.totalTopics) * 100}
              size="sm"
              color={stats.coveredCount === stats.totalTopics ? 'success' : 'primary'}
              className="mt-2"
            />
          )}
        </div>
      </div>

      {/* Next Action Recommendation */}
      <div className={`bg-bg-elevated border rounded-xl p-5 mb-5 animate-slide-up ${nextActionBorder}`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg ${nextActionBg} flex items-center justify-center flex-shrink-0`}>
            <NextActionIcon size={18} className={nextActionColor} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">Recommended Next Action</h3>
            <p className="text-sm text-muted leading-relaxed">{stats.nextAction}</p>
            {stats.nextActionLink && (
              <Button
                onClick={() => navigate(stats.nextActionLink)}
                variant={nextActionVariant}
                size="sm"
                className="mt-3"
                icon={<ArrowRight size={12} />}
              >
                Go there
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Substantially Covered Topics */}
      {stats.substantiallyCovered.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Topics Covered</h3>
          <div className="flex flex-wrap gap-2">
            {stats.substantiallyCovered.map((topic, i) => (
              <Badge key={i} variant="success" icon={<CheckCircle2 size={12} />}>
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quiz History */}
      {quizResults.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Brain size={15} className="text-primary" />
            Quiz History
          </h3>
          <div className="space-y-2">
            {[...quizResults].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()).map((result, i) => {
              const scorePct = Math.round((result.score / result.total) * 100);
              const isSuccessScore = scorePct >= 80;
              const isWarningScore = scorePct >= 60 && scorePct < 80;
              const isDangerScore = scorePct < 60;
              return (
                <div key={i} className="bg-bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isSuccessScore ? 'bg-success/10' : isWarningScore ? 'bg-warning/10' : 'bg-danger/10'
                      }`}>
                        <Brain size={16} className={
                          isSuccessScore ? 'text-success' : isWarningScore ? 'text-warning' : 'text-danger'
                        } />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{result.topicName}</p>
                        <p className="text-xs text-muted">{result.score}/{result.total} correct</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-lg font-bold ${
                        isSuccessScore ? 'text-success' : isWarningScore ? 'text-warning' : 'text-danger'
                      }`}>{scorePct}%</span>
                      {isDangerScore && <span className="block text-[10px] text-danger">Needs review</span>}
                      {isSuccessScore && <span className="block text-[10px] text-success">Covered</span>}
                    </div>
                  </div>
                  {/* Question dots */}
                  {result.questions.length > 0 && (
                    <div className="flex items-center gap-1 mt-3 flex-wrap">
                      {result.questions.map((q, qi) => (
                        <span
                          key={qi}
                          className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${
                            q.isCorrect ? 'bg-success/20 text-success' : 'bg-danger/15 text-danger'
                          }`}
                          title={`Q${qi + 1}: ${q.isCorrect ? 'Correct' : 'Incorrect'}`}
                        >
                          {q.isCorrect ? '✓' : '✗'}
                        </span>
                      ))}
                      <span className="text-[10px] text-muted ml-2">
                        · {new Date(result.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weak Areas */}
      {stats.weakAreas.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-danger" />
            Areas to Review
          </h3>
          <div className="space-y-2">
            {stats.weakAreas.map((area, i) => (
              <div key={i} className="bg-danger/5 border border-danger/20 rounded-xl p-3 flex items-center justify-between gap-2">
                <span className="text-sm text-foreground">{area}</span>
                <Button
                  onClick={() => {
                    localStorage.setItem('icecold-quiz-topic', JSON.stringify({
                      topicName: area,
                      topicId: setup?.topics.find(t => t.name === area)?.id || '',
                    }));
                    navigate('/quiz');
                  }}
                  variant="danger"
                  size="sm"
                >
                  Retake Quiz <ArrowRight size={12} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {stats.weakAreas.length > 0 && (
          <Button
            onClick={() => {
              const firstWeak = stats.weakAreas[0];
              localStorage.setItem('icecold-quiz-topic', JSON.stringify({
                topicName: firstWeak,
                topicId: setup?.topics.find(t => t.name === firstWeak)?.id || '',
              }));
              navigate('/quiz');
            }}
            variant="danger"
            className="flex-1"
            icon={<AlertTriangle size={15} />}
          >
            Review Weak Areas
          </Button>
        )}
        <Button
          onClick={() => navigate('/plan')}
          variant="primary"
          className={stats.weakAreas.length > 0 ? 'flex-1' : 'w-full'}
          icon={<CheckCircle2 size={15} />}
        >
          Continue Sprint
        </Button>
      </div>
    </div>
  );
}