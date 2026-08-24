/**
 * rtl-prose.ts — the rewrite rules that remove RTL dash clutter from Hebrew
 * math prose, shared by every sweep.
 *
 * Two defects, both of which read as a MINUS SIGN when they sit beside real
 * minus signs (the owner's original report):
 *   1. a Hebrew prefix glued by maqaf to a math island or a digit — `ב-$2$`
 *   2. an em-dash touching a math island — `$x$ — כלומר`
 * A dash far from any math is ordinary Hebrew typography and is LEFT ALONE;
 * scoping the dash rule by ADJACENCY is what stops it over-correcting.
 *
 * The fix is never "delete the maqaf" — that jams two words together. It is to
 * re-attach the prefix to a real Hebrew noun chosen from the ISLAND'S SHAPE
 * (`ב-$\angle A$` → `בזווית $\angle A$`), which is why `noun()` exists.
 */

// ---- what kind of thing is inside the island? ------------------------------
const ANGLE = /^\$\\angle|^\$\\(alpha|beta|gamma|theta|varphi|phi)\b|^\$-?\d+(\.\d+)?\^?\\?circ|^\$-?\d+(\.\d+)?°/;
const TRI = /^\$\\triangle/;
const FUNC = /^\$\\(sin|cos|tan|cot)\b/;
const SEG = /^\$[A-Z]{2}\$/;
const PT = /^\$[A-Z]\$/;
const VAR = /^\$[a-z]\$/;
const NUM = /^\$-?\d+(\.\d+)?\$/;
const FRAC = /^\$\\[dt]?frac/;
/** An island that states a relation reads as a clause, not as a noun. */
const REL = /^\$[^$]*(=|<|>|\\le|\\ge|\\parallel|\\perp|\\ne)[^$]*\$/;

const SQRT = /^\$\\sqrt/;
/** A trig function or an operator anywhere inside ⇒ it reads as an expression. */
const EXPR = /\\(sin|cos|tan|cot|sqrt|frac|dfrac|tfrac|pi)\b|[+\-*/^]/;

export function noun(raw: string): string {
  // KaTeX spacing macros at the head hide the shape — `$\;1 + 2\sin x$`.
  const island = raw.replace(/^\$\\[;,:!]\s*/, '$');
  if (TRI.test(island)) return 'משולש';
  if (ANGLE.test(island)) return 'זווית';
  if (FUNC.test(island)) return 'ביטוי';
  if (SEG.test(island)) return 'קטע';
  if (PT.test(island)) return 'נקודה';
  if (VAR.test(island)) return 'משתנה';
  if (NUM.test(island)) return 'מספר';
  if (FRAC.test(island) || SQRT.test(island)) return 'ערך';
  // Anything else carrying maths reads as "the expression …".
  if (EXPR.test(island)) return 'ביטוי';
  return '';
}

const WORD: Record<string, string> = { 2: 'בשניים', 3: 'בשלושה', 4: 'בארבעה', 5: 'בחמישה', 6: 'בשישה' };

/**
 * Substring rewrites the generic rules deliberately refuse to guess at: a
 * one-letter prefix glued to a RELATION, a DOMAIN or a bare digit, where the
 * right noun depends on what the sentence is doing ("in the range", "by the
 * factor", "at the point", "into the form"). Every entry was a real leftover.
 */
const MANUAL: [RegExp | string, string][] = [
  [/\bפתור ב-(\$\[)/g, 'פתור בתחום $1'],
  [/\bפתרונות ב-(\$\[)/g, 'פתרונות בתחום $1'],
  [/ ב-(\$\[[^$]*\$)/g, ' בתחום $1'],
  [/ ל-(\$\[[^$]*\$)/g, ' לתחום $1'],
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
  [/חלוקה ב-(\$)/g, 'חלוקה בגורם $1'],
  [/לחלק ב-(\$)/g, 'לחלק בגורם $1'],
  [/חושב כ-(\$)/g, 'חושב כמו $1'],
  [/חוזרת ל-(\$)/g, 'חוזרת לביטוי $1'],
  [/נשכח ה-(\$)/g, 'נשכח הגורם $1'],
  ['ב-2 שניות', 'בשתי שניות'],
  ['מ-4 המרובעים', 'מארבעת המרובעים'],
  ['ב-5 יחידות', 'בחמש יחידות'],
  ['ב-3 מתוך 5 בגרויות', 'בשלוש מתוך חמש בגרויות'],
  ['שונים מ-1', 'שונים מאחד'],
  ['. מקסימום (', ' יש מקסימום ('],
  ['. מינימום (', ' יש מינימום ('],
];

/** Abstract (masculine) number words — "קטן או שווה ל-1" → "…לאחד". */
const NUMWORD: Record<string, string> = {
  1: 'אחד', 2: 'שניים', 3: 'שלושה', 4: 'ארבעה', 5: 'חמישה',
  6: 'שישה', 7: 'שבעה', 8: 'שמונה', 9: 'תשעה', 10: 'עשרה',
};

export function fixPrefix(s: string): string {
  for (const [from, to] of MANUAL) s = typeof from === 'string' ? s.split(from).join(to) : s.replace(from, to);
  // A prefix glued to a BARE digit (no math island). Spelling the number out is
  // the only rewrite that keeps the sentence natural. Never "בערך N" for ב —
  // "בערך" means "approximately" and would change the meaning.
  s = s.replace(/(^|[^א-ת])(ל|מ|ב|ו|ש|כ)-(\d+)\b/g, (m, pre: string, p: string, n: string) =>
    NUMWORD[n] ? `${pre}${p}${NUMWORD[n]}` : m,
  );
  s = s
    .replace(/(הכפל\S*|כפל|מכפיל\S*|הכפלה|להכפיל|מוכפל\S*)(\s+\S+)?\s+ב-(\$[^$\n]+\$)/g, (_m, v: string, mid: string, isl: string) => `${v}${mid ?? ''} פי ${isl}`)
    .replace(/(לחלק|חילק\S*|חלוקה|מחלק\S*)(\s+\S+)?\s+ב-\$(\d+)\$/g, (m, v: string, mid: string, n: string) => (WORD[n] ? `${v}${mid ?? ''} ${WORD[n]}` : m))
    .replace(/שווה ל-(\$[^$\n]+\$)/g, 'שווה לערך $1')
    // Hebrew final letters are different characters — `קטן\S*` never matches
    // "קטנה", so every such verb has to spell both forms.
    .replace(/(מסתכ[מם]\S*) ל-(\$[^$\n]+\$)/g, '$1 לסכום $2')
    .replace(/(גדול\S*|קט[נן]\S*|פחות|יותר) מ-(\$[^$\n]+\$)/g, '$1 מהערך $2');

  return s.replace(/(^|[^א-ת])(כש|שב|ש|ו|ב|ל|מ|ומ|וב|ה|כ)-(\$[^$\n]+\$)/g, (m, pre: string, p: string, island: string) => {
    const nn = noun(island);
    const rel = REL.test(island);
    switch (p) {
      case 'כש': return `${pre}כאשר ${island}`;
      case 'שב': return nn ? `${pre}שב${nn} ${island}` : m;
      case 'ש': return rel ? `${pre}שמתקיים ${island}` : nn ? `${pre}שה${nn} ${island}` : m;
      case 'ו': return `${pre}וגם ${island}`;
      // `ב-$x = 90°$` is "for the case x = 90°", not "in the <noun> x = 90°".
      // And never "בערך" — that is Hebrew for "approximately", so `ב` + the
      // noun 'ערך' would silently turn "bounded BY ½" into "bounded by ABOUT ½".
      case 'ב': return rel ? `${pre}עבור ${island}` : nn ? `${pre}ב${nn === 'ערך' ? 'גודל' : nn} ${island}` : m;
      case 'ל': return rel ? `${pre}לכך שמתקיים ${island}` : nn ? `${pre}ל${nn} ${island}` : m;
      case 'מ': return nn ? `${pre}מה${nn} ${island}` : m;
      case 'ומ': return nn ? `${pre}ומה${nn} ${island}` : m;
      case 'וב': return nn ? `${pre}וב${nn} ${island}` : m;
      case 'כ': return nn ? `${pre}כמו ה${nn} ${island}` : m;
      // 'ה-$\cos$' is a definite article on the island, not a preposition.
      case 'ה': return nn ? `${pre}ה${nn} ${island}` : m;
      default: return m;
    }
  });
}

const CONNECTIVE = /^(ו|אבל|כי|אז|רק|כלומר|ולכן|לכן|ומכאן|ואז|וזה|וזו|כך|שזה|שהיא|שהוא|למשל)/;

export function fixDash(s: string): string {
  return s
    .replace(/(\$[^$\n]+\$)(\**)\s+[—–]\s+(?=\S)/g, (m, island: string, bold: string, off: number) => {
      const rest = s.slice(off + m.length);
      const lineStart = s.lastIndexOf('\n', off) + 1;
      const lead = s.slice(lineStart, off).replace(/[#>*\-\s]+/g, ' ').trim();
      if (CONNECTIVE.test(rest)) return `${island}${bold}, `;
      // A conditional must never be cut by a full stop — "אם רואים $\pi$ — רדיאנים"
      // would become two fragments. The conditional can sit anywhere in the clause.
      const lastSentence = lead.split(/[.?!]\s+/).pop() ?? '';
      if (/(^|\s)(אם|כאשר|כש\S+|במקרה ש)\b/.test(lastSentence)) return `${island}${bold}, `;
      if (lead.split(/\s+/).filter(Boolean).length <= 3) return `${island}${bold}: `;
      return `${island}${bold}. `;
    })
    .replace(/(\S)\s+[—–]\s+(?=\$[^$\n]+\$)/g, (_m, prev: string) => (prev === '"' ? `${prev} ` : `${prev}: `));
}

export const transformProse = (s: string) => fixDash(fixPrefix(s));

/**
 * Hebrew number words back to digits.
 *
 * Spelling a number out is the sanctioned fix for a prefix glued to it
 * (`מחלקים ב-$3$` → `מחלקים בשלושה`), but it makes a digit — and sometimes a
 * whole `$3$` island — disappear. A gate comparing digits or islands literally
 * would reject the very rewrite we want, so it canonicalises through this first.
 * Longest first, so "בשניים" is not eaten by "שניים".
 */
const WORD_TO_DIGIT: [string, string][] = [
  ['בשניים', '2'], ['בשלושה', '3'], ['בארבעה', '4'], ['בחמישה', '5'], ['בשישה', '6'],
  ['ארבעת', '4'], ['שלושה', '3'], ['ארבעה', '4'], ['חמישה', '5'], ['שמונה', '8'],
  ['שניים', '2'], ['שישה', '6'], ['שבעה', '7'], ['תשעה', '9'], ['עשרה', '10'],
  ['שלוש', '3'], ['ארבע', '4'], ['שתי', '2'], ['חמש', '5'], ['אחד', '1'],
];

export function deWord(s: string): string {
  let out = s;
  for (const [w, d] of WORD_TO_DIGIT) out = out.split(w).join(d);
  return out;
}

/** The numbers written as Hebrew WORDS in `s`, longest form first so
 *  "בשניים" is counted once as 2 rather than twice via "שניים". */
export function spelledNums(s: string): string[] {
  let rest = s;
  const found: string[] = [];
  for (const [w, d] of WORD_TO_DIGIT) {
    const parts = rest.split(w);
    for (let i = 1; i < parts.length; i++) found.push(d);
    rest = parts.join(' ');
  }
  return found;
}

/** Every remaining defect in a string. Empty ⇒ clean. */
export const proseDefects = (s: string) => s.match(/[א-ת]-(?=\$|\d)|\$ ?[—–] | [—–] ?\$/g) ?? [];
