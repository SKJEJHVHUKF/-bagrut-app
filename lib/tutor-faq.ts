/**
 * tutor-faq.ts — "same idea, different words": match a typed student message
 * to the authored FAQ of the question on screen, with no model call.
 *
 * WHY NOT lib/mathscan/match.ts
 * -----------------------------
 * That matcher is tuned for OCR'd exam text — long strings full of numbers and
 * LaTeX — and MEASURED on short Hebrew questions it returns ZERO tokens
 * ("למה מכפילים ולא מחברים?" → {}), and a trigram Jaccard of 0.07 between two
 * paraphrases of the same ask. Hebrew needs its own, smaller normaliser:
 * final letters, the clitic prefixes (ו/ה/ב/ל/ש…), and a handful of maths
 * synonyms (כפל / פעמים / להכפיל are one word to a student).
 *
 * HOW A MATCH IS DECIDED
 * ----------------------
 *   1. Normalise both sides to canonical tokens (see `tokens`).
 *   2. Weight tokens by IDF over the UNIT's own FAQ corpus (q + alts), so
 *      words every entry shares ("למה", "את", "זה") weigh little and the
 *      discriminating word ("כפל", "בלי החזרה") weighs a lot.
 *   3. score = Σ idf(query tokens found in the entry) / Σ idf(query tokens).
 *      A hit needs score ≥ THRESHOLD and a MARGIN over the runner-up entry —
 *      two close candidates means the phrasing is ambiguous, and an ambiguous
 *      guess served with confidence is worse than a model call.
 *   4. A step reference ("שורה 3", "הצעד השני") narrows the candidates to
 *      that step's entries and, failing an entry, answers from the step text
 *      itself — every solution step is an answer nobody had to author.
 *
 * Thresholds are calibrated by scripts/test-tutor-faq.ts, which holds out the
 * last two phrasings of every entry as blind queries and also fires them at
 * OTHER units to measure false matches. Change a number here → re-run it.
 */

import type { TutorFocus } from '@/lib/tutor-presence';
import { loadFaqBank } from '@/content/tutor-faq';
import type { TutorFaq } from '@/content/tutor-faq';
import { leaksAnswer } from '@/lib/help-ladder';

// ------------------------------------------------------------
// Normalisation
// ------------------------------------------------------------

const FINALS: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

/** Clitic prefixes a student glues onto a word. Longest first. Stripping is
 *  conservative: the bare form is ADDED as an extra token, never substituted,
 *  so "הכפל" yields both "הכפל" and "כפל" and a false strip costs nothing. */
const PREFIXES = ['וכש', 'וש', 'וה', 'וב', 'ול', 'ומ', 'כש', 'שה', 'שב', 'של', 'מה', 'ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'כ'];

/** Every lookup table below is keyed by the FOLDED form (final letters
 *  normalised), because `tokenGroups` folds before it looks anything up. The
 *  first version keyed "שישים" and "חייבים" unfolded, so neither ever matched
 *  — found by tracing the seed, not by reading the code. */
function fold(word: string): string {
  return word.replace(/[ךםןףץ]/g, (c) => FINALS[c] ?? c);
}
const foldedSet = (words: string[]) => new Set(words.map(fold));

/** Pure function words and modals. If ANY reading of a word is one of these
 *  the whole word is dropped — "שזה" is ש+זה, not a content word, even though
 *  its raw form is rare. NOT here on purpose: למה / איך / מאיפה / מה — they
 *  separate a "why" ask from a "how" ask; they are FRAME words, capped in
 *  weight instead (see `FRAME`). */
const STOP = foldedSet([
  'אני', 'לי', 'לנו', 'אותי', 'את', 'זה', 'זאת', 'זו', 'של', 'על', 'הוא', 'היא', 'הם', 'הן', 'אם', 'גם', 'רק',
  'כל', 'עם', 'יש', 'אין', 'בבקשה', 'תודה', 'האם', 'אפשר', 'אותו', 'אותה', 'שלי', 'שלך', 'שלנו',
  'כאן', 'פה', 'עכשיו', 'בעצם', 'אז', 'כי', 'אבל', 'או', 'בכלל', 'ממש', 'קצת', 'לא', 'כן',
  'תגיד', 'תגידי', 'רגע', 'בשאלה', 'בתרגיל', 'הזה', 'הזאת', 'האלה', 'ככה', 'כלום', 'משהו', 'מישהו',
  'למשל', 'אולי', 'בטח', 'אפילו', 'תמיד', 'שוב', 'עוד', 'כבר', 'פשוט', 'מאוד', 'הרבה', 'דווקא',
  'חייבים', 'חייב', 'חייבת', 'צריך', 'צריכה', 'צריכים', 'יכול', 'יכולה', 'רוצה', 'רוצים', 'אמור', 'אמורה',
  'ואם', 'וגם', 'ולמה', 'ואיך', 'בשביל', 'אצלי', 'לפי', 'כאילו',
  'שאלה', 'השאלה', 'שאלות', 'תרגיל', 'התרגיל', 'תרגילים', 'בין', 'דרך', 'דרכים', 'סתם', 'כזה', 'כזאת', 'כאלה', 'דבר', 'דברים',
]);

/** Question-frame words: they say WHAT KIND of ask this is but not what it is
 *  about, so their weight is capped — on a two-unit seed "מאיפה" looked as
 *  rare and heavy as "60", and a held-out "מאיפה ה-60" failed because the
 *  entry's other alts happened to say "למה" instead. */
const FRAME = foldedSet([
  'למה', 'מה', 'איך', 'מאיפה', 'מתי', 'כמה', 'איזה', 'איזו', 'מי', 'למי', 'מדוע', 'כיצד', 'איפה', 'מהיכן',
  // generic verbs of asking — "how do we solve / do / compute / know / understand"
  'פותרים', 'פותר', 'פותרת', 'לפתור', 'עושים', 'עושה', 'לעשות', 'מחשבים', 'לחשב', 'מחשב',
  'יודעים', 'יודע', 'יודעת', 'לדעת', 'מבין', 'מבינה', 'להבין', 'הכוונה', 'משמעות', 'אומר', 'אומרת',
  'קורה', 'משתנה', 'הולך', 'עובד', 'נכון', 'בסדר', 'מותר', 'אסור',
]);
const FRAME_WEIGHT = 0.8;

/** Maths-speak synonyms → one canonical token. A student's "פעמים" and the
 *  author's "כפל" must meet somewhere. Small on purpose; grow it from measured
 *  misses, not from a thesaurus. */
const SYNONYMS: Record<string, string> = Object.fromEntries(
  (
    [
      ['כפל', ['מכפילים', 'להכפיל', 'פעמים', 'מכפלה', 'הכפלה', 'כפול', 'מכפיל', 'מכפילה', 'הכפלנו', 'הכפלת']],
      ['חיבור', ['מחברים', 'לחבר', 'פלוס', 'סכום', 'מסכמים', 'חיברנו', 'לסכום', 'מחבר', 'מחברת', 'חיברת']],
      ['חיסור', ['מחסרים', 'לחסר', 'מינוס', 'הפרש', 'חיסרנו', 'מחסר', 'מורידים', 'להוריד']],
      ['חילוק', ['מחלקים', 'לחלק', 'חילקנו', 'שבר', 'מחלק', 'מחלקת', 'חלקי', 'לקוח']],
      ['נוסחה', ['נוסחא', 'נוסחאות', 'נוסחת', 'הנוסחה', 'בנוסחה']],
      ['צעד', ['שורה', 'שלב', 'צעדים', 'שורות', 'שלבים', 'בשורה', 'בצעד', 'בשלב']],
      ['למה', ['מדוע', 'בשביל', 'לשם']],
      ['איך', ['כיצד', 'באיזה', 'באיזו']],
      ['מאיפה', ['מהיכן', 'מאין', 'מאיפוא', 'הגיע', 'הגיעו', 'מגיע', 'יוצא', 'יצא', 'בא', 'באו']],
      ['תשובה', ['תוצאה', 'התשובה', 'התוצאה', 'פתרון', 'הפתרון']],
      ['טעות', ['טעיתי', 'טועים', 'שגיאה', 'מפספסים', 'מתבלבלים', 'בלבול', 'מבלבל']],
      ['בדיקה', ['לבדוק', 'בודקים', 'לוודא', 'מוודאים', 'מאמתים', 'לאמת']],
      ['חזרה', ['החזרה', 'מחזירים', 'להחזיר', 'מחזיר']],
      ['תלוי', ['תלויים', 'תלויות', 'תלות', 'בלתי']],
      ['הסתברות', ['סיכוי', 'סיכויים', 'הסיכוי', 'ההסתברות']],
      ['מנה', ['המנה', 'יחס', 'היחס']],
      ['הפרש', ['ההפרש', 'd']],
      ['איבר', ['האיבר', 'איברים', 'האיברים', 'מקום', 'המקום']],
      ['שלילי', ['מינוס', 'שלילית', 'שליליים']],
      // NOT "מבין" here: it is also "understand", and a synonym that is two
      // words is a false hit waiting to happen (MEASURED: "למה אני לא מבין"
      // landed on the conditional-probability entry at score 1.0).
      ['תנאי', ['מותנה', 'מותנית', 'בהינתן', 'בתנאי', 'התנאי', 'ידוע']],
      ['כלול', ['כולל', 'נכלל', 'נכנס', 'בפנים', 'נספר', 'כלולה', 'כוללים', 'נכללת', 'נכנסת']],
      ['תוצאה', ['תוצאות', 'אפשרויות', 'אפשרות', 'מקרים', 'מקרה', 'אופציות', 'אופציה', 'פאות', 'פאה']],
      ['סדרה', ['הסדרה', 'סדרות', 'בסדרה']],
      ['חשבונית', ['חשבוניות', 'החשבונית']],
      ['הנדסית', ['הנדסיות', 'ההנדסית']],
    ] as [string, string[]][]
  ).flatMap(([canon, words]) => [[fold(canon), canon], ...words.map((w) => [fold(w), canon])]),
);

/** "שש" and "6" are the same token to a student. Fractions keep their shape
 *  ("2/6" → "2_6") so "שליש" and "1/3" meet as well. */
const NUMBER_WORDS: Record<string, string> = Object.fromEntries(
  Object.entries({
    'אפס': '0', 'אחד': '1', 'אחת': '1', 'שניים': '2', 'שתיים': '2', 'שני': '2', 'שתי': '2',
    'שלוש': '3', 'שלושה': '3', 'ארבע': '4', 'ארבעה': '4', 'חמש': '5', 'חמישה': '5',
    'שש': '6', 'שישה': '6', 'שבע': '7', 'שבעה': '7', 'שמונה': '8', 'תשע': '9', 'תשעה': '9',
    'עשר': '10', 'עשרה': '10', 'עשרים': '20', 'שלושים': '30', 'ארבעים': '40', 'חמישים': '50',
    'שישים': '60', 'שבעים': '70', 'שמונים': '80', 'תשעים': '90', 'מאה': '100', 'מאתיים': '200',
    'חצי': '1_2', 'מחצית': '1_2', 'שליש': '1_3', 'רבע': '1_4', 'שלישים': '1_3', 'רבעים': '1_4',
    'חמישית': '1_5', 'שישית': '1_6', 'שביעית': '1_7', 'שמינית': '1_8', 'תשיעית': '1_9', 'עשירית': '1_10',
  }).map(([k, v]) => [fold(k), v]),
);

/**
 * Every number becomes its VALUE: "2/6", "2 חלקי 6", "שליש", "1/3" and "0.333"
 * are one token, and "40 חלקי 200", "0.2", "חמישית" are one token. Integers
 * stay exact ("60" → num:60). This is what lets a student who writes the
 * decimal meet an author who wrote the fraction.
 */
function numericKey(form: string): string | null {
  const frac = /^(\d+)_(\d+)$/.exec(form);
  if (frac) {
    const d = Number(frac[2]);
    return d ? `num:${(Number(frac[1]) / d).toFixed(4).replace(/\.?0+$/, '')}` : null;
  }
  if (/^\d+(?:\.\d+)?$/.test(form)) return `num:${Number(form).toFixed(4).replace(/\.?0+$/, '')}`;
  return null;
}

const VERB_PREFIXES = ['מ', 'ת', 'י', 'נ'];
/** FOLDED suffixes — "ים" is "ימ" by the time a word gets here. The unfolded
 *  list matched nothing, so "מצמצמים" never met "לצמצם". */
const SUFFIXES = ['יות', 'ימ', 'ות', 'תי', 'נו', 'ית', 'ת', 'ה', 'י', 'ו'];

/**
 * Crude stems, added as extra variants. MEASURED on the first seed: "מצמצמים"
 * never met "לצמצם", "נכונה" never met "נכון", "יודעים" never met "יודע" —
 * a third of the misses. One verbal prefix and one suffix off, both only when
 * enough of the word is left, and only as ADDITIONAL variants: a wrong stem
 * costs nothing because the raw form is still there.
 */
function stems(w: string): string[] {
  if (w.length < 5 || /\d/.test(w)) return [];
  const out = new Set<string>();
  const bases = [w];
  for (const p of VERB_PREFIXES) if (w.startsWith(p) && w.length - 1 >= 4) bases.push(w.slice(1));
  for (const b of bases) {
    out.add(b);
    for (const s of SUFFIXES) if (b.endsWith(s) && b.length - s.length >= 3) out.add(b.slice(0, -s.length));
  }
  out.delete(w);
  return [...out];
}

function canon(form: string): string | null {
  const n = NUMBER_WORDS[form] ?? form;
  const num = numericKey(n);
  if (num) return num;
  const c = SYNONYMS[n] ?? n;
  return c.length >= 2 ? c : null;
}

/**
 * One group of canonical variants PER WORD of the sentence.
 *
 * MEASURED on the first seed: expanding "השש" into the two tokens {השש, שש}
 * and scoring them separately halved every score, because the raw form never
 * matches anything and still sat in the denominator. A word is one unit of
 * meaning; it is matched when ANY of its variants is known, and weighed once.
 */
export function tokenGroups(text: string): string[][] {
  const groups: string[][] = [];
  const clean = text
    .toLowerCase()
    .replace(/\$[^$]*\$/g, ' ') // maths islands carry no intent words
    .replace(/(\d+)\s*(?:\/|חלקי|לחלק ל|מתוך)\s*(\d+)/g, '$1_$2') // "2/6", "2 חלקי 6", "40 מתוך 200"
    .replace(/(\d+)\s*%/g, '$1 אחוז')
    .replace(/[?!.,:;"'׳״()[\]{}«»\-–—/\\*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  for (const raw of clean.split(' ')) {
    if (!raw) continue;
    const w = fold(raw);
    const forms = new Set<string>([w]);
    for (const p of PREFIXES) {
      if (w.startsWith(p) && w.length - p.length >= 2) forms.add(w.slice(p.length));
    }
    for (const f of [...forms]) for (const s of stems(f)) forms.add(s);
    // A word with a stop-word reading is a function word: drop it whole.
    if ([...forms].some((f) => STOP.has(f))) continue;
    const variants = new Set<string>();
    for (const f of forms) {
      const c = canon(f);
      if (c) variants.add(c);
    }
    if (variants.size) groups.push([...variants]);
  }
  return groups;
}

/** Flat canonical tokens — what an indexed phrasing contributes. */
export function tokens(text: string): string[] {
  return [...new Set(tokenGroups(text).flat())];
}

// ------------------------------------------------------------
// Step references
// ------------------------------------------------------------

const ORDINALS: Record<string, number> = {
  'ראשון': 0, 'ראשונה': 0, 'שני': 1, 'שנייה': 1, 'שניה': 1, 'שלישי': 2, 'שלישית': 2,
  'רביעי': 3, 'רביעית': 3, 'חמישי': 4, 'חמישית': 4, 'שישי': 5, 'שישית': 5,
};

/** "שורה 3" / "הצעד השני" / "בשלב האחרון" → 0-based step index. */
export function stepReference(text: string, stepCount: number): number | null {
  const m = /(?:ב|ה)?(?:שורה|צעד|שלב)\s*(?:ה)?(\d+|[א-ת]+)/.exec(text);
  if (!m) return null;
  const tok = m[1];
  if (/^\d+$/.test(tok)) {
    const n = Number(tok) - 1;
    return n >= 0 && n < stepCount ? n : null;
  }
  if (tok === 'אחרון' || tok === 'אחרונה') return stepCount - 1;
  const o = ORDINALS[tok];
  return o !== undefined && o < stepCount ? o : null;
}

// ------------------------------------------------------------
// Index + scoring
// ------------------------------------------------------------

export const FAQ_THRESHOLD = 0.5;
export const FAQ_MARGIN = 0.12;

type Indexed = { faq: TutorFaq; docs: Set<string>[] };

export type FaqIndex = { items: Indexed[]; idf: Map<string, number> };

/**
 * IDF over a corpus of phrasings. Use the WHOLE TOPIC's bank, not one unit's:
 * MEASURED on a two-unit seed, "איך", "מה", "משתנה" looked rare inside a
 * 12-phrasing unit and outweighed the one word that actually differed
 * ("לפחות" vs "לבנים"), producing a confident cross-unit false hit. Over a
 * few thousand phrasings the frame words sink and the content words rise.
 */
export function buildCorpusIdf(phrasings: Iterable<string>): Map<string, number> {
  const df = new Map<string, number>();
  let n = 0;
  for (const p of phrasings) {
    n++;
    for (const t of new Set(tokens(p))) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const idf = new Map<string, number>();
  for (const [t, c] of df) idf.set(t, Math.log((n + 1) / (c + 0.5)) + 0.2);
  return idf;
}

/** Build the per-unit index. Pass the topic-wide `idf`; without it the unit's
 *  own phrasings are the universe (fine for a gate, wrong for production). */
export function buildFaqIndex(
  faqs: readonly TutorFaq[],
  opts: { exclude?: (f: TutorFaq, alt: number) => boolean; idf?: Map<string, number> } = {},
): FaqIndex {
  const items: Indexed[] = [];
  const all: string[] = [];
  for (const faq of faqs) {
    const phrasings = [faq.q, ...faq.alts].filter((_, i) => !opts.exclude || !opts.exclude(faq, i - 1));
    all.push(...phrasings);
    items.push({ faq, docs: phrasings.map((p) => new Set(tokens(p))) });
  }
  return { items, idf: opts.idf ?? buildCorpusIdf(all) };
}

export type FaqMatch = { faq: TutorFaq; score: number; margin: number };

/** Weight of a word the corpus has never seen. It stays in the denominator
 *  because it is something the student said that no entry explains — and it
 *  weighs MORE than a typical known word on purpose: "יש לי מבחן מחר מה
 *  לעשות" must not land on an entry through "מה לעשות" alone while "מבחן" and
 *  "מחר" go unexplained. MEASURED: at 1.5 that noise scored 0.62. */
const UNKNOWN_WEIGHT = 2.2;

export function matchFaq(index: FaqIndex, message: string, opts: { step?: number | null } = {}): FaqMatch | null {
  const groups = tokenGroups(message);
  if (groups.length === 0) return null;
  // A word's weight is that of its best-known variant; a word with no known
  // variant weighs UNKNOWN_WEIGHT and can never be matched.
  const isFrame = (g: string[]) => g.some((t) => FRAME.has(t));
  const weightOf = (g: string[]) => {
    if (isFrame(g)) return FRAME_WEIGHT;
    const known = g.filter((t) => index.idf.has(t));
    return known.length ? Math.max(...known.map((t) => index.idf.get(t)!)) : UNKNOWN_WEIGHT;
  };
  const weights = groups.map(weightOf);
  const denom = weights.reduce((s, x) => s + x, 0);
  if (denom === 0) return null;
  // At least one CONTENT word must match — a frame word alone ("מה… ?")
  // matches every entry on the unit and says nothing about which.
  const contentIdx = groups.map((g, i) => (isFrame(g) ? -1 : i)).filter((i) => i >= 0);

  const scored = index.items
    .filter((it) => opts.step === undefined || opts.step === null || it.faq.step === undefined || it.faq.step === opts.step)
    .map((it) => {
      let best = 0;
      let bestMatched = 0;
      for (const d of it.docs) {
        let hit = 0;
        let matched = 0;
        let content = false;
        groups.forEach((g, i) => {
          if (g.some((t) => d.has(t))) {
            hit += weights[i];
            matched++;
            if (contentIdx.includes(i)) content = true;
          }
        });
        if (!content) continue;
        const score = hit / denom;
        if (score > best) {
          best = score;
          bestMatched = matched;
        }
      }
      return { faq: it.faq, score: best, matched: bestMatched };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top || top.score < FAQ_THRESHOLD) return null;
  // One shared word in a message of four or more is a coincidence, however
  // heavy that word is ("מה הבדיקה כאן" landing on an entry via "בדיקה").
  if (top.matched < 2 && groups.length >= 4) return null;
  const second = scored[1]?.score ?? 0;
  const margin = top.score - second;
  if (second >= FAQ_THRESHOLD && margin < FAQ_MARGIN) return null;
  return { faq: top.faq, score: top.score, margin };
}

// ------------------------------------------------------------
// The entry point used by the bubble
// ------------------------------------------------------------

export type FaqAnswer = {
  text: string;
  /** 'faq' — an authored entry; 'step' — the step text itself. */
  source: 'faq' | 'step';
  faqId?: string;
  score?: number;
};

/** Topic-wide IDF, computed once per loaded bank. */
const idfCache = new WeakMap<object, Map<string, number>>();
function topicIdf(bank: Record<string, TutorFaq[]>): Map<string, number> {
  let idf = idfCache.get(bank);
  if (!idf) {
    idf = buildCorpusIdf(Object.values(bank).flatMap((fs) => fs.flatMap((f) => [f.q, ...f.alts])));
    idfCache.set(bank, idf);
  }
  return idf;
}

/** Is the student allowed to see answers that state the result? */
function answered(focus: TutorFocus): boolean {
  return !!focus.correctAnswer || !!focus.wrongAnswer;
}

/**
 * Answer from the question's FAQ bank, or from the referenced step, or null.
 * Never throws: a topic without a bank, a unit without entries, or a message
 * that matches nothing all return null and the caller goes to the model.
 */
export async function answerFromFaq(message: string, focus: TutorFocus | null, subject = 'math5'): Promise<FaqAnswer | null> {
  const q = focus?.question;
  if (!q || !focus?.topic) return null;
  const steps = q.solution.steps;
  const step = stepReference(message, steps.length);

  const bank = await loadFaqBank(subject, focus.topic);
  const entries = bank?.[q.id] ?? [];
  const canReveal = answered(focus);
  const usable = entries.filter((f) => !f.reveals || canReveal);

  if (usable.length > 0 && bank) {
    const hit = matchFaq(buildFaqIndex(usable, { idf: topicIdf(bank) }), message, { step });
    if (hit) return { text: hit.faq.a, source: 'faq', faqId: hit.faq.id, score: hit.score };
  }

  // No entry, but the student pointed at a step: the step explains itself,
  // with its rule. Withheld when it would hand over the answer before the
  // student has one — the same rule the help ladder applies to its rungs.
  if (step !== null) {
    const text = steps[step];
    if (!text) return null;
    if (!canReveal && leaksAnswer(text, q.solution.finalAnswer)) return null;
    const rule = steps.find((s) => s.startsWith('**הכלל:**'));
    const ruleLine = rule && step !== 0 ? `\n\nהכלל שעומד מאחורי זה: ${rule.replace(/^\*\*הכלל:\*\*\s*/, '')}` : '';
    return {
      source: 'step',
      text:
        `הצעד ה-${step + 1} אומר כך:\n\n${text}${ruleLine}\n\n` +
        'תכתוב לי איזה חלק בשורה הזאת לא מסתדר לך, ונפרק אותו.',
    };
  }
  return null;
}
