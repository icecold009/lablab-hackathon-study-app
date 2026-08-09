import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, ArrowLeft, ArrowRight, CheckCircle2, XCircle, Send,
  Lightbulb, Snowflake, Target, BookOpen, Award, Sparkles,
} from 'lucide-react';
import type { QuizQuestion, QuizResult, StudyPlan, SprintSetup } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateTopicQuiz, checkAnswer } from '../utils/quizGenerator';
import { getTopicPriorityScore } from '../utils/planGenerator';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

type Stage = 'select' | 'taking' | 'results';

/* ── Skeleton loader ────────────────────────────────────────── */
function QuizSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-64 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export default function TopicQuiz() {
  const navigate = useNavigate();
  const [plan, setPlan] = useLocalStorage<StudyPlan | null>('icecold-plan', null);
  const [setup] = useLocalStorage<SprintSetup | null>('icecold-setup', null);
  const [, setQuizResults] = useLocalStorage<QuizResult[]>('icecold-quiz-results', []);

  const [stage, setStage] = useState<Stage>('select');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedTopicName, setSelectedTopicName] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [submittedQuestions, setSubmittedQuestions] = useState<QuizQuestion[]>([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  const topics = useMemo(() => setup?.topics || [], [setup]);

  const handleSelectTopic = (topicId: string, topicName: string) => {
    setSelectedTopicId(topicId);
    setSelectedTopicName(topicName);
    setLoading(true);
    setTimeout(() => {
      const qs = generateTopicQuiz(topicName, 5);
      setQuestions(qs);
      setAnswers({});
      setCurrentQ(0);
      setShowExplanation(false);
      setQuizScore(0);
      setSubmittedQuestions([]);
      setFinished(false);
      setStage('taking');
      setLoading(false);
    }, 400);
  };

  const handleAnswer = (questionId: string, answer: string) => {
    if (finished) return;
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    if (showExplanation && answers[questionId] !== answer) {
      setShowExplanation(false);
    }
  };

  const submitAnswer = useCallback(() => {
    const q = questions[currentQ];
    if (!q) return;
    const userAnswer = answers[q.id];
    if (!userAnswer?.trim()) return;

    const isCorrect = checkAnswer(q, userAnswer);
    q.userAnswer = userAnswer;
    q.isCorrect = isCorrect;

    setSubmittedQuestions(prev => {
      const filtered = prev.filter(pq => pq.id !== q.id);
      return [...filtered, q];
    });
    if (isCorrect) setQuizScore(prev => prev + 1);
    setShowExplanation(true);
  }, [questions, currentQ, answers]);

  const handleNext = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setShowExplanation(false);
    }
  }, [currentQ, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentQ > 0) setCurrentQ(prev => prev - 1);
  }, [currentQ]);

  const finishQuiz = () => {
    const finalQuestions = questions.map(q => {
      const found = submittedQuestions.find(sq => sq.id === q.id);
      return found || { ...q, userAnswer: '', isCorrect: false };
    });

    const totalScore = finalQuestions.filter(q => q.isCorrect).length;
    const scorePct = Math.round((totalScore / finalQuestions.length) * 100);

    const result: QuizResult = {
      topicId: selectedTopicId,
      topicName: selectedTopicName,
      questions: finalQuestions,
      score: totalScore,
      total: finalQuestions.length,
      completedAt: new Date().toISOString(),
    };
    setQuizResults(prev => [...prev, result]);

    if (plan) {
      setPlan({
        ...plan,
        blocks: plan.blocks.map(b =>
          b.topicId === selectedTopicId
            ? {
                ...b,
                quizScore: scorePct,
                done: true,
                substantiallyCovered: scorePct >= 80,
              }
            : b
        ),
      });
    }

    setFinished(true);
    setStage('results');
  };

  const handleRetry = () => {
    setLoading(true);
    setTimeout(() => {
      const qs = generateTopicQuiz(selectedTopicName, 5);
      setQuestions(qs);
      setAnswers({});
      setCurrentQ(0);
      setShowExplanation(false);
      setQuizScore(0);
      setSubmittedQuestions([]);
      setFinished(false);
      setStage('taking');
      setLoading(false);
    }, 400);
  };

  const handleBackToSelect = () => {
    setStage('select');
    setSelectedTopicId('');
    setSelectedTopicName('');
    setQuestions([]);
    setFinished(false);
    localStorage.removeItem('icecold-quiz-topic');
  };

  const handleBackToPlan = () => {
    localStorage.removeItem('icecold-quiz-topic');
    navigate('/plan');
  };

  const handleContinueToNextTopic = () => {
    if (plan && setup) {
      const undones = plan.blocks
        .filter(b => !b.substantiallyCovered && b.topicId !== 'review-break')
        .sort((a, b) => {
          const aTopic = setup.topics.find(t => t.id === a.topicId);
          const bTopic = setup.topics.find(t => t.id === b.topicId);
          if (!aTopic || !bTopic) return 0;
          return getTopicPriorityScore(bTopic) - getTopicPriorityScore(aTopic);
        });
      if (undones.length > 0) {
        const next = undones[0];
        handleSelectTopic(next.topicId, next.topicName);
        return;
      }
    }
    navigate('/plan');
  };

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    if (stage !== 'taking' || loading || questions.length === 0) return;

    const q = questions[currentQ];
    const userAnswer = answers[q?.id];
    const hasAnswer = !!userAnswer?.trim();
    const isSubmitted = submittedQuestions.some(sq => sq.id === q?.id);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (showExplanation && currentQ < questions.length - 1) {
          handleNext();
        } else if (showExplanation && currentQ >= questions.length - 1) {
          finishQuiz();
        }
        return;
      }
      if (e.key === 'Enter' && hasAnswer && !showExplanation && !isSubmitted) {
        e.preventDefault();
        submitAnswer();
        return;
      }
      if (q?.type === 'mcq' && !showExplanation && !isSubmitted) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= (q.options?.length || 0)) {
          e.preventDefault();
          handleAnswer(q.id, q.options![num - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, loading, questions, currentQ, answers, showExplanation, submittedQuestions, handlePrev, handleNext, submitAnswer, finishQuiz, handleAnswer]);

  // Auto-start if preselected (via a plan card or the quiz results).
  // Keep this synchronous: under React StrictMode an async timer scheduled
  // by the first effect pass can be cancelled before the second pass runs.
  useEffect(() => {
    if (stage !== 'select') return;
    const stored = localStorage.getItem('icecold-quiz-topic');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const topic = topics.find(t => t.id === parsed?.topicId);
      if (!topic) {
        localStorage.removeItem('icecold-quiz-topic');
        return;
      }

      localStorage.removeItem('icecold-quiz-topic');
      setSelectedTopicId(topic.id);
      setSelectedTopicName(topic.name);
      setQuestions(generateTopicQuiz(topic.name, 5));
      setAnswers({});
      setCurrentQ(0);
      setShowExplanation(false);
      setQuizScore(0);
      setSubmittedQuestions([]);
      setFinished(false);
      setStage('taking');
    } catch {
      localStorage.removeItem('icecold-quiz-topic');
      /* invalid JSON — ignore */
    }
  }, [stage, topics]);

  const totalQ = questions.length || 5;
  const pct = totalQ > 0 ? Math.round((quizScore / totalQ) * 100) : 0;
  const grade = pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good job!' : 'Keep practising';
  const gradeColors = pct >= 80 ? 'text-success' : pct >= 60 ? 'text-warning' : 'text-danger';
  const isCovered = pct >= 80;

  // Recommendation data per score tier
  const recommendation = pct >= 80
    ? {
        title: 'Substantially Covered',
        text: 'Excellent work! You have demonstrated strong understanding. Move on to your next highest-priority topic.',
        Icon: Award,
        color: 'text-success',
        bg: 'bg-success/15',
        border: 'border-success/30',
        badge: 'success',
      }
    : pct >= 60
    ? {
        title: 'Targeted Practice Needed',
        text: 'Good progress! Focus on the concepts you missed below. Review the explanations and try again.',
        Icon: Target,
        color: 'text-warning',
        bg: 'bg-warning/15',
        border: 'border-warning/30',
        badge: 'warning',
      }
    : {
        title: 'Review and Retry',
        text: 'Review the explanations below carefully. Each question has a detailed explanation to help you understand the concept. Retake the quiz when you feel more confident.',
        Icon: BookOpen,
        color: 'text-danger',
        bg: 'bg-danger/15',
        border: 'border-danger/30',
        badge: 'danger',
      };

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<Snowflake size={18} className="text-primary" />}
        title="Topic Quiz"
        subtitle={
          stage === 'select'
            ? 'Choose a topic to test yourself'
            : `Testing: ${selectedTopicName}`
        }
        action={
          stage !== 'select' ? (
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={handleBackToSelect}>
              Topics
            </Button>
          ) : undefined
        }
      />

      {/* Stage: Select */}
      {stage === 'select' && (
        <div>
          {loading && <QuizSkeleton />}
          {!loading && topics.length === 0 && (
            <EmptyState
              icon={<Brain size={28} className="text-muted/20" />}
              title="No topics yet"
              description="Set up your exam and topics first, then come back to test your knowledge."
              action={{
                label: 'Go to Setup',
                onClick: () => navigate('/'),
              }}
            />
          )}
          {!loading && topics.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted mb-2">
                Select a topic to start a 5-question quiz
              </p>
              {topics.map(topic => {
                const block = plan?.blocks.find(b => b.topicId === topic.id);
                const isCovered = block?.substantiallyCovered;
                return (
                  <button
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic.id, topic.name)}
                    className="w-full flex items-center justify-between bg-bg-card border border-border hover:border-primary/30 hover:bg-hover rounded-xl px-4 py-3.5 text-left transition-all cursor-pointer group focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">{topic.name}</span>
                      {isCovered && (
                        <Badge variant="success" icon={<CheckCircle2 size={10} />}>Covered</Badge>
                      )}
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-muted group-hover:text-primary-light transition-colors flex-shrink-0">
                      Start Quiz <ArrowRight size={14} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stage: Taking */}
      {stage === 'taking' && (
        <div>
          {loading ? <QuizSkeleton /> : questions.length > 0 && (
            <>
              {/* Progress strip */}
              <div className="bg-bg-card border border-border rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted">{selectedTopicName}</span>
                  <span className="text-xs text-muted">
                    {Object.keys(answers).length}/{questions.length} answered
                  </span>
                </div>
                <ProgressBar
                  value={(Object.keys(answers).length / questions.length) * 100}
                  size="sm"
                />
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[11px] text-muted">
                    Correct: <span className="text-success font-medium">{quizScore}</span>
                  </span>
                  <span className="text-[11px] text-muted">
                    Incorrect: <span className="text-danger font-medium">{submittedQuestions.filter(q => !q.isCorrect).length}</span>
                  </span>
                </div>
              </div>

              {/* Question */}
              <div className="bg-bg-card border border-border rounded-xl p-4 sm:p-6 mb-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="info">Question {currentQ + 1} of {questions.length}</Badge>
                  <Badge variant={questions[currentQ].type === 'mcq' ? 'info' : 'warning'}>
                    {questions[currentQ].type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-foreground mt-3 mb-5 leading-relaxed">
                  {questions[currentQ].question}
                </h3>

                {/* MCQ */}
                {questions[currentQ].type === 'mcq' && questions[currentQ].options && (
                  <div className="space-y-2">
                    {questions[currentQ].options.map((option, oi) => {
                      const isSelected = answers[questions[currentQ].id] === option;
                      const isCorrectOpt = option === questions[currentQ].correctAnswer;
                      let optStyle = 'border-border hover:border-primary/30 hover:bg-hover text-foreground';
                      if (showExplanation) {
                        if (isCorrectOpt) optStyle = 'border-success bg-success/5 text-success';
                        else if (isSelected) optStyle = 'border-danger bg-danger/5 text-danger';
                        else optStyle = 'border-border/50 text-muted';
                      } else if (isSelected) {
                        optStyle = 'border-primary bg-primary/5 text-foreground ring-1 ring-primary/20';
                      }
                      return (
                        <button
                          key={oi}
                          onClick={() => !showExplanation && handleAnswer(questions[currentQ].id, option)}
                          disabled={showExplanation}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all cursor-pointer ${optStyle}`}
                        >
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            showExplanation && isCorrectOpt ? 'bg-success text-white' :
                            showExplanation && isSelected && !isCorrectOpt ? 'bg-danger text-white' :
                            isSelected ? 'bg-primary text-white' :
                            'bg-border/50 text-muted'
                          }`}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="text-sm flex-1">{option}</span>
                          {!showExplanation && !isSelected && (
                            <span className="text-[9px] text-muted/40 font-mono flex-shrink-0">{oi + 1}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer */}
                {questions[currentQ].type === 'short' && (
                  <div>
                    <textarea
                      value={answers[questions[currentQ].id] || ''}
                      onChange={e => !showExplanation && handleAnswer(questions[currentQ].id, e.target.value)}
                      disabled={showExplanation}
                      placeholder="Type your answer…"
                      rows={3}
                      className="w-full bg-input-bg border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none disabled:opacity-60"
                    />
                  </div>
                )}

                {!showExplanation && answers[questions[currentQ].id]?.trim() && (
                  <Button
                    onClick={submitAnswer}
                    variant="secondary"
                    size="md"
                    className="w-full mt-4"
                    icon={<Send size={15} />}
                  >
                    Submit Answer
                  </Button>
                )}
              </div>

              {/* Feedback / Explanation */}
              {showExplanation && questions[currentQ] && (
                <div className={`bg-bg-card border rounded-xl p-4 sm:p-5 mb-4 animate-slide-scale ${
                  submittedQuestions.find(q => q.id === questions[currentQ].id)?.isCorrect
                    ? 'border-success/30' : 'border-danger/30'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      submittedQuestions.find(q => q.id === questions[currentQ].id)?.isCorrect
                        ? 'bg-success/15' : 'bg-danger/15'
                    }`}>
                      {submittedQuestions.find(q => q.id === questions[currentQ].id)?.isCorrect
                        ? <CheckCircle2 size={20} className="text-success" />
                        : <XCircle size={20} className="text-danger" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-semibold mb-2 ${
                        submittedQuestions.find(q => q.id === questions[currentQ].id)?.isCorrect
                          ? 'text-success' : 'text-danger'
                      }`}>
                        {submittedQuestions.find(q => q.id === questions[currentQ].id)?.isCorrect ? 'Correct!' : 'Incorrect'}
                      </p>
                      {questions[currentQ].type === 'short' && (
                        <div className="bg-input-bg rounded-lg px-3 py-2 mb-2 text-xs flex items-center gap-2">
                          <span className="text-muted">Correct answer:</span>
                          <span className="text-foreground font-medium">{questions[currentQ].correctAnswer}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3 border border-primary/10">
                        <Lightbulb size={14} className="text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-muted leading-relaxed">{questions[currentQ].explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-2">
                <Button
                  onClick={handlePrev}
                  disabled={currentQ === 0}
                  variant="ghost"
                  size="sm"
                  icon={<ArrowLeft size={14} />}
                >
                  Previous
                </Button>

                {/* Question dots — hidden on narrow mobile */}
                <div className="hidden sm:flex items-center gap-1">
                  {questions.map((q, qi) => (
                    <button
                      key={q.id}
                      onClick={() => { setCurrentQ(qi); setShowExplanation(!!submittedQuestions.find(sq => sq.id === q.id)); }}
                      className={`w-7 h-7 rounded-full text-[11px] font-medium transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                        qi === currentQ ? 'bg-primary text-bg' :
                        submittedQuestions.find(sq => sq.id === q.id)?.isCorrect ? 'bg-success/20 text-success' :
                        submittedQuestions.find(sq => sq.id === q.id) ? 'bg-danger/20 text-danger' :
                        answers[q.id] ? 'bg-primary/20 text-primary-light' :
                        'bg-border/50 text-muted hover:bg-border'
                      }`}
                    >
                      {qi + 1}
                    </button>
                  ))}
                </div>

                {currentQ < questions.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!showExplanation}
                    variant="ghost"
                    size="sm"
                  >
                    Next <ArrowRight size={14} />
                  </Button>
                ) : (
                  <Button
                    onClick={finishQuiz}
                    disabled={!showExplanation}
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 size={14} />}
                  >
                    Finish Quiz
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Stage: Results */}
      {stage === 'results' && (
        <div className="animate-slide-up space-y-4">
          {/* Score Card */}
          <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-3">
              <span className={`text-3xl font-bold ${gradeColors}`}>{pct}%</span>
            </div>
            <h2 className={`text-xl font-bold ${gradeColors} mb-1`}>{grade}</h2>
            <p className="text-sm text-muted">{selectedTopicName}</p>
            <p className="text-xs text-muted mt-1">{quizScore} of {questions.length} correct</p>

            <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
              <Button variant="secondary" size="sm" icon={<CheckCircle2 size={14} />} onClick={handleRetry}>
                Retry Quiz
              </Button>
              {isCovered ? (
                <Button variant="primary" size="sm" icon={<Sparkles size={14} />} onClick={handleContinueToNextTopic}>
                  Next Topic
                </Button>
              ) : (
                <Button variant="primary" size="sm" icon={<CheckCircle2 size={14} />} onClick={handleBackToPlan}>
                  Continue Sprint
                </Button>
              )}
            </div>
          </div>

          {/* Recommendation */}
          <div className={`bg-bg-card border rounded-xl p-4 sm:p-5 animate-slide-up ${recommendation.border}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg ${recommendation.bg} flex items-center justify-center flex-shrink-0`}>
                <recommendation.Icon size={18} className={recommendation.color} />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${recommendation.color} mb-1`}>{recommendation.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{recommendation.text}</p>
              </div>
            </div>
          </div>

          {/* Review Answers */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Review Answers</h3>
            {submittedQuestions.map((q, qi) => (
              <div key={q.id} className={`bg-bg-card border rounded-xl p-4 ${q.isCorrect ? 'border-success/30' : 'border-danger/30'}`}>
                <div className="flex items-start gap-3">
                  {q.isCorrect
                    ? <CheckCircle2 size={18} className="text-success flex-shrink-0 mt-0.5" />
                    : <XCircle size={18} className="text-danger flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground mb-2">
                      <span className="text-xs text-muted mr-1">Q{qi + 1}.</span>
                      {q.question}
                    </p>
                    {q.type === 'mcq' && q.options && (
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => {
                          let s = 'text-muted';
                          if (opt === q.correctAnswer) s = 'text-success font-medium';
                          else if (opt === q.userAnswer && !q.isCorrect) s = 'text-danger font-medium';
                          return (
                            <div key={oi} className="flex items-center gap-2 text-xs">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                                opt === q.correctAnswer ? 'bg-success/20 text-success' :
                                opt === q.userAnswer && !q.isCorrect ? 'bg-danger/20 text-danger' :
                                'bg-border/50 text-muted'
                              }`}>{String.fromCharCode(65 + oi)}</span>
                              <span className={s}>{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {q.type === 'short' && (
                      <div className="text-xs space-y-1">
                        <p className="text-muted">
                          Your answer:{' '}
                          <span className={q.isCorrect ? 'text-success' : 'text-danger'}>
                            {q.userAnswer || '(no answer)'}
                          </span>
                        </p>
                        <p className="text-success">Correct: {q.correctAnswer}</p>
                      </div>
                    )}
                    <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-border/50">
                      <Lightbulb size={12} className="text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-muted leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
