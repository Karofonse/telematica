// Evita partes de 1 sola pregunta en las carpetas del examen final CCNA1: la mueve a la parte anterior.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const supabase = createClient(env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim(), env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim());

const NAMES = ['CCNA1 v7 · Examen final', 'CCNA1 v7 · Examen final · Reformuladas'];
const { data: stateRow } = await supabase.from('app_state').select('settings').eq('id', 1).single();
const settings = stateRow.settings;
let modules = settings.modules;

for (const name of NAMES) {
  const mod = modules.find((m) => m.name === name);
  const groups = [...mod.groups].sort((a, b) => a - b);
  const last = groups[groups.length - 1];
  const prev = groups[groups.length - 2];
  const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('group_number', last);
  if (count !== 1) { console.log(name, ': la última parte tiene', count, '- sin cambios'); continue; }
  const { error } = await supabase.from('questions').update({ group_number: prev }).eq('group_number', last);
  if (error) throw error;
  modules = modules.map((m) => (m.name === name ? { ...m, groups: groups.filter((g) => g !== last) } : m));
  console.log(name, ': pregunta de la parte', last, '-> parte', prev);
}
const { error } = await supabase.from('app_state').update({ settings: { ...settings, modules } }).eq('id', 1);
if (error) throw error;
