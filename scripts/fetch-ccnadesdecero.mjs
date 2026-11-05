// Descarga y parsea el examen final CCNA1 v7 de ccnadesdecero.es (plugin Quiz Maker).
// La respuesta correcta de cada pregunta viene en un JSON base64: window.quizOptions_N['id'] = base64({"question_answer":{"idRespuesta":"0|1"}}).
// Uso: node scripts/fetch-ccnadesdecero.mjs <url> > salida.json
const URL = process.argv[2] || 'https://ccnadesdecero.es/ccna1-v7-itn-examen-final-respuestas/';
const html = await (await fetch(URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();

const decode = (s) =>
  s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–').replace(/&#8217;/g, '’').replace(/&#8220;/g, '“').replace(/&#8221;/g, '”').replace(/&#039;/g, "'");
const text = (s) => decode(s.replace(/<br\s*\/?>/g, '\n').replace(/<\/p>/g, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

const start = html.indexOf("id='ays-quiz-container-");
const parts = html.slice(start).split(/<div class='step[^']*'\s+data-question-id='/).slice(1);

const questions = [];
for (const part of parts) {
  const id = /^(\d+)'/.exec(part)?.[1];
  const type = /data-type='([^']+)'/.exec(part)?.[1];
  const qBlock = /<div class='ays_quiz_question'>([\s\S]*?)<\/div>\s*<div class='ays-quiz-answers/.exec(part)?.[1];
  if (!id || !qBlock) continue;
  const images = [...qBlock.matchAll(/<img[^>]*?(?:data-spai-egr[^>]*)?src="(https?:[^"]+)"/g)].map((m) => m[1]);

  const answersBlock = /<div class='ays-quiz-answers[\s\S]*?(?=<script>if\(typeof window\.quizOptions_)/.exec(part)?.[0] ?? '';
  const answers = [...answersBlock.matchAll(/id='ays-answer-(\d+)-\d+'\s+value='\d+'\s*\/>\s*<label[^>]*>([\s\S]*?)<\/label>/g)].map((m) => ({ id: m[1], label: text(m[2]) }));

  const b64 = /quizOptions_\d+\['\d+'\] = '([^']+)'/.exec(part)?.[1];
  const map = b64 ? JSON.parse(Buffer.from(b64, 'base64').toString('utf8')).question_answer : {};

  // Explicación / respuesta correcta mostrada por el plugin (si existe)
  const expl = /ays_questtion_explanation[^>]*>([\s\S]*?)<\/div>/.exec(part)?.[1];

  questions.push({
    id,
    type,
    qtext: text(qBlock),
    images,
    options: answers.map((a) => ({ text: a.label, correct: map[a.id] === '1' })),
    explanation: expl ? text(expl) : '',
  });
}
console.log(JSON.stringify(questions));
