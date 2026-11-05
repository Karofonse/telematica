// Importa el "CCNA1 v7 ITN Examen Final" de ccnadesdecero.es (168 preguntas).
// - Carpeta "CCNA1 v7 · Examen final": las preguntas de opción simple/múltiple (con la respuesta
//   correcta que marca la página), en partes de 10. Se descarta 1 duplicado exacto (590 = 591).
// - Carpeta "CCNA1 v7 · Examen final · Reformuladas" (orden fijo): las 14 preguntas de unir pareja
//   distintas (16 en la página; 603 y 502 repiten a 578 y 492), convertidas a opción múltiple.
//   Las respuestas salen de la explicación de la página cuando la trae (641, 578, 583, 502, 489);
//   en el resto la imagen es solo el enunciado y se resolvieron con el contenido estándar del CCNA.
// Las carpetas se colocan justo debajo de "Parcial final · Módulos 1-17" (se renumera `position`).
// Uso: node scripts/apply-ccna-final.mjs <final.json> <final-images.json>   (DRY=1 para probar sin escribir)
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);
const DRY = !!process.env.DRY;

const TOPIC = 'CCNA1 v7 Examen final';
const MAIN_NAME = 'CCNA1 v7 · Examen final';
const REF_NAME = 'CCNA1 v7 · Examen final · Reformuladas';
const AFTER = 'Parcial final · Módulos 1-17';
const CHUNK = 10;

const qs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const imgRows = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const origImg = Object.fromEntries(imgRows.map((r) => [r.id, r.orig]));

// 603 repite 578 y 502 repite 492: cada pareja se convierte una sola vez.
const MATCHING = new Set(['641', '636', '633', '629', '609', '603', '593', '583', '581', '578', '536', '503', '502', '492', '489', '487']);
const DUPLICATES = new Set(['590']); // idéntica a 591

// Comparación exacta (sin quitar puntuación: 2001:DA48:FC5::A4:/64 y 2001:DA48:FC5:A4::/64 son distintas).
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const COUNT = { dos: 2, tres: 3, cuatro: 4, cinco: 5 };

function clean(q) {
  const merged = [];
  const index = new Map();
  for (const o of q.options) {
    const text = o.text.replace(/^[A-Z]\)\s*/, '').replace(/`/g, '').trim();
    const k = norm(text);
    if (index.has(k)) {
      if (o.correct) merged[index.get(k)].correct = true;
    } else {
      index.set(k, merged.length);
      merged.push({ text, correct: o.correct });
    }
  }
  let text = q.qtext.replace(/^\d+\.\s*/, '').replace(/`/g, '').replace(/\n{2,}/g, '\n').trim();
  const correctCount = merged.filter((o) => o.correct).length;
  const m = /\((?:elija|escoja|seleccione|selecciona)\s+(dos|tres|cuatro|cinco)[^)]*\)/i.exec(text);
  if (m && COUNT[m[1].toLowerCase()] !== correctCount) text = text.replace(m[0], '(Elija todas las que correspondan)');
  return { options: merged, text, explanation: q.explanation.replace(/`/g, '').replace(/\s*\n+\s*/g, ' ').trim(), image: origImg[q.id] || '' };
}

// ---- Preguntas de unir pareja convertidas ----
const REF_SUB = 'Reformulada (era de unir/arrastrar)';
const conv = (question, options, correctIdx, explanation, image = '') => ({ question, options, correct_indices: [correctIdx], explanation, image });
const make = (prefix, opts, exp, image = '') => (stmt, i) => conv(`${prefix} ${stmt}`, opts, i, exp, image);

// 641 (parejas dadas por la explicación de la página)
const IPS = ['169.254.1.5', '127.0.0.1', '198.133.219.2', '240.2.6.255'];
const IPS_EXP = 'Bucle invertido: 127.0.0.1 (bloque 127.0.0.0/8, pruebas de la pila TCP/IP local). Experimental: 240.2.6.255 (bloque reservado 240.0.0.0/4). Pública: 198.133.219.2. Link-local: 169.254.1.5 (rango APIPA 169.254.0.0/16).';
const ip = make('¿Qué dirección IP es adecuada para esta descripción?', IPS, IPS_EXP);

// 636
const TOPO = ['Diagrama de topología física', 'Diagrama de topología lógica'];
const TOPO_EXP = 'La topología física muestra la ubicación de los dispositivos y el tendido de cables; la topología lógica muestra direcciones IP, subredes y cómo fluyen los datos.';
const topo = make('¿En qué tipo de diagrama de topología se suele identificar el siguiente elemento?', TOPO, TOPO_EXP);

// 633
const TCP = ['Tamaño de la ventana', 'Números de secuencia', 'Retransmisión', 'Acuse de recibo'];
const TCP_EXP = 'Tamaño de la ventana: bytes que el destino puede aceptar a la vez. Números de secuencia: permiten identificar segmentos faltantes. Retransmisión: administra los segmentos perdidos. Acuse de recibo: lo recibe el emisor antes de enviar más segmentos.';
const tcp = make('¿Qué mecanismo de TCP corresponde a la siguiente descripción?', TCP, TCP_EXP);

// 629
const MSG = ['Codificación del mensaje', 'Encapsulamiento del mensaje', 'Estimación de tamaño del mensaje'];
const MSG_EXP = 'Codificación: convierte la información a un formato aceptable para la transmisión. Encapsulamiento: coloca un formato de mensaje dentro de otro. Tamaño: divide un mensaje largo en partes antes de enviarlo.';
const msg = make('¿A qué término corresponde la siguiente descripción?', MSG, MSG_EXP);

// 609
const CAPAS = ['Capa 2', 'Capa 3', 'Capa 4'];
const CAPAS_EXP = 'Capa 2: dirección MAC de destino, encabezado 802.2 y FCS. Capa 3: dirección IP de origen y TTL. Capa 4: número de puerto de destino y número de acuse de recibo. (Destination Options no se utiliza.)';
const capa = make('¿A qué capa del modelo OSI pertenece el siguiente campo del encabezado?', CAPAS, CAPAS_EXP);

// 593
const IPMAC = ['Dirección IP', 'Dirección MAC'];
const IPMAC_EXP = 'IP: está en el encabezado de capa 3, se divide en porción de red y de host, y tiene 32 o 128 bits. MAC: está en el encabezado de capa 2, se divide en OUI e identificador único, y tiene 48 bits. (64 bits no se utiliza.)';
const ipmac = make('¿A qué tipo de dirección corresponde la siguiente característica?', IPMAC, IPMAC_EXP);

// 583
const FW = ['Filtrado de paquetes', 'Filtrado de URL', 'Traducción de direcciones de red (NAT)', 'Inspección de paquetes con estado', 'Filtrado de aplicaciones'];
const FW_EXP = 'Filtrado de aplicaciones: por número de puerto. Filtrado de paquetes: por dirección IP o MAC. Inspección de paquetes con estado: evita sesiones entrantes no solicitadas. Filtrado de URL: evita el acceso a sitios web. NAT no se utiliza en esta pregunta.';
const fw = make('¿Qué función del cortafuegos proporciona la siguiente protección a la red?', FW, FW_EXP);

// 581
const CAMPO = ['Direccionamiento', 'Detección de errores', 'Tipo', 'Inicio de trama'];
const CAMPO_EXP = 'Direccionamiento: ayuda a dirigir la trama hacia su destino. Detección de errores: comprueba si la trama se dañó durante la transferencia. Tipo: lo usa LLC para identificar el protocolo de capa 3. Inicio de trama: identifica el comienzo de la trama.';
const campo = make('¿Qué tipo de campo de trama corresponde a esta función?', CAMPO, CAMPO_EXP);

// 578
const P2P = ['Red entre pares (peer-to-peer)', 'Aplicación entre pares (peer-to-peer)'];
const P2P_EXP = 'En una red entre pares no se requiere un servidor dedicado y las funciones de cliente y servidor se establecen por solicitud. Una aplicación entre pares requiere una interfaz de usuario específica y un servicio en segundo plano.';
const p2p = make('¿A qué modelo corresponde la siguiente afirmación?', P2P, P2P_EXP);

// 536
const AMEN = ['Amenazas de mantenimiento', 'Amenazas de hardware', 'Amenazas ambientales', 'Amenazas eléctricas'];
const AMEN_EXP = 'Mantenimiento: mal manejo de componentes, falta de repuestos, cableado y etiquetado deficientes. Hardware: daño físico a equipos. Ambientales: temperatura y humedad extremas. Eléctricas: picos de voltaje, voltaje insuficiente, ruido y pérdida total de energía.';
const amen = make('¿Qué tipo de amenaza corresponde a la siguiente causa?', AMEN, AMEN_EXP);

// 503
const TRANS = ['TCP', 'UDP'];
const TRANS_EXP = 'FTP, HTTP y SMTP usan TCP (necesitan entrega confiable). DHCP y TFTP usan UDP.';
const trans = (proto, i) => conv(`¿Qué protocolo de transporte utiliza el protocolo de aplicación ${proto}?`, TRANS, i, TRANS_EXP);

// 492/502 (la explicación de la página da las direcciones; la imagen muestra las redes A=100, B=50, C=25, D=2 hosts)
const NET = ['192.168.0.0 /25', '192.168.0.128 /26', '192.168.0.192 /27', '192.168.0.224 /30'];
const NET_EXP = 'La red A necesita 192.168.0.0 /25 (128 direcciones); la red B, 192.168.0.128 /26 (64); la red C, 192.168.0.192 /27 (32); la red D, 192.168.0.224 /30 (4).';
const net = (red, n, i) => conv(`Consulte la figura. ¿Qué dirección de red y prefijo cumplen los requisitos de hosts utilizables de la Red ${red} (${n} hosts)?`, NET, i, NET_EXP, origImg['492']);

// 489 (la explicación de la página respalda las respuestas)
const SW = ['Store-and-forward', 'Cut-through'];
const SW_EXP = 'Store-and-forward siempre almacena la trama completa, verifica su CRC y su longitud antes de reenviar. Cut-through empieza a reenviar al recibir la dirección de destino, con menos latencia, y puede reenviar tramas corruptas o runt.';
const sw = make('¿A qué método de reenvío de un switch corresponde la siguiente característica?', SW, SW_EXP);

// 487
const V6 = ['ID de subred', 'Prefijo de enrutamiento global', 'ID de interfaz', 'Máscara de subred'];
const V6_EXP = 'ID de subred: lo usan las organizaciones para identificar subredes. Prefijo de enrutamiento global: la porción de red que asigna el proveedor. ID de interfaz: equivale a la porción de host de una dirección IPv4.';
const v6 = make('¿A qué componente de direccionamiento IPv6 corresponde la siguiente descripción?', V6, V6_EXP);

const converted = [
  ip('Una dirección de bucle invertido.', 1), ip('Una dirección experimental.', 3), ip('Una dirección pública.', 2), ip('Una dirección link-local.', 0),
  topo('Ubicación de una PC de escritorio en un aula.', 0), topo('Tendido de cables que conectan salas a armarios de cableado.', 0), topo('Dirección IP de un servidor.', 1),
  tcp('Número de bytes que un dispositivo de destino puede aceptar y procesar al mismo tiempo.', 0),
  tcp('Se utiliza para identificar segmentos faltantes de datos.', 1),
  tcp('Método para administrar segmentos de pérdida de datos.', 2),
  tcp('Recibido por un emisor antes de transmitir más segmentos en una sesión.', 3),
  msg('Proceso de convertir la información de un formato a otro aceptable para la transmisión.', 0),
  msg('Proceso de colocar un formato de mensaje dentro de otro.', 1),
  msg('Proceso de dividir un mensaje largo en partes individuales antes de enviarlo por la red.', 2),
  capa('Source IP Address (dirección IP de origen).', 1), capa('Destination Port Number (número de puerto de destino).', 2), capa('FCS (Frame Check Sequence).', 0),
  capa('Encabezado 802.2.', 0), capa('TTL.', 1), capa('Acknowledgment Number (número de acuse de recibo).', 2), capa('Destination MAC Address (dirección MAC de destino).', 0),
  ipmac('Está contenida en el encabezado de capa 3.', 0), ipmac('Está contenida en el encabezado de capa 2.', 1),
  ipmac('Se separa en OUI y un identificador único.', 1), ipmac('Se separa en una porción de red y un identificador único (host).', 0),
  ipmac('Tiene 32 o 128 bits.', 0), ipmac('Tiene 48 bits.', 1),
  fw('Impide el acceso por número de puerto.', 4), fw('Impide el acceso según la dirección IP o MAC.', 0),
  fw('Impide las sesiones entrantes no solicitadas.', 3), fw('Impide el acceso a sitios web.', 1),
  campo('Este campo comprueba si la trama se dañó durante la transferencia.', 1),
  campo('Este campo ayuda a dirigir la trama hacia su destino.', 0),
  campo('Este campo identifica el comienzo de una trama.', 3),
  campo('Este campo es utilizado por LLC para identificar el protocolo de capa 3.', 2),
  p2p('No se requiere un servidor dedicado.', 0), p2p('Las funciones de cliente y servidor se establecen por solicitud.', 0),
  p2p('Requiere una interfaz de usuario específica.', 1), p2p('Se requiere un servicio en segundo plano.', 1),
  amen('Manejo deficiente de componentes eléctricos clave (descarga electrostática), falta de repuestos críticos, cableado y etiquetado deficientes.', 0),
  amen('Daño físico a servidores, routers, switches, planta de cableado y estaciones de trabajo.', 1),
  amen('Extremos de temperatura (demasiado calor o demasiado frío) o extremos de humedad (demasiado húmedo o demasiado seco).', 2),
  amen('Picos de voltaje, voltaje de alimentación insuficiente (brownouts), energía no acondicionada (ruido) y pérdida total de energía.', 3),
  trans('FTP', 0), trans('HTTP', 0), trans('SMTP', 0), trans('DHCP', 1), trans('TFTP', 1),
  net('A', 100, 0), net('B', 50, 1), net('C', 25, 2), net('D', 2, 3),
  sw('Baja latencia.', 1), sw('Puede reenviar runt frames.', 1), sw('Comienza a reenviar cuando se recibe la dirección de destino.', 1),
  sw('Siempre almacena la trama completa.', 0), sw('Realiza la CRC antes de reenviar.', 0), sw('Revisa la longitud de la trama antes de reenviar.', 0),
  v6('Las organizaciones utilizan esta parte de la dirección para identificar subredes.', 0),
  v6('El proveedor asigna esta porción de red de la dirección.', 1),
  v6('Esta parte de la dirección es equivalente a la porción de host de una dirección IPv4.', 2),
];

// ---- Filas principales ----
const mainSrc = qs.filter((q) => !MATCHING.has(q.id) && !DUPLICATES.has(q.id));
const mainClean = mainSrc.map((q) => ({ q, c: clean(q) }));
const bad = mainClean.filter(({ c }) => c.options.length < 2 || !c.options.some((o) => o.correct));
if (bad.length) throw new Error('Preguntas sin opciones o sin correcta: ' + bad.map((b) => b.q.id).join(','));

console.log(`principales: ${mainClean.length} | reformuladas: ${converted.length} | descartadas: duplicado ${[...DUPLICATES].join(',')}`);
if (DRY) {
  const multi = mainClean.filter(({ c }) => c.options.filter((o) => o.correct).length > 1);
  const changed = mainClean.filter(({ q, c }) => c.options.length !== q.options.length);
  console.log('multi:', multi.length, '| con opciones fusionadas:', changed.map(({ q }) => q.id).join(',') || 'ninguna', '| con imagen:', mainClean.filter(({ c }) => c.image).length);
  const tricky = mainClean.filter(({ c }) => /\((?:elija|escoja|seleccione|selecciona)/i.test(c.text) === false && c.options.filter((o) => o.correct).length > 1);
  console.log('multi sin "(Elija N)" en el enunciado:', tricky.length, tricky.slice(0, 6).map(({ q, c }) => q.id + ':' + c.text.slice(0, 60).replace(/\n/g, ' ')).join(' | '));
  process.exit(0);
}

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
const maxGroup = Math.max(existing.reduce((m, r) => Math.max(m, r.group_number ?? 0), 0), ...modules.flatMap((m) => m.groups));

let qn = maxQ;
let nextGroup = maxGroup + 1;
const nextQid = () => `Q${String(++qn).padStart(3, '0')}`;

const mainRows = mainClean.map(({ c }, i) => {
  const correct_indices = c.options.map((o, idx) => (o.correct ? idx : -1)).filter((idx) => idx >= 0);
  return {
    qid: nextQid(), topic: TOPIC, subtopic: 'Examen final', question: c.text, question_image: c.image,
    options: c.options.map((o) => o.text), option_images: c.options.map(() => ''),
    correct_index: correct_indices[0], correct_indices, explanation: c.explanation, difficulty: 'medium',
    group_number: nextGroup + Math.floor(i / CHUNK),
  };
});
const mainGroups = [...new Set(mainRows.map((r) => r.group_number))];
nextGroup += mainGroups.length;

const refRows = converted.map((c, i) => ({
  qid: nextQid(), topic: TOPIC, subtopic: REF_SUB, question: c.question, question_image: c.image,
  options: c.options, option_images: c.options.map(() => ''),
  correct_index: c.correct_indices[0], correct_indices: c.correct_indices, explanation: c.explanation, difficulty: 'medium',
  group_number: nextGroup + Math.floor(i / CHUNK),
}));
const refGroups = [...new Set(refRows.map((r) => r.group_number))];

// Inserta en lotes para no exceder el tamaño de la petición.
const all = [...mainRows, ...refRows];
for (let i = 0; i < all.length; i += 50) {
  const { error } = await supabase.from('questions').insert(all.slice(i, i + 50));
  if (error) throw error;
}
console.log('Insertadas', mainRows.length, 'principales (grupos', mainGroups.length, ') y', refRows.length, 'reformuladas (grupos', refGroups.length, ')');

// ---- Módulos: justo debajo de "Parcial final · Módulos 1-17" ----
const now = new Date().toISOString();
const newMain = {
  id: `mod-${Date.now().toString(36)}-a`, name: MAIN_NAME, description: 'Examen final CCNA1 v7 ITN (ccnadesdecero.es)',
  color: 'teal', icon: 'file-text', position: 0, groups: mainGroups, created_at: now,
};
const newRef = {
  id: `mod-${Date.now().toString(36)}-b`, name: REF_NAME,
  description: 'Preguntas que en el examen original eran de "unir pareja"; aquí quedan como opción múltiple y en orden fijo. Respuestas: de la explicación de la página cuando la trae; si no, del contenido estándar del CCNA.',
  color: 'violet', icon: 'brain', position: 0, groups: refGroups, ordered: true, created_at: now,
};
const byPos = (a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.created_at ?? '').localeCompare(b.created_at ?? '');
const sorted = [...modules].sort(byPos);
const at = sorted.findIndex((m) => m.name === AFTER);
sorted.splice(at + 1, 0, newMain, newRef);
const renumbered = sorted.map((m, i) => ({ ...m, position: i }));
const { error: upErr } = await supabase.from('app_state').update({ settings: { ...settings, modules: renumbered } }).eq('id', 1);
if (upErr) throw upErr;
console.log('Módulos creados bajo', AFTER + ':', renumbered.map((m) => `${m.position}:${m.name}`).slice(0, 5).join(' | '));
