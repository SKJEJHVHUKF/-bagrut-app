/**
 * sweep-prose.ts — remove RTL dash clutter from a topic's PROSE fields.
 *
 *   npx tsx scripts/sweep-prose.ts "<topic>" [--apply]
 *
 * The solution pipeline (audit/merge/apply-solutions) owns steps, answers,
 * question/prompt/context and hints. Everything ELSE a student reads —
 * intro, concepts[].body, pitfalls, examTips, summary, keyPoints, tagline,
 * lesson titles and `teach`, formula notes and variable meanings, diagram
 * captions, worked-example problems, distractorNotes, wrongAnswers notes and
 * solution `explanation` — has no field in that pipeline and stays dirty
 * unless something sweeps it. That gap cost a second round on גאומטריה.
 *
 * Two defects, both of which read as a minus sign beside real minus signs:
 *   1. a Hebrew prefix glued by maqaf to a math island or a digit  (ב-$2$)
 *   2. an em-dash touching a math island                          ($x$ — כלומר)
 * A dash far from math is ordinary Hebrew typography and is LEFT ALONE.
 *
 * Patching is by exact string-literal replacement in the source, with a
 * paragraph-by-paragraph fallback for `summary` fields built by .join('\n\n').
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { getLesson } from '../content/lessons';

const topic = process.argv[2];
const apply = process.argv.includes('--apply');
if (!topic) { console.error('usage: sweep-prose.ts "<topic>" [--apply]'); process.exit(2); }

const L = getLesson('math5', topic);
if (!L) { console.error(`no lesson for topic ${topic}`); process.exit(2); }

/** Fields the solution pipeline owns — never touched here. */
const OWNED = new Set(['steps', 'finalAnswer', 'final_answer', 'answer', 'question', 'prompt', 'context', 'hint', 'hints']);
/** Identifiers and raw markup — not prose. */
const SKIP = new Set(['id', 'latex', 'sym', 'subject', 'topic', 'kind', 'difficulty', 'answer_type', 'subTopicId',
  'topic_tag', 'type', 'emoji', 'svg', 'viewBox', 'value', 'values', 'expected', 'answerLabels', 'answers', 'correct', 'fn']);

// ---- the noun a glued prefix should attach to, from the island's shape ----
const ANGLE = /^\$\\angle|^\$\\(alpha|beta|gamma|theta|varphi|phi)\b|^\$-?\d+(\.\d+)?\^?\\?circ|^\$-?\d+(\.\d+)?°/;
const TRI = /^\$\\triangle/;
const FUNC = /^\$\\(sin|cos|tan|cot)\b/;
const SEG = /^\$[A-Z]{2}\$/;
const PT = /^\$[A-Z]\$/;
const VAR = /^\$[a-z]\$/;
const NUM = /^\$-?\d+(\.\d+)?\$/;
const FRAC = /^\$\\[dt]?frac/;
const REL = /^\$[^$]*(=|<|>|\\le|\\ge|\\parallel|\\perp|\\ne)[^$]*\$/;

function noun(island: string): string {
  if (TRI.test(island)) return 'משולש';
  if (ANGLE.test(island)) return 'זווית';
  if (FUNC.test(island)) return 'ביטוי';
  if (SEG.test(island)) return 'קטע';
  if (PT.test(island)) return 'נקודה';
  if (VAR.test(island)) return 'משתנה';
  if (NUM.test(island)) return 'מספר';
  if (FRAC.test(island)) return 'ערך';
  return '';
}

const WORD: Record<string, string> = { 2: 'בשניים', 3: 'בשלושה', 4: 'בארבעה', 5: 'בחמישה', 6: 'בשישה' };

/**
 * Substring rewrites the generic rules deliberately refuse to guess at: a
 * single-letter prefix glued to a RELATION, a DOMAIN or a bare digit, where the
 * right Hebrew noun depends on what the sentence is doing ("in the range",
 * "by the factor", "at the point", "into the form"). Applied before the generic
 * rules. Each entry here was a real leftover, not a hypothetical.
 */
const MANUAL: [RegExp | string, string][] = [
  // domains and ranges
  [/\bפתור ב-(\$\[)/g, 'פתור בתחום $1'],
  [/\bפתרונות ב-(\$\[)/g, 'פתרונות בתחום $1'],
  [/ ב-(\$\[[^$]*\$)/g, ' בתחום $1'],
  [/ ל-(\$\[[^$]*\$)/g, ' לתחום $1'],
  // multiply / convert / substitute
  [/כופלים ב-(\$)/g, 'כופלים בגורם $1'],
  [/המר ל-(\$)/g, 'המר לצורה $1'],
  [/לכתוב כ-(\$)/g, 'לכתוב בצורה $1'],
  [/הצגת (\$[^$]*\$) כ-(\$)/g, 'הצגת $1 בצורה $2'],
  [/השתמש ב-(\$)/g, 'השתמש בזהות $1'],
  [/נגזר ל-(\$)/g, 'נגזר לביטוי $1'],
  [/במקום ב-(\$[A-Za-z]=)/g, 'במקום במקדם $1'],
  [/בדיקה ב-(\$[a-z]=)/g, 'בדיקה עבור $1'],
  [/המחזור ב-(\$)/g, 'המחזור בנקודה $1'],
  [/בין (\$\+\$) ל-(\$-\$)/g, 'בין הסימן $1 לסימן $2'],
  [/ול-(\$\\cos)/g, 'ולמשוואה $1'],
  [/ה-(\$x\$)-ים/g, 'ערכי $1'],
  [/(\$[A-Z]\$) ו-(\$[A-Z]\$)/g, '$1 וגם $2'],
  // bare digits after a one-letter prefix — spell the number out
  ['ב-2 שניות', 'בשתי שניות'],
  ['מ-4 המרובעים', 'מארבעת המרובעים'],
  ['ב-5 יחידות', 'בחמש יחידות'],
  ['ב-3 מתוך 5 בגרויות', 'בשלוש מתוך חמש בגרויות'],
  ['שונים מ-1', 'שונים מאחד'],
  [/חלוקה ב-(\$)/g, 'חלוקה בגורם $1'],
  [/לחלק ב-(\$)/g, 'לחלק בגורם $1'],
  [/חושב כ-(\$)/g, 'חושב כמו הערך $1'],
  [/חוזרת ל-(\$)/g, 'חוזרת לביטוי $1'],
  [/נשכח ה-(\$)/g, 'נשכח הגורם $1'],
  // a dash the sweep already turned into a full stop, leaving a fragment
  ['. מקסימום (', ' יש מקסימום ('],
  ['. מינימום (', ' יש מינימום ('],
];

function fixPrefix(s: string): string {
  for (const [from, to] of MANUAL) s = typeof from === 'string' ? s.split(from).join(to) : s.replace(from, to);
  // Specific phrasings first — each generic rule below misfires on one of these.
  s = s
    .replace(/(הכפל\S*|כפל|מכפיל\S*|הכפלה|להכפיל|מוכפל\S*)(\s+\S+)?\s+ב-(\$[^$\n]+\$)/g, (_m, v: string, mid: string, isl: string) => `${v}${mid ?? ''} פי ${isl}`)
    .replace(/(לחלק|חילק\S*|חלוקה|מחלק\S*)(\s+\S+)?\s+ב-\$(\d+)\$/g, (m, v: string, mid: string, n: string) => (WORD[n] ? `${v}${mid ?? ''} ${WORD[n]}` : m))
    .replace(/שווה ל-(\$[^$\n]+\$)/g, 'שווה לערך $1')
    .replace(/(מסתכ[מם]\S*) ל-(\$[^$\n]+\$)/g, '$1 לסכום $2')
    .replace(/(גדול\S*|קט[נן]\S*|פחות|יותר) מ-(\$[^$\n]+\$)/g, '$1 מהערך $2')
    .replace(/([א-ת]{2,})-(\d+)\b/g, (m, w: string, n: string) => (WORD[n] ? m : `${w} ${n}`)); // "מ-4 המשפטים" → "מ 4"… handled below

  return s.replace(/(^|[^א-ת])(כש|שב|ש|ו|ב|ל|מ|ומ|וב|ה|כ)-(\$[^$\n]+\$)/g, (m, pre: string, p: string, island: string) => {
    const nn = noun(island);
    const rel = REL.test(island);
    switch (p) {
      case 'כש': return `${pre}כאשר ${island}`;
      case 'שב': return nn ? `${pre}שב${nn} ${island}` : m;
      case 'ש': return rel ? `${pre}שמתקיים ${island}` : nn ? `${pre}שה${nn} ${island}` : m;
      case 'ו': return `${pre}וגם ${island}`;
      case 'ב': return rel ? m : nn ? `${pre}ב${nn} ${island}` : m;
      case 'ל': return rel ? `${pre}לכך שמתקיים ${island}` : nn ? `${pre}ל${nn} ${island}` : m;
      case 'מ': return nn ? `${pre}מה${nn} ${island}` : m;
      case 'ומ': return nn ? `${pre}ומה${nn} ${island}` : m;
      case 'וב': return nn ? `${pre}וב${nn} ${island}` : m;
      case 'כ': return nn ? `${pre}כמו ה${nn} ${island}` : m;
      // 'ה-$\cos$' is a DEFINITE ARTICLE on the island, not a preposition:
      // it needs the noun spelled out ("הביטוי $\cos$"), never "ה $\cos$".
      case 'ה': return nn ? `${pre}ה${nn} ${island}` : m;
      default: return m;
    }
  });
}

const CONNECTIVE = /^(ו|אבל|כי|אז|רק|כלומר|ולכן|לכן|ומכאן|ואז|וזה|וזו|כך|שזה|שהיא|שהוא|למשל)/;

function fixDash(s: string): string {
  return s
    .replace(/(\$[^$\n]+\$)(\**)\s+[—–]\s+(?=\S)/g, (m, island: string, bold: string, off: number) => {
      const rest = s.slice(off + m.length);
      const lineStart = s.lastIndexOf('\n', off) + 1;
      const lead = s.slice(lineStart, off).replace(/[#>*\-\s]+/g, ' ').trim();
      if (CONNECTIVE.test(rest)) return `${island}${bold}, `;
      // A conditional must never be cut by a full stop — "אם רואים $\pi$ — רדיאנים"
      // would become two fragments. Split on any sentence end (a bold lead like
      // "**איך לזהות?**" ends one), then look for the conditional ANYWHERE in the
      // remaining clause, not only at its start.
      const lastSentence = lead.split(/[.?!]\s+/).pop() ?? '';
      if (/(^|\s)(אם|כאשר|כש\S+|במקרה ש)\b/.test(lastSentence)) return `${island}${bold}, `;
      if (lead.split(/\s+/).filter(Boolean).length <= 3) return `${island}${bold}: `;
      return `${island}${bold}. `;
    })
    .replace(/(\S)\s+[—–]\s+(?=\$[^$\n]+\$)/g, (_m, prev: string) => (prev === '"' ? `${prev} ` : `${prev}: `));
}

const transform = (s: string) => fixDash(fixPrefix(s));

// ---- walk the Lesson and collect every prose string ----------------------
const strings: { where: string; s: string }[] = [];
function walk(v: unknown, p: string, key: string) {
  if (typeof v === 'string') { if (!OWNED.has(key) && !SKIP.has(key) && v.trim()) strings.push({ where: p, s: v }); return; }
  if (Array.isArray(v)) { if (OWNED.has(key) || SKIP.has(key)) return; v.forEach((x, i) => walk(x, `${p}[${i}]`, key)); return; }
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v as Record<string, unknown>)) { if (OWNED.has(k) || SKIP.has(k)) continue; walk(x, `${p}.${k}`, k); }
}
walk(L, 'L', '');

// ---- patch the source ------------------------------------------------------
function contentFiles(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) contentFiles(p, out);
    else if (n.endsWith('.ts') && n !== 'types.ts' && n !== 'index.ts') out.push(p);
  }
  return out;
}
const FILES = contentFiles('content/lessons/math5');
const texts = new Map(FILES.map((f) => [f, readFileSync(f, 'utf8')]));

const lits = (s: string) => {
  const bs = s.replace(/\\/g, '\\\\');
  return [`'${bs.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`, `"${bs.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`, `\`${bs.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``];
};
function patch(from: string, to: string): 'whole' | 'paragraphs' | 'MISS' | 'AMBIG' {
  const one = (f: string, t: string): 'ok' | 'MISS' | 'AMBIG' => {
    const fl = lits(f), tl = lits(t);
    for (const [file, text] of texts) for (let q = 0; q < 3; q++) {
      const n = text.split(fl[q]).length - 1;
      if (n === 1) { texts.set(file, text.replace(fl[q], () => tl[q])); return 'ok'; }
      if (n > 1) return 'AMBIG';
    }
    return 'MISS';
  };
  const w = one(from, to);
  if (w !== 'MISS') return w === 'ok' ? 'whole' : 'AMBIG';
  const fp = from.split('\n\n'), tp = to.split('\n\n');
  if (fp.length !== tp.length) return 'MISS';
  for (let i = 0; i < fp.length; i++) if (fp[i] !== tp[i] && one(fp[i], tp[i]) !== 'ok') return 'MISS';
  return 'paragraphs';
}

const LEFT = /[א-ת]-(?=\$|\d)|\$ ?[—–] | [—–] ?\$/g;
let changed = 0, miss = 0, still = 0;
for (const { where, s } of strings) {
  const t = transform(s);
  if (t === s) continue;
  changed++;
  const how = apply ? patch(s, t) : 'dry';
  if (how === 'MISS' || how === 'AMBIG') miss++;
  const rem = t.match(LEFT);
  if (rem) still += rem.length;
  console.log(`\n## ${where} ${how}${rem ? `  ! still: ${rem.join(' ')}` : ''}`);
  const a = s.split('\n'), b = t.split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) console.log(`  - ${(a[i] ?? '').slice(0, 200)}\n  + ${(b[i] ?? '').slice(0, 200)}`);
}
if (apply) for (const [f, t] of texts) writeFileSync(f, t, 'utf8');
console.log(`\n${changed} strings changed${apply ? ' (written)' : ' (dry)'}; ${miss} could not be located; ${still} defect(s) still left inside changed strings.`);
if (miss) process.exit(1);
