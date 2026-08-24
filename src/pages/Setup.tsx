import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Plus, Trash2, Clock, Brain, Snowflake,
  AlertCircle, Coffee, Zap, Shield, Star, Rocket, RotateCcw,
} from 'lucide-react';
import type { SprintSetup, StudyPlan, QuizResult, TopicSetup, Confidence, Importance } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getSampleSetup } from '../data/sampleData';
import { generatePlan } from '../utils/planGenerator';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';

function makeId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const confidenceOptions: Confidence[] = ['low', 'medium', 'high'];
const importanceOptions: Importance[] = ['low', 'medium', 'high'];

/* Clickable cycle badge for confidence/importance */
function LevelBadge({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  label: string;
}) {
  const nextValue = options[(options.indexOf(value) + 1) % options.length];
  const level = value as 'low' | 'medium' | 'high';
  const dotColor = { low: 'bg-danger', medium: 'bg-warning', high: 'bg-success' }[level];
  const textColor = { low: 'text-danger', medium: 'text-warning', high: 'text-success' }[level];
  const bgColor = { low: 'bg-danger/10', medium: 'bg-warning/10', high: 'bg-success/10' }[level];
  return (
    <button
      onClick={() => onChange(nextValue)}
      title={`${label}: ${value} — click to change`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-transparent cursor-pointer transition-all duration-150 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${bgColor} ${textColor}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {value}
    </button>
  );
}

function getLevelIcon(value: string) {
  if (value === 'high') return Star;
  if (value === 'medium') return Shield;
  return Zap;
}

/* ── Error inline message ─────────────────────────────────── */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-danger mt-1 flex items-center gap-1">
      <AlertCircle size={11} />
      {message}
    </p>
  );
}

export default function Setup() {
  const navigate = useNavigate();
  const [setup, setSetup] = useLocalStorage<SprintSetup | null>('icecold-setup', null);
  const [, setPlan] = useLocalStorage<StudyPlan | null>('icecold-plan', null);
  const [, setQuizResults] = useLocalStorage<QuizResult[]>('icecold-quiz-results', []);

  const [examName, setExamName] = useState(setup?.examName || '');
  const [examHours, setExamHours] = useState(setup?.examHours || 48);
  const [studyHours, setStudyHours] = useState(setup?.studyHours || 10);
  const [topics, setTopics] = useState<TopicSetup[]>(setup?.topics || []);
  const [newTopicName, setNewTopicName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  const totalAllocated = useMemo(() => {
    const count = topics.length;
    if (count === 0) return { hours: 0, perTopic: 0 };
    const perTopic = Math.round((studyHours / count) * 10) / 10;
    return { hours: studyHours, perTopic };
  }, [studyHours, topics.length]);

  const clearError = (field: string) => {
    setErrors(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  const addTopic = () => {
    const name = newTopicName.trim();
    if (!name) return;
    if (topics.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      setErrors(prev => ({ ...prev, newTopic: 'A topic with this name already exists.' }));
      return;
    }
    setTopics(prev => [...prev, {
      id: makeId(),
      name,
      confidence: 'medium',
      importance: 'medium',
    }]);
    setNewTopicName('');
    clearError('newTopic');
  };

  const removeTopic = (id: string) => {
    setTopics(prev => prev.filter(t => t.id !== id));
  };

  const updateTopic = (id: string, field: keyof TopicSetup, value: string) => {
    setTopics(prev => prev.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const loadSample = () => {
    const sample = getSampleSetup();
    setExamName(sample.examName);
    setExamHours(sample.examHours);
    setStudyHours(sample.studyHours);
    setTopics(sample.topics);
  };

  const handleSampleSprint = () => {
    const sample = getSampleSetup();
    // Load into form state
    setExamName(sample.examName);
    setExamHours(sample.examHours);
    setStudyHours(sample.studyHours);
    setTopics(sample.topics);

    // Immediately save setup and generate plan (directly, no state dependency)
    const sprintSetup: SprintSetup = {
      examName: sample.examName,
      examHours: sample.examHours,
      studyHours: sample.studyHours,
      topics: sample.topics.map(t => ({ ...t })),
      generatedAt: new Date().toISOString(),
    };
    setSetup(sprintSetup);
    const plan = generatePlan(sprintSetup);
    setPlan(plan);
    setQuizResults([]);
    localStorage.removeItem('icecold-quiz-topic');

    // Navigate to plan page
    navigate('/plan');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!examName.trim()) newErrors.examName = 'Enter your exam or subject name.';
    if (examHours < 1) newErrors.examHours = 'Time until exam must be at least 1 hour.';
    if (studyHours < 1) newErrors.studyHours = 'You need at least 1 hour to study.';
    if (studyHours > examHours) newErrors.studyHours = 'Study hours cannot exceed time until the exam.';
    if (topics.length === 0) newErrors.topics = 'Add at least one topic to generate a plan.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = () => {
    if (!validate()) return;
    setGenerating(true);

    const sprintSetup: SprintSetup = {
      examName: examName.trim(),
      examHours,
      studyHours,
      topics,
      generatedAt: new Date().toISOString(),
    };

    setSetup(sprintSetup);
    const plan = generatePlan(sprintSetup);
    setPlan(plan);
    setQuizResults([]);
    localStorage.removeItem('icecold-quiz-topic');

    setTimeout(() => {
      setGenerating(false);
      navigate('/plan');
    }, 600);
  };

  const handleReset = () => {
    setSetup(null);
    setPlan(null);
    setQuizResults([]);
    localStorage.removeItem('icecold-quiz-topic');
    setExamName('');
    setExamHours(48);
    setStudyHours(10);
    setTopics([]);
    setNewTopicName('');
    setErrors({});
  };

  const reviewReservePct = topics.length > 0 ? 15 : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<Snowflake size={18} className="text-primary" />}
        title="Setup Your Sprint"
        subtitle="Tell us about your exam and we'll build a plan"
      />

      {/* ── Try Sample Sprint ──────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-5 mb-5 animate-slide-scale">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Rocket size={20} className="text-primary-light" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-foreground mb-1">Try the Sample Sprint</h2>
            <p className="text-xs text-muted leading-relaxed mb-3">
              Jump straight into a <strong className="text-foreground">Biology Fundamentals</strong> exam sprint
              with 4 pre-configured topics, priority ratings, and a 6-hour study block. See the full flow
              in seconds.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleSampleSprint}
                variant="primary"
                size="md"
                icon={<Sparkles size={15} />}
              >
                Try Sample Sprint
              </Button>
              <Button
                onClick={loadSample}
                variant="ghost"
                size="sm"
              >
                Preview topics
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* ── Exam Info ───────────────────────────────────────── */}
        <section className="bg-bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Exam Details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="exam-name" className="block text-sm font-medium text-muted mb-1.5">
                Exam or Subject Name
              </label>
              <input
                id="exam-name"
                type="text"
                value={examName}
                onChange={e => { setExamName(e.target.value); clearError('examName'); }}
                placeholder="e.g. Biology Final Exam"
                className="w-full bg-input-bg border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <FieldError message={errors.examName} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="exam-hours" className="block text-sm font-medium text-muted mb-1.5">
                  <Clock size={14} className="inline mr-1.5 -mt-0.5" />
                  Hours Until Exam
                </label>
                <input
                  id="exam-hours"
                  type="number"
                  value={examHours}
                  onChange={e => { setExamHours(Number(e.target.value)); clearError('examHours'); }}
                  min={1}
                  max={720}
                  className="w-full bg-input-bg border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <FieldError message={errors.examHours} />
              </div>
              <div>
                <label htmlFor="study-hours" className="block text-sm font-medium text-muted mb-1.5">
                  <Brain size={14} className="inline mr-1.5 -mt-0.5" />
                  Available Study Hours
                </label>
                <input
                  id="study-hours"
                  type="number"
                  value={studyHours}
                  onChange={e => { setStudyHours(Number(e.target.value)); clearError('studyHours'); }}
                  min={1}
                  max={examHours}
                  step={0.5}
                  className="w-full bg-input-bg border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <FieldError message={errors.studyHours} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Topics ──────────────────────────────────────────── */}
        <section className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Topics</h2>
            {topics.length > 0 && (
              <span className="text-xs text-muted">
                {topics.length} topic{topics.length !== 1 ? 's' : ''} · ~{totalAllocated.perTopic}h each
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={newTopicName}
              onChange={e => { setNewTopicName(e.target.value); clearError('newTopic'); }}
              onKeyDown={e => e.key === 'Enter' && addTopic()}
              placeholder="Add a topic…"
              className="flex-1 bg-input-bg border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <Button
              onClick={addTopic}
              disabled={!newTopicName.trim()}
              variant="secondary"
              size="md"
              icon={<Plus size={15} />}
            >
              Add
            </Button>
          </div>
          <FieldError message={errors.newTopic} />

          {topics.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted">No topics yet.</p>
              <Button
                onClick={loadSample}
                variant="ghost"
                size="sm"
                className="mt-2"
              >
                Load sample data
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {topics.map((topic) => {
                const ConfidenceIcon = getLevelIcon(topic.confidence);
                const ImportanceIcon = getLevelIcon(topic.importance);
                return (
                  <div
                    key={topic.id}
                    className="flex items-center gap-2 bg-input-bg border border-border rounded-lg p-3 hover:border-primary/30 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{topic.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-card/50">
                        <ConfidenceIcon size={11} className="text-muted" />
                        <LevelBadge
                          value={topic.confidence}
                          options={confidenceOptions}
                          onChange={v => updateTopic(topic.id, 'confidence', v)}
                          label="Confidence"
                        />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-card/50">
                        <ImportanceIcon size={11} className="text-muted" />
                        <LevelBadge
                          value={topic.importance}
                          options={importanceOptions}
                          onChange={v => updateTopic(topic.id, 'importance', v)}
                          label="Importance"
                        />
                      </div>
                      <button
                        onClick={() => removeTopic(topic.id)}
                        className="p-1.5 text-muted/40 hover:text-danger hover:bg-danger/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-danger"
                        aria-label={`Remove ${topic.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <FieldError message={errors.topics} />

          {topics.length > 0 && (
            <button
              onClick={loadSample}
              className="mt-3 text-xs text-muted hover:text-primary-light transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              Reset to sample data
            </button>
          )}
        </section>

        {/* ── Summary + Generate ──────────────────────────────── */}
        <section className="bg-bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Summary</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Exam', value: examName || '—', highlight: !!examName },
              { label: 'Until Exam', value: `${examHours}h` },
              { label: 'Study Time', value: `${studyHours}h` },
              { label: 'Topics', value: topics.length.toString() },
            ].map(stat => (
              <div key={stat.label} className="bg-input-bg rounded-lg p-3 text-center">
                <span className={`block text-lg font-bold transition-colors ${
                  stat.highlight ? 'text-primary-light' : 'text-foreground'
                }`}>
                  {stat.value}
                </span>
                <span className="text-[11px] text-muted">{stat.label}</span>
              </div>
            ))}
          </div>

          {topics.length > 0 && (
            <div className="bg-input-bg border border-border/50 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
              <Coffee size={13} className="text-muted flex-shrink-0" />
              <p className="text-[11px] text-muted">
                <span className="text-foreground font-medium">~{reviewReservePct}%</span> of your study time
                ({Math.round(studyHours * 0.15 * 2) / 2}h) reserved for review and breaks.
              </p>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generating || topics.length === 0}
            size="lg"
            loading={generating}
            className="w-full"
          >
            {generating ? 'Building your sprint…' : (
              <>
                <Sparkles size={18} />
                Generate My Sprint
              </>
            )}
          </Button>

          {(setup || topics.length > 0) && (
            <Button
              onClick={handleReset}
              variant="danger"
              size="sm"
              className="w-full mt-2"
              icon={<RotateCcw size={14} />}
            >
              Reset Sprint
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}
