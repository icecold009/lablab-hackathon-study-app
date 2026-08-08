export type Confidence = 'low' | 'medium' | 'high';
export type Importance = 'low' | 'medium' | 'high';
export type QuestionType = 'mcq' | 'short';

export interface TopicSetup {
  id: string;
  name: string;
  confidence: Confidence;
  importance: Importance;
}

export interface SprintSetup {
  examName: string;
  examHours: number;       // remaining hours until exam
  studyHours: number;      // total available study hours
  topics: TopicSetup[];
  generatedAt: string;
}

export interface TimeBlock {
  id: string;
  topicId: string;
  topicName: string;
  duration: number;         // in hours
  startHour: number;        // hour offset from now (0 = now)
  priority: string;         // "High priority - low confidence" etc
  priorityReason: string;   // brief explanation of why this topic was prioritised
  recommendedActivity: string;
  activityLabel: 'learn' | 'review' | 'practice' | 'recall' | 'mistakes';
  done: boolean;
  quizScore?: number;       // stored after quiz completion
  substantiallyCovered?: boolean; // true when quiz score >= 80%
}

export interface StudyPlan {
  setup: SprintSetup;
  blocks: TimeBlock[];
  totalHours: number;
  generatedAt: string;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];       // for MCQ
  correctAnswer: string;    // the correct answer text (for MCQ it's the text, for short it's the expected answer)
  explanation: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface QuizResult {
  topicId: string;
  topicName: string;
  questions: QuizQuestion[];
  score: number;
  total: number;
  completedAt: string;
}

export interface ProgressData {
  completedTopics: string[];         // topic IDs
  quizResults: QuizResult[];
  weakAreas: string[];              // topic names the user struggled with
  nextAction: string;
  nextActionLink: string;
}