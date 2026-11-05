// Importa "Módulos 4 - 7: Examen de conceptos de Ethernet" (examenredes.com).
// - Carpeta "Módulos 4 - 7": las 60 preguntas de opción múltiple, en partes de 10. Las opciones
//   duplicadas que trae la página (mismas frases repetidas) se fusionan; si el número de
//   respuestas marcadas no coincide con el "(Escoja dos)" del enunciado, éste se cambia por
//   "(Elija todas las que correspondan)" (preguntas 33 y 53).
// - Carpeta "Módulos 4-7 · Reformuladas" (orden fijo): la pregunta 46 (unir) convertida en 6.
// Uso: node scripts/apply-m4-7.mjs <m4-7.json generado por fetch-examenredes.mjs>
// Idempotente: si ya existe el topic o el módulo, no duplica.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const TOPIC = 'Módulos 4 - 7';
const MAIN_NAME = 'Módulos 4 - 7';
const REF_NAME = 'Módulos 4-7 · Reformuladas';
const CHUNK = 10;

const qs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const mc = qs.filter((q) => q.options.length > 0);

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const COUNT = { dos: 2, tres: 3, cuatro: 4 };

function lev(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
// Iguales tras normalizar, o (opciones largas) casi iguales: variantes de redacción/ortografía de la misma frase.
function sameOption(a, b) {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 25) return false;
  return 1 - lev(a, b) / Math.max(a.length, b.length) >= 0.95;
}

function cleanQuestion(q) {
  // Fusiona opciones duplicadas: se conserva la primera aparición y es correcta si alguna copia lo era.
  const merged = [];
  for (const o of q.options) {
    const k = norm(o.text);
    const hit = merged.find((m) => sameOption(m.key, k));
    if (hit) {
      if (o.correct) hit.correct = true;
    } else {
      merged.push({ key: k, text: o.text, correct: o.correct });
    }
  }
  let text = q.qtext.replace(/^\d+\.\s*/, '').trim().replace(/^Que /, '¿Qué ');
  const correctCount = merged.filter((o) => o.correct).length;
  const m = /\((?:elija|escoja|seleccione)\s+(dos|tres|cuatro)[^)]*\)/i.exec(text);
  if (m && COUNT[m[1].toLowerCase()] !== correctCount) {
    text = text.replace(m[0], '(Elija todas las que correspondan)');
  }
  return { ...q, options: merged.map(({ text, correct }) => ({ text, correct })), text };
}

// ---- Pregunta 46 (unir situación con medio de red) convertida ----
const REF_SUB = 'Reformulada (era de unir/arrastrar)';
const MEDIOS = ['Cables de cobre', 'Fibra óptica', 'Acceso inalámbrico'];
const MEDIOS_EXP = 'Cables de cobre: cableado horizontal y PC de escritorio en una oficina. Fibra óptica: cableado backbone de una empresa y redes de largo alcance. Acceso inalámbrico: acceso de invitado en una cafetería y salas de espera de un hospital.';
const medio = (situacion, i) => ({
  question: `¿Qué medio de red es el uso adecuado para la siguiente situación? ${situacion}`,
  options: MEDIOS,
  correct_indices: [i],
  explanation: MEDIOS_EXP,
});
const converted = [
  medio('Estructura de cableado horizontal.', 0),
  medio('PC de escritorio en una oficina empresarial.', 0),
  medio('Cableado backbone en una empresa.', 1),
  medio('Redes de largo alcance.', 1),
  medio('Acceso de invitado en una cafetería.', 2),
  medio('Salas de espera de un hospital.', 2),
];

// ---- Estado actual ----
const { data: already } = await supabase.from('questions').select('id').eq('topic', TOPIC).limit(1);
const { data: stateRow, error: stErr } = await supabase.from('app_state').select('settings').eq('id', 1).single();
if (stErr) throw stErr;
const settings = stateRow.settings ?? {};
const modules = settings.modules ?? [];
if ((already && already.length > 0) || modules.some((m) => m.name === MAIN_NAME || m.name === REF_NAME)) {
  console.log('Ya existe el topic o los módulos de', TOPIC, '- no se importa de nuevo.');
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

let qn = maxQ;
let nextGroup = maxGroup + 1;
const nextQid = () => `Q${String(++qn).padStart(3, '0')}`;

const mainRows = mc.map(cleanQuestion).map((q, i) => {
  const correct_indices = q.options.map((o, idx) => (o.correct ? idx : -1)).filter((idx) => idx >= 0);
  const tema = /Tema\s+(\d+)\./.exec(q.explanation);
  return {
    qid: nextQid(),
    topic: TOPIC,
    subtopic: tema ? `Módulo ${tema[1]}` : TOPIC,
    question: q.text,
    question_image: q.images[0] || '',
    options: q.options.map((o) => o.text),
    option_images: q.options.map(() => ''),
    correct_index: correct_indices[0],
    correct_indices,
    explanation: q.explanation.trim().replace(/\n+/g, ' '),
    difficulty: 'medium',
    group_number: nextGroup + Math.floor(i / CHUNK),
  };
});
const mainGroups = [...new Set(mainRows.map((r) => r.group_number))];
nextGroup += mainGroups.length;

const refRows = converted.map((c, i) => ({
  qid: nextQid(),
  topic: TOPIC,
  subtopic: REF_SUB,
  question: c.question,
  question_image: '',
  options: c.options,
  option_images: c.options.map(() => ''),
  correct_index: c.correct_indices[0],
  correct_indices: c.correct_indices,
  explanation: c.explanation,
  difficulty: 'medium',
  group_number: nextGroup + Math.floor(i / CHUNK),
}));
const refGroups = [...new Set(refRows.map((r) => r.group_number))];

const { error: insErr } = await supabase.from('questions').insert([...mainRows, ...refRows]);
if (insErr) throw insErr;
console.log('Insertadas', mainRows.length, 'principales (grupos', mainGroups.join(','), ') y', refRows.length, 'reformuladas (grupos', refGroups.join(','), ')');

const maxPos = modules.reduce((m, r) => Math.max(m, r.position ?? 0), 0);
const now = new Date().toISOString();
const newModules = [
  {
    id: `mod-${Date.now().toString(36)}-a`,
    name: MAIN_NAME,
    description: 'Examen de conceptos de Ethernet (CCNA1 v7)',
    color: 'teal',
    icon: 'globe',
    position: maxPos + 1,
    groups: mainGroups,
    created_at: now,
  },
  {
    id: `mod-${Date.now().toString(36)}-b`,
    name: REF_NAME,
    description: 'Pregunta que en el examen original era de "unir pareja"; aquí queda como opción múltiple y en orden fijo.',
    color: 'violet',
    icon: 'brain',
    position: maxPos + 2,
    groups: refGroups,
    ordered: true,
    created_at: now,
  },
];
const { error: upErr } = await supabase.from('app_state').update({ settings: { ...settings, modules: [...modules, ...newModules] } }).eq('id', 1);
if (upErr) throw upErr;
console.log('Módulos creados:', newModules.map((m) => `${m.name} (${m.groups.length} partes)`).join(' | '));
