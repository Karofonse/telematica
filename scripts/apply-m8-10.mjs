// Importa "Módulos 8 - 10: Examen de comunicación entre redes" (examenredes.com).
// - Carpeta "Módulos 8 - 10": las 60 preguntas de opción múltiple, en partes de 10.
// - Carpeta "Módulos 8-10 · Reformuladas" (orden fijo): las 6 de unir/arrastrar (8, 17, 18, 19, 20
//   y 24) convertidas a 24 preguntas de opción múltiple, con las parejas leídas de las imágenes.
// Uso: node scripts/apply-m8-10.mjs <m8-10.json generado por fetch-examenredes.mjs>
// Idempotente: si ya existe el topic o el módulo, no duplica.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const TOPIC = 'Módulos 8 - 10';
const MAIN_NAME = 'Módulos 8 - 10';
const REF_NAME = 'Módulos 8-10 · Reformuladas';
const CHUNK = 10;

const qs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const mc = qs.filter((q) => q.options.length > 0);

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// Solo se fusionan opciones idénticas tras normalizar (la similitud "aproximada" mezcla
// opciones opuestas como "más alta"/"más baja").
function cleanQuestion(q) {
  const merged = [];
  const index = new Map();
  for (const o of q.options) {
    const k = norm(o.text);
    if (index.has(k)) {
      if (o.correct) merged[index.get(k)].correct = true;
    } else {
      index.set(k, merged.length);
      merged.push({ text: o.text, correct: o.correct });
    }
  }
  return { ...q, options: merged, text: q.qtext.replace(/^\d+\.\s*/, '').trim() };
}

// ---- Preguntas de unir/arrastrar convertidas ----
const REF_SUB = 'Reformulada (era de unir/arrastrar)';
const RT_IMG = 'https://examenredes.com/wp-content/uploads/2021/08/Modulos-8-10-Examen-de-comunicacion-entre-redes-Respuestas-11.jpg';
function conv(question, options, correctIdx, explanation, image = '') {
  return { question, options, correct_indices: [correctIdx], explanation, image };
}

// Pregunta 8: interfaz de salida según la tabla de enrutamiento
const IFACES = ['FastEthernet0/0', 'FastEthernet0/1', 'FastEthernet1/0', 'FastEthernet1/1', 'Serial0/0/0', 'El paquete se descarta'];
const IFACES_EXP = 'Según la tabla de enrutamiento: 172.17.6.0/24 sale por FastEthernet0/0, 172.17.14.0/24 está conectada a FastEthernet0/1, 172.17.12.0/24 sale por FastEthernet1/0 y 172.17.10.0/24 por FastEthernet1/1. 172.17.8.20 no está en la tabla, así que usa la ruta por defecto (0.0.0.0/0) por Serial0/0/0.';
const iface = (dest, i) => conv(`Consulte la ilustración. ¿Por qué interfaz de salida envía el router los paquetes con destino ${dest}?`, IFACES, i, IFACES_EXP, RT_IMG);

// Pregunta 17: comandos y sus acciones
const CMDS = ['Router(config)# hostname CL1', 'Router(config)# enable password Cisco', 'Router(config-line)# password class', 'Router(config)# password Cisco', 'Router(config)# banner motd #'];
const CMDS_EXP = 'hostname configura el nombre del router; password class en modo de configuración de línea protege la consola; banner motd muestra un mensaje cuando se accede al router.';
const cmd = (accion, i) => conv(`¿Qué comando realiza la siguiente acción? ${accion}`, CMDS, i, CMDS_EXP);

// Pregunta 18: métodos de acceso
const ACCESO = ['SSH', 'De consola', 'FTP', 'AUX', 'Telnet'];
const ACCESO_EXP = 'La consola es el método de acceso fuera de banda preferido; SSH es acceso remoto cifrado; Telnet es acceso remoto no seguro (texto sin cifrar); AUX permite acceso remoto mediante una conexión de acceso telefónico.';
const acceso = (d, i) => conv(`¿A qué método de acceso corresponde la siguiente descripción? ${d}`, ACCESO, i, ACCESO_EXP);

// Pregunta 19: fases del arranque de un router Cisco
const FASES = ['Ejecución del POST y carga del programa de arranque', 'Localización y carga del software Cisco IOS', 'Localización y carga del archivo de configuración de inicio', 'Ingreso al modo de configuración'];
const FASES_EXP = 'Arranque de un router Cisco: 1) se ejecuta el POST y se carga el programa de arranque (bootstrap); 2) se localiza y carga el software Cisco IOS; 3) se localiza y carga el archivo de configuración de inicio (o se entra al modo de configuración si no existe).';
const fase = (n, i) => conv(`¿Qué función se realiza en la fase ${n} del proceso de arranque de un router Cisco?`, FASES, i, FASES_EXP);

// Preguntas 20 y 24: comando <-> prompt (modo)
const PROMPTS20 = ['R1(config)#', 'R1>', 'R1(config-router)#', 'R1#', 'R1(config-line)#', 'R1(config-if)#'];
const PROMPTS20_EXP = 'service password-encryption se introduce en configuración global R1(config)#; enable en modo EXEC de usuario R1>; copy running-config startup-config en EXEC privilegiado R1#; login en configuración de línea R1(config-line)#; ip address en configuración de interfaz R1(config-if)#.';
const modo20 = (c, i) => conv(`¿En qué modo del dispositivo (prompt) se introduce el comando ${c}?`, PROMPTS20, i, PROMPTS20_EXP);

const PROMPTS24 = ['R1(config-line)#', 'R1#', 'R1(config-router)#', 'R1>', 'R1(config)#'];
const PROMPTS24_EXP = 'enable está disponible en R1> (EXEC de usuario); copy running-config startup-config en R1# (EXEC privilegiado); login en R1(config-line)# (configuración de línea); interface fastethernet 0/0 en R1(config)# (configuración global).';
const modo24 = (c, i) => conv(`¿En qué modo está disponible el comando ${c}?`, PROMPTS24, i, PROMPTS24_EXP);

const converted = [
  // Pregunta 8
  iface('172.17.6.15', 0),
  iface('172.17.14.8', 1),
  iface('172.17.12.10', 2),
  iface('172.17.10.5', 3),
  iface('172.17.8.20', 4),
  // Pregunta 17
  cmd('Proporciona seguridad en la consola.', 2),
  cmd('Muestra un mensaje cuando se accede al router.', 4),
  cmd('Configura un nombre en el router.', 0),
  // Pregunta 18
  acceso('Acceso remoto a través de una conexión de acceso telefónico.', 3),
  acceso('Método de acceso fuera de banda preferido.', 1),
  acceso('Método de acceso remoto que utiliza cifrado.', 0),
  acceso('Acceso remoto no seguro.', 4),
  // Pregunta 19
  fase(1, 0),
  fase(2, 1),
  fase(3, 2),
  // Pregunta 20
  modo20('service password-encryption', 0),
  modo20('enable', 1),
  modo20('copy running-config startup-config', 3),
  modo20('login', 4),
  modo20('ip address 192.168.4.4 255.255.255.0', 5),
  // Pregunta 24
  modo24('enable', 3),
  modo24('copy running-config startup-config', 1),
  modo24('login', 0),
  modo24('interface fastethernet 0/0', 4),
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
  question_image: c.image,
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
    description: 'Examen de comunicación entre redes (CCNA1 v7)',
    color: 'brand',
    icon: 'cpu',
    position: maxPos + 1,
    groups: mainGroups,
    created_at: now,
  },
  {
    id: `mod-${Date.now().toString(36)}-b`,
    name: REF_NAME,
    description: 'Preguntas que en el examen original eran de "unir pareja" o "arrastrar y soltar"; aquí quedan como opción múltiple y en orden fijo.',
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
