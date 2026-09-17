import { supabase } from './supabase';
import type { Question, QuizSession, SessionAnswer, AppState, AppSettings, Achievement, QuizMode, Difficulty } from './types';
import { DEFAULT_SETTINGS } from './types';
import { updateSpacedRepetition, updateStreak, levelForXp } from './spaced-repetition';
import { masteryLevel } from './spaced-repetition';

// ---- Questions (shared bank) ----
export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase.from('questions').select('*').order('group_number', { ascending: true }).order('qid', { ascending: true });
  if (error) throw error;
  return (data as Question[]) ?? [];
}

export async function createQuestion(input: {
  topic: string;
  subtopic: string;
  question: string;
  question_image: string;
  options: string[];
  option_images: string[];
  correct_index: number;
  correct_indices: number[];
  explanation: string;
  difficulty: Difficulty;
  group_number?: number;
}): Promise<Question> {
  const { data: existing } = await supabase.from('questions').select('qid').order('created_at', { ascending: true });
  const maxNum = (existing ?? []).reduce((max, row: any) => {
    const m = /^Q(\d+)$/.exec(row.qid || '');
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 0);
  const qid = `Q${String(maxNum + 1).padStart(3, '0')}`;

  const { data, error } = await supabase
    .from('questions')
    .insert({
      qid,
      topic: input.topic.trim() || 'General',
      subtopic: input.subtopic.trim(),
      question: input.question.trim(),
      question_image: input.question_image || '',
      options: input.options.map((o) => o.trim()),
      option_images: input.option_images,
      correct_index: input.correct_index,
      correct_indices: input.correct_indices,
      explanation: input.explanation.trim(),
      difficulty: input.difficulty,
      group_number: input.group_number ?? 1,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Question;
}

export async function updateQuestion(id: string, patch: Partial<Question>): Promise<Question> {
  const { data, error } = await supabase.from('questions').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Question;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
}

// ---- Quiz sessions & answers ----
export async function createSession(mode: QuizMode, topic: string | null): Promise<QuizSession> {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert({ mode, topic, total: 0, correct: 0, xp_earned: 0 })
    .select()
    .single();
  if (error) throw error;
  return data as QuizSession;
}

export async function completeSession(
  sessionId: string,
  total: number,
  correct: number,
  xpEarned: number,
): Promise<void> {
  const { error } = await supabase
    .from('quiz_sessions')
    .update({ completed_at: new Date().toISOString(), total, correct, xp_earned: xpEarned })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function recordAnswer(answer: Omit<SessionAnswer, 'id'>): Promise<void> {
  const { error } = await supabase.from('session_answers').insert(answer);
  if (error) throw error;
}

export async function applyAnswerToQuestion(question: Question, isCorrect: boolean, settings: AppSettings): Promise<void> {
  const updates = updateSpacedRepetition(question, isCorrect, settings);
  const { error } = await supabase.from('questions').update(updates).eq('id', question.id);
  if (error) throw error;
}

// ---- App state ----
export async function fetchAppState(): Promise<AppState> {
  const { data, error } = await supabase.from('app_state').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  if (!data) {
    const { data: created, error: insErr } = await supabase.from('app_state').insert({ id: 1 }).select().single();
    if (insErr) throw insErr;
    return created as AppState;
  }
  return data as AppState;
}

export async function updateAppState(patch: Partial<AppState>): Promise<AppState> {
  const { data, error } = await supabase.from('app_state').update(patch).eq('id', 1).select().maybeSingle();
  if (error) throw error;
  return data as AppState;
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  const { error } = await supabase.from('app_state').update({ settings: settings as any }).eq('id', 1);
  if (error) throw error;
}

export async function applyQuizCompletion(xpEarned: number): Promise<{ state: AppState; leveledUp: boolean; newAchievements: string[] }> {
  const state = await fetchAppState();
  const oldLevel = levelForXp(state.xp);
  const newXp = state.xp + xpEarned;
  const newLevel = levelForXp(newXp);
  const leveledUp = newLevel > oldLevel;

  const today = new Date().toISOString().slice(0, 10);
  let newStreak = state.streak;
  if (state.last_study_date !== today) {
    const sr = updateStreak(state.last_study_date);
    if (sr.isNewDay) {
      if (sr.isBroken) newStreak = 1;
      else newStreak = state.streak + 1;
    }
  }
  const newBest = Math.max(state.best_streak, newStreak);

  const { data: updated, error } = await supabase
    .from('app_state')
    .update({
      xp: newXp,
      level: newLevel,
      streak: newStreak,
      best_streak: newBest,
      last_study_date: today,
    })
    .eq('id', 1)
    .select()
    .maybeSingle();
  if (error) throw error;
  const updatedState = (updated as AppState) ?? { ...state, xp: newXp, level: newLevel, streak: newStreak, best_streak: newBest, last_study_date: today };

  const newAch = await checkAchievements(updatedState, newXp, newLevel, newStreak);

  return { state: updatedState, leveledUp, newAchievements: newAch };
}

// ---- Achievements ----
export async function fetchAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase.from('achievements').select('*');
  if (error) throw error;
  return (data as Achievement[]) ?? [];
}

export async function unlockAchievement(key: string): Promise<boolean> {
  const { data: existing } = await supabase.from('achievements').select('id').eq('key', key).maybeSingle();
  if (existing) return false;
  const { error } = await supabase.from('achievements').insert({ key });
  if (error) return false;
  return true;
}

async function checkAchievements(state: AppState, xp: number, level: number, streak: number): Promise<string[]> {
  const unlocked: string[] = [];

  const { count: sessionCount } = await supabase
    .from('quiz_sessions')
    .select('*', { count: 'exact', head: true })
    .not('completed_at', 'is', null);

  const { count: totalAnswers } = await supabase
    .from('session_answers')
    .select('*', { count: 'exact', head: true });

  const { count: masteredCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .gte('consecutive_correct', 3);

  const { data: perfectSessions } = await supabase
    .from('quiz_sessions')
    .select('id, total, correct')
    .not('completed_at', 'is', null);
  const hasPerfect = (perfectSessions ?? []).some((s: any) => s.total > 0 && s.correct === s.total);

  const { count: fastCount } = await supabase
    .from('session_answers')
    .select('*', { count: 'exact', head: true })
    .eq('is_correct', true)
    .lt('time_taken_ms', 5000);

  const checks: { key: string; cond: boolean }[] = [
    { key: 'streak_7', cond: streak >= 7 },
    { key: 'mastered_50', cond: (masteredCount ?? 0) >= 50 },
    { key: 'fast_10', cond: (fastCount ?? 0) >= 10 },
    { key: 'studied_100', cond: (totalAnswers ?? 0) >= 100 },
    { key: 'quizzes_10', cond: (sessionCount ?? 0) >= 10 },
    { key: 'level_5', cond: level >= 5 },
    { key: 'perfect_quiz', cond: hasPerfect },
  ];

  for (const c of checks) {
    if (c.cond) {
      const isNew = await unlockAchievement(c.key);
      if (isNew) unlocked.push(c.key);
    }
  }

  return unlocked;
}

// ---- Stats ----
export async function fetchAllAnswers(): Promise<SessionAnswer[]> {
  const { data, error } = await supabase.from('session_answers').select('*').order('answered_at', { ascending: true });
  if (error) throw error;
  return (data as SessionAnswer[]) ?? [];
}

export async function fetchAllSessions(): Promise<QuizSession[]> {
  const { data, error } = await supabase.from('quiz_sessions').select('*').order('completed_at', { ascending: false });
  if (error) throw error;
  return (data as QuizSession[]) ?? [];
}

// ---- Import / Export ----
export async function exportData(): Promise<string> {
  const [questions, sessions, answers, state, achievements] = await Promise.all([
    fetchQuestions(),
    fetchAllSessions(),
    fetchAllAnswers(),
    fetchAppState(),
    fetchAchievements(),
  ]);
  return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), questions, sessions, answers, state, achievements }, null, 2);
}

export async function importData(json: string): Promise<void> {
  const parsed = JSON.parse(json);
  if (!parsed.questions) throw new Error('Invalid backup file');

  await supabase.from('session_answers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('quiz_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('achievements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (parsed.questions.length > 0) {
    const { error } = await supabase.from('questions').insert(parsed.questions);
    if (error) throw error;
  }
  if (parsed.sessions?.length > 0) {
    const { error } = await supabase.from('quiz_sessions').insert(parsed.sessions);
    if (error) throw error;
  }
  if (parsed.answers?.length > 0) {
    const { error } = await supabase.from('session_answers').insert(parsed.answers);
    if (error) throw error;
  }
  if (parsed.achievements?.length > 0) {
    const { error } = await supabase.from('achievements').insert(parsed.achievements);
    if (error) throw error;
  }
  if (parsed.state) {
    const { id, created_at, user_id, ...rest } = parsed.state;
    const { error } = await supabase.from('app_state').update(rest).eq('id', 1);
    if (error) throw error;
  }
}

export { DEFAULT_SETTINGS, masteryLevel };
