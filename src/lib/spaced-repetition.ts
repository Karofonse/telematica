import type { Question, AppSettings } from './types';

// Mastery levels derived from consecutive_correct and interval
export type MasteryLevel = 'none' | 'weak' | 'progress' | 'mastered' | 'strong';

export function masteryLevel(q: Question): MasteryLevel {
  if (q.total_count === 0) return 'none';
  const acc = q.correct_count / q.total_count;
  if (q.consecutive_correct >= 4 && acc >= 0.85) return 'strong';
  if (q.consecutive_correct >= 3 && acc >= 0.7) return 'mastered';
  if (q.consecutive_correct >= 1 && acc >= 0.5) return 'progress';
  if (q.total_count >= 1) return 'weak';
  return 'none';
}

export function masteryColor(level: MasteryLevel): string {
  switch (level) {
    case 'strong': return '#22c55e';
    case 'mastered': return '#10b981';
    case 'progress': return '#eab308';
    case 'weak': return '#f97316';
    default: return '#ef4444';
  }
}

export function masteryLabel(level: MasteryLevel): string {
  switch (level) {
    case 'strong': return 'Muy dominada';
    case 'mastered': return 'Dominada';
    case 'progress': return 'En progreso';
    case 'weak': return 'Necesita práctica';
    default: return 'No dominada';
  }
}

// SM-2-ish spaced repetition update.
// Returns new fields to merge into the question row.
export function updateSpacedRepetition(
  q: Question,
  correct: boolean,
  settings: AppSettings,
): { correct_count: number; total_count: number; consecutive_correct: number; last_answered_at: string; next_review_at: string; interval_days: number } {
  const intensityMul = settings.repetitionIntensity === 'aggressive' ? 0.6 : settings.repetitionIntensity === 'gentle' ? 1.5 : 1;

  let interval = q.interval_days || 1;
  let consecutive = q.consecutive_correct || 0;

  if (correct) {
    consecutive += 1;
    // grow interval
    if (consecutive === 1) interval = 1;
    else if (consecutive === 2) interval = 2;
    else if (consecutive === 3) interval = 4;
    else if (consecutive === 4) interval = 7;
    else if (consecutive === 5) interval = 14;
    else interval = Math.round(interval * 1.6);
  } else {
    consecutive = 0;
    interval = 0.5; // re-show soon
  }

  interval = Math.max(0.5, interval * intensityMul);

  const now = new Date();
  const next = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    correct_count: q.correct_count + (correct ? 1 : 0),
    total_count: q.total_count + 1,
    consecutive_correct: consecutive,
    last_answered_at: now.toISOString(),
    next_review_at: next.toISOString(),
    interval_days: interval,
  };
}

// XP / level system
export const LEVEL_THRESHOLDS = [0, 500, 1200, 2200, 3500, 5000, 7000, 9500, 12500, 16000, 20000, 25000, 31000, 38000, 46000, 55000];

export function levelForXp(xp: number): number {
  let lvl = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) lvl = i + 1;
  }
  return lvl;
}

export function levelProgress(xp: number): { level: number; current: number; needed: number; pct: number } {
  const level = levelForXp(xp);
  const base = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? base + 5000;
  const current = xp - base;
  const needed = next - base;
  const pct = Math.min(100, (current / needed) * 100);
  return { level, current, needed, pct };
}

// Scoring for a single answer
export function scoreAnswer(params: { correct: boolean; timeMs: number; timeLimitMs: number; streak: number }): { base: number; speedBonus: number; streakBonus: number; total: number } {
  const { correct, timeMs, timeLimitMs, streak } = params;
  if (!correct) return { base: 0, speedBonus: 0, streakBonus: 0, total: 0 };

  const base = 100;
  let speedBonus = 0;
  if (timeLimitMs > 0) {
    const ratio = Math.max(0, 1 - timeMs / timeLimitMs);
    speedBonus = Math.round(ratio * 50);
  }
  let streakBonus = 0;
  if (streak >= 5) streakBonus = 50;
  else if (streak >= 3) streakBonus = 25;

  return { base, speedBonus, streakBonus, total: base + speedBonus + streakBonus };
}

// Streak update
export function updateStreak(lastStudyDate: string | null, now = new Date()): { streak: number; isNewDay: boolean; isBroken: boolean } {
  const today = now.toISOString().slice(0, 10);
  if (!lastStudyDate) return { streak: 1, isNewDay: true, isBroken: false };
  const last = lastStudyDate.slice(0, 10);
  if (last === today) return { streak: 0, isNewDay: false, isBroken: false }; // already studied today, no increment

  const lastD = new Date(last + 'T00:00:00');
  const todayD = new Date(today + 'T00:00:00');
  const diffDays = Math.round((todayD.getTime() - lastD.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 1) return { streak: 1, isNewDay: true, isBroken: false }; // increment handled by caller adding to existing
  return { streak: 1, isNewDay: true, isBroken: true };
}
