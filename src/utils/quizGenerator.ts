import type { QuizQuestion, QuestionType } from '../types';
import { getSampleQuizQuestions } from '../data/sampleData';

function getSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let state = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateTopicQuiz(topicName: string, count: number = 5): QuizQuestion[] {
  const bank = getSampleQuizQuestions(topicName);

  // We want a mix: ~60% MCQ, ~40% short-answer
  const mcqCount = Math.ceil(count * 0.6); // 3 for 5
  const shortCount = count - mcqCount;       // 2 for 5
  const topicSeed = getSeed(topicName.trim().toLowerCase());

  const shuffledMcqs = stableShuffle(bank.mcqs, topicSeed).slice(0, mcqCount);
  const shuffledShorts = stableShuffle(bank.shorts, topicSeed ^ 0x9e3779b9).slice(0, shortCount);

  const questions: QuizQuestion[] = [
    ...shuffledMcqs.map((q, i) => ({
      id: `mcq-${topicName.replace(/\s+/g, '-')}-${i}`,
      type: 'mcq' as QuestionType,
      question: q.q,
      options: stableShuffle(q.options, getSeed(`${topicName}:${q.q}`)),
      correctAnswer: q.correct,
      explanation: q.explanation,
    })),
    ...shuffledShorts.map((q, i) => ({
      id: `short-${topicName.replace(/\s+/g, '-')}-${i}`,
      type: 'short' as QuestionType,
      question: q.q,
      correctAnswer: q.answer,
      explanation: q.explanation,
    })),
  ];

  return stableShuffle(questions, topicSeed ^ 0x85ebca6b);
}

export function calculateScore(questions: QuizQuestion[]): number {
  return questions.filter(q => q.isCorrect).length;
}

export function checkAnswer(question: QuizQuestion, userAnswer: string): boolean {
  if (question.type === 'mcq') {
    return userAnswer === question.correctAnswer;
  }
  // Short answer: case-insensitive, trim, check for keywords if it's a phrase
  const normalized = userAnswer.trim().toLowerCase();
  const expected = question.correctAnswer.trim().toLowerCase();

  // Exact match
  if (normalized === expected) return true;

  // Check if the answer contains key terms (for phrase answers)
  const keyWords = expected.split(/\s+/);
  const matchedWords = keyWords.filter(w => {
    // Use word boundary to avoid false matches like "cell" matching "cellular"
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`).test(normalized);
  });
  // Accept if 60%+ of key words match, or at least 1 key word for short answers
  return matchedWords.length >= Math.max(1, Math.ceil(keyWords.length * 0.6));
}
