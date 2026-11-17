// Exporta todas las tablas de Supabase a backups/backup-<fecha>.json
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function all(table, order) {
  const out = []; const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await supabase.from(table).select('*').order(order, { ascending: true }).range(from, from + size - 1);
    if (error) throw new Error(table + ': ' + error.message);
    out.push(...data);
    if (data.length < size) break;
  }
  return out;
}
const tables = {};
const { data: st, error: e0 } = await supabase.from('app_state').select('*');
if (e0) throw e0;
tables.app_state = st;
for (const [t, o] of [['questions', 'qid'], ['session_answers', 'id'], ['achievements', 'id'], ['quiz_sessions', 'id']]) {
  try { tables[t] = await all(t, o); } catch (e) { console.log('Aviso:', e.message); }
}
const file = new URL(`../backups/backup-${new Date().toISOString().slice(0, 10)}.json`, import.meta.url);
fs.writeFileSync(file, JSON.stringify({ exported_at: new Date().toISOString(), tables }, null, 1));
for (const [t, rows] of Object.entries(tables)) console.log(t, rows.length);
console.log('Guardado en', file.pathname);
