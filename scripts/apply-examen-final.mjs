// Importa el "Simulacro de Redes · Examen Final 70 puntos" (archivo HTML con `const BANK = {...}`).
//  - "Examen final": las 63 preguntas REALES del examen (las de unir pareja se pasan a "Reformuladas"), partes de 10.
//  - "Examen final · Reformuladas" (orden fijo): la pregunta real de unir pareja (OSPF) convertida a opción múltiple.
//  - "Examen final · Generadas": las 63 preguntas inventadas a partir de las reales (+ 2 de unir convertidas), partes de 10.
// Uso: node scripts/apply-examen-final.mjs "<ruta al .html>" [--dry]
// Idempotente: si ya existen los módulos o el topic, no duplica.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry');
const html = fs.readFileSync(process.argv[2], 'utf8');

// ---- Extraer BANK del HTML ----
const start = html.indexOf('const BANK = ') + 'const BANK = '.length;
let depth = 0, end = start, inStr = false, esc = false;
for (; end < html.length; end++) {
  const c = html[end];
  if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
  if (c === '"') inStr = true;
  else if (c === '{') depth++;
  else if (c === '}') { depth--; if (depth === 0) { end++; break; } }
}
const BANK = JSON.parse(html.slice(start, end));
const Q = Object.fromEntries(BANK.questions.map((q) => [q.id, q]));
const AREA = Object.fromEntries(BANK.areas.map((a) => [a.key, a.name]));

const clean = (s) =>
  String(s)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n').trim();

const TOPIC_MAIN = 'Examen final';
const TOPIC_GEN = 'Examen final · Generadas';
const NAME_MAIN = 'Examen final';
const NAME_REF = 'Examen final · Reformuladas';
const NAME_GEN = 'Examen final · Generadas';
const AFTER = 'Parcial final · Módulos 1-17'; // las carpetas nuevas van justo debajo
const CHUNK = 10;
const REF_SUB = 'Reformulada (era de unir/arrastrar)';

function explain(q) {
  const e = clean(q.expl || '');
  return q.note ? `${e}\n\nNota: ${clean(q.note)}` : e;
}

// ---- Preguntas de opción múltiple (single/multi) ----
function toRow(q, topic) {
  const idx = Array.isArray(q.ans) ? q.ans : [q.ans];
  return {
    topic,
    subtopic: AREA[q.area] ?? topic,
    question: clean(q.q),
    question_image: '',
    options: q.opts.map(clean),
    option_images: q.opts.map(() => ''),
    correct_index: idx[0],
    correct_indices: idx,
    explanation: explain(q),
    difficulty: 'medium',
  };
}

// ---- Unir pareja → opción múltiple (una pregunta por fila) ----
// Para r53 (OSPF) la clave de la plataforma pone las 4 filas en "Establecer y mantener adyacencias";
// aquí se usa la correspondencia real de Cisco y se deja el aviso en la explicación.
const MATCH_ANS = { r53: [1, 2, 4, 3] }; // índices en `choices` por fila, según Cisco (ver orden de items)
function convertMatch(q, topic) {
  const ans = MATCH_ANS[q.id] ?? q.ans;
  const stem = clean(q.q);
  return q.items.map((item, i) => ({
    topic,
    subtopic: REF_SUB,
    question: `${stem}\nElemento a unir: ${clean(item)}`,
    question_image: '',
    options: q.choices.map(clean),
    option_images: q.choices.map(() => ''),
    correct_index: ans[i],
    correct_indices: [ans[i]],
    explanation:
      q.id === 'r53'
        ? `${clean(q.expl)}\n\nNota: en la plataforma del examen las cuatro filas se calificaron como "Establecer y mantener adyacencias"; aquí se usa la correspondencia real de Cisco, que es la correcta en teoría.`
        : explain(q),
    difficulty: 'medium',
  }));
}

const real = BANK.realOrder.map((id) => Q[id]);
const gen = BANK.fullOrder.map((id) => Q[id]).filter((q) => q.src === 'gen');

const mainRows = real.filter((q) => q.type !== 'match').map((q) => toRow(q, TOPIC_MAIN));
const refRows = real.filter((q) => q.type === 'match').flatMap((q) => convertMatch(q, TOPIC_MAIN));
const genRows = [
  ...gen.filter((q) => q.type !== 'match').map((q) => toRow(q, TOPIC_GEN)),
  ...gen.filter((q) => q.type === 'match').flatMap((q) => convertMatch(q, TOPIC_GEN)),
];

// ---- Validación ----
for (const r of [...mainRows, ...refRows, ...genRows]) {
  if (!r.question || r.options.length < 2) throw new Error('Pregunta inválida: ' + r.question);
  if (!r.correct_indices.every((i) => Number.isInteger(i) && i >= 0 && i < r.options.length)) throw new Error('Índice fuera de rango: ' + r.question);
}
console.log('A importar:', { principal: mainRows.length, reformuladas: refRows.length, generadas: genRows.length });

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const supabase = createClient(env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim(), env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim());

const { data: stateRow, error: stErr } = await supabase.from('app_state').select('settings').eq('id', 1).single();
if (stErr) throw stErr;
const settings = stateRow.settings ?? {};
const modules = settings.modules ?? [];
if (modules.some((m) => [NAME_MAIN, NAME_REF, NAME_GEN].includes(m.name))) {
  console.log('Ya existen módulos "Examen final" - no se importa de nuevo.');
  process.exit(0);
}
if (!modules.some((m) => m.name === AFTER)) throw new Error('No encuentro el módulo ' + AFTER);

const { data: existing, error: exErr } = await supabase.from('questions').select('qid,group_number,question');
if (exErr) throw exErr;

// Solo informativo: cuántas ya existen con texto idéntico en otras carpetas
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const have = new Set(existing.map((r) => norm(r.question)));
console.log('Con texto idéntico a preguntas ya existentes:', { principal: mainRows.filter((r) => have.has(norm(r.question))).length, generadas: genRows.filter((r) => have.has(norm(r.question))).length });

const maxQ = existing.reduce((m, r) => { const x = /^Q(\d+)$/.exec(r.qid || ''); return x ? Math.max(m, +x[1]) : m; }, 0);
const maxGroup = Math.max(existing.reduce((m, r) => Math.max(m, r.group_number ?? 0), 0), ...modules.flatMap((m) => m.groups));

let qn = maxQ, ng = maxGroup + 1;
const assign = (rows) => {
  const out = rows.map((r, i) => ({ ...r, qid: `Q${String(++qn).padStart(3, '0')}`, group_number: ng + Math.floor(i / CHUNK) }));
  const groups = [...new Set(out.map((r) => r.group_number))];
  ng += groups.length;
  return { out, groups };
};
const main = assign(mainRows), ref = assign(refRows), genr = assign(genRows);
console.log('Partes:', { principal: main.groups.length, reformuladas: ref.groups.length, generadas: genr.groups.length });
if (DRY) { console.log('--dry: no se escribe nada.'); process.exit(0); }

const { error: insErr } = await supabase.from('questions').insert([...main.out, ...ref.out, ...genr.out]);
if (insErr) throw insErr;

const now = new Date().toISOString(), id = Date.now().toString(36);
const newMods = [
  { id: `mod-${id}-ef`, name: NAME_MAIN, description: 'Las 63 preguntas reales del examen final (70 puntos)', color: 'sky', icon: 'file-text', groups: main.groups },
  { id: `mod-${id}-er`, name: NAME_REF, description: 'Pregunta real de "unir pareja" pasada a opción múltiple, en orden fijo', color: 'violet', icon: 'brain', groups: ref.groups, ordered: true },
  { id: `mod-${id}-eg`, name: NAME_GEN, description: 'Preguntas inventadas a partir de las reales, para practicar más (no son del examen)', color: 'teal', icon: 'book', groups: genr.groups },
].map((m) => ({ ...m, position: 0, created_at: now }));

const at = modules.findIndex((m) => m.name === AFTER) + 1;
const next = [...modules.slice(0, at), ...newMods, ...modules.slice(at)].map((m, i) => ({ ...m, position: i }));
const { error: upErr } = await supabase.from('app_state').update({ settings: { ...settings, modules: next } }).eq('id', 1);
if (upErr) throw upErr;
console.log('Listo:', newMods.map((m) => `${m.name} (${m.groups.length} partes)`).join(' | '));
