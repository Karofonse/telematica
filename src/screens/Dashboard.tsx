import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Target, Brain, Zap, RotateCcw, TrendingUp, CheckCircle2, Lock, Layers, ChevronDown, FolderPlus, Pencil, FolderOpen, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ModuleForm } from '@/components/ModuleForm';
import { levelProgress } from '@/lib/spaced-repetition';
import { moduleColor, moduleIcon, modulePartStats, moduleQuestions, type PartStats } from '@/lib/modules';
import type { Route } from '@/components/NavBar';
import type { QuizMode, Module } from '@/lib/types';
import { playClick } from '@/lib/sound';

interface DashboardProps {
  onNavigate: (r: Route) => void;
  onStartQuiz: (mode: QuizMode, group?: number, moduleId?: string) => void;
}

function PartCard({ part, gradient, accentText, bar, delay, onStart }: { part: PartStats; gradient: string; accentText: string; bar: string; delay: number; onStart: () => void }) {
  const pct = part.total > 0 ? Math.round((part.mastered / part.total) * 100) : 0;
  const allMastered = part.mastered === part.total && part.total > 0;
  const hasProgress = part.answered > 0;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} whileHover={{ scale: 1.02, y: -2 }}>
      <Card className="p-5 cursor-pointer hover:border-brand-500/40 transition-all" onClick={() => { playClick(); onStart(); }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold font-display text-lg`}>
              {part.index}
            </div>
            <div>
              <div className="font-display font-bold text-white">Parte {part.index}</div>
              <div className="text-xs text-slate-400">{part.total} preguntas</div>
            </div>
          </div>
          {allMastered ? <CheckCircle2 className="w-6 h-6 text-success-400" /> : !hasProgress ? <Lock className="w-5 h-5 text-slate-600" /> : null}
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">{part.mastered} / {part.total} dominadas</span>
          <span className="text-xs font-semibold text-slate-300">{pct}%</span>
        </div>
        <ProgressBar
          value={pct}
          height="h-3"
          color={allMastered ? 'linear-gradient(90deg, #22c55e, #4ade80)' : pct > 50 ? bar : 'linear-gradient(90deg, #f59e0b, #f97316)'}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">{hasProgress ? `${part.correct} correctas de ${part.answered}` : 'Sin intentar'}</span>
          <span className={`text-xs font-semibold ${accentText} flex items-center gap-1`}><Zap className="w-3 h-3" /> Empezar</span>
        </div>
      </Card>
    </motion.div>
  );
}

interface ModuleFolderProps {
  module: Module;
  parts: PartStats[];
  delay: number;
  onStartQuiz: DashboardProps['onStartQuiz'];
  onEdit: () => void;
  onAddQuestion: () => void;
}

function ModuleFolder({ module, parts, delay, onStartQuiz, onEdit, onAddQuestion }: ModuleFolderProps) {
  const [open, setOpen] = useState(false);
  const c = moduleColor(module.color);
  const Icon = moduleIcon(module.icon);
  const total = parts.reduce((s, p) => s + p.total, 0);
  const mastered = parts.reduce((s, p) => s + p.mastered, 0);

  return (
    <div className="space-y-3">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={`flex items-center gap-2 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 ${c.border} transition-all`}>
        <button onClick={() => { playClick(); setOpen((v) => !v); }} className="flex-1 flex items-center justify-between text-left min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-white truncate">{module.name}</div>
              <div className="text-xs text-slate-400 truncate">
                {parts.length} {parts.length === 1 ? 'parte' : 'partes'} · {total} preguntas · {mastered} dominadas
                {module.description ? ` · ${module.description}` : ''}
              </div>
            </div>
          </div>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 ml-2">
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </button>
        <button onClick={(e) => { e.stopPropagation(); playClick(); onEdit(); }} title="Editar módulo" className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/60 transition-colors shrink-0">
          <Pencil className="w-4 h-4" />
        </button>
      </motion.div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-display font-semibold text-white">Partes del módulo</h3>
              <button onClick={() => { playClick(); onAddQuestion(); }} className={`text-xs font-semibold ${c.text} flex items-center gap-1 hover:underline`}>
                <Plus className="w-3.5 h-3.5" /> Agregar pregunta aquí
              </button>
            </div>
            {parts.length === 0 ? (
              <Card className="p-6 text-center mb-3">
                <p className="text-slate-400 text-sm">Este módulo todavía no tiene preguntas.</p>
                <Button size="sm" className="mt-3" onClick={() => { playClick(); onAddQuestion(); }}><Plus className="w-4 h-4 inline mr-1" /> Agregar la primera</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                {parts.map((p, i) => (
                  <PartCard
                    key={p.group}
                    part={p}
                    gradient={c.parts[i % c.parts.length]}
                    accentText={c.text}
                    bar={c.bar}
                    delay={0.05 + i * 0.05}
                    onStart={() => onStartQuiz('group', p.group)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {total > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 0.05 }}>
          <Card className={`p-6 bg-gradient-to-r ${c.banner} ${c.bannerBorder} cursor-pointer transition-all`} onClick={() => { playClick(); onStartQuiz('module', undefined, module.id); }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <motion.div whileHover={{ scale: 1.1, rotate: -5 }} className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <div className="font-display font-bold text-white text-lg">Quiz {module.name}</div>
                  <div className="text-sm text-slate-300">Examen final con todas las {total} preguntas revueltas</div>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${c.gradient} text-white font-semibold text-sm shadow-lg`}>
                <Zap className="w-4 h-4" /> Comenzar examen
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export function Dashboard({ onNavigate, onStartQuiz }: DashboardProps) {
  const { questions, modules, state, refresh } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);

  const partsByModule = useMemo(() => {
    const map: Record<string, PartStats[]> = {};
    for (const m of modules) map[m.id] = modulePartStats(questions, m.id);
    return map;
  }, [questions, modules]);

  const orphans = useMemo(() => moduleQuestions(questions, null), [questions]);

  const totals = useMemo(() => {
    const mastered = questions.filter((q) => q.consecutive_correct >= 3).length;
    const answered = questions.reduce((s, q) => s + q.total_count, 0);
    const correct = questions.reduce((s, q) => s + q.correct_count, 0);
    return { mastered, answered, correct, total: questions.length, accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0 };
  }, [questions]);

  const lp = state ? levelProgress(state.xp) : { level: 1, current: 0, needed: 500, pct: 0 };

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (m: Module) => { setEditing(m); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const goAddQuestion = (moduleId: string) => {
    try { sessionStorage.setItem('sq_preselect_module', moduleId); } catch { /* ignore */ }
    onNavigate('add');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white">StudyQuest</h1>
          <p className="text-slate-400 mt-1">{modules.length} {modules.length === 1 ? 'módulo' : 'módulos'} · {questions.length} preguntas</p>
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
          { label: 'Dominadas', value: totals.mastered, icon: Brain, color: 'text-success-400', bg: 'from-success-500/10' },
          { label: 'Precisión', value: `${totals.accuracy}%`, icon: Target, color: 'text-brand-400', bg: 'from-brand-500/10' },
          { label: 'Respondidas', value: totals.answered, icon: TrendingUp, color: 'text-accent-400', bg: 'from-accent-500/10' },
          { label: 'Total', value: totals.total, icon: Layers, color: 'text-purple-400', bg: 'from-purple-500/10' },
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

      {/* Modules */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display font-semibold text-white text-lg">Módulos</h2>
        <Button size="sm" variant="secondary" onClick={() => { playClick(); openCreate(); }}>
          <FolderPlus className="w-4 h-4 inline mr-1" /> Nuevo módulo
        </Button>
      </div>

      {modules.length === 0 && (
        <Card className="p-8 text-center">
          <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Aún no hay módulos. Crea el primero para organizar tus preguntas.</p>
          <Button className="mt-4" onClick={openCreate}><FolderPlus className="w-4 h-4 inline mr-1" /> Crear módulo</Button>
        </Card>
      )}

      {modules.map((m, i) => (
        <ModuleFolder
          key={m.id}
          module={m}
          parts={partsByModule[m.id] ?? []}
          delay={0.2 + i * 0.05}
          onStartQuiz={onStartQuiz}
          onEdit={() => openEdit(m)}
          onAddQuestion={() => goAddQuestion(m.id)}
        />
      ))}

      {orphans.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 flex items-center justify-between flex-wrap gap-3 border-dashed">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-700/60 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <div className="font-display font-bold text-white">Sin módulo</div>
                <div className="text-xs text-slate-400">{orphans.length} preguntas sin carpeta. Edítalas desde el banco para asignarlas.</div>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onNavigate('bank')}>Ir al banco</Button>
          </Card>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3 className="font-display font-semibold text-white mb-3 px-1">Acciones rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => { playClick(); onStartQuiz('smart'); }} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white font-semibold shadow-lg">
            <Zap className="w-6 h-6" />
            <span className="text-sm">Quiz inteligente</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => { playClick(); onStartQuiz('errors'); }} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-error-500 to-error-600 text-white font-semibold shadow-lg">
            <RotateCcw className="w-6 h-6" />
            <span className="text-sm">Repasar errores</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => { playClick(); onNavigate('stats'); }} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 text-white font-semibold shadow-lg">
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

      <AnimatePresence>
        {formOpen && (
          <ModuleForm
            module={editing}
            questionCount={editing ? moduleQuestions(questions, editing.id).length : 0}
            onClose={closeForm}
            onSaved={async () => { closeForm(); await refresh(); }}
            onDeleted={async () => { closeForm(); await refresh(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
