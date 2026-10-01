import {
  Folder, FolderOpen, Terminal, FileText, GraduationCap, Network, BookOpen, Brain, Cpu, Shield, Globe, Wifi,
  type LucideIcon,
} from 'lucide-react';
import type { Question, Module } from './types';
import { masteryLevel } from './spaced-repetition';

// ---- Colors available for a module (folder) ----
export interface ModuleColor {
  key: string;
  label: string;
  gradient: string;      // icon / buttons
  border: string;        // hover border of the folder
  banner: string;        // final-quiz banner background
  bannerBorder: string;
  text: string;          // "Empezar" label
  bar: string;           // progress bar css gradient
  parts: string[];       // gradients for each part card
}

export const MODULE_COLORS: ModuleColor[] = [
  {
    key: 'brand', label: 'Índigo',
    gradient: 'from-brand-500 to-purple-500', border: 'hover:border-brand-500/40',
    banner: 'from-brand-500/20 via-accent-500/15 to-purple-500/20', bannerBorder: 'border-brand-500/30 hover:border-brand-500/50',
    text: 'text-brand-400', bar: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
    parts: ['from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-rose-500 to-pink-500', 'from-indigo-500 to-blue-500', 'from-violet-500 to-purple-500'],
  },
  {
    key: 'emerald', label: 'Verde',
    gradient: 'from-emerald-600 to-slate-700', border: 'hover:border-emerald-500/40',
    banner: 'from-emerald-500/20 via-teal-500/15 to-slate-600/20', bannerBorder: 'border-emerald-500/30 hover:border-emerald-500/50',
    text: 'text-emerald-400', bar: 'linear-gradient(90deg, #10b981, #14b8a6)',
    parts: ['from-slate-500 to-slate-700', 'from-zinc-500 to-zinc-700', 'from-stone-500 to-stone-700', 'from-gray-500 to-gray-700', 'from-neutral-500 to-neutral-700', 'from-slate-600 to-slate-800'],
  },
  {
    key: 'sky', label: 'Azul',
    gradient: 'from-sky-500 to-blue-600', border: 'hover:border-sky-500/40',
    banner: 'from-sky-500/20 via-blue-500/15 to-indigo-500/20', bannerBorder: 'border-sky-500/30 hover:border-sky-500/50',
    text: 'text-sky-400', bar: 'linear-gradient(90deg, #0ea5e9, #06b6d4)',
    parts: ['from-sky-500 to-blue-600', 'from-cyan-500 to-sky-600', 'from-blue-500 to-indigo-600', 'from-indigo-500 to-blue-600', 'from-teal-500 to-cyan-600', 'from-sky-600 to-indigo-700'],
  },
  {
    key: 'amber', label: 'Naranja',
    gradient: 'from-amber-500 to-orange-600', border: 'hover:border-amber-500/40',
    banner: 'from-amber-500/20 via-orange-500/15 to-red-500/20', bannerBorder: 'border-amber-500/30 hover:border-amber-500/50',
    text: 'text-amber-400', bar: 'linear-gradient(90deg, #f59e0b, #f97316)',
    parts: ['from-amber-500 to-orange-600', 'from-orange-500 to-red-500', 'from-yellow-500 to-amber-600', 'from-rose-500 to-orange-500', 'from-amber-600 to-red-600', 'from-orange-400 to-amber-600'],
  },
  {
    key: 'rose', label: 'Rosa',
    gradient: 'from-rose-500 to-pink-600', border: 'hover:border-rose-500/40',
    banner: 'from-rose-500/20 via-pink-500/15 to-fuchsia-500/20', bannerBorder: 'border-rose-500/30 hover:border-rose-500/50',
    text: 'text-rose-400', bar: 'linear-gradient(90deg, #f43f5e, #ec4899)',
    parts: ['from-rose-500 to-pink-600', 'from-pink-500 to-fuchsia-600', 'from-fuchsia-500 to-purple-600', 'from-red-500 to-rose-600', 'from-pink-600 to-rose-700', 'from-rose-400 to-fuchsia-600'],
  },
  {
    key: 'violet', label: 'Violeta',
    gradient: 'from-violet-500 to-purple-600', border: 'hover:border-violet-500/40',
    banner: 'from-violet-500/20 via-purple-500/15 to-fuchsia-500/20', bannerBorder: 'border-violet-500/30 hover:border-violet-500/50',
    text: 'text-violet-400', bar: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
    parts: ['from-violet-500 to-purple-600', 'from-purple-500 to-fuchsia-600', 'from-indigo-500 to-violet-600', 'from-fuchsia-500 to-pink-600', 'from-violet-600 to-indigo-700', 'from-purple-400 to-violet-600'],
  },
  {
    key: 'teal', label: 'Turquesa',
    gradient: 'from-teal-500 to-cyan-600', border: 'hover:border-teal-500/40',
    banner: 'from-teal-500/20 via-cyan-500/15 to-emerald-500/20', bannerBorder: 'border-teal-500/30 hover:border-teal-500/50',
    text: 'text-teal-400', bar: 'linear-gradient(90deg, #14b8a6, #06b6d4)',
    parts: ['from-teal-500 to-cyan-600', 'from-cyan-500 to-teal-600', 'from-emerald-500 to-teal-600', 'from-teal-600 to-emerald-700', 'from-cyan-600 to-sky-700', 'from-teal-400 to-cyan-600'],
  },
];

export function moduleColor(key: string): ModuleColor {
  return MODULE_COLORS.find((c) => c.key === key) ?? MODULE_COLORS[0];
}

// ---- Icons available for a module ----
export const MODULE_ICONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'folder', label: 'Carpeta', icon: Folder },
  { key: 'graduation-cap', label: 'Graduación', icon: GraduationCap },
  { key: 'terminal', label: 'Terminal', icon: Terminal },
  { key: 'file-text', label: 'Documento', icon: FileText },
  { key: 'network', label: 'Red', icon: Network },
  { key: 'book', label: 'Libro', icon: BookOpen },
  { key: 'brain', label: 'Cerebro', icon: Brain },
  { key: 'cpu', label: 'CPU', icon: Cpu },
  { key: 'shield', label: 'Seguridad', icon: Shield },
  { key: 'globe', label: 'Internet', icon: Globe },
  { key: 'wifi', label: 'Wifi', icon: Wifi },
];

export function moduleIcon(key: string): LucideIcon {
  return MODULE_ICONS.find((i) => i.key === key)?.icon ?? FolderOpen;
}

// ---- Stats helpers ----
export interface PartStats {
  group: number;      // group_number in DB
  index: number;      // 1-based position inside the module ("Parte N")
  total: number;
  mastered: number;
  answered: number;
  correct: number;
  progress: number;   // 0-100: avance hacia dominar todas (cada acierto consecutivo suma 1/3 por pregunta)
}

function statsFor(qs: Question[]) {
  const mastered = qs.filter((q) => {
    const m = masteryLevel(q);
    return m === 'mastered' || m === 'strong';
  }).length;
  const answered = qs.reduce((s, q) => s + q.total_count, 0);
  const correct = qs.reduce((s, q) => s + q.correct_count, 0);
  const points = qs.reduce((s, q) => s + Math.min(q.consecutive_correct || 0, 3), 0);
  const progress = qs.length > 0 ? Math.round((points / (qs.length * 3)) * 100) : 0;
  return { total: qs.length, mastered, answered, correct, progress };
}

// Questions of a module, split by "part" (group_number), sorted by the module's group order.
export function modulePartStats(questions: Question[], module: Module): PartStats[] {
  const groups = [...module.groups].sort((a, b) => a - b);
  return groups.map((g, i) => ({ group: g, index: i + 1, ...statsFor(questions.filter((q) => q.group_number === g)) }));
}

export function moduleStats(questions: Question[], module: Module) {
  return statsFor(moduleQuestions(questions, module));
}

export function moduleQuestions(questions: Question[], module: Module): Question[] {
  return questions.filter((q) => module.groups.includes(q.group_number));
}

export function findModuleForQuestion(modules: Module[], q: Question): Module | null {
  return modules.find((m) => m.groups.includes(q.group_number)) ?? null;
}

// Questions whose group_number belongs to no module
export function orphanQuestions(questions: Question[], modules: Module[]): Question[] {
  const all = new Set(modules.flatMap((m) => m.groups));
  return questions.filter((q) => !all.has(q.group_number));
}

// Parts (group numbers) that exist in a module, with their index label
export function modulePartOptions(questions: Question[], module: Module): { group: number; label: string; count: number }[] {
  return modulePartStats(questions, module).map((p) => ({ group: p.group, label: `Parte ${p.index}`, count: p.total }));
}

export function partLabel(modules: Module[], q: Question): string {
  const m = findModuleForQuestion(modules, q);
  if (!m) return `Grupo ${q.group_number}`;
  const idx = [...m.groups].sort((a, b) => a - b).indexOf(q.group_number);
  return idx >= 0 ? `Parte ${idx + 1}` : `Grupo ${q.group_number}`;
}
