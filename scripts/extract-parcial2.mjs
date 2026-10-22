// Extrae SET1/SET2/IMGS del HTML "PREGUNTAS-TEORICAS- CORTE 2.html" y los imprime como JSON.
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(process.argv[2], 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) throw new Error('No se encontró <script>');
const src = m[1];
const start = src.indexOf('const IMGS');
const end = src.indexOf('const SET_INFO');
const code = src.slice(start, end) + '\n;({IMGS, SET1, SET2})';
const { IMGS, SET1, SET2 } = vm.runInNewContext(code);
console.log(JSON.stringify({ IMGS, SET1, SET2 }));
