// Convierte las 4 preguntas de "unir pareja" / "arrastrar y soltar" del examen Módulos 16-17
// (que la app no puede renderizar como tal) en preguntas de opción múltiple equivalentes.
// Idempotente: si ya existe una pregunta con el mismo `question`, no la duplica.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const TOPIC = 'Módulos 16 - 17';
const SUBTOPIC = 'Seguridad de red';
const GROUP = 27;

const DEBILIDAD_OPTS = ['debilidad tecnológica', 'debilidad en la configuración', 'debilidad de la directiva de seguridad'];
const DEBILIDAD_EXPL = 'Tema 16.1.2\nUn empleado que está tratando de adivinar la contraseña de otro usuario ejemplifica no una debilidad sino un ataque (por eso no aparece como opción correcta aquí).';

const AMENAZA_OPTS = ['Robo de información', 'Robo de identidad', 'Pérdida de datos', 'Interrupción del servicio'];
const AMENAZA_EXPL = 'Tema 16.1.2\nCuando un intruso obtiene acceso a una red, las amenazas comunes son: robo de información, robo de identidad, pérdida o manipulación de datos e interrupción del servicio. La decodificación de la contraseña de un usuario conocido es un tipo de ataque de acceso, no una de estas amenazas.';

const FIREWALL_OPTS = ['Inspección de paquetes con estado', 'Filtrado de URL', 'Filtrado de aplicaciones', 'Filtrado de paquetes'];
const FIREWALL_EXPL = 'Tema 16.3.6\nInspección de paquetes con estado: impide o permite el acceso en función de si el tráfico responde a solicitudes de hosts internos.\nFiltrado de URL: evita o permite el acceso a sitios web según palabras clave o URL específicos.\nFiltrado de aplicaciones: impide o permite el acceso en función de los números de puerto utilizados en la solicitud.\nFiltrado de paquetes: evita o permite el acceso según las direcciones IP o MAC del origen o del destino.';

function matchQuestion(scenario, opts, correctIdx, explanation) {
  return {
    topic: TOPIC,
    subtopic: SUBTOPIC,
    question: `¿Qué opción corresponde a la siguiente situación? ${scenario}`,
    question_image: '',
    options: opts,
    option_images: opts.map(() => ''),
    correct_index: correctIdx,
    correct_indices: [correctIdx],
    explanation,
    difficulty: 'medium',
    group_number: GROUP,
  };
}

const rows = [
  // Q1 original: "Haga coincidir cada debilidad con un ejemplo"
  matchQuestion('Al implementar una lista de acceso en un router, un ingeniero de red no filtró un tipo de tráfico maligno.', DEBILIDAD_OPTS, 1, DEBILIDAD_EXPL),
  matchQuestion('Un ingeniero de red está examinando el sistema operativo de un dispositivo de red en busca de vulnerabilidades.', DEBILIDAD_OPTS, 0, DEBILIDAD_EXPL),
  matchQuestion('El administrador de la red no tomó en cuenta las consecuencias de que los usuarios no autorizados accedan a la red.', DEBILIDAD_OPTS, 2, DEBILIDAD_EXPL),

  // Q2 original: "Una el tipo de amenaza de seguridad de la información con la situación"
  matchQuestion('Instalar código de virus para destruir las grabaciones de vigilancia de ciertos días.', AMENAZA_OPTS, 2, AMENAZA_EXPL),
  matchQuestion('Hacerse pasar por otra persona utilizando información personal robada para solicitar una tarjeta de crédito.', AMENAZA_OPTS, 1, AMENAZA_EXPL),
  matchQuestion('Impedir que los usuarios accedan a un sitio web por medio del envío de una gran cantidad de solicitudes de enlace en un período breve.', AMENAZA_OPTS, 3, AMENAZA_EXPL),
  matchQuestion('Obtener documentos comerciales secretos de manera ilegal.', AMENAZA_OPTS, 0, AMENAZA_EXPL),

  // Q6 original: "Haga coincidir la descripción con el tipo de filtrado del firewall"
  matchQuestion('Impide o permite el acceso en función de si el tráfico responde a solicitudes de hosts internos.', FIREWALL_OPTS, 0, FIREWALL_EXPL),
  matchQuestion('Evita o permite el acceso a sitios web según palabras clave o URL específicos.', FIREWALL_OPTS, 1, FIREWALL_EXPL),
  matchQuestion('Impide o permite el acceso en función de los números de puerto utilizados en la solicitud.', FIREWALL_OPTS, 2, FIREWALL_EXPL),
  matchQuestion('Evita o permite el acceso según las direcciones IP o MAC del origen o del destino.', FIREWALL_OPTS, 3, FIREWALL_EXPL),

  // Q9 original: "Identifique los pasos necesarios para configurar un switch para SSH" (arrastrar, 5 de 7 correctos)
  {
    topic: TOPIC,
    subtopic: SUBTOPIC,
    question: 'Identifique los pasos necesarios para configurar un switch para SSH. (Elija todas las que correspondan; no se utilizan todas las opciones).',
    question_image: '',
    options: ['Crear un usuario local.', 'Generar claves RSA.', 'Usar el comando login.', 'Configurar un nombre de dominio.', 'Usar el comando login local.', 'Usar el comando password cisco.', 'Usar el comando transport input ssh.'],
    option_images: Array(7).fill(''),
    correct_index: 0,
    correct_indices: [0, 1, 3, 4, 6],
    explanation: 'Tema 16.4.4\nLos comandos login y password cisco se usan con la configuración de switch Telnet, no SSH.',
    difficulty: 'medium',
    group_number: GROUP,
  },
];

const { data: existing, error: exErr } = await supabase.from('questions').select('qid,question');
if (exErr) throw exErr;
const existingTexts = new Set((existing ?? []).map(r => r.question));
const maxNum = (existing ?? []).reduce((max, row) => {
  const m = /^Q(\d+)$/.exec(row.qid || '');
  return m ? Math.max(max, parseInt(m[1], 10)) : max;
}, 0);

const toInsert = rows.filter(r => !existingTexts.has(r.question));
if (toInsert.length === 0) {
  console.log('Las preguntas de "unir pareja" ya estaban cargadas, no se insertó nada.');
} else {
  const withQid = toInsert.map((r, i) => ({ qid: `Q${String(maxNum + i + 1).padStart(3, '0')}`, ...r }));
  const { error: insErr } = await supabase.from('questions').insert(withQid);
  if (insErr) throw insErr;
  console.log('Insertadas', withQid.length, 'preguntas de conversión (de', rows.length, 'generadas) ->', withQid[0].qid, '..', withQid[withQid.length - 1].qid);
}
