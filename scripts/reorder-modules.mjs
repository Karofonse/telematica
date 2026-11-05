// Ordena las carpetas del Inicio: parcial mixto y CCNA arriba, módulos de menor a mayor
// (cada "Reformuladas" justo debajo de su módulo) y los parciales / Linux al final.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const supabase = createClient(env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim(), env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim());

const ORDER = [
  'Parcial final · Módulos 1-17',
  'CCNA1 v7 · Examen final',
  'CCNA1 v7 · Examen final · Reformuladas',
  'Módulos 1 - 3', 'Módulos 1-3 · Reformuladas',
  'Módulos 4 - 7', 'Módulos 4-7 · Reformuladas',
  'Módulos 8 - 10', 'Módulos 8-10 · Reformuladas',
  'Módulos 11 - 13',
  'Módulo 14 y 15',
  'Módulos 16 - 17', 'Módulos 16-17 · Reformuladas',
  'Parcial 1',
  'Parcial teórico 2',
  'Linux',
];

const { data: stateRow, error } = await supabase.from('app_state').select('settings').eq('id', 1).single();
if (error) throw error;
const settings = stateRow.settings;
const modules = settings.modules;

const unknown = modules.filter((m) => !ORDER.includes(m.name)).map((m) => m.name);
const missing = ORDER.filter((n) => !modules.some((m) => m.name === n));
if (unknown.length || missing.length) throw new Error(`Desajuste. Sin lugar en ORDER: [${unknown}] | en ORDER pero no existen: [${missing}]`);

const next = ORDER.map((name, i) => ({ ...modules.find((m) => m.name === name), position: i }));
const { error: upErr } = await supabase.from('app_state').update({ settings: { ...settings, modules: next } }).eq('id', 1);
if (upErr) throw upErr;
console.log(next.map((m) => `${m.position + 1}. ${m.name}`).join('\n'));
