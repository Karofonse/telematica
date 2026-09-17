import type { Question, QuizMode } from './types';
import { masteryLevel } from './spaced-repetition';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Check if a question supports multiple correct answers
export function isMultipleChoice(q: Question): boolean {
  return Array.isArray(q.correct_indices) && q.correct_indices.length > 1;
}

// Build a quiz of `count` questions based on the mode.
// Returns array of questions (not yet shuffled options).
export function buildQuiz(allQuestions: Question[], mode: QuizMode, count: number, topic?: string, group?: number): Question[] {
  if (allQuestions.length === 0) return [];

  let pool: Question[];

  if (mode === 'group' && group !== undefined) {
    pool = allQuestions.filter((q) => q.group_number === group);
    return shuffle(pool);
  } else if (mode === 'module' && group !== undefined) {
    // group here represents the module: 1 = mod 14&15 (groups 1-6), 2 = linux (groups 7-8)
    const groups = group === 1 ? [1,2,3,4,5,6] : group === 2 ? [7,8,9,10,11,12,13,14,15,16] : group === 3 ? [17,18,19,20,21] : [];
    pool = allQuestions.filter((q) => groups.includes(q.group_number));
  } else if (mode === 'topic' && topic) {
    pool = allQuestions.filter((q) => q.topic.toLowerCase() === topic.toLowerCase());
  } else if (mode === 'errors') {
    // Priority 1: questions answered incorrectly at least once (total > correct)
    const incorrect = allQuestions.filter((q) => q.total_count > 0 && q.correct_count < q.total_count);
    // Priority 2: weak mastery
    const weak = allQuestions.filter((q) => {
      const m = masteryLevel(q);
      return (m === 'weak' || m === 'none') && q.correct_count >= q.total_count;
    });
    // Priority 3: low accuracy but not fully incorrect
    const lowAcc = allQuestions.filter((q) =>
      q.total_count > 0 &&
      q.correct_count / q.total_count < 0.6 &&
      !incorrect.includes(q) &&
      !weak.includes(q),
    );
    // Priority 4: not yet mastered
    const notMastered = allQuestions.filter((q) => q.consecutive_correct < 3 && !incorrect.includes(q) && !weak.includes(q) && !lowAcc.includes(q));

    // Merge in priority order, dedupe
    const seen = new Set<string>();
    pool = [];
    for (const q of [...incorrect, ...weak, ...lowAcc, ...notMastered]) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        pool.push(q);
      }
    }
  } else if (mode === 'all') {
    pool = [...allQuestions];
  } else {
    // smart
    pool = buildSmartQuiz(allQuestions, count);
  }

  if (mode !== 'smart') {
    return shuffle(pool).slice(0, count);
  }

  return pool;
}

function buildSmartQuiz(all: Question[], count: number): Question[] {
  const now = new Date();
  const due = all.filter((q) => new Date(q.next_review_at) <= now);
  const buckets = {
    weak: due.filter((q) => masteryLevel(q) === 'weak' || masteryLevel(q) === 'none'),
    new: due.filter((q) => q.total_count === 0),
    progress: due.filter((q) => masteryLevel(q) === 'progress'),
    mastered: due.filter((q) => masteryLevel(q) === 'mastered' || masteryLevel(q) === 'strong'),
  };

  // If not enough due questions, fall back to all
  const totalDue = due.length;
  if (totalDue < count) {
    const notDue = all.filter((q) => new Date(q.next_review_at) > now);
    // prioritize weak/new from not-due
    const extra = shuffle([
      ...notDue.filter((q) => masteryLevel(q) === 'weak'),
      ...notDue.filter((q) => q.total_count === 0),
      ...notDue,
    ]);
    const merged = [...shuffle(due), ...extra];
    return merged.slice(0, count);
  }

  // target distribution: 40% weak, 30% new, 20% progress, 10% mastered
  const targets = {
    weak: Math.round(count * 0.4),
    new: Math.round(count * 0.3),
    progress: Math.round(count * 0.2),
    mastered: Math.round(count * 0.1),
  };

  const picked: Question[] = [];
  const used = new Set<string>();

  const take = (arr: Question[], n: number) => {
    const shuffled = shuffle(arr);
    for (const q of shuffled) {
      if (picked.length >= count) break;
      if (used.has(q.id)) continue;
      if (n <= 0) break;
      picked.push(q);
      used.add(q.id);
      n--;
    }
  };

  take(buckets.weak, targets.weak);
  take(buckets.new, targets.new);
  take(buckets.progress, targets.progress);
  take(buckets.mastered, targets.mastered);

  // fill remainder from any due
  if (picked.length < count) {
    take(due.filter((q) => !used.has(q.id)), count - picked.length);
  }

  return shuffle(picked);
}

// Shuffle the options of a question, returning new options + new correct indices + images
export function shuffleOptions(q: Question): { options: string[]; optionImages: string[]; correctIndices: number[] } {
  const correctSet = new Set(isMultipleChoice(q) ? q.correct_indices : [q.correct_index]);
  const images = q.option_images ?? q.options.map(() => '');
  const indexed = q.options.map((opt, i) => ({ opt, img: images[i] ?? '', correct: correctSet.has(i) }));
  const shuffled = shuffle(indexed);
  return {
    options: shuffled.map((s) => s.opt),
    optionImages: shuffled.map((s) => s.img),
    correctIndices: shuffled
      .map((s, i) => (s.correct ? i : -1))
      .filter((i) => i >= 0),
  };
}
