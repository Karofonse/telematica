// Aplica el módulo "Módulos 16 - 17" directamente en Supabase (producción), vía el mismo
// cliente anon que usa la app (RLS abierto, modo single-tenant). Idempotente.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const qs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const picked = qs.filter(q => q.options.length > 0);

function temaMajor(q) {
  const m = /Tema\s+(\d+)\./.exec(q.explanation);
  return m ? parseInt(m[1], 10) : 17;
}
function cleanQuestion(qtext) {
  return qtext.replace(/^\d+\.\s*/, '').trim();
}

const TOPIC = 'Módulos 16 - 17';
const MODULE_NAME = 'Módulos 16 - 17';

const { data: already } = await supabase.from('questions').select('id').eq('topic', TOPIC).limit(1);
if (already && already.length > 0) {
  console.log('Ya existen preguntas con topic', TOPIC, '- no se insertan de nuevo.');
} else {
  const { data: existing, error: exErr } = await supabase.from('questions').select('qid');
  if (exErr) throw exErr;
  const maxNum = (existing ?? []).reduce((max, row) => {
    const m = /^Q(\d+)$/.exec(row.qid || '');
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 0);

  const rows = picked.map((q, i) => {
    const tema = temaMajor(q);
    const subtopic = tema === 16 ? 'Seguridad de red' : 'Solución de problemas en la red';
    const group_number = tema === 16 ? 27 : 28;
    const options = q.options.map(o => o.text);
    const correct_index = q.options.findIndex(o => o.correct);
    const correct_indices = q.options.map((o, idx) => (o.correct ? idx : -1)).filter(idx => idx >= 0);
    return {
      qid: `Q${String(maxNum + i + 1).padStart(3, '0')}`,
      topic: TOPIC,
      subtopic,
      question: cleanQuestion(q.qtext),
      question_image: q.images[0] || '',
      options,
      option_images: options.map(() => ''),
      correct_index,
      correct_indices,
      explanation: q.explanation.trim(),
      difficulty: 'medium',
      group_number,
    };
  });

  const { error: insErr } = await supabase.from('questions').insert(rows);
  if (insErr) throw insErr;
  console.log('Insertadas', rows.length, 'preguntas (grupos 27-28, qids', rows[0].qid, '..', rows[rows.length - 1].qid, ')');
}

// ---- Módulo (carpeta) ----
const { data: stateRow, error: stErr } = await supabase.from('app_state').select('settings').eq('id', 1).single();
if (stErr) throw stErr;
const settings = stateRow.settings ?? {};
const modules = settings.modules ?? [];

if (modules.some(m => m.name === MODULE_NAME)) {
  console.log('El módulo', MODULE_NAME, 'ya existe en app_state.settings - no se duplica.');
} else {
  const maxPos = modules.reduce((m, r) => Math.max(m, r.position ?? 0), 0);
  const newModule = {
    id: `mod-${Date.now().toString(36)}`,
    name: MODULE_NAME,
    description: 'Creación y protección de un examen de redes pequeñas (CCNA1 v7)',
    color: 'rose',
    icon: 'shield',
    position: maxPos + 1,
    groups: [27, 28],
    created_at: new Date().toISOString(),
  };
  const nextModules = [...modules, newModule];
  const { error: upErr } = await supabase.from('app_state').update({ settings: { ...settings, modules: nextModules } }).eq('id', 1);
  if (upErr) throw upErr;
  console.log('Módulo creado:', newModule.name, '-> grupos', newModule.groups);
}
