import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, Edit2, Trash2, BookOpen, ChevronDown, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { masteryLevel, masteryColor, masteryLabel } from '@/lib/spaced-repetition';
import { isMultipleChoice } from '@/lib/quiz-builder';
import * as db from '@/lib/db';
import { playClick } from '@/lib/sound';
import type { Question } from '@/lib/types';
import type { Route } from '@/components/NavBar';

interface BankProps {
  onNavigate: (r: Route) => void;
  onEdit: (q: Question) => void;
}

type FilterMode = 'all' | 'new' | 'weak' | 'strong' | 'correct' | 'incorrect';

export function QuestionBank({ onNavigate, onEdit }: BankProps) {
  const { questions, refresh, settings } = useApp();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [topicFilter, setTopicFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const topics = useMemo(() => Array.from(new Set(questions.map((q) => q.topic))).sort(), [questions]);

  const filtered = useMemo(() => {
    let result = questions;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((q) =>
        q.question.toLowerCase().includes(s) ||
        q.topic.toLowerCase().includes(s) ||
        q.subtopic.toLowerCase().includes(s) ||
        q.qid.toLowerCase().includes(s) ||
        q.options.some((o) => o.toLowerCase().includes(s)),
      );
    }
    if (topicFilter) result = result.filter((q) => q.topic === topicFilter);
    if (filterMode === 'new') result = result.filter((q) => q.total_count === 0);
    if (filterMode === 'weak') result = result.filter((q) => ['weak', 'none'].includes(masteryLevel(q)));
    if (filterMode === 'strong') result = result.filter((q) => ['mastered', 'strong'].includes(masteryLevel(q)));
    if (filterMode === 'correct') result = result.filter((q) => q.total_count > 0 && q.correct_count === q.total_count);
    if (filterMode === 'incorrect') result = result.filter((q) => q.total_count > 0 && q.correct_count < q.total_count);
    return result;
  }, [questions, search, filterMode, topicFilter]);

  const handleDelete = async (id: string) => {
    try {
      await db.deleteQuestion(id);
      await refresh();
      setConfirmDelete(null);
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const filterChips: { key: FilterMode; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'new', label: 'Nuevas' },
    { key: 'weak', label: 'Por reforzar' },
    { key: 'strong', label: 'Dominadas' },
    { key: 'correct', label: 'Correctas' },
    { key: 'incorrect', label: 'Incorrectas' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white">Banco de preguntas</h1>
          <p className="text-slate-400 mt-1">{questions.length} preguntas en total</p>
        </div>
        <Button onClick={() => onNavigate('add')}><Plus className="w-4 h-4 inline mr-1" /> Nueva pregunta</Button>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por pregunta, tema, ID..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <Button variant="secondary" onClick={() => setShowFilters((v) => !v)}>
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="p-4 space-y-3">
              <div>
                <div className="text-xs text-slate-400 mb-2 font-semibold">Estado</div>
                <div className="flex flex-wrap gap-2">
                  {filterChips.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setFilterMode(c.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterMode === c.key ? 'bg-brand-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              {topics.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 mb-2 font-semibold">Tema</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTopicFilter('')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${topicFilter === '' ? 'bg-brand-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                    >
                      Todos
                    </button>
                    {topics.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTopicFilter(t)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${topicFilter === t ? 'bg-brand-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question list */}
      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">{questions.length === 0 ? 'Aún no hay preguntas. ¡Crea la primera!' : 'No se encontraron preguntas con estos filtros.'}</p>
          {questions.length === 0 && <Button className="mt-4" onClick={() => onNavigate('add')}><Plus className="w-4 h-4 inline mr-1" /> Agregar pregunta</Button>}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((q, i) => {
            const m = masteryLevel(q);
            const color = masteryColor(m);
            const isExpanded = expanded === q.id;
            const acc = q.total_count > 0 ? Math.round((q.correct_count / q.total_count) * 100) : 0;
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
              >
                <Card className="overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : q.id)}
                    className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500">{q.qid}</span>
                        <span className="px-2 py-0.5 rounded-md bg-brand-500/15 text-brand-300 text-xs">{q.topic}</span>
                        {q.subtopic && <span className="px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-400 text-xs">{q.subtopic}</span>}
                        {isMultipleChoice(q) && <span className="px-2 py-0.5 rounded-md bg-accent-500/20 text-accent-300 text-xs font-semibold">Múltiple</span>}
                      </div>
                      <p className="text-sm text-white font-medium line-clamp-2">{q.question}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs" style={{ color }}>{masteryLabel(m)}</span>
                        {q.total_count > 0 && <span className="text-xs text-slate-500">{q.correct_count}/{q.total_count} ({acc}%)</span>}
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-2 border-t border-slate-700/50 mt-2">
                          {q.question_image && (
                            <img src={q.question_image} alt="pregunta" className="max-h-32 rounded-lg border border-slate-700/50 mb-2" />
                          )}
                          {q.options.map((opt, idx) => {
                            const isCorrect = isMultipleChoice(q) ? q.correct_indices.includes(idx) : idx === q.correct_index;
                            const optImg = q.option_images?.[idx];
                            return (
                              <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${isCorrect ? 'bg-success-500/15 text-success-300' : 'text-slate-400'}`}>
                                <span className="w-6 h-6 rounded-md bg-slate-700/50 flex items-center justify-center text-xs font-bold shrink-0">{String.fromCharCode(65 + idx)}</span>
                                <div className="flex-1 min-w-0">
                                  {optImg && <img src={optImg} alt={`opción ${String.fromCharCode(65 + idx)}`} className="mb-1 max-h-16 rounded border border-slate-700/50" />}
                                  {opt && <span>{opt}</span>}
                                </div>
                                {isCorrect && <span className="ml-auto text-xs font-semibold shrink-0">Correcta</span>}
                              </div>
                            );
                          })}
                          {q.explanation && (
                            <div className="p-3 rounded-lg bg-accent-500/10 text-sm text-slate-300">
                              <span className="font-semibold text-accent-400">Explicación: </span>{q.explanation}
                            </div>
                          )}
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="secondary" onClick={() => { playClick(); onEdit(q); }}><Edit2 className="w-4 h-4 inline mr-1" /> Editar</Button>
                            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(q.id)}><Trash2 className="w-4 h-4 inline mr-1" /> Eliminar</Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="max-w-sm w-full">
              <Card className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-error-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-error-400" />
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-2">¿Eliminar pregunta?</h3>
                <p className="text-slate-400 text-sm mb-5">Esta acción no se puede deshacer. Se perderá el historial de respuestas de esta pregunta.</p>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                  <Button variant="danger" className="flex-1" onClick={() => handleDelete(confirmDelete)}>Eliminar</Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
