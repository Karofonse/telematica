// Mueve las 12 preguntas que vinieron de las 4 preguntas "de unir pareja" (Q459-Q470) a su
// propio grupo/módulo, con un subtopic que las identifica y el módulo marcado `ordered: true`
// para que el quiz las muestre en orden fijo (por qid) en vez de al azar.
// Idempotente: si el módulo ya existe, no hace nada.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const CONVERTED_QIDS = Array.from({ length: 12 }, (_, i) => `Q${459 + i}`); // Q459..Q470
const NEW_GROUP = 29;
const NEW_SUBTOPIC = 'Reformulada (era de unir/arrastrar)';
const MODULE_NAME = 'Módulos 16-17 · Reformuladas';

const { data: stateRow, error: stErr } = await supabase.from('app_state').select('settings').eq('id', 1).single();
if (stErr) throw stErr;
const settings = stateRow.settings ?? {};
const modules = settings.modules ?? [];

if (modules.some((m) => m.name === MODULE_NAME)) {
  console.log('El módulo', MODULE_NAME, 'ya existe - no se repite la migración.');
} else {
  const { data: updated, error: upErr } = await supabase
    .from('questions')
    .update({ group_number: NEW_GROUP, subtopic: NEW_SUBTOPIC })
    .in('qid', CONVERTED_QIDS)
    .select('qid');
  if (upErr) throw upErr;
  console.log('Movidas', updated.length, 'preguntas al grupo', NEW_GROUP, '-', updated.map((r) => r.qid).join(', '));

  const maxPos = modules.reduce((m, r) => Math.max(m, r.position ?? 0), 0);
  const newModule = {
    id: `mod-${Date.now().toString(36)}`,
    name: MODULE_NAME,
    description: 'Preguntas que en el examen original eran de "unir pareja" o "arrastrar y soltar"; aquí quedan como opción múltiple y en orden fijo.',
    color: 'violet',
    icon: 'brain',
    position: maxPos + 1,
    groups: [NEW_GROUP],
    ordered: true,
    created_at: new Date().toISOString(),
  };
  const { error: insErr } = await supabase.from('app_state').update({ settings: { ...settings, modules: [...modules, newModule] } }).eq('id', 1);
  if (insErr) throw insErr;
  console.log('Módulo creado:', newModule.name, '(ordered: true, grupo', NEW_GROUP, ')');
}
