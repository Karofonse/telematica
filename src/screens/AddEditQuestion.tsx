import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Save, ListChecks, CircleDot, Plus, Trash2, Image as ImageIcon, X, FolderPlus, Folder } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { ModuleForm } from '@/components/ModuleForm';
import { modulePartOptions, moduleColor, moduleIcon } from '@/lib/modules';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import * as db from '@/lib/db';
import { isMultipleChoice } from '@/lib/quiz-builder';
import type { Question, Difficulty } from '@/lib/types';
import type { Route } from '@/components/NavBar';

interface AddEditProps {
  editQuestion?: Question | null;
  onNavigate: (r: Route) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const OPTION_COLORS = [
  'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
  'from-amber-500/20 to-orange-600/10 border-amber-500/30',
  'from-pink-500/20 to-pink-600/10 border-pink-500/30',
  'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
];

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

export function AddEditQuestion({ editQuestion, onNavigate }: AddEditProps) {
  const { refresh, modules, questions } = useApp();
  const isEdit = !!editQuestion;

  // ---- Module (folder) + part ----
  const [moduleId, setModuleId] = useState<string>(() => {
    try { return sessionStorage.getItem('sq_preselect_module') ?? ''; } catch { return ''; }
  });
  useEffect(() => {
    try { sessionStorage.removeItem('sq_preselect_module'); } catch { /* ignore */ }
  }, []);
  // '' = new part, otherwise the existing group_number as string
  const [partChoice, setPartChoice] = useState<string>('');
  const [moduleFormOpen, setModuleFormOpen] = useState(false);

  const [question, setQuestion] = useState('');
  const [questionImage, setQuestionImage] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [optionImages, setOptionImages] = useState<string[]>(['', '', '', '']);
  const [multiAnswer, setMultiAnswer] = useState(false);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [correctIndices, setCorrectIndices] = useState<number[]>([0]);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editQuestion) {
      setModuleId(editQuestion.module_id ?? '');
      setPartChoice(String(editQuestion.group_number));
      setQuestion(editQuestion.question);
      setQuestionImage(editQuestion.question_image ?? '');
      setTopic(editQuestion.topic);
      setSubtopic(editQuestion.subtopic);
      setOptions(editQuestion.options);
      setOptionImages(editQuestion.option_images ?? editQuestion.options.map(() => ''));
      setExplanation(editQuestion.explanation);
      setDifficulty(editQuestion.difficulty);
      if (isMultipleChoice(editQuestion)) {
        setMultiAnswer(true);
        setCorrectIndices(editQuestion.correct_indices);
        setCorrectIndex(editQuestion.correct_indices[0] ?? 0);
      } else {
        setMultiAnswer(false);
        setCorrectIndex(editQuestion.correct_index);
        setCorrectIndices([editQuestion.correct_index]);
      }
    }
  }, [editQuestion]);

  const filledOptions = options.filter((o) => o.trim());
  const canSave = question.trim() && topic.trim() && filledOptions.length >= MIN_OPTIONS && (multiAnswer ? correctIndices.length >= 1 : true);

  const selectedModule = modules.find((m) => m.id === moduleId) ?? null;
  const partOptions = moduleId ? modulePartOptions(questions, moduleId) : [];
  const PART_SIZE = 10;
  const lastPart = partOptions[partOptions.length - 1];
  const lastPartFull = lastPart ? lastPart.count >= PART_SIZE : true;

  // When the module changes (and we're not editing that same question), pick a sensible default part:
  // the last part if it still has room, otherwise a new part.
  useEffect(() => {
    if (editQuestion && editQuestion.module_id === moduleId) {
      setPartChoice(String(editQuestion.group_number));
      return;
    }
    const opts = moduleId ? modulePartOptions(questions, moduleId) : [];
    const last = opts[opts.length - 1];
    setPartChoice(last && last.count < PART_SIZE ? String(last.group) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  // Auto-fill topic with the module name when empty
  useEffect(() => {
    if (selectedModule && !topic.trim() && !isEdit) setTopic(selectedModule.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModule?.id]);

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions([...options, '']);
    setOptionImages([...optionImages, '']);
  };

  const removeOption = (i: number) => {
    if (options.length <= MIN_OPTIONS) return;
    const nextOpts = options.filter((_, idx) => idx !== i);
    const nextImgs = optionImages.filter((_, idx) => idx !== i);
    setOptions(nextOpts);
    setOptionImages(nextImgs);
    // fix correct indices
    if (multiAnswer) {
      setCorrectIndices((prev) => {
        const filtered = prev.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x));
        return filtered.length > 0 ? filtered : [0];
      });
    } else {
      if (correctIndex === i) setCorrectIndex(0);
      else if (correctIndex > i) setCorrectIndex(correctIndex - 1);
      setCorrectIndices([correctIndex === i ? 0 : correctIndex > i ? correctIndex - 1 : correctIndex]);
    }
  };

  const toggleMultiCorrect = (i: number) => {
    setCorrectIndices((prev) => {
      if (prev.includes(i)) {
        const next = prev.filter((x) => x !== i);
        return next.length > 0 ? next : prev;
      }
      return [...prev, i].sort((a, b) => a - b);
    });
  };

  const handleSave = async () => {
    if (!canSave) {
      setError('Completa la pregunta, el tema y al menos 2 opciones.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const finalCorrectIndices = multiAnswer ? correctIndices : [correctIndex];
      const finalCorrectIndex = finalCorrectIndices[0] ?? 0;
      const finalModuleId = moduleId || null;
      let groupNumber: number;
      if (partChoice) {
        groupNumber = parseInt(partChoice, 10);
      } else if (finalModuleId) {
        groupNumber = await db.nextGroupNumber();
      } else {
        groupNumber = editQuestion?.group_number ?? 1;
      }
      if (isEdit && editQuestion) {
        await db.updateQuestion(editQuestion.id, {
          module_id: finalModuleId,
          group_number: groupNumber,
          question: question.trim(),
          question_image: questionImage,
          topic: topic.trim(),
          subtopic: subtopic.trim(),
          options: options.map((o) => o.trim()),
          option_images: optionImages,
          correct_index: finalCorrectIndex,
          correct_indices: finalCorrectIndices,
          explanation: explanation.trim(),
          difficulty,
        });
      } else {
        await db.createQuestion({
          module_id: finalModuleId,
          group_number: groupNumber,
          question: question.trim(),
          question_image: questionImage,
          topic: topic.trim(),
          subtopic: subtopic.trim(),
          options: options.map((o) => o.trim()),
          option_images: optionImages,
          correct_index: finalCorrectIndex,
          correct_indices: finalCorrectIndices,
          explanation: explanation.trim(),
          difficulty,
        });
      }
      await refresh();
      onNavigate('bank');
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate('bank')} className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white">{isEdit ? 'Editar pregunta' : 'Nueva pregunta'}</h1>
      </div>

      {/* Module + part */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-1.5"><Folder className="w-4 h-4" /> Módulo (carpeta)</label>
            <button onClick={() => setModuleFormOpen(true)} className="text-xs font-semibold text-brand-400 hover:underline flex items-center gap-1">
              <FolderPlus className="w-3.5 h-3.5" /> Crear módulo nuevo
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setModuleId('')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${moduleId === '' ? 'bg-slate-600 text-white ring-2 ring-slate-400/50' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
            >
              Sin módulo
            </button>
            {modules.map((m) => {
              const c = moduleColor(m.color);
              const Icon = moduleIcon(m.icon);
              const active = moduleId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModuleId(m.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${active ? `bg-gradient-to-r ${c.gradient} text-white shadow-lg` : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                >
                  <Icon className="w-4 h-4" /> {m.name}
                </button>
              );
            })}
          </div>

          {moduleId && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Parte dentro del módulo</label>
              <div className="flex flex-wrap gap-2">
                {partOptions.map((p) => {
                  const active = partChoice === String(p.group);
                  const full = p.count >= PART_SIZE && !(editQuestion && editQuestion.group_number === p.group);
                  return (
                    <button
                      key={p.group}
                      type="button"
                      onClick={() => setPartChoice(String(p.group))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-brand-500 text-white' : full ? 'bg-slate-800/60 text-slate-500 hover:bg-slate-700' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {p.label} <span className="opacity-70">({p.count})</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setPartChoice('')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${partChoice === '' ? 'bg-brand-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                >
                  <Plus className="w-3.5 h-3.5" /> Nueva parte {partOptions.length + 1}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {partChoice === ''
                  ? 'Se creará una parte nueva con esta pregunta.'
                  : lastPartFull && partChoice === String(lastPart?.group)
                    ? `Esta parte ya tiene ${lastPart?.count} preguntas (se recomiendan ${PART_SIZE} por parte).`
                    : `La pregunta se agregará a esta parte.`}
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Question */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
        <Card className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Pregunta *</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="Escribe tu pregunta aquí..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 resize-none"
            />
          </div>
          {/* Question image URL */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> Imagen de la pregunta (opcional)
            </label>
            {questionImage ? (
              <div className="relative inline-block">
                <img src={questionImage} alt="pregunta" className="max-h-40 rounded-xl border border-slate-700/50" />
                <button onClick={() => setQuestionImage('')} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error-500 text-white flex items-center justify-center shadow-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <input
                value={questionImage}
                onChange={(e) => setQuestionImage(e.target.value)}
                placeholder="Pega aquí la URL de una imagen..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 text-sm"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Tema *</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: Física moderna"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Subtema</label>
              <input
                value={subtopic}
                onChange={(e) => setSubtopic(e.target.value)}
                placeholder="Ej: Relatividad"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Answer type toggle */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-200">Tipo de respuesta</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {multiAnswer ? 'Selecciona todas las respuestas correctas' : 'Una sola respuesta correcta'}
              </div>
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-slate-700/50">
              <button
                onClick={() => { setMultiAnswer(false); setCorrectIndices([correctIndex]); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!multiAnswer ? 'bg-brand-500 text-white' : 'text-slate-400'}`}
              >
                <CircleDot className="w-4 h-4" /> Única
              </button>
              <button
                onClick={() => { setMultiAnswer(true); setCorrectIndices([correctIndex]); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${multiAnswer ? 'bg-brand-500 text-white' : 'text-slate-400'}`}
              >
                <ListChecks className="w-4 h-4" /> Múltiple
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Options */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-300">
              {multiAnswer ? 'Respuestas * — marca todas las correctas' : 'Respuestas * — selecciona la correcta'}
            </div>
            <span className="text-xs text-slate-500">{options.length}/{MAX_OPTIONS} opciones</span>
          </div>
          {options.map((opt, i) => {
            const isCorrect = multiAnswer ? correctIndices.includes(i) : correctIndex === i;
            return (
              <div
                key={i}
                className={`p-3 rounded-xl border bg-gradient-to-r ${OPTION_COLORS[i % OPTION_COLORS.length]} ${isCorrect ? 'ring-2 ring-success-500/50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (multiAnswer) {
                        toggleMultiCorrect(i);
                      } else {
                        setCorrectIndex(i);
                        setCorrectIndices([i]);
                      }
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold shrink-0 transition-all ${isCorrect ? 'bg-success-500 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'}`}
                  >
                    {isCorrect ? <Check className="w-5 h-5" /> : LETTERS[i]}
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                    placeholder={`Opción ${LETTERS[i]}`}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
                  />
                  {options.length > MIN_OPTIONS && (
                    <button onClick={() => removeOption(i)} className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:text-error-400 hover:bg-error-500/10 transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {/* Option image URL */}
                <div className="mt-2 pl-13">
                  {optionImages[i] ? (
                    <div className="relative inline-block">
                      <img src={optionImages[i]} alt={`opción ${LETTERS[i]}`} className="max-h-24 rounded-lg border border-slate-700/50" />
                      <button onClick={() => { const next = [...optionImages]; next[i] = ''; setOptionImages(next); }} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-error-500 text-white flex items-center justify-center shadow-lg">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <input
                        value={optionImages[i] ?? ''}
                        onChange={(e) => {
                          const next = [...optionImages];
                          while (next.length <= i) next.push('');
                          next[i] = e.target.value;
                          setOptionImages(next);
                        }}
                        placeholder="URL de imagen (opcional)"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {options.length < MAX_OPTIONS && (
            <button onClick={addOption} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-600/50 text-slate-400 hover:text-white hover:border-brand-500/50 transition-all flex items-center justify-center gap-2 text-sm font-medium">
              <Plus className="w-4 h-4" /> Agregar opción
            </button>
          )}
          {multiAnswer && (
            <p className="text-xs text-slate-400 pt-1">
              {correctIndices.length} respuesta(s) correcta(s) seleccionada(s)
            </p>
          )}
        </Card>
      </motion.div>

      {/* Explanation + difficulty */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Explicación</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              placeholder="¿Por qué es la respuesta correcta?"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Dificultad</label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${difficulty === d ? 'bg-brand-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                >
                  {d === 'easy' ? 'Fácil' : d === 'medium' ? 'Media' : 'Difícil'}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {error && (
        <div className="p-3 rounded-xl bg-error-500/15 border border-error-500/30 text-error-300 text-sm">{error}</div>
      )}

      <AnimatePresence>
        {moduleFormOpen && (
          <ModuleForm
            onClose={() => setModuleFormOpen(false)}
            onSaved={async (m) => {
              setModuleFormOpen(false);
              await refresh();
              setModuleId(m.id);
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex gap-3 pb-8">
        <Button variant="ghost" size="lg" className="flex-1" onClick={() => onNavigate('bank')}>Cancelar</Button>
        <Button size="lg" className="flex-1" onClick={handleSave} disabled={saving || !canSave}>
          <Save className="w-5 h-5 inline mr-1" /> {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear pregunta'}
        </Button>
      </div>
    </div>
  );
}
