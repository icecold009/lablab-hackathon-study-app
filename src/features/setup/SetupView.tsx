import {
  AlertCircle, Brain, Clock, Coffee, Plus, Rocket, RotateCcw, Shield,
  Snowflake, Sparkles, Star, Trash2, Zap,
} from 'lucide-react'
import type { SprintSetup, TopicSetup } from '../../types'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'

const confidenceOptions = ['low', 'medium', 'high']
const importanceOptions = ['low', 'medium', 'high']

export interface SetupViewProps {
  setup: SprintSetup | null
  examName: string
  examHours: number
  studyHours: number
  topics: TopicSetup[]
  newTopicName: string
  errors: Record<string, string>
  generating: boolean
  perTopicHours: number
  reviewReservePct: number
  onExamNameChange: (value: string) => void
  onExamHoursChange: (value: number) => void
  onStudyHoursChange: (value: number) => void
  onNewTopicNameChange: (value: string) => void
  onClearError: (field: string) => void
  onAddTopic: () => void
  onRemoveTopic: (id: string) => void
  onUpdateTopic: (id: string, field: keyof TopicSetup, value: string) => void
  onLoadSample: () => void
  onSampleSprint: () => void
  onGenerate: () => void
  onReset: () => void
}

function LevelBadge({
  value,
  options,
  onChange,
  label,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
  label: string
}) {
  const nextValue = options[(options.indexOf(value) + 1) % options.length]
  const level = value as 'low' | 'medium' | 'high'
  const dotColor = { low: 'bg-danger', medium: 'bg-warning', high: 'bg-success' }[level]
  const textColor = { low: 'text-danger', medium: 'text-warning', high: 'text-success' }[level]
  const bgColor = { low: 'bg-danger/10', medium: 'bg-warning/10', high: 'bg-success/10' }[level]

  return (
    <button
      onClick={() => onChange(nextValue)}
      title={`${label}: ${value} — click to change`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-transparent cursor-pointer transition-all duration-150 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${bgColor} ${textColor}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {value}
    </button>
  )
}

function getLevelIcon(value: string) {
  if (value === 'high') return Star
  if (value === 'medium') return Shield
  return Zap
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-xs text-danger mt-1 flex items-center gap-1">
      <AlertCircle size={11} />
      {message}
    </p>
  )
}

export default function SetupView({
  setup,
  examName,
  examHours,
  studyHours,
  topics,
  newTopicName,
  errors,
  generating,
  perTopicHours,
  reviewReservePct,
  onExamNameChange,
  onExamHoursChange,
  onStudyHoursChange,
  onNewTopicNameChange,
  onClearError,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
  onLoadSample,
  onSampleSprint,
  onGenerate,
  onReset,
}: SetupViewProps) {
  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<Snowflake size={18} className="text-primary" />}
        title="Setup Your Sprint"
        subtitle="Tell us about your exam and we'll build a plan"
      />

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
              <Button onClick={onSampleSprint} variant="primary" size="md" icon={<Sparkles size={15} />}>
                Try Sample Sprint
              </Button>
              <Button onClick={onLoadSample} variant="ghost" size="sm">
                Preview topics
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
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
                onChange={event => { onExamNameChange(event.target.value); onClearError('examName') }}
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
                  onChange={event => { onExamHoursChange(Number(event.target.value)); onClearError('examHours') }}
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
                  onChange={event => { onStudyHoursChange(Number(event.target.value)); onClearError('studyHours') }}
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

        <section className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Topics</h2>
            {topics.length > 0 && (
              <span className="text-xs text-muted">
                {topics.length} topic{topics.length !== 1 ? 's' : ''} · ~{perTopicHours}h each
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={newTopicName}
              onChange={event => { onNewTopicNameChange(event.target.value); onClearError('newTopic') }}
              onKeyDown={event => { if (event.key === 'Enter') onAddTopic() }}
              placeholder="Add a topic…"
              className="flex-1 bg-input-bg border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <Button onClick={onAddTopic} disabled={!newTopicName.trim()} variant="secondary" size="md" icon={<Plus size={15} />}>
              Add
            </Button>
          </div>
          <FieldError message={errors.newTopic} />

          {topics.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted">No topics yet.</p>
              <Button onClick={onLoadSample} variant="ghost" size="sm" className="mt-2">
                Load sample data
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {topics.map(topic => {
                const ConfidenceIcon = getLevelIcon(topic.confidence)
                const ImportanceIcon = getLevelIcon(topic.importance)
                return (
                  <div key={topic.id} className="flex items-center gap-2 bg-input-bg border border-border rounded-lg p-3 hover:border-primary/30 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{topic.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-card/50">
                        <ConfidenceIcon size={11} className="text-muted" />
                        <LevelBadge
                          value={topic.confidence}
                          options={confidenceOptions}
                          onChange={value => onUpdateTopic(topic.id, 'confidence', value)}
                          label="Confidence"
                        />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-card/50">
                        <ImportanceIcon size={11} className="text-muted" />
                        <LevelBadge
                          value={topic.importance}
                          options={importanceOptions}
                          onChange={value => onUpdateTopic(topic.id, 'importance', value)}
                          label="Importance"
                        />
                      </div>
                      <button
                        onClick={() => onRemoveTopic(topic.id)}
                        className="p-1.5 text-muted/40 hover:text-danger hover:bg-danger/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-danger"
                        aria-label={`Remove ${topic.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <FieldError message={errors.topics} />

          {topics.length > 0 && (
            <button
              onClick={onLoadSample}
              className="mt-3 text-xs text-muted hover:text-primary-light transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              Reset to sample data
            </button>
          )}
        </section>

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
                <span className={`block text-lg font-bold transition-colors ${stat.highlight ? 'text-primary-light' : 'text-foreground'}`}>
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

          <Button onClick={onGenerate} disabled={generating || topics.length === 0} size="lg" loading={generating} className="w-full">
            {generating ? 'Building your sprint…' : <><Sparkles size={18} />Generate My Sprint</>}
          </Button>

          {(setup || topics.length > 0) && (
            <Button onClick={onReset} variant="danger" size="sm" className="w-full mt-2" icon={<RotateCcw size={14} />}>
              Reset Sprint
            </Button>
          )}
        </section>
      </div>
    </div>
  )
}
