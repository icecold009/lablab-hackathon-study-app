import type { SprintSetup, TimeBlock, StudyPlan } from '../types';

/* ── Scoring weights ───────────────────────────────────────── */

// Invert confidence so low → highest need
const confidenceNeed: Record<string, number> = { low: 3, medium: 2, high: 1 };
const importanceNeed: Record<string, number> = { high: 3, medium: 2, low: 1 };

const confidenceLabel: Record<string, string> = {
  low: 'low confidence',
  medium: 'moderate confidence',
  high: 'good confidence',
};
const importanceLabel: Record<string, string> = {
  high: 'high importance',
  medium: 'moderate importance',
  low: 'lower importance',
};

/* ── Activities by confidence ──────────────────────────────── */

type ActivityEntry = { label: TimeBlock['activityLabel']; text: string };

const activityMap: Record<string, ActivityEntry[]> = {
  low: [
    { label: 'learn', text: 'Learn the concept — start with core definitions and principles.' },
    { label: 'review', text: 'Review an explanation — watch a walkthrough or read a summary.' },
  ],
  medium: [
    { label: 'practice', text: 'Solve practice questions — apply what you know.' },
    { label: 'recall', text: 'Recall from memory — close your notes and explain it out loud.' },
  ],
  high: [
    { label: 'mistakes', text: 'Review mistakes — go over errors from past quizzes or exercises.' },
    { label: 'recall', text: 'Recall from memory — quick self-test to confirm mastery.' },
  ],
};

/** Deterministic activity pick so regenerating with same data yields the same plan. */
function pickActivity(confidence: string, index: number): ActivityEntry {
  const pool = activityMap[confidence] ?? activityMap.medium;
  return pool[index % pool.length];
}

/* ── Priority helpers ─────────────────────────────────────── */

function computeScore(topic: SprintSetup['topics'][number]): number {
  // Low confidence + high importance = highest priority
  return confidenceNeed[topic.confidence] * 2 + importanceNeed[topic.importance] * 3;
}

function pickPriorityLabel(confidence: string, importance: string): string {
  const c = confidenceLabel[confidence];
  const i = importanceLabel[importance];
  if (confidence === 'low' && importance === 'high') return `Critical — ${c}, ${i}`;
  if (confidence === 'low' || importance === 'high') return `High priority — ${c}, ${i}`;
  if (confidence === 'high' && importance === 'low') return `Quick review — ${c}, ${i}`;
  return `Moderate — ${c}, ${i}`;
}

function pickPriorityReason(topic: SprintSetup['topics'][number]): string {
  const parts: string[] = [];
  if (topic.confidence === 'low') parts.push('you rated your confidence as low, so this needs the most attention');
  else if (topic.confidence === 'medium') parts.push('you have moderate confidence here');
  else parts.push('you feel confident about this topic');

  if (topic.importance === 'high') parts.push('it is highly important for the exam');
  else if (topic.importance === 'medium') parts.push('it has moderate importance');
  else parts.push('it has lower exam weight');

  if (topic.confidence === 'low' && topic.importance === 'high') {
    return `Top priority — ${parts[0]} and ${parts[1]}. Focus here first.`;
  }
  return `Scheduled now because ${parts.join(' and ')}.`;
}

/* ── Main generator ───────────────────────────────────────── */

export function generatePlan(setup: SprintSetup): StudyPlan {
  const { topics, studyHours } = setup;

  // Clamp study hours to a sane minimum
  const effectiveHours = Math.max(1, studyHours);

  // Reserve ~15% for review and breaks, but ensure at least 30 min of real study per topic
  const reviewReserve = Math.round(effectiveHours * 0.15 * 2) / 2; // round to nearest 0.5
  const studyPool = Math.max(topics.length * 0.5, effectiveHours - reviewReserve);

  // Score and sort topics
  const scored = topics.map(t => ({ topic: t, score: computeScore(t) }));
  const totalScore = scored.reduce((s, x) => s + x.score, 0);

  // Allocate time proportionally by score (higher score = more time)
  const blocks: TimeBlock[] = scored.map((s, i) => {
    const rawHours = totalScore > 0 ? (s.score / totalScore) * studyPool : studyPool / topics.length;
    const duration = Math.max(0.5, Math.round(rawHours * 2) / 2);
    const activity = pickActivity(s.topic.confidence, i);
    return {
      id: `block-${i}`,
      topicId: s.topic.id,
      topicName: s.topic.name,
      duration,
      startHour: 0,
      priority: pickPriorityLabel(s.topic.confidence, s.topic.importance),
      priorityReason: pickPriorityReason(s.topic),
      recommendedActivity: activity.text,
      activityLabel: activity.label,
      done: false,
    };
  });

  // Sort: highest score first
  blocks.sort((a, b) => {
    const aTopic = topics.find(t => t.id === a.topicId)!;
    const bTopic = topics.find(t => t.id === b.topicId)!;
    return computeScore(bTopic) - computeScore(aTopic);
  });

  // Recalculate start hours chronologically
  let currentHour = 0;
  for (const block of blocks) {
    block.startHour = currentHour;
    currentHour += block.duration;
  }

  // Add a review/break block at the end if reserve is meaningful
  if (reviewReserve >= 0.5 && blocks.length > 0) {
    blocks.push({
      id: 'block-review-break',
      topicId: 'review-break',
      topicName: 'Review & Breaks',
      duration: reviewReserve,
      startHour: currentHour,
      priority: 'Scheduled — built-in review and break time',
      priorityReason: '~15% of your study time is reserved for reviewing weak spots and taking short breaks to stay fresh.',
      recommendedActivity: 'Review your notes, retake a quiz on a weak area, or step away for 5–10 minutes.',
      activityLabel: 'review',
      done: false,
    });
  }

  // ~15% reserve complete

  return {
    setup: {
      ...setup,
      studyHours: effectiveHours,
    },
    blocks,
    totalHours: effectiveHours,
    generatedAt: new Date().toISOString(),
  };
}

/* ── Formatters ───────────────────────────────────────────── */

export function formatTime(hourOffset: number): string {
  const now = new Date();
  const d = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours === Math.floor(hours)) return `${hours}h`;
  return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
}

/** Return a summary object for the StudyPlan page. */
export function getPlanSummary(plan: StudyPlan) {
  const blocks = plan.blocks.filter(b => b.topicId !== 'review-break');
  const totalTopics = blocks.length;
  const totalStudyHours = blocks.reduce((s, b) => s + b.duration, 0);
  const highestPriorityBlock = blocks[0] ?? null;
  const doneBlocks = plan.blocks.filter(b => b.done).length;
  const completionPct = plan.blocks.length > 0
    ? Math.round((doneBlocks / plan.blocks.length) * 100)
    : 0;
  const reviewBreak = plan.blocks.find(b => b.topicId === 'review-break');

  return {
    totalTopics,
    totalStudyHours,
    highestPriorityTopic: highestPriorityBlock?.topicName ?? '—',
    highestPriorityReason: highestPriorityBlock?.priorityReason ?? '',
    completionPct,
    reviewBreakHours: reviewBreak?.duration ?? 0,
    doneBlocks,
    totalBlocks: plan.blocks.length,
  };
}