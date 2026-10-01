// Genera supabase/insert_modulos_16_17.sql a partir del JSON parseado de examenredes.com.
// Sigue el mismo patrón que insert_modulos_11_13.sql (idempotente, seguro de ejecutar dos veces).
import fs from 'node:fs';

const qs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const picked = qs.filter(q => q.options.length > 0);

function temaMajor(q) {
  const m = /Tema\s+(\d+)\./.exec(q.explanation);
  return m ? parseInt(m[1], 10) : 17; // Q48 no trae "Tema": es de la familia de comandos de diagnóstico (17.5.x)
}

function sqlStr(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function sqlTextArray(arr) {
  return 'ARRAY[' + arr.map(sqlStr).join(',') + ']::text[]';
}

function sqlIntArray(arr) {
  return 'ARRAY[' + arr.join(',') + ']::int[]';
}

// Quita el "N. " inicial del enunciado (el número ya vive en el qid).
function cleanQuestion(qtext) {
  return qtext.replace(/^\d+\.\s*/, '');
}

const rows = picked.map((q, i) => {
  const tema = temaMajor(q);
  const subtopic = tema === 16 ? 'Seguridad de red' : 'Solución de problemas en la red';
  const grp = tema === 16 ? 27 : 28;
  const opts = q.options.map(o => o.text);
  const correctIdx = q.options.findIndex(o => o.correct);
  const correctIndices = q.options.map((o, idx) => (o.correct ? idx : -1)).filter(idx => idx >= 0);
  const img = q.images[0] || '';
  const explanation = q.explanation.trim();
  const n = i + 1;
  return `(${n},${sqlStr(subtopic)},${sqlStr(cleanQuestion(q.qtext))},${sqlStr(img)},${sqlTextArray(opts)},${correctIdx},${sqlIntArray(correctIndices)},${sqlStr(explanation)},'medium',${grp})`;
});

const sql = `-- Módulos 16 - 17: Creación y protección de un examen de redes pequeñas (${rows.length} preguntas, grupos 27-28).
-- Seguro de ejecutar dos veces (no inserta si ya existen preguntas de este módulo).
DO $$
DECLARE
  base_qid int;
BEGIN
  IF EXISTS (SELECT 1 FROM questions WHERE topic = 'Módulos 16 - 17') THEN
    RETURN;
  END IF;
  SELECT COALESCE(MAX((regexp_match(qid, '^Q(\\d+)$'))[1]::int), 0) INTO base_qid FROM questions;

  INSERT INTO questions (qid, topic, subtopic, question, question_image, options, option_images, correct_index, correct_indices, explanation, difficulty, group_number)
  SELECT 'Q' || lpad((base_qid + v.n)::text, 3, '0'), 'Módulos 16 - 17', v.subtopic, v.question, v.img, v.opts,
         ARRAY(SELECT '' FROM generate_series(1, array_length(v.opts, 1)))::text[], v.ci, v.cis, v.expl, v.diff, v.grp
  FROM (VALUES
${rows.join(',\n')}
  ) AS v(n, subtopic, question, img, opts, ci, cis, expl, diff, grp);
END $$;
`;

fs.writeFileSync(process.argv[3], sql);
console.log('rows:', rows.length, '-> written to', process.argv[3]);
