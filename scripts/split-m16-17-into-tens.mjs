// Divide las 2 partes actuales de "Módulos 16 - 17" (grupo 27: 24 preguntas "Seguridad de
// red", grupo 28: 32 preguntas "Solución de problemas en la red") en partes de 10 preguntas
// (la última de cada bloque se queda con el resto). Asigna group_number nuevos (30+) y
// actualiza module.groups. Idempotente: si ya no quedan preguntas en 27/28, no hace nada.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const MODULE_NAME = 'Módulos 16 - 17';
const CHUNK_SIZE = 10;
const OLD_GROUPS = [27, 28];
let nextGroup = 30; // 29 ya está en uso (Reformuladas)

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const { data: existingOld } = await supabase.from('questions').select('qid').in('group_number', OLD_GROUPS);
if (!existingOld || existingOld.length === 0) {
  console.log('Los grupos 27/28 ya no tienen preguntas - no se repite la división.');
  process.exit(0);
}

const newGroupsInOrder = [];

for (const oldGroup of OLD_GROUPS) {
  const { data: qs, error } = await supabase.from('questions').select('qid').eq('group_number', oldGroup).order('qid');
  if (error) throw error;
  const chunks = chunk(qs.map((q) => q.qid), CHUNK_SIZE);
  for (const qids of chunks) {
    const g = nextGroup++;
    newGroupsInOrder.push(g);
    const { error: upErr } = await supabase.from('questions').update({ group_number: g }).in('qid', qids);
    if (upErr) throw upErr;
    console.log(`grupo ${oldGroup} -> nuevo grupo ${g}: ${qids.length} preguntas (${qids[0]}..${qids[qids.length - 1]})`);
  }
}

const { data: stateRow, error: stErr } = await supabase.from('app_state').select('settings').eq('id', 1).single();
if (stErr) throw stErr;
const settings = stateRow.settings ?? {};
const modules = settings.modules ?? [];
const nextModules = modules.map((m) => (m.name === MODULE_NAME ? { ...m, groups: newGroupsInOrder } : m));
const { error: upErr2 } = await supabase.from('app_state').update({ settings: { ...settings, modules: nextModules } }).eq('id', 1);
if (upErr2) throw upErr2;
console.log('Módulo', MODULE_NAME, '-> groups:', newGroupsInOrder.join(', '));
