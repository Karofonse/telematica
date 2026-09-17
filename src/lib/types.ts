export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  qid: string;
  topic: string;
  subtopic: string;
  question: string;
  question_image: string | null;
  options: string[];
  option_images: string[] | null;
  correct_index: number;
  correct_indices: number[];
  explanation: string;
  difficulty: Difficulty;
  group_number: number;
  module_id: string | null;
  created_at: string;
  correct_count: number;
  total_count: number;
  consecutive_correct: number;
  last_answered_at: string | null;
  next_review_at: string;
  interval_days: number;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  position: number;
  created_at: string;
}

export type QuizMode = 'smart' | 'errors' | 'topic' | 'all' | 'group' | 'module';

export interface QuizSession {
  id: string;
  user_id?: string;
  started_at: string;
  completed_at: string | null;
  total: number;
  correct: number;
  xp_earned: number;
  mode: QuizMode;
  topic: string | null;
}

export interface SessionAnswer {
  id: string;
  user_id?: string;
  session_id: string;
  question_id: string;
  selected_index: number | null;
  selected_indices: number[] | null;
  is_correct: boolean;
  timed_out: boolean;
  time_taken_ms: number;
  answered_at: string;
}

export interface AppSettings {
  sounds: boolean;
  animations: boolean;
  timerEnabled: boolean;
  timerSeconds: number;
  defaultQuestionCount: number;
  repetitionIntensity: 'gentle' | 'normal' | 'aggressive';
  theme: 'dark' | 'light';
}

export interface AppState {
  id: number;
  user_id?: string;
  xp: number;
  level: number;
  streak: number;
  best_streak: number;
  last_study_date: string | null;
  settings: AppSettings;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id?: string;
  key: string;
  unlocked_at: string;
}


export const DEFAULT_SETTINGS: AppSettings = {
  sounds: true,
  animations: true,
  timerEnabled: true,
  timerSeconds: 20,
  defaultQuestionCount: 10,
  repetitionIntensity: 'normal',
  theme: 'dark',
};

export const ACHIEVEMENT_DEFS: { key: string; title: string; description: string; icon: string }[] = [
  { key: 'first_quiz', title: 'Primer quiz', description: 'Completa tu primer quiz', icon: 'trophy' },
  { key: 'streak_7', title: '7 días seguidos', description: 'Mantén una racha de 7 días', icon: 'flame' },
  { key: 'perfect_quiz', title: 'Quiz perfecto', description: 'Acerta todas las preguntas de un quiz', icon: 'target' },
  { key: 'mastered_50', title: '50 dominadas', description: 'Domina 50 preguntas', icon: 'brain' },
  { key: 'fast_10', title: '10 rápidas', description: '10 respuestas correctas rápidas', icon: 'zap' },
  { key: 'studied_100', title: '100 estudiadas', description: 'Responde 100 preguntas en total', icon: 'book' },
  { key: 'quizzes_10', title: '10 quizzes', description: 'Completa 10 quizzes', icon: 'flag' },
  { key: 'level_5', title: 'Nivel 5', description: 'Alcanza el nivel 5', icon: 'star' },
];
