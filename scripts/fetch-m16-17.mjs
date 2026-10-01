// Descarga y parsea el examen "Módulos 16 - 17" de examenredes.com.
// Salida: JSON en stdout con { num, qtext, options:[{text,correct}], explanation, images[] }
const URL = 'https://examenredes.com/modulos-16-17-creacion-y-proteccion-de-un-examen-de-redes-pequenas-respuestas/';

const res = await fetch(URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const html = await res.text();

const entryMatch = html.match(/<div class="entry">([\s\S]*?)<div class="clear">/);
if (!entryMatch) throw new Error('No se encontró el bloque .entry');
const entry = entryMatch[1];

// Tokenizar por elementos de nivel superior: <p>, <ul>, <div class="box...">, <figure...>
const tokenRe = /<p>([\s\S]*?)<\/p>|<ul>([\s\S]*?)<\/ul>|<div class="box[^"]*">([\s\S]*?)<\/div>\s*<\/div>|<figure[^>]*>([\s\S]*?)<\/figure>/g;

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '–').replace(/&#8217;/g, '’')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8220;/g, '“').replace(/&#8221;/g, '”')
    .replace(/\s+/g, ' ').trim();
}

const questions = [];
let current = null;
let m;
while ((m = tokenRe.exec(entry)) !== null) {
  const [, pContent, ulContent, boxContent, figureContent] = m;
  if (pContent !== undefined) {
    const text = stripTags(pContent);
    const qm = /^(\d+)\.\s/.exec(text);
    if (qm && pContent.includes('<strong>')) {
      if (current) questions.push(current);
      current = { num: parseInt(qm[1], 10), qtext: text, options: [], explanation: '', images: [] };
      const imgs = [...pContent.matchAll(/<img[^>]*src="([^"]+)"/g)].map(x => x[1]);
      current.images.push(...imgs);
    } else if (current && current.options.length === 0) {
      const imgs = [...pContent.matchAll(/<img[^>]*src="([^"]+)"/g)].map(x => x[1]);
      current.images.push(...imgs);
    }
  } else if (ulContent !== undefined && current) {
    const liRe = /<li( class="([^"]*)")?>([\s\S]*?)<\/li>/g;
    let lm;
    while ((lm = liRe.exec(ulContent)) !== null) {
      current.options.push({ text: stripTags(lm[3]), correct: (lm[2] || '').includes('correct_answer') });
    }
  } else if (boxContent !== undefined && current && current.options.length > 0) {
    current.explanation += stripTags(boxContent) + '\n';
  } else if (figureContent !== undefined && current && current.options.length === 0) {
    const imgs = [...figureContent.matchAll(/<img[^>]*src="([^"]+)"/g)].map(x => x[1]);
    current.images.push(...imgs);
  }
}
if (current) questions.push(current);

console.log(JSON.stringify(questions, null, 2));
