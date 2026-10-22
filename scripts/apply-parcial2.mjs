// Importa las 50 preguntas de "PREGUNTAS-TEORICAS- CORTE 2.html" (SET 1 + SET 2) como un
// módulo nuevo "Parcial teórico 2" con 5 partes de 10 preguntas (en orden SET 1 -> SET 2).
// Uso: node scripts/apply-parcial2.mjs <parcial2.json generado por extract-parcial2.mjs>
// Idempotente: si ya existen preguntas con ese topic o el módulo, no duplica.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const TOPIC = 'Parcial teórico 2';
const MODULE_NAME = 'Parcial teórico 2';
const CHUNK = 10;

const { IMGS, SET1, SET2 } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// Correcciones a la clave del HTML original.
const CORRECT_FIX = {
  14: ['10101100.00011001.01000010.00000000 (dirección de red 172.25.66.0/23)'],
  120: ['2 grupos de ceros'],
};
const EXP_FIX = {
  120: (e) => e.replace(/\s*CORRECCIÓN:.*$/, '').trim(),
};

const all = [
  ...SET1.map((q) => ({ ...q, subtopic: 'Parcial S2 (SET 1)' })),
  ...SET2.map((q) => ({ ...q, subtopic: 'Situaciones (SET 2)' })),
];

const { data: already } = await supabase.from('questions').select('id').eq('topic', TOPIC).limit(1);
const { data: stateRow, error: stErr } = await supabase.from('app_state').select('settings').eq('id', 1).single();
if (stErr) throw stErr;
const settings = stateRow.settings ?? {};
const modules = settings.modules ?? [];

if ((already && already.length > 0) || modules.some((m) => m.name === MODULE_NAME)) {
  console.log('Ya existe el topic o el módulo', TOPIC, '- no se importa de nuevo.');
  process.exit(0);
}

const { data: existing, error: exErr } = await supabase.from('questions').select('qid,group_number');
if (exErr) throw exErr;
const maxQ = existing.reduce((m, r) => {
  const x = /^Q(\d+)$/.exec(r.qid || '');
  return x ? Math.max(m, parseInt(x[1], 10)) : m;
}, 0);
const maxGroup = Math.max(
  existing.reduce((m, r) => Math.max(m, r.group_number ?? 0), 0),
  ...modules.flatMap((m) => m.groups),
);
const firstGroup = maxGroup + 1;

const rows = all.map((q, i) => {
  const correct = CORRECT_FIX[q.id] ?? q.correct;
  const correct_indices = q.options.map((o, idx) => (correct.includes(o) ? idx : -1)).filter((idx) => idx >= 0);
  if (correct_indices.length === 0) throw new Error(`Pregunta ${q.id}: ninguna opción correcta`);
  const exp = EXP_FIX[q.id] ? EXP_FIX[q.id](q.exp) : q.exp;
  return {
    qid: `Q${String(maxQ + i + 1).padStart(3, '0')}`,
    topic: TOPIC,
    subtopic: q.subtopic,
    question: q.text.replace(/\\n/g, '\n'),
    question_image: q.img ? IMGS[q.img] : '',
    options: q.options,
    option_images: q.options.map(() => ''),
    correct_index: correct_indices[0],
    correct_indices,
    explanation: exp,
    difficulty: 'medium',
    group_number: firstGroup + Math.floor(i / CHUNK),
  };
});

const { error: insErr } = await supabase.from('questions').insert(rows);
if (insErr) throw insErr;
const groups = [...new Set(rows.map((r) => r.group_number))];
console.log('Insertadas', rows.length, 'preguntas', rows[0].qid, '..', rows[rows.length - 1].qid, '-> grupos', groups.join(', '));

const maxPos = modules.reduce((m, r) => Math.max(m, r.position ?? 0), 0);
const newModule = {
  id: `mod-${Date.now().toString(36)}`,
  name: MODULE_NAME,
  description: 'Segundo corte: subnetting, IPv6, routing y Cisco IOS (SET 1 parcial + SET 2 situaciones)',
  color: 'teal',
  icon: 'book',
  position: maxPos + 1,
  groups,
  created_at: new Date().toISOString(),
};
const { error: upErr } = await supabase.from('app_state').update({ settings: { ...settings, modules: [...modules, newModule] } }).eq('id', 1);
if (upErr) throw upErr;
console.log('Módulo creado:', newModule.name, '-> partes', groups.length);
