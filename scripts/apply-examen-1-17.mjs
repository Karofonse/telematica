// Crea el módulo mixto "Parcial final · Módulos 1-17": su quiz toma 60 preguntas al azar del banco formado por
// todas las preguntas de los módulos 1 al 17 (incluidas sus carpetas "Reformuladas").
// No copia preguntas: solo reúne los grupos (group_number) de esos módulos y marca quizLimit: 60.
// Idempotente: si el módulo ya existe, lo actualiza con los grupos actuales de las carpetas fuente.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const NAME = 'Parcial final · Módulos 1-17';
const OLD_NAMES = ['Examen Módulos 1-17']; // nombre anterior: se renombra en lugar de duplicar
const LIMIT = 60;
const SOURCES = [
  'Módulos 1 - 3', 'Módulos 1-3 · Reformuladas',
  'Módulos 4 - 7', 'Módulos 4-7 · Reformuladas',
  'Módulos 8 - 10', 'Módulos 8-10 · Reformuladas',
  'Módulos 11 - 13',
  'Módulo 14 y 15',
  'Módulos 16 - 17', 'Módulos 16-17 · Reformuladas',
];

const { data: stateRow, error: stErr } = await supabase.from('app_state').select('settings').eq('id', 1).single();
if (stErr) throw stErr;
const settings = stateRow.settings ?? {};
const modules = settings.modules ?? [];

const missing = SOURCES.filter((n) => !modules.some((m) => m.name === n));
if (missing.length) throw new Error('Faltan módulos fuente: ' + missing.join(', '));

const groups = [...new Set(SOURCES.flatMap((n) => modules.find((m) => m.name === n).groups))].sort((a, b) => a - b);
const { count, error: cErr } = await supabase.from('questions').select('*', { count: 'exact', head: true }).in('group_number', groups);
if (cErr) throw cErr;

const existing = modules.find((m) => m.name === NAME || OLD_NAMES.includes(m.name));
const exam = {
  id: existing?.id ?? `mod-${Date.now().toString(36)}-exam`,
  name: NAME,
  description: `Parcial real: ${LIMIT} preguntas al azar de todas las de los módulos 1 al 17 (distintas cada vez)`,
  color: 'amber',
  icon: 'graduation-cap',
  position: existing?.position ?? 0,
  groups,
  quizLimit: LIMIT,
  created_at: existing?.created_at ?? new Date().toISOString(),
};
const next = existing ? modules.map((m) => (m.id === existing.id ? exam : m)) : [...modules, exam];
const { error: upErr } = await supabase.from('app_state').update({ settings: { ...settings, modules: next } }).eq('id', 1);
if (upErr) throw upErr;
console.log(existing ? 'Módulo actualizado:' : 'Módulo creado:', NAME, '- banco de', count, 'preguntas en', groups.length, 'grupos; examen de', LIMIT);
