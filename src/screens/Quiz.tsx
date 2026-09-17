import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, X, Lightbulb, ChevronRight, Flame, Zap, ListChecks } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Card } from '@/components/ui/Card';
import { buildQuiz, shuffleOptions, isMultipleChoice } from '@/lib/quiz-builder';
import { scoreAnswer, levelForXp } from '@/lib/spaced-repetition';
import { playCorrect, playWrong, playStreak } from '@/lib/sound';
import * as db from '@/lib/db';
import type { Question, QuizMode } from '@/lib/types';
import type { Route } from '@/components/NavBar';

interface QuizScreenProps {
  mode: QuizMode;
  topic?: string;
  group?: number;
  moduleId?: string;
  onNavigate: (r: Route) => void;
  onQuizComplete: (result: QuizResult) => void;
}

export interface QuizResult {
  sessionId: string;
  total: number;
  correct: number;
  xpEarned: number;
  answers: { question: Question; selected: number | null; selectedIndices: number[] | null; correct: boolean; timedOut: boolean }[];
  leveledUp: boolean;
  newAchievements: string[];
}

const OPTION_STYLES = [
  { bg: 'from-purple-500 to-purple-600', ring: 'ring-purple-400', text: 'A' },
  { bg: 'from-blue-500 to-blue-600', ring: 'ring-blue-400', text: 'B' },
  { bg: 'from-emerald-500 to-emerald-600', ring: 'ring-emerald-400', text: 'C' },
  { bg: 'from-amber-500 to-orange-600', ring: 'ring-amber-400', text: 'D' },
  { bg: 'from-pink-500 to-pink-600', ring: 'ring-pink-400', text: 'E' },
  { bg: 'from-cyan-500 to-cyan-600', ring: 'ring-cyan-400', text: 'F' },
];

export function QuizScreen({ mode, topic, group, moduleId, onNavigate, onQuizComplete }: QuizScreenProps) {
  const { questions, settings, state } = useApp();
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [multiSelected, setMultiSelected] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.timerSeconds);
  const [startTime, setStartTime] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<{ question: Question; selected: number | null; selectedIndices: number[] | null; correct: boolean; timedOut: boolean }[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<{ options: string[]; optionImages: string[]; correctIndices: number[] } | null>(null);
  const [lastScoreGain, setLastScoreGain] = useState<{ base: number; speedBonus: number; streakBonus: number; total: number } | null>(null);
  const [ready, setReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQ = quizQuestions[currentIndex];
  const isMulti = currentQ ? isMultipleChoice(currentQ) : false;

  // Build quiz on mount
  useEffect(() => {
    if (questions.length === 0) {
      setReady(false);
      return;
    }
    const count = (mode === 'all' || mode === 'module') ? questions.length : settings.defaultQuestionCount;
    const built = buildQuiz(questions, mode, count, topic, group, moduleId);
    if (built.length === 0) {
      setReady(false);
      return;
    }
    setQuizQuestions(built);
    setReady(true);
    (async () => {
      try {
        const s = await db.createSession(mode, topic ?? null);
        setSessionId(s.id);
      } catch (e) {
        console.error('Failed to create session', e);
      }
    })();
  }, []);

  // Shuffle options when question changes
  useEffect(() => {
    if (quizQuestions[currentIndex]) {
      setShuffledOptions(shuffleOptions(quizQuestions[currentIndex]));
    }
  }, [currentIndex, quizQuestions]);

  const timeLimitMs = settings.timerEnabled ? settings.timerSeconds * 1000 : 0;

  const submitAnswer = useCallback(async (index: number | null, indices: number[] | null) => {
    if (locked || !currentQ || !shuffledOptions) return;
    setLocked(true);

    const timeTaken = Date.now() - startTime;
    let isCorrect: boolean;
    const timedOut = index === null && indices === null;

    if (isMulti && indices !== null) {
      // Multiple: correct if the selected set exactly matches the correct set
      const correctSet = new Set(shuffledOptions.correctIndices);
      const selectedSet = new Set(indices);
      isCorrect = correctSet.size === selectedSet.size && [...correctSet].every((i) => selectedSet.has(i));
    } else {
      isCorrect = index !== null && shuffledOptions.correctIndices.includes(index);
    }

    if (timerRef.current) clearInterval(timerRef.current);

    const newStreak = isCorrect ? streak + 1 : 0;
    const s = scoreAnswer({ correct: isCorrect, timeMs: timeTaken, timeLimitMs, streak: newStreak });

    setScore((prev) => prev + s.total);
    setStreak(newStreak);
    setMaxStreak((prev) => Math.max(prev, newStreak));
    if (isCorrect) setCorrectCount((prev) => prev + 1);
    setLastScoreGain(s);
    setSelected(index);
    setMultiSelected(indices ?? []);

    if (isCorrect) {
      if (settings.sounds) playCorrect();
      if (newStreak >= 3 && settings.sounds) setTimeout(() => playStreak(), 300);
    } else {
      if (settings.sounds) playWrong();
    }

    setAnswers((prev) => [...prev, { question: currentQ, selected: index, selectedIndices: indices, correct: isCorrect, timedOut }]);

    setTimeout(() => setShowExplanation(true), 600);

    // record answer + update question SR (non-blocking)
    (async () => {
      try {
        if (sessionId) {
          await db.recordAnswer({
            session_id: sessionId,
            question_id: currentQ.id,
            selected_index: index,
            selected_indices: indices,
            is_correct: isCorrect,
            timed_out: timedOut,
            time_taken_ms: timeTaken,
            answered_at: new Date().toISOString(),
          });
        }
        await db.applyAnswerToQuestion(currentQ, isCorrect, settings);
      } catch (e) {
        console.error('Failed to record answer', e);
      }
    })();
  }, [locked, currentQ, shuffledOptions, startTime, timeLimitMs, streak, sessionId, settings, isMulti]);

  const handleSingleAnswer = useCallback((index: number) => {
    if (locked) return;
    submitAnswer(index, null);
  }, [locked, submitAnswer]);

  const toggleMultiSelect = useCallback((i: number) => {
    if (locked) return;
    setMultiSelected((prev) => {
      if (prev.includes(i)) return prev.filter((x) => x !== i);
      return [...prev, i].sort((a, b) => a - b);
    });
  }, [locked]);

  const handleMultiSubmit = useCallback(() => {
    if (locked || multiSelected.length === 0) return;
    submitAnswer(null, multiSelected);
  }, [locked, multiSelected, submitAnswer]);

  const handleTimeout = useCallback(() => {
    submitAnswer(null, null);
  }, [submitAnswer]);

  // Timer
  useEffect(() => {
    if (!ready || locked || !settings.timerEnabled) return;
    setTimeLeft(settings.timerSeconds);
    setStartTime(Date.now());
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIndex, ready, settings.timerEnabled, settings.timerSeconds, locked, handleTimeout]);

  const handleNext = useCallback(async () => {
    if (currentIndex + 1 >= quizQuestions.length) {
      // quiz complete — navigate immediately, save in background
      const finalAnswers = answers;
      const finalCorrect = correctCount;
      const finalScore = score;
      const finalSessionId = sessionId;
      const oldLevel = state ? levelForXp(state.xp) : 1;
      const predictedLevelUp = state ? levelForXp(state.xp + score) > oldLevel : false;

      onQuizComplete({
        sessionId: finalSessionId ?? '',
        total: quizQuestions.length,
        correct: finalCorrect,
        xpEarned: finalScore,
        answers: finalAnswers,
        leveledUp: predictedLevelUp,
        newAchievements: [],
      });

      (async () => {
        try {
          if (finalSessionId) await db.completeSession(finalSessionId, quizQuestions.length, finalCorrect, finalScore);
          const result = await db.applyQuizCompletion(finalScore);
          // refresh will update state in context
        } catch (e) {
          console.error('Failed to complete quiz', e);
        }
      })();
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelected(null);
    setMultiSelected([]);
    setLocked(false);
    setShowExplanation(false);
    setLastScoreGain(null);
  }, [currentIndex, quizQuestions.length, correctCount, score, sessionId, answers, state, onQuizComplete]);

  if (!ready || !currentQ || !shuffledOptions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        {questions.length === 0 ? (
          <>
            <p className="text-slate-300 text-lg">No hay preguntas disponibles para este quiz.</p>
            <Button onClick={() => onNavigate('add')}>Agregar preguntas</Button>
          </>
        ) : (
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    );
  }

  const timePct = settings.timerEnabled ? (timeLeft / settings.timerSeconds) * 100 : 100;
  const timeColor = timePct > 50 ? '#22c55e' : timePct > 25 ? '#f59e0b' : '#ef4444';
  const correctSet = new Set(shuffledOptions.correctIndices);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header: progress + timer */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">Pregunta {currentIndex + 1} / {quizQuestions.length}</span>
            <div className="flex items-center gap-3">
              {streak >= 2 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-orange-400">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-bold">{streak}</span>
                </motion.div>
              )}
              <span className="text-sm font-semibold text-brand-400">{score.toLocaleString()} pts</span>
            </div>
          </div>
          <ProgressBar value={((currentIndex + 1) / quizQuestions.length) * 100} height="h-2.5" />
        </div>
        {settings.timerEnabled && (
          <div className="flex items-center gap-2 bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-700/50">
            <Clock className="w-4 h-4" style={{ color: timeColor }} />
            <span className="text-sm font-bold" style={{ color: timeColor }}>{Math.ceil(timeLeft)}s</span>
          </div>
        )}
      </div>

      {/* Timer bar */}
      {settings.timerEnabled && (
        <ProgressBar value={timePct} height="h-1.5" color={timeColor} />
      )}

      {/* Multi-answer hint */}
      {isMulti && !locked && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20">
          <ListChecks className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="text-sm text-brand-300">Selecciona todas las opciones correctas y luego confirma.</span>
        </div>
      )}

      {/* Score gain animation */}
      <AnimatePresence>
        {lastScoreGain && lastScoreGain.total > 0 && showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3"
          >
            <span className="text-2xl font-display font-bold text-success-400">+{lastScoreGain.total}</span>
            <div className="flex gap-2 text-xs">
              {lastScoreGain.base > 0 && <span className="text-slate-400">+{lastScoreGain.base} base</span>}
              {lastScoreGain.speedBonus > 0 && <span className="text-accent-400 flex items-center gap-0.5"><Zap className="w-3 h-3" />+{lastScoreGain.speedBonus}</span>}
              {lastScoreGain.streakBonus > 0 && <span className="text-orange-400 flex items-center gap-0.5"><Flame className="w-3 h-3" />+{lastScoreGain.streakBonus}</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
        >
          <Card className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-300 text-xs font-semibold">{currentQ.topic}</span>
              {currentQ.subtopic && <span className="px-2.5 py-1 rounded-lg bg-slate-700/50 text-slate-300 text-xs">{currentQ.subtopic}</span>}
              <span className="px-2.5 py-1 rounded-lg bg-slate-700/50 text-slate-400 text-xs">{currentQ.qid}</span>
              {isMulti && <span className="px-2.5 py-1 rounded-lg bg-accent-500/20 text-accent-300 text-xs font-semibold flex items-center gap-1"><ListChecks className="w-3 h-3" /> Múltiple</span>}
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-white leading-snug">{currentQ.question}</h2>
            {currentQ.question_image && (
              <img src={currentQ.question_image} alt="pregunta" className="mt-4 max-h-56 rounded-xl border border-slate-700/50 mx-auto" />
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {shuffledOptions.options.map((opt, i) => {
          const style = OPTION_STYLES[i % OPTION_STYLES.length];
          const isCorrectOpt = correctSet.has(i);
          const showResult = locked;
          const optImg = shuffledOptions.optionImages[i];

          let isPicked: boolean;
          if (isMulti) {
            isPicked = multiSelected.includes(i);
          } else {
            isPicked = selected === i;
          }

          let stateClass = `bg-gradient-to-br ${style.bg}`;
          if (showResult) {
            if (isCorrectOpt) stateClass = 'bg-gradient-to-br from-success-500 to-success-600 ring-2 ring-success-400';
            else if (isPicked) stateClass = 'bg-gradient-to-br from-error-500 to-error-600 ring-2 ring-error-400';
            else stateClass = 'bg-slate-700/40 opacity-50';
          } else if (isPicked) {
            stateClass = `bg-gradient-to-br ${style.bg} ring-2 ring-white/60`;
          }

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={!locked ? { scale: 1.02, y: -2 } : {}}
              whileTap={!locked ? { scale: 0.98 } : {}}
              onClick={() => isMulti ? toggleMultiSelect(i) : handleSingleAnswer(i)}
              disabled={locked}
              className={`relative flex items-center gap-3 p-4 md:p-5 rounded-2xl text-white text-left font-medium shadow-lg transition-all ${stateClass}`}
            >
              <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-display font-bold text-lg shrink-0">
                {style.text}
              </span>
              <div className="flex-1 min-w-0">
                {optImg && <img src={optImg} alt={`opción ${style.text}`} className="mb-2 max-h-24 rounded-lg border border-white/10" />}
                {opt && <span className="text-sm md:text-base block">{opt}</span>}
              </div>
              {showResult && isCorrectOpt && <Check className="w-6 h-6 text-white shrink-0" />}
              {showResult && isPicked && !isCorrectOpt && <X className="w-6 h-6 text-white shrink-0" />}
              {!showResult && isPicked && <Check className="w-5 h-5 text-white/80 shrink-0" />}
            </motion.button>
          );
        })}
      </div>

      {/* Confirm button for multi-answer */}
      {isMulti && !locked && (
        <Button size="lg" className="w-full" onClick={handleMultiSubmit} disabled={multiSelected.length === 0}>
          Confirmar respuesta ({multiSelected.length} seleccionada{multiSelected.length !== 1 ? 's' : ''})
        </Button>
      )}

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className={`p-5 border-2 ${locked && (isMulti ? arraysEqual(multiSelected, shuffledOptions.correctIndices) : selected !== null && correctSet.has(selected)) ? 'border-success-500/50 bg-success-500/5' : 'border-error-500/50 bg-error-500/5'}`}>
              <div className="flex items-center gap-2 mb-2">
                {isMulti
                  ? (arraysEqual(multiSelected, shuffledOptions.correctIndices)
                    ? <><Check className="w-5 h-5 text-success-400" /><span className="font-display font-bold text-success-400">¡Correcto!</span></>
                    : <><X className="w-5 h-5 text-error-400" /><span className="font-display font-bold text-error-400">{multiSelected.length === 0 ? 'Tiempo agotado' : 'Incorrecto'}</span></>)
                  : (selected !== null && correctSet.has(selected)
                    ? <><Check className="w-5 h-5 text-success-400" /><span className="font-display font-bold text-success-400">¡Correcto!</span></>
                    : <><X className="w-5 h-5 text-error-400" /><span className="font-display font-bold text-error-400">{selected === null ? 'Tiempo agotado' : 'Incorrecto'}</span></>)}
              </div>
              {!(isMulti ? arraysEqual(multiSelected, shuffledOptions.correctIndices) : selected !== null && correctSet.has(selected)) && (
                <p className="text-sm text-slate-300 mb-2">
                  Respuesta{shuffledOptions.correctIndices.length > 1 ? 's' : ''} correcta{shuffledOptions.correctIndices.length > 1 ? 's' : ''}:{' '}
                  <span className="font-semibold text-white">
                    {shuffledOptions.correctIndices.map((ci) => `${OPTION_STYLES[ci].text}. ${shuffledOptions.options[ci]}`).join('  ·  ')}
                  </span>
                </p>
              )}
              {currentQ.explanation && (
                <div className="flex items-start gap-2 mt-3 pt-3 border-t border-slate-700/50">
                  <Lightbulb className="w-5 h-5 text-accent-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}
            </Card>

            <Button size="lg" className="w-full" onClick={handleNext}>
              {currentIndex + 1 >= quizQuestions.length ? 'Ver resultados' : 'Siguiente pregunta'}
              <ChevronRight className="w-5 h-5 inline ml-1" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}
