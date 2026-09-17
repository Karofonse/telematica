import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Clock, Target, Flame, Award, ChevronRight, BarChart3 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { masteryLevel, masteryColor } from '@/lib/spaced-repetition';
import * as db from '@/lib/db';
import type { SessionAnswer, QuizSession } from '@/lib/types';
import type { Route } from '@/components/NavBar';

interface StatsProps {
  onNavigate: (r: Route) => void;
  onStartQuiz: (mode: 'smart' | 'errors' | 'topic') => void;
}

export function Stats({ onNavigate, onStartQuiz }: StatsProps) {
  const { questions, state } = useApp();
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [sessions, setSessions] = useState<QuizSession[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [a, s] = await Promise.all([db.fetchAllAnswers(), db.fetchAllSessions()]);
        setAnswers(a);
        setSessions(s);
      } catch (e) {
        console.error('Failed to load stats', e);
      }
    })();
  }, []);

  const overall = useMemo(() => {
    const total = answers.length;
    const correct = answers.filter((a) => a.is_correct).length;
    const incorrect = total - correct;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const avgTime = total > 0 ? Math.round(answers.reduce((sum, a) => sum + (a.time_taken_ms || 0), 0) / total / 1000) : 0;
    return { total, correct, incorrect, accuracy, avgTime };
  }, [answers]);

  // Day comparison
  const dayComparison = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const todayAnswers = answers.filter((a) => a.answered_at.slice(0, 10) === today);
    const yesterdayAnswers = answers.filter((a) => a.answered_at.slice(0, 10) === yesterday);

    const todayErrors = todayAnswers.filter((a) => !a.is_correct).length;
    const yesterdayErrors = yesterdayAnswers.filter((a) => !a.is_correct).length;

    const todayAcc = todayAnswers.length > 0 ? (todayAnswers.filter((a) => a.is_correct).length / todayAnswers.length) * 100 : 0;
    const yesterdayAcc = yesterdayAnswers.length > 0 ? (yesterdayAnswers.filter((a) => a.is_correct).length / yesterdayAnswers.length) * 100 : 0;

    const accDiff = todayAnswers.length > 0 && yesterdayAnswers.length > 0 ? todayAcc - yesterdayAcc : 0;
    const errorDiff = todayErrors - yesterdayErrors;

    return { todayErrors, yesterdayErrors, todayAcc, yesterdayAcc, accDiff, errorDiff, todayCount: todayAnswers.length, yesterdayCount: yesterdayAnswers.length };
  }, [answers]);

  // Per-topic performance
  const topicStats = useMemo(() => {
    const stats: Record<string, { correct: number; total: number }> = {};
    for (const q of questions) {
      if (!stats[q.topic]) stats[q.topic] = { correct: 0, total: 0 };
      stats[q.topic].correct += q.correct_count;
      stats[q.topic].total += q.total_count;
    }
    return Object.entries(stats)
      .map(([topic, s]) => ({ topic, ...s, acc: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [questions]);

  // Weakness detection
  const weaknesses = useMemo(() => {
    const weakTopics = topicStats.filter((t) => t.total >= 3 && t.acc < 65).sort((a, b) => a.acc - b.acc);

    const weakQuestions = questions
      .filter((q) => q.total_count >= 2 && (q.correct_count / q.total_count) < 0.5)
      .sort((a, b) => (a.correct_count / a.total_count) - (b.correct_count / b.total_count))
      .slice(0, 5);

    return { weakTopics, weakQuestions };
  }, [questions, topicStats]);

  const cards = [
    { label: 'Respondidas', value: overall.total, icon: BarChart3, color: 'text-brand-400' },
    { label: 'Correctas', value: overall.correct, icon: Target, color: 'text-success-400' },
    { label: 'Incorrectas', value: overall.incorrect, icon: AlertTriangle, color: 'text-error-400' },
    { label: 'Precisión', value: `${overall.accuracy}%`, icon: Award, color: 'text-accent-400' },
    { label: 'Tiempo prom.', value: `${overall.avgTime}s`, icon: Clock, color: 'text-purple-400' },
    { label: 'XP total', value: state?.xp.toLocaleString() ?? 0, icon: TrendingUp, color: 'text-brand-400' },
    { label: 'Racha', value: state?.streak ?? 0, icon: Flame, color: 'text-orange-400' },
    { label: 'Quizzes', value: sessions.filter((s) => s.completed_at).length, icon: Award, color: 'text-accent-400' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold text-white">Estadísticas</h1>

      {/* Overall cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-4">
                <Icon className={`w-5 h-5 ${c.color} mb-2`} />
                <div className="text-xl font-display font-bold text-white">{c.value}</div>
                <div className="text-xs text-slate-400">{c.label}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Day comparison */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-white mb-4">Comparación entre días</h3>
          {dayComparison.todayCount === 0 && dayComparison.yesterdayCount === 0 ? (
            <p className="text-slate-400 text-sm">Aún no hay datos suficientes para comparar. ¡Responde preguntas hoy y mañana!</p>
          ) : (
            <div className="space-y-3">
              {dayComparison.yesterdayCount > 0 && dayComparison.todayCount > 0 && (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40">
                    {dayComparison.accDiff > 0 ? (
                      <TrendingUp className="w-5 h-5 text-success-400 shrink-0" />
                    ) : dayComparison.accDiff < 0 ? (
                      <TrendingDown className="w-5 h-5 text-error-400 shrink-0" />
                    ) : (
                      <BarChart3 className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                    <p className="text-sm text-slate-300">
                      {dayComparison.accDiff > 0
                        ? `¡Has mejorado un ${Math.abs(Math.round(dayComparison.accDiff))}% respecto a ayer!`
                        : dayComparison.accDiff < 0
                        ? `Tu precisión bajó ${Math.abs(Math.round(dayComparison.accDiff))}% respecto a ayer.`
                        : 'Tu precisión se mantuvo igual que ayer.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40">
                    {dayComparison.errorDiff < 0 ? (
                      <TrendingUp className="w-5 h-5 text-success-400 shrink-0" />
                    ) : dayComparison.errorDiff > 0 ? (
                      <TrendingDown className="w-5 h-5 text-error-400 shrink-0" />
                    ) : (
                      <BarChart3 className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                    <p className="text-sm text-slate-300">
                      {dayComparison.errorDiff < 0
                        ? `Ayer tuviste ${dayComparison.yesterdayErrors} error(es) y hoy solo ${dayComparison.todayErrors}. ¡Vas mejorando!`
                        : dayComparison.errorDiff > 0
                        ? `Ayer tuviste ${dayComparison.yesterdayErrors} error(es) y hoy ${dayComparison.todayErrors}.`
                        : `Tuviste ${dayComparison.todayErrors} error(es) hoy, igual que ayer.`}
                    </p>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-800/40 text-center">
                  <div className="text-xs text-slate-400 mb-1">Ayer</div>
                  <div className="text-lg font-bold text-white">{dayComparison.yesterdayCount} resp.</div>
                  <div className="text-sm text-slate-400">{Math.round(dayComparison.yesterdayAcc)}% precisión</div>
                </div>
                <div className="p-3 rounded-xl bg-brand-500/10 text-center border border-brand-500/20">
                  <div className="text-xs text-brand-300 mb-1">Hoy</div>
                  <div className="text-lg font-bold text-white">{dayComparison.todayCount} resp.</div>
                  <div className="text-sm text-brand-300">{Math.round(dayComparison.todayAcc)}% precisión</div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Per-topic */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-white mb-4">Rendimiento por tema</h3>
          {topicStats.length === 0 ? (
            <p className="text-slate-400 text-sm">Aún no hay datos.</p>
          ) : (
            <div className="space-y-3">
              {topicStats.map((t) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300 font-medium">{t.topic}</span>
                    <span className="text-sm text-slate-400">{t.acc}% · {t.total} preg.</span>
                  </div>
                  <ProgressBar value={t.acc} height="h-2.5" color={t.acc >= 70 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : t.acc >= 50 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f97316)'} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Weaknesses */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="p-5 border-error-500/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-error-400" />
            <h3 className="font-display font-semibold text-white">Necesitas reforzar</h3>
          </div>
          {weaknesses.weakTopics.length === 0 && weaknesses.weakQuestions.length === 0 ? (
            <p className="text-slate-400 text-sm">¡Vas bien! No hay temas que necesiten refuerzo urgente.</p>
          ) : (
            <div className="space-y-4">
              {weaknesses.weakTopics.length > 0 && (
                <div>
                  <p className="text-sm text-slate-300 mb-2">
                    Tu principal dificultad está en <span className="font-semibold text-white">{weaknesses.weakTopics[0].topic}</span>.
                  </p>
                  <div className="space-y-2">
                    {weaknesses.weakTopics.map((t) => (
                      <div key={t.topic} className="flex items-center justify-between p-3 rounded-xl bg-error-500/5">
                        <span className="text-sm text-slate-300">{t.topic}</span>
                        <span className="text-error-400 font-semibold text-sm">{t.acc}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {weaknesses.weakQuestions.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 font-semibold mb-2">Preguntas problemáticas</div>
                  <div className="space-y-1.5">
                    {weaknesses.weakQuestions.map((q) => (
                      <div key={q.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
                        <span className="text-sm text-slate-300"><span className="text-slate-500 font-mono">{q.qid}</span> — {q.correct_count}/{q.total_count} correctas</span>
                        <span className="text-xs" style={{ color: masteryColor(masteryLevel(q)) }}>{masteryLevel(q) === 'weak' ? 'Por reforzar' : 'Débil'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button variant="danger" onClick={() => onStartQuiz('errors')}>
                Repasar estas preguntas <ChevronRight className="w-4 h-4 inline" />
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
