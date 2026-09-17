import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Home, RotateCcw, AlertCircle, Trophy, Flame, Sparkles, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { fireBigConfetti, fireConfetti } from '@/components/ui/Confetti';
import { playWin, playLevelUp } from '@/lib/sound';
import { useApp } from '@/context/AppContext';
import { masteryLevel } from '@/lib/spaced-repetition';
import type { Route } from '@/components/NavBar';
import type { QuizResult } from '@/screens/Quiz';

interface ResultsProps {
  result: QuizResult;
  onNavigate: (r: Route) => void;
  onRetry: () => void;
  onReviewErrors: () => void;
}

function getMotivationalMessage(accuracy: number): { title: string; message: string; color: string } {
  if (accuracy === 100) return { title: '¡Perfecto!', message: 'Respondiste todas las preguntas correctamente. ¡Excelente trabajo con este grupo!', color: 'text-success-400' };
  if (accuracy >= 80) return { title: '¡Muy bien!', message: 'Dominaste este grupo. Solo unos pocos detalles por pulir. ¡Sigue así!', color: 'text-success-400' };
  if (accuracy >= 60) return { title: 'Buen trabajo', message: 'Vas por buen camino con este grupo, pero repasa las preguntas que fallaste para dominarlas por completo.', color: 'text-amber-400' };
  if (accuracy >= 40) return { title: 'Repasa este grupo', message: 'Hay varios conceptos que necesitan refuerzo. Vuelve a intentarlo y presta atención a las explicaciones.', color: 'text-orange-400' };
  return { title: 'Sigue practicando', message: 'Este grupo necesita más repaso. No te desanimes, vuelve a intentarlo y aprenderás de cada error.', color: 'text-error-400' };
}

export function QuizResults({ result, onNavigate, onRetry, onReviewErrors }: ResultsProps) {
  const { settings } = useApp();

  const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const isPerfect = accuracy === 100 && result.total > 0;
  const motivation = getMotivationalMessage(accuracy);

  useEffect(() => {
    if (settings.sounds) {
      if (result.leveledUp) {
        setTimeout(() => playLevelUp(), 500);
        setTimeout(() => fireBigConfetti(), 300);
      } else if (isPerfect) {
        setTimeout(() => playWin(), 200);
        setTimeout(() => fireBigConfetti(), 200);
      } else if (accuracy >= 70) {
        setTimeout(() => fireConfetti(), 300);
      }
    } else {
      if (result.leveledUp || isPerfect) fireBigConfetti();
      else if (accuracy >= 70) fireConfetti();
    }
  }, []);

  const topicPerf = useMemo(() => {
    const stats: Record<string, { correct: number; total: number }> = {};
    for (const a of result.answers) {
      const t = a.question.topic;
      if (!stats[t]) stats[t] = { correct: 0, total: 0 };
      stats[t].total += 1;
      if (a.correct) stats[t].correct += 1;
    }
    const entries = Object.entries(stats).map(([t, s]) => ({ topic: t, acc: (s.correct / s.total) * 100, ...s }));
    const strong = entries.filter((e) => e.acc >= 70).sort((a, b) => b.acc - a.acc);
    const weak = entries.filter((e) => e.acc < 60).sort((a, b) => a.acc - b.acc);
    return { strong, weak };
  }, [result.answers]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center pt-4">
        {result.leveledUp && (
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3, type: 'spring' }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent-500 to-orange-500 text-white font-bold font-display mb-3 shadow-lg">
            <Star className="w-5 h-5" /> ¡NUEVO NIVEL!
          </motion.div>
        )}
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">¡Quiz terminado!</h1>
        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="mt-4 inline-flex flex-col items-center">
          <div className="text-5xl md:text-6xl font-display font-bold text-white">{result.correct} / {result.total}</div>
          <div className="text-2xl font-display font-bold text-brand-400 mt-1">{accuracy}%</div>
        </motion.div>
      </motion.div>

      {/* Motivational message */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="p-5 bg-gradient-to-r from-brand-500/10 to-accent-500/5 border-brand-500/20">
          <div className="flex items-start gap-3">
            <MessageCircle className={`w-6 h-6 ${motivation.color} shrink-0 mt-0.5`} />
            <div>
              <div className={`font-display font-bold ${motivation.color}`}>{motivation.title}</div>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">{motivation.message}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* XP earned */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="p-5 bg-gradient-to-r from-brand-500/15 to-accent-500/10 border-brand-500/30">
          <div className="flex items-center justify-around">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-accent-400" />
              <div>
                <div className="text-2xl font-display font-bold text-white">+{result.xpEarned.toLocaleString()}</div>
                <div className="text-xs text-slate-400">XP ganada</div>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-700/50" />
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" />
              <div>
                <div className="text-2xl font-display font-bold text-white">{result.answers.filter((a) => a.correct).length}</div>
                <div className="text-xs text-slate-400">Correctas</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Performance breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-white mb-4">Rendimiento</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success-500/10">
              <Check className="w-5 h-5 text-success-400" />
              <span className="text-success-300 font-semibold">{result.correct} correctas</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-error-500/10">
              <X className="w-5 h-5 text-error-400" />
              <span className="text-error-300 font-semibold">{result.total - result.correct} incorrectas</span>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={accuracy} height="h-3" color={accuracy >= 70 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 'linear-gradient(90deg, #ef4444, #f97316)'} />
          </div>
        </Card>
      </motion.div>

      {/* Strengths & weaknesses */}
      {(topicPerf.strong.length > 0 || topicPerf.weak.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid md:grid-cols-2 gap-4">
          {topicPerf.strong.length > 0 && (
            <Card className="p-5 border-success-500/30">
              <h4 className="font-display font-semibold text-success-400 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Tus puntos fuertes</h4>
              <div className="space-y-1.5">
                {topicPerf.strong.map((t) => (
                  <div key={t.topic} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{t.topic}</span>
                    <span className="text-success-400 font-semibold">{Math.round(t.acc)}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {topicPerf.weak.length > 0 && (
            <Card className="p-5 border-error-500/30">
              <h4 className="font-display font-semibold text-error-400 mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Necesitas reforzar</h4>
              <div className="space-y-1.5">
                {topicPerf.weak.map((t) => (
                  <div key={t.topic} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{t.topic}</span>
                    <span className="text-error-400 font-semibold">{Math.round(t.acc)}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>
      )}

      {/* New achievements */}
      {result.newAchievements.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
          <Card className="p-5 bg-gradient-to-r from-accent-500/15 to-brand-500/10 border-accent-500/30">
            <h4 className="font-display font-semibold text-accent-400 mb-2 flex items-center gap-2"><Trophy className="w-5 h-5" /> ¡Nuevos logros!</h4>
            <div className="flex flex-wrap gap-2">
              {result.newAchievements.map((a) => (
                <span key={a} className="px-3 py-1.5 rounded-lg bg-accent-500/20 text-accent-300 text-sm font-medium">{a.replace(/_/g, ' ')}</span>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex flex-col sm:flex-row gap-3 pb-8">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onRetry}>
          <RotateCcw className="w-5 h-5 inline mr-1" /> Repetir quiz
        </Button>
        {topicPerf.weak.length > 0 && (
          <Button variant="danger" size="lg" className="flex-1" onClick={onReviewErrors}>
            Repasar errores
          </Button>
        )}
        <Button variant="ghost" size="lg" className="flex-1" onClick={() => onNavigate('dashboard')}>
          <Home className="w-5 h-5 inline mr-1" /> Inicio
        </Button>
      </motion.div>
    </div>
  );
}
