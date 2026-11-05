// Importa "Módulos 1 - 3: Examen de conectividad de red básica y comunicaciones" (examenredes.com).
// - Carpeta "Módulos 1 - 3": las 59 preguntas de opción múltiple, en partes de 10.
// - Carpeta "Módulos 1-3 · Reformuladas" (orden fijo): las 7 de unir/arrastrar convertidas a
//   opción múltiple (23 preguntas), con las respuestas leídas de las imágenes originales.
// Uso: node scripts/apply-m1-3.mjs <m1-3.json generado por fetch-examenredes.mjs>
// Idempotente: si ya existe el topic o el módulo, no duplica.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const TOPIC = 'Módulos 1 - 3';
const MAIN_NAME = 'Módulos 1 - 3';
const REF_NAME = 'Módulos 1-3 · Reformuladas';
const CHUNK = 10;

const qs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const mc = qs.filter((q) => q.options.length > 0);

// ---- Preguntas de unir/arrastrar convertidas ----
const REF_SUB = 'Reformulada (era de unir/arrastrar)';
function conv(question, opts, correctIdx, explanation) {
  return { question, options: opts, correct_indices: [correctIdx], explanation };
}

const MODOS = ['Modo EXEC del usuario', 'Modo EXEC privilegiado', 'Modo de configuración global'];
const MODOS_EXP = 'Modo EXEC del usuario: pocos comandos básicos y es la primera entrada a la CLI. Modo EXEC privilegiado: se entra con enable y el prompt termina en #. Modo de configuración global: se entra con configure terminal y los cambios afectan a todo el dispositivo.';
const modo = (d, i) => conv(`¿Qué modo de IOS corresponde a la siguiente descripción? ${d}`, MODOS, i, MODOS_EXP);

const TECLAS = ['Tabulación', 'Barra espaciadora', 'Flecha arriba', 'Ctrl-C', '?', 'Ctrl-Mayús-6'];
const TECLAS_EXP = 'Tabulación completa comandos y parámetros abreviados; la barra espaciadora muestra la siguiente pantalla; la flecha arriba recupera los comandos introducidos antes; ? da ayuda contextual; Ctrl-Mayús-6 anula comandos como trace y ping.';
const tecla = (d, i) => conv(`¿Qué tecla o método abreviado de la CLI corresponde a la siguiente definición? ${d}`, TECLAS, i, TECLAS_EXP);

const REQ = ['Tolerancia a fallas', 'Escalabilidad', 'Seguridad'];
const REQ_EXP = 'Tolerancia a fallas: enlaces y dispositivos redundantes. Escalabilidad: expandir la red sin degradar el servicio a los usuarios existentes. Seguridad: proteger la red del acceso no autorizado.';
const req = (d, i) => conv(`¿Qué requisito de una red confiable corresponde a la siguiente descripción? ${d}`, REQ, i, REQ_EXP);

const ORG = ['ISOC', 'ISO', 'EIA', 'IANA'];
const ORG_EXP = 'IANA supervisa la asignación de direcciones IP, los nombres de dominio y los identificadores de protocolo. ISO es el mayor desarrollador de estándares internacionales y creó el modelo OSI. ISOC promueve el desarrollo abierto, la evolución y el uso de Internet en todo el mundo.';
const org = (d, i) => conv(`¿Qué organización corresponde a la siguiente descripción? ${d}`, ORG, i, ORG_EXP);

const CONN = ['DSL', 'Telefónica por dial-up', 'Satelital', 'Cable'];
const CONN_EXP = 'DSL: gran ancho de banda sobre la línea telefónica. Dial-up: ancho de banda bajo. Satelital: no es apta para zonas muy boscosas. Cable: usa cable coaxial como medio.';
const conn = (d, i) => conv(`¿Qué tipo de conectividad a Internet corresponde a la siguiente característica? ${d}`, CONN, i, CONN_EXP);

const converted = [
  // Pregunta 11 (modos de IOS)
  modo('La cantidad de comandos de control básicos es limitada.', 0),
  modo('Es la primera entrada a la CLI de un dispositivo IOS.', 0),
  modo('Se accede mediante la introducción del comando enable.', 1),
  modo('Se identifica con una petición de entrada que termina con el carácter #.', 1),
  modo('Los cambios que se realizan afectan el funcionamiento global del dispositivo.', 2),
  modo('Se accede mediante la introducción del comando configure terminal.', 2),
  // Pregunta 12 (teclas de la CLI)
  tecla('Completa comandos y parámetros abreviados.', 0),
  tecla('Muestra la siguiente pantalla.', 1),
  tecla('Realiza un desplazamiento hacia atrás por los comandos introducidos anteriormente.', 2),
  tecla('Proporciona ayuda contextual.', 4),
  tecla('Anula los comandos como trace y ping.', 5),
  // Pregunta 34 (requisitos de una red confiable)
  req('Proteger la red del acceso no autorizado.', 2),
  req('Proporcionar enlaces y dispositivos redundantes.', 0),
  req('Expandir la red sin degradar el servicio para los usuarios existentes.', 1),
  // Pregunta 36 (organizaciones)
  org('Esta organización es responsable de supervisar y administrar la asignación de direcciones IP, la administración de nombres de dominio y los identificadores de protocolo.', 3),
  org('Esta organización es el mayor desarrollador de estándares internacionales en el mundo para una amplia variedad de productos y servicios. Es conocido por su modelo de referencia de interconexión de sistemas abiertos (OSI).', 1),
  org('Esta organización promueve el desarrollo abierto, la evolución y el uso de Internet en todo el mundo.', 0),
  // Pregunta 39 (orden de encapsulación de un mensaje Telnet)
  conv(
    'Para el conjunto de protocolos TCP/IP, ¿cuál es el orden correcto de los eventos cuando se prepara un mensaje Telnet para enviarlo a través de la red?',
    [
      'Los datos Telnet se entregan a la siguiente capa → se agrega el encabezado TCP → se agrega el encabezado IP → se agrega el encabezado Ethernet',
      'Los datos Telnet se entregan a la siguiente capa → se agrega el encabezado IP → se agrega el encabezado TCP → se agrega el encabezado Ethernet',
      'Los datos Telnet se entregan a la siguiente capa → se agrega el encabezado TCP → se agrega el encabezado Ethernet → se agrega el encabezado IP',
      'Los datos Telnet se entregan a la siguiente capa → se agrega el encabezado Ethernet → se agrega el encabezado IP → se agrega el encabezado TCP',
    ],
    0,
    'Al encapsular, los datos de la aplicación (Telnet) pasan a la capa de transporte, que agrega el encabezado TCP; luego la capa de red agrega el encabezado IP y por último la capa de acceso a la red agrega el encabezado Ethernet.',
  ),
  // Pregunta 50 (recorrido de modos de IOS hasta configurar la contraseña de consola)
  conv(
    'Un administrador está configurando la contraseña del puerto de consola de un switch. ¿En qué orden debe atravesar los modos de operación de IOS para llegar al modo en el que introducirá los comandos de configuración?',
    [
      'Modo EXEC del usuario → modo EXEC privilegiado → modo de configuración global → modo de configuración de línea',
      'Modo EXEC del usuario → modo EXEC privilegiado → modo de configuración global → modo de configuración de interfaz',
      'Modo EXEC privilegiado → modo EXEC del usuario → modo de configuración global → modo de configuración de línea',
      'Modo EXEC del usuario → modo de configuración global → modo EXEC privilegiado → modo de configuración de línea',
    ],
    0,
    'Se empieza en EXEC del usuario, se entra a EXEC privilegiado con enable, luego a configuración global con configure terminal y finalmente a configuración de línea (line console 0), donde se configura la contraseña de consola. El modo de configuración de interfaz no se usa en este caso.',
  ),
  // Pregunta 58 (tipos de conectividad a Internet)
  conn('No es apta para zonas muy boscosas.', 2),
  conn('Utiliza cable coaxial como medio.', 3),
  conn('Por lo general, tiene un ancho de banda bajo.', 1),
  conn('Es una conexión de gran ancho de banda que funciona mediante una línea telefónica.', 0),
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

// ---- Filas ----
let qn = maxQ;
let nextGroup = maxGroup + 1;
const nextQid = () => `Q${String(++qn).padStart(3, '0')}`;

const mainRows = mc.map((q, i) => {
  const correct_indices = q.options.map((o, idx) => (o.correct ? idx : -1)).filter((idx) => idx >= 0);
  const tema = /Tema\s+(\d+)\./.exec(q.explanation);
  return {
    qid: nextQid(),
    topic: TOPIC,
    subtopic: tema ? `Módulo ${tema[1]}` : TOPIC,
    question: q.qtext.replace(/^\d+\.\s*/, '').trim(),
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
console.log('Insertadas', mainRows.length, 'preguntas principales (grupos', mainGroups.join(','), ') y', refRows.length, 'reformuladas (grupos', refGroups.join(','), ')');

const maxPos = modules.reduce((m, r) => Math.max(m, r.position ?? 0), 0);
const now = new Date().toISOString();
const newModules = [
  {
    id: `mod-${Date.now().toString(36)}-a`,
    name: MAIN_NAME,
    description: 'Examen de conectividad de red básica y comunicaciones (CCNA1 v7)',
    color: 'sky',
    icon: 'wifi',
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
