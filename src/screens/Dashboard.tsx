import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Target, Brain, Zap, RotateCcw, TrendingUp, CheckCircle2, Lock, Layers, GraduationCap, ChevronDown, FolderOpen, Terminal, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { masteryLevel, levelProgress } from '@/lib/spaced-repetition';
import type { Route } from '@/components/NavBar';
import type { QuizMode } from '@/lib/types';
import { playClick } from '@/lib/sound';

interface DashboardProps {
  onNavigate: (r: Route) => void;
  onStartQuiz: (mode: QuizMode, group?: number) => void;
}

const GROUP_NAMES = [
  'Grupo 1',
  'Grupo 2',
  'Grupo 3',
  'Grupo 4',
  'Grupo 5',
  'Grupo 6',
];

const LINUX_GROUP_NAMES = [
  'Linux - Parte 1',
  'Linux - Parte 2',
  'Linux - Parte 3',
  'Linux - Parte 4',
  'Linux - Parte 5',
  'Linux - Parte 6',
  'Linux - Parte 7',
  'Linux - Parte 8',
  'Linux - Parte 9',
  'Linux - Parte 10',
];

const GROUP_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-500',
  'from-violet-500 to-purple-500',
];

const LINUX_GROUP_COLORS = [
  'from-slate-500 to-slate-700',
  'from-zinc-500 to-zinc-700',
  'from-stone-500 to-stone-700',
  'from-gray-500 to-gray-700',
  'from-neutral-500 to-neutral-700',
  'from-slate-600 to-slate-800',
  'from-zinc-600 to-zinc-800',
  'from-stone-600 to-stone-800',
  'from-gray-600 to-gray-800',
  'from-neutral-600 to-neutral-800',
];

const PARCIAL1_GROUP_NAMES = [
  'Parcial 1 - Parte 1',
  'Parcial 1 - Parte 2',
  'Parcial 1 - Parte 3',
  'Parcial 1 - Parte 4',
  'Parcial 1 - Parte 5',
];

const PARCIAL1_GROUP_COLORS = [
  'from-sky-500 to-blue-600',
  'from-cyan-500 to-sky-600',
  'from-blue-500 to-indigo-600',
  'from-indigo-500 to-blue-600',
  'from-teal-500 to-cyan-600',
];

export function Dashboard({ onNavigate, onStartQuiz }: DashboardProps) {
  const { questions, state } = useApp();
  const [moduleOpen, setModuleOpen] = useState(false);
  const [linuxOpen, setLinuxOpen] = useState(false);
  const [parcial1Open, setParcial1Open] = useState(false);

  const groupStats = useMemo(() => {
    const groups: { group: number; total: number; mastered: number; answered: number; correct: number }[] = [];
    for (let g = 1; g <= 6; g++) {
      const gq = questions.filter((q) => q.group_number === g);
      const mastered = gq.filter((q) => {
        const m = masteryLevel(q);
        return m === 'mastered' || m === 'strong';
      }).length;
      const answered = gq.reduce((sum, q) => sum + q.total_count, 0);
      const correct = gq.reduce((sum, q) => sum + q.correct_count, 0);
      groups.push({ group: g, total: gq.length, mastered, answered, correct });
    }
    return groups;
  }, [questions]);

  const linuxGroupStats = useMemo(() => {
    const groups: { group: number; total: number; mastered: number; answered: number; correct: number }[] = [];
    for (let g = 7; g <= 16; g++) {
      const gq = questions.filter((q) => q.group_number === g);
      const mastered = gq.filter((q) => {
        const m = masteryLevel(q);
        return m === 'mastered' || m === 'strong';
      }).length;
      const answered = gq.reduce((sum, q) => sum + q.total_count, 0);
      const correct = gq.reduce((sum, q) => sum + q.correct_count, 0);
      groups.push({ group: g, total: gq.length, mastered, answered, correct });
    }
    return groups;
  }, [questions]);

  const parcial1GroupStats = useMemo(() => {
    const groups: { group: number; total: number; mastered: number; answered: number; correct: number }[] = [];
    for (let g = 17; g <= 21; g++) {
      const gq = questions.filter((q) => q.group_number === g);
      const mastered = gq.filter((q) => {
        const m = masteryLevel(q);
        return m === 'mastered' || m === 'strong';
      }).length;
      const answered = gq.reduce((sum, q) => sum + q.total_count, 0);
      const correct = gq.reduce((sum, q) => sum + q.correct_count, 0);
      groups.push({ group: g, total: gq.length, mastered, answered, correct });
    }
    return groups;
  }, [questions]);

  const totalMastered = groupStats.reduce((s, g) => s + g.mastered, 0);
  const modQuestions = questions.filter((q) => q.group_number >= 1 && q.group_number <= 6);
  const linuxQuestions = questions.filter((q) => q.group_number >= 7 && q.group_number <= 16);
  const parcial1Questions = questions.filter((q) => q.group_number >= 17 && q.group_number <= 21);
  const parcial1Total = parcial1Questions.length;
  const parcial1Mastered = parcial1GroupStats.reduce((s, g) => s + g.mastered, 0);
  const totalQuestions = modQuestions.length;
  const linuxTotal = linuxQuestions.length;
  const linuxMastered = linuxGroupStats.reduce((s, g) => s + g.mastered, 0);
  const totalAnswered = groupStats.reduce((s, g) => s + g.answered, 0);
  const totalCorrect = groupStats.reduce((s, g) => s + g.correct, 0);
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const lp = state ? levelProgress(state.xp) : { level: 1, current: 0, needed: 500, pct: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white">StudyQuest</h1>
          <p className="text-slate-400 mt-1">Módulos 14 y 15 — Capa de transporte y aplicación</p>
        </div>
        {state && (
          <div className="flex items-center gap-3 bg-slate-800/60 rounded-2xl px-4 py-2.5 border border-slate-700/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold font-display">{lp.level}</div>
            <div>
              <div className="text-xs text-slate-400">Nivel {lp.level}</div>
              <div className="text-sm font-semibold text-white">{state.xp.toLocaleString()} XP</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Streak banner */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className="p-5 bg-gradient-to-r from-orange-500/20 to-red-500/10 border-orange-500/30">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/40">
                <Flame className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <div className="text-2xl font-display font-bold text-white">{state?.streak ?? 0} días seguidos</div>
                <div className="text-sm text-orange-200/70">Mejor racha: {state?.best_streak ?? 0} días</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <div key={d} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${(state?.streak ?? 0) >= d ? 'bg-orange-500 text-white' : 'bg-slate-700/50 text-slate-500'}`}>
                  {d}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Dominadas', value: totalMastered, icon: Brain, color: 'text-success-400', bg: 'from-success-500/10' },
          { label: 'Precisión', value: `${accuracy}%`, icon: Target, color: 'text-brand-400', bg: 'from-brand-500/10' },
          { label: 'Respondidas', value: totalAnswered, icon: TrendingUp, color: 'text-accent-400', bg: 'from-accent-500/10' },
          { label: 'Total', value: totalQuestions, icon: Layers, color: 'text-purple-400', bg: 'from-purple-500/10' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
              <Card className={`p-4 bg-gradient-to-br ${s.bg} to-transparent`}>
                <Icon className={`w-6 h-6 ${s.color} mb-2`} />
                <div className="text-2xl font-display font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Module folder */}
      <div>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          onClick={() => { playClick(); setModuleOpen((v) => !v); }}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:border-brand-500/40 transition-all mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-lg">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-white">Módulo 14 y 15</div>
              <div className="text-xs text-slate-400">6 grupos · {totalQuestions} preguntas · {totalMastered} dominadas</div>
            </div>
          </div>
          <motion.div animate={{ rotate: moduleOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </motion.button>

        <AnimatePresence initial={false}>
          {moduleOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <h3 className="font-display font-semibold text-white mb-3 px-1">Grupos de preguntas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupStats.map((gs, i) => {
            const pct = gs.total > 0 ? Math.round((gs.mastered / gs.total) * 100) : 0;
            const allMastered = gs.mastered === gs.total && gs.total > 0;
            const hasProgress = gs.answered > 0;
            return (
              <motion.div
                key={gs.group}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Card className="p-5 cursor-pointer hover:border-brand-500/40 transition-all" onClick={() => { playClick(); onStartQuiz('group', gs.group); }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${GROUP_COLORS[i]} flex items-center justify-center text-white font-bold font-display text-lg`}>
                        {gs.group}
                      </div>
                      <div>
                        <div className="font-display font-bold text-white">{GROUP_NAMES[i]}</div>
                        <div className="text-xs text-slate-400">{gs.total} preguntas</div>
                      </div>
                    </div>
                    {allMastered ? (
                      <CheckCircle2 className="w-6 h-6 text-success-400" />
                    ) : !hasProgress ? (
                      <Lock className="w-5 h-5 text-slate-600" />
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">{gs.mastered} / {gs.total} dominadas</span>
                    <span className="text-xs font-semibold text-slate-300">{pct}%</span>
                  </div>
                  <ProgressBar
                    value={pct}
                    height="h-3"
                    color={allMastered ? 'linear-gradient(90deg, #22c55e, #4ade80)' : pct > 50 ? 'linear-gradient(90deg, #3b82f6, #06b6d4)' : 'linear-gradient(90deg, #f59e0b, #f97316)'}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {hasProgress ? `${gs.correct} correctas de ${gs.answered}` : 'Sin intentar'}
                    </span>
                    <span className="text-xs font-semibold text-brand-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Empezar
                    </span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Final quiz banner - Modulo 14 y 15 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <Card className="p-6 bg-gradient-to-r from-brand-500/20 via-accent-500/15 to-purple-500/20 border-brand-500/30 cursor-pointer hover:border-brand-500/50 transition-all" onClick={() => { playClick(); onStartQuiz('module', 1); }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.1, rotate: -5 }} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/40">
                <GraduationCap className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <div className="font-display font-bold text-white text-lg">Quiz Módulo 14 y 15</div>
                <div className="text-sm text-slate-300">Examen final con todas las {totalQuestions} preguntas revueltas</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-500 text-white font-semibold text-sm shadow-lg">
              <Zap className="w-4 h-4" /> Comenzar examen
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Linux folder */}
      <div>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => { playClick(); setLinuxOpen((v) => !v); }}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:border-emerald-500/40 transition-all mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-slate-700 flex items-center justify-center shadow-lg">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-white">Linux</div>
              <div className="text-xs text-slate-400">10 grupos · {linuxTotal} preguntas · {linuxMastered} dominadas</div>
            </div>
          </div>
          <motion.div animate={{ rotate: linuxOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </motion.button>

        <AnimatePresence initial={false}>
          {linuxOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {linuxGroupStats.map((gs, i) => {
                  const pct = gs.total > 0 ? Math.round((gs.mastered / gs.total) * 100) : 0;
                  const allMastered = gs.mastered === gs.total && gs.total > 0;
                  const hasProgress = gs.answered > 0;
                  return (
                    <motion.div
                      key={gs.group}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <Card className="p-5 cursor-pointer hover:border-emerald-500/40 transition-all" onClick={() => { playClick(); onStartQuiz('group', gs.group); }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${LINUX_GROUP_COLORS[i]} flex items-center justify-center text-white font-bold font-display text-lg`}>
                              {i + 1}
                            </div>
                            <div>
                              <div className="font-display font-bold text-white">{LINUX_GROUP_NAMES[i]}</div>
                              <div className="text-xs text-slate-400">{gs.total} preguntas</div>
                            </div>
                          </div>
                          {allMastered ? (
                            <CheckCircle2 className="w-6 h-6 text-success-400" />
                          ) : !hasProgress ? (
                            <Lock className="w-5 h-5 text-slate-600" />
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">{gs.mastered} / {gs.total} dominadas</span>
                          <span className="text-xs font-semibold text-slate-300">{pct}%</span>
                        </div>
                        <ProgressBar
                          value={pct}
                          height="h-3"
                          color={allMastered ? 'linear-gradient(90deg, #22c55e, #4ade80)' : pct > 50 ? 'linear-gradient(90deg, #10b981, #06b6d4)' : 'linear-gradient(90deg, #f59e0b, #f97316)'}
                        />
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {hasProgress ? `${gs.correct} correctas de ${gs.answered}` : 'Sin intentar'}
                          </span>
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Empezar
                          </span>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Linux final quiz banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="p-6 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-slate-600/20 border-emerald-500/30 cursor-pointer hover:border-emerald-500/50 transition-all" onClick={() => { playClick(); onStartQuiz('module', 2); }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.1, rotate: -5 }} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-slate-700 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <Terminal className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <div className="font-display font-bold text-white text-lg">Quiz Linux</div>
                <div className="text-sm text-slate-300">Examen final con todas las {linuxTotal} preguntas de Linux revueltas</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-slate-700 text-white font-semibold text-sm shadow-lg">
              <Zap className="w-4 h-4" /> Comenzar examen
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Parcial 1 folder */}
      <div>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => { playClick(); setParcial1Open((v) => !v); }}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:border-sky-500/40 transition-all mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-white">Parcial 1</div>
              <div className="text-xs text-slate-400">5 grupos · {parcial1Total} preguntas · {parcial1Mastered} dominadas</div>
            </div>
          </div>
          <motion.div animate={{ rotate: parcial1Open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </motion.button>

        <AnimatePresence initial={false}>
          {parcial1Open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parcial1GroupStats.map((gs, i) => {
                  const pct = gs.total > 0 ? Math.round((gs.mastered / gs.total) * 100) : 0;
                  const allMastered = gs.mastered === gs.total && gs.total > 0;
                  const hasProgress = gs.answered > 0;
                  return (
                    <motion.div
                      key={gs.group}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <Card className="p-5 cursor-pointer hover:border-sky-500/40 transition-all" onClick={() => { playClick(); onStartQuiz('group', gs.group); }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${PARCIAL1_GROUP_COLORS[i]} flex items-center justify-center text-white font-bold font-display text-lg`}>
                              {i + 1}
                            </div>
                            <div>
                              <div className="font-display font-bold text-white">{PARCIAL1_GROUP_NAMES[i]}</div>
                              <div className="text-xs text-slate-400">{gs.total} preguntas</div>
                            </div>
                          </div>
                          {allMastered ? (
                            <CheckCircle2 className="w-6 h-6 text-success-400" />
                          ) : !hasProgress ? (
                            <Lock className="w-5 h-5 text-slate-600" />
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">{gs.mastered} / {gs.total} dominadas</span>
                          <span className="text-xs font-semibold text-slate-300">{pct}%</span>
                        </div>
                        <ProgressBar
                          value={pct}
                          height="h-3"
                          color={allMastered ? 'linear-gradient(90deg, #22c55e, #4ade80)' : pct > 50 ? 'linear-gradient(90deg, #0ea5e9, #06b6d4)' : 'linear-gradient(90deg, #f59e0b, #f97316)'}
                        />
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {hasProgress ? `${gs.correct} correctas de ${gs.answered}` : 'Sin intentar'}
                          </span>
                          <span className="text-xs font-semibold text-sky-400 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Empezar
                          </span>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Parcial 1 final quiz banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <Card className="p-6 bg-gradient-to-r from-sky-500/20 via-blue-500/15 to-indigo-500/20 border-sky-500/30 cursor-pointer hover:border-sky-500/50 transition-all" onClick={() => { playClick(); onStartQuiz('module', 3); }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.1, rotate: -5 }} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/40">
                <FileText className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <div className="font-display font-bold text-white text-lg">Quiz Parcial 1</div>
                <div className="text-sm text-slate-300">Examen final con todas las {parcial1Total} preguntas del Parcial 1 revueltas</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm shadow-lg">
              <Zap className="w-4 h-4" /> Comenzar examen
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3 className="font-display font-semibold text-white mb-3 px-1">Acciones rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { playClick(); onStartQuiz('smart'); }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white font-semibold shadow-lg"
          >
            <Zap className="w-6 h-6" />
            <span className="text-sm">Quiz inteligente</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { playClick(); onStartQuiz('errors'); }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-error-500 to-error-600 text-white font-semibold shadow-lg"
          >
            <RotateCcw className="w-6 h-6" />
            <span className="text-sm">Repasar errores</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { playClick(); onNavigate('stats'); }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 text-white font-semibold shadow-lg"
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-sm">Ver progreso</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Level progress */}
      {state && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-semibold text-white">Nivel {lp.level}</span>
              <span className="text-sm text-slate-400">{lp.current.toLocaleString()} / {lp.needed.toLocaleString()} XP</span>
            </div>
            <ProgressBar value={lp.pct} height="h-4" color="linear-gradient(90deg, #f59e0b, #fbbf24)" />
          </Card>
        </motion.div>
      )}
    </div>
  );
}
