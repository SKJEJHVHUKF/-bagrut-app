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
import type { TutorFaq, TutorFaqKind } from '@/content/tutor-faq';
import { leaksAnswer } from '@/lib/help-ladder';
import { foreignSubject, namesAMathsSubject } from '@/lib/maths-vocabulary';
import { resolveTopic } from '@/lib/resolve-topic';

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

/**
 * Kinds whose answer is about the IDEA, not about this exercise's numbers.
 *
 * This is what makes cross-question reuse safe. "מה זה הסתברות מותנית",
 * "מה המלכודת כאן", "איך בודקים את התשובה" are true of every question in the
 * topic; "מאיפה ה-60" and "למה לא 40 חלקי 200" belong to one exercise and
 * serving them on another would be a confident wrong answer.
 *
 * Why it matters: the bank holds ~1,500 authored entries, and until this
 * existed only the ~10 belonging to the question on screen were ever searched.
 * Everything else was paid for and never read.
 */
const TRANSFERABLE = new Set<TutorFaqKind>(['concept', 'mistake', 'check']);

/**
 * Higher than FAQ_THRESHOLD, deliberately. Inside one unit the candidates are
 * ten entries about one exercise, so a moderate match is informative. Across a
 * topic the pool is hundreds of entries, and the chance of a coincidental
 * overlap rises with it — so an answer from another exercise has to earn a
 * clearly better match before it is served in place of a model call.
 */
export const FAQ_TRANSFER_THRESHOLD = 0.66;

/**
 * ✅ CROSS-QUESTION REUSE IS ON, after a sixth tightening cleared the bar the
 * previous five did not. It was off for a long time and the history below is
 * kept because it is the argument for every guard that is still here.
 *
 * The idea: ~2,300 entries are authored, and only the ~10 on the student's own
 * question are ever searched. Stage 2 would serve an entry from a sibling
 * exercise when the question is about the IDEA (concept/mistake/check) rather
 * than this exercise's numbers.
 *
 * MEASURED across five tightenings, on the full סדרות + הסתברות bank:
 *
 *   as first designed                     fires 17.1%  unsafe 13.2%
 *   + require 2 matching content words    fires 15.5%  unsafe  5.1%
 *   + reject answers with foreign numbers fires 15.5%  unsafe  1.6%  ← looked fine
 *   + honest metric (count what is SERVED,
 *     not what the screen blocks)         fires 17.7%  unsafe  4.7%
 *   + no clamp on the content requirement fires 17.2%  unsafe  4.2%
 *
 * The 1.6% was a measurement error of mine: the test counted the cases the
 * foreign-number screen REJECTS as failures, so a working guard read as a
 * defect and the rest read as clean. Corrected, the real rate is 4.2% — about
 * one wrong answer for every four calls saved.
 *
 * That trade was wrong for this product, and the note here said the way back
 * was authoring rather than tuning. That turned out to be half right: a
 * threshold sweep alone found no working point (0.62/mc3 came closest at
 * 11.2% fires / 1.6% unsafe, still short on reach), but it also showed WHY.
 * Every screen in place was reading the ANSWER. Nothing read the QUESTION.
 *
 *   + screen the question too (pointsAtThisExercise)
 *                                         fires 14.8%  unsafe  1.9%
 *
 * A student asking "מאיפה הגיע ה-60" or "למה חילקת בשורה השנייה" is pointing
 * at the thing in front of them, and a general explanation from a sibling
 * exercise answers none of it — those are exactly the where-from / why-not /
 * what-if / why-step asks stage 2 is not allowed to serve. At runtime we
 * cannot know which kind the student meant, only what their words point at,
 * and deixis is cheap to detect: a number, or one of פה / כאן / הזה / בשורה.
 *
 * That cut the wrong answers by 55% (4.2% → 1.9%) for 2.4 points of reach.
 * Sweeping the threshold on top of it, 0.62 through 0.68 all clear the bar;
 * 0.66 was chosen for having margin on BOTH sides (12.7% fires, 1.5% unsafe)
 * rather than the most reach, because the two errors do not cost the same: a
 * miss costs one model call, a wrong answer costs the student's trust.
 *
 * TO TURN IT OFF AGAIN: flip this to false. The bar it must keep clearing is
 * `unsafe ≤ 2%` with `fires ≥ 12%` in `npm run test:faq`, which is asserted
 * there — and both knobs are sweepable from the environment
 * (FAQ_SWEEP_THRESHOLD, FAQ_SWEEP_MIN_CONTENT, FAQ_SWEEP_NO_SCREEN) so the
 * claim can be re-tested in a minute instead of argued about.
 */
const TRANSFER_ENABLED = true;

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

export function matchFaq(
  index: FaqIndex,
  message: string,
  opts: { step?: number | null; threshold?: number; minContentMatches?: number } = {},
): FaqMatch | null {
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
  /**
   * How many content words must match. 1 inside a unit; the caller raises it
   * for cross-question reuse.
   *
   * MEASURED, and it is the whole difference between the stage-2 path being
   * safe and being a liability: at 1, "למה לא 17" scored a perfect 1.00 against
   * an entry on a DIFFERENT exercise that merely also mentions 17 — one shared
   * number, no shared idea. 13.2% of number questions were answered from the
   * wrong exercise. A query that shares only one content word with an entry
   * from another question has not established that it is the same question.
   */
  const minContent = opts.minContentMatches ?? 1;
  // ⚠️ NOT clamped to what the query happens to contain. The first version did
  // `Math.min(required, contentIdx.length)`, which meant a two-word message
  // could never fail the requirement — it was lowered to fit. That is how
  // "למה לא 3" scored a perfect 1.00 against a different exercise on the
  // strength of one shared number. A query too short to meet the bar has not
  // established anything; it must not transfer at all.
  if (contentIdx.length < minContent) return null;

  const scored = index.items
    .filter((it) => opts.step === undefined || opts.step === null || it.faq.step === undefined || it.faq.step === opts.step)
    .map((it) => {
      let best = 0;
      let bestMatched = 0;
      for (const d of it.docs) {
        let hit = 0;
        let matched = 0;
        let contentMatched = 0;
        groups.forEach((g, i) => {
          if (g.some((t) => d.has(t))) {
            hit += weights[i];
            matched++;
            if (contentIdx.includes(i)) contentMatched++;
          }
        });
        if (contentMatched < minContent) continue;
        const score = hit / denom;
        if (score > best) {
          best = score;
          bestMatched = matched;
        }
      }
      return { faq: it.faq, score: best, matched: bestMatched };
    })
    .sort((a, b) => b.score - a.score);

  const threshold = opts.threshold ?? FAQ_THRESHOLD;
  const top = scored[0];
  if (!top || top.score < threshold) return null;
  // One shared word in a message of four or more is a coincidence, however
  // heavy that word is ("מה הבדיקה כאן" landing on an entry via "בדיקה").
  if (top.matched < 2 && groups.length >= 4) return null;
  const second = scored[1]?.score ?? 0;
  const margin = top.score - second;
  if (second >= threshold && margin < FAQ_MARGIN) return null;
  return { faq: top.faq, score: top.score, margin };
}

// ------------------------------------------------------------
// The entry point used by the bubble
// ------------------------------------------------------------

export type FaqAnswer = {
  text: string;
  /**
   * 'faq'      an authored entry for THIS question
   * 'transfer' an authored entry from another question in the topic, whose
   *            answer is about the idea rather than this exercise's numbers
   * 'step'     the solution step the student pointed at
   */
  source: 'faq' | 'transfer' | 'step';
  faqId?: string;
  score?: number;
};

/**
 * `seq-arg-007#3` → `seq-arg`. Units in one group are variations of one
 * exercise type, so an idea explained on one reads naturally on another.
 *
 * ⚠️ A SINGLE-SEGMENT RESULT IS NOT A GROUP. Top-level question ids look like
 * `seq-001`, and stripping the digits leaves `seq` — the whole topic. The first
 * version returned that, so every top-level question in סדרות was "the same
 * sub-topic" as every other one and transferred freely between them. MEASURED:
 * that alone pushed unsafe transfers from 1.6% to 2.5% as the bank grew, with
 * failures like "למה לא מכפילים 15 ב-4" on seq-001 answered from seq-010.
 * A degenerate group returns the unit's own id instead, so it matches nothing
 * but itself and those units simply do not participate in transfer.
 */
function groupOf(faqId: string): string {
  const unit = faqId.replace(/#.*$/, '').replace(/\/.*$/, '');
  const g = unit.replace(/[-_]?\d+$/, '');
  return g.includes('-') ? g : unit;
}

/**
 * Would serving this answer put ANOTHER exercise's numbers on the screen?
 *
 * This is the real boundary for cross-question reuse, and it is sharper than
 * "which kind is it". A `concept` answer that says "התנאי מחליף את המכנה"
 * is true everywhere and helps wherever it is served. The same kind of answer
 * that says "המכנה הוא 60" is about one exercise, and a student looking at
 * different numbers will either be confused or quietly misled.
 *
 * MEASURED: restricting by kind alone left 5.1% of number questions answered
 * from a neighbouring exercise. Screening the ANSWER for foreign numbers is
 * what closes it, and it costs one regex.
 *
 * Small integers (0-2) and anything already visible in the student's own
 * question or solution are not foreign — "שני נעלמים" and a `2` in their own
 * equation say nothing about a different exercise.
 */
/**
 * Is the student pointing at THIS exercise? Then nothing from another one may
 * be served, however well it scores.
 *
 * `mentionsForeignNumber` screens the ANSWER — it stops another exercise's
 * arithmetic from landing on the screen. This screens the QUESTION, which is
 * the half that was missing: "מאיפה הגיע ה-60", "למה חילקת בשורה השנייה",
 * "ומה אם היו שלושה" are all about the specific thing in front of the student,
 * and a general explanation from a sibling exercise answers none of them. Those
 * asks are exactly the `where-from` / `why-not` / `what-if` / `why-step` kinds
 * the transfer stage is not allowed to serve — but at runtime we do not know
 * which kind the student MEANT, only what their words point at.
 *
 * Two signals, both cheap and both about deixis rather than topic:
 *   a number   — a concept question almost never carries one; a question about
 *                this solution's arithmetic almost always does
 *   a pointer  — פה / כאן / הזה / בשורה / בשלב / למעלה / שלך
 *
 * Measured effect on the cross-question reuse bar, over the whole bank:
 *   without it   fires 11.2%  unsafe 1.6%   (threshold 0.62, minContent 3)
 *   with it      see scripts/test-tutor-faq.ts — this is why it exists
 */
export function pointsAtThisExercise(message: string): boolean {
  if (/\d/.test(message)) return true;
  return /(?:^|[^א-ת])(?:פה|כאן|הזה|הזאת|הזו|בשורה|בשלב|למעלה|למטה|שלך|שכתבת|שעשית|שחילקת|שהצבת)(?:[^א-ת]|$)/.test(
    message,
  );
}

/**
 * The narrow version of `pointsAtThisExercise`, for the screens that have none.
 *
 * WARNING: THE WIDE ONE IS WRONG HERE, AND IT SILENTLY ATE REAL QUESTIONS.
 * `pointsAtThisExercise` rejects any digit and the words פה, כאן, הזה, הזאת,
 * שלך — correct when a student is looking at an exercise, where all of those
 * mean "this one". On the roadmap there is no "this one": "איך עובדת
 * האפליקציה הזאת" and "מאיפה התשובות שלך" are ordinary questions with authored
 * answers, and the wide guard refused both.
 *
 * What is left is the words that cannot mean anything ELSE: a step, a line, a
 * סעיף, or something the student did in a working he can see.
 */
export function pointsAtSomethingOnScreen(message: string): boolean {
  return /(?:^|[^א-ת])(?:בשורה|בשלב|בסעיף|שכתבת|שעשית|שחילקת|שהצבת|שחישבת|למעלה|למטה)(?:[^א-ת]|$)/.test(
    message,
  );
}

export function mentionsForeignNumber(answer: string, ownText: string): boolean {
  const own = new Set(ownText.match(/\d+(?:\.\d+)?/g) ?? []);
  for (const n of answer.match(/\d+(?:\.\d+)?/g) ?? []) {
    if (Number(n) <= 2) continue;
    if (own.has(n)) continue;
    return true;
  }
  return false;
}

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
/**
 * Words that carry any weight at all.
 *
 * ⚠️ TWO CHARACTERS, NOT THREE. A three-character floor reads "מה יש בדף
 * הנוסחאות" as two words and refuses it — a real question, with an authored
 * answer, thrown away because Hebrew function words are short and so are some
 * of its content words. At two, that question counts four and "החלק הראשון"
 * still counts two.
 */
function contentWords(message: string): string[] {
  return (message ?? '')
    .replace(/[^\u0590-\u05FFa-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

/**
 * An entry that is grounded in ITS OWN exercise, whatever kind it claims to be.
 *
 * A `concept` answer that opens "בשאלה שלנו מוציאים 2 כדורים" is a general
 * explanation on paper and an exercise-specific one in practice. Inside a
 * question that is harmless — the student has an exercise to map it onto. On a
 * screen with no exercise at all it is nonsense, so it is refused there.
 */
const BOUND_TO_ITS_EXERCISE =
  /(?:^|[^א-ת])(?:בשאלה\s*(?:הזאת|הזו|שלנו|שלפנינו)|בסעיף\s*(?:הזה|א|ב|ג|ד)|בתרגיל\s*(?:הזה|שלנו)|כאן\s*(?:יש|מוציאים|בוחרים)|בדוגמה\s*(?:הזאת|שלנו))/;

/**
 * The whole topic's bank, for a student with NO exercise on screen.
 *
 * ============================================================
 * WHY THIS IS A SEPARATE ENTRY POINT AND NOT A LOOSER `answerFromFaq`
 * ============================================================
 * Itay: "ברגע שהוא לא במסלול הלמידה עצמו בתוך שאלות, שיהיה לו את כל הבנקים".
 *
 * `answerFromFaq` returns null without a question, so on the roadmap index the
 * ~3,500 authored entries — the largest body of Hebrew this app owns — were
 * never searched at all. Every question there went to the model.
 *
 * ⚠️ AND THE MEASUREMENT THAT REJECTED TOPIC-WIDE SEARCH DOES NOT APPLY HERE.
 * Stage 2 of `answerFromFaq` deliberately stays inside the sub-topic:
 *
 *   same sub-topic only   fires 15.5% · unsafe 1.6%   ← shipping
 *   + whole topic         fires 26.8% · unsafe 5.6%
 *
 * What made the wide pool unsafe there is that the student is looking at an
 * exercise, so an answer about a DIFFERENT exercise is about the wrong numbers.
 * With no exercise on screen there is no other exercise to confuse it with: the
 * question is general, and a `concept` / `mistake` / `check` entry about the
 * topic is exactly what it asks for. The guard that replaces the sub-topic
 * fence is BOUND_TO_ITS_EXERCISE, which drops the entries that only LOOK
 * general.
 *
 * Same TRANSFERABLE kinds and same threshold as stage 2 — nothing is loosened
 * except the pool, and only on the screen where the tightening bought nothing.
 */
/**
 * The bank that belongs to no topic — method, structure, how this app works.
 *
 * ⚠️ SEARCHED ONLY WHEN NOTHING ELSE COULD BE, AND WITH THE SAME THRESHOLD.
 * It is the widest pool in the product: nothing keys it, so nothing narrows a
 * wrong answer. It runs last, after the topic bank has declined, and it is
 * deliberately ten entries rather than a hundred — an entry earns its place by
 * being asked often AND having one answer that is true for every student on
 * every day. See content/tutor-faq/general.ts for what that rules out.
 */
export async function answerGeneralFaq(message: string): Promise<FaqAnswer | null> {
  if (!message.trim()) return null;
  if (pointsAtSomethingOnScreen(message)) return null;
  // WARNING: SAME FENCE AS THE TOPIC BANK, DIFFERENT SHAPE. These entries are
  // about METHOD, so naming mathematics is not the test - "איך כדאי ללמוד"
  // names none. What separates them from a conversational fragment is length:
  // a question about how to study is a sentence, "החלק השני" is not. Three
  // content words is the floor, measured against both sets.
  if (contentWords(message).length < 3) return null;

  let pool: TutorFaq[];
  try {
    pool = (await import('@/content/tutor-faq/general')).GENERAL_FAQ;
  } catch {
    return null;
  }
  if (!pool?.length) return null;

  const idf = buildCorpusIdf(pool.flatMap((f) => [f.q, ...f.alts]));
  // WARNING: ONE CONTENT WORD IS ENOUGH HERE, AND ONLY HERE.
  //
  //  exists for the topic pools, where hundreds of
  // entries discuss the same mathematics and a single shared word is a
  // coincidence. This bank is ten entries about ten unrelated things, so one
  // strong word is decisive — measured, "מה לעשות כשאני נתקע בשאלה" matched its
  // own entry at score 1.000 and margin 1.000 and was refused for having only
  // one word the matcher counts.
  //
  // The threshold stays at the transfer level, and scripts/test-general-faq
  // asserts that maths questions still get nothing from this pool.
  const hit = matchFaq(buildFaqIndex(pool, { idf }), message, {
    threshold: FAQ_TRANSFER_THRESHOLD,
    minContentMatches: 1,
  });
  if (!hit) return null;

  return { source: 'transfer', faqId: hit.faq.id, score: hit.score, text: hit.faq.a };
}

/**
 * Every topic whose bank is authored. The pool when no single topic is named.
 *
 * WARNING: HEBREW KEYS, because `loadFaqBank` is keyed by the topic name the
 * lessons register, not by the file name. Getting this wrong fails silently:
 * the import throws, the catch swallows it, and the layer simply never fires.
 */
const BANKED_TOPICS = ['הסתברות', 'סדרות', 'טריגונומטריה', 'גיאומטריה אוקלידית'];

export async function answerTopicFaq(
  message: string,
  topic: string | null,
  subject = 'math5',
): Promise<FaqAnswer | null> {
  if (!message.trim()) return null;

  // WARNING: THE BANK ANSWERS QUESTIONS. IT MUST NOT ANSWER CONVERSATION.
  //
  // Reported with a screenshot: mid-explanation the student typed "החלק השני"
  // - two words meaning "the second part of what you just said" - and the bank
  // served an authored answer about a completely different exercise, stamped
  // "מהחומר המאומת". A confident wrong answer, which is worse than the model
  // call it saved.
  //
  // It got through because the measurement that cleared this layer used the
  // bank's OWN phrasings, which are all real questions. It never tested the
  // messages a student actually sends INSIDE a conversation: "החלק הראשון",
  // "תמשיך", "ומה עכשיו", "הבנתי את זה". Those carry two or three common words,
  // and with a large pool some entry always scores.
  //
  // The separator that works, checked on both sets: a real question either
  // names a piece of mathematics or resolves to a topic. Every fragment above
  // fails both; "מה זה הסתברות מותנית" passes the first, "שליפה עם החזרה"
  // passes the second. A message that does neither belongs to the conversation,
  // and the conversation belongs to the model.
  if (!namesAMathsSubject(message) && !resolveTopic(message)) return null;

  // A message pointing at "this step" or "this exercise" is about something
  // the student is looking at, and on this screen there is nothing to look at.
  if (pointsAtSomethingOnScreen(message)) return null;

  // WARNING: A NAMED TOPIC IS ONE BANK. NO TOPIC IS ALL OF THEM.
  //
  // Itay: "שיהיה לו צינור לכל הבנקים הקיימים והוא ידע לענות בצורה מדויקת בהקשר
  // לשאלה בלי שימוש ב-API". When the message names a topic, searching only that
  // topic is both cheaper and safer. When it names none — "מה זה בעצם משתנה
  // מקרי", asked from the roadmap — the right pool is everything authored,
  // because the question is about mathematics and the app has ~3,500 authored
  // answers about mathematics.
  const banks: string[] = topic ? [topic] : BANKED_TOPICS;
  const pool: TutorFaq[] = [];
  for (const t of banks) {
    let bank: Record<string, TutorFaq[]> | null = null;
    try {
      bank = (await loadFaqBank(subject, t)) as Record<string, TutorFaq[]>;
    } catch {
      continue; // a topic with no bank authored yet
    }
    if (!bank) continue;
    for (const list of Object.values(bank)) {
      for (const f of list) {
        if (!TRANSFERABLE.has(f.kind)) continue;
      // `reveals` entries hand over an answer. With no exercise on screen there
      // is no ladder to be early on, but there is also no reason to volunteer
      // one, and the conservative choice is the one that cannot embarrass us.
        if (f.reveals) continue;
        if (BOUND_TO_ITS_EXERCISE.test(f.a)) continue;
        pool.push(f);
      }
    }
  }
  if (pool.length === 0) return null;

  const idf = buildCorpusIdf(pool.flatMap((f) => [f.q, ...f.alts]));
  const hit = matchFaq(buildFaqIndex(pool, { idf }), message, {
    threshold: FAQ_TRANSFER_THRESHOLD,
    minContentMatches: 2,
  });
  if (!hit) return null;

  return {
    source: 'transfer',
    faqId: hit.faq.id,
    score: hit.score,
    text: hit.faq.a,
  };
}

export async function answerFromFaq(message: string, focus: TutorFocus | null, subject = 'math5'): Promise<FaqAnswer | null> {
  const q = focus?.question;
  if (!q || !focus?.topic) return null;
  // ⚠️ OPTIONAL, BECAUSE THE TYPE LIES ABOUT THE DATA.
  //
  // A concept-quiz question (/quiz) carries no `solution` object at all, so
  // this line threw on every one of the 574 of them — inside a function whose
  // own doc comment says "Never throws". The caller wraps it in a try/catch, so
  // the failure was silent: the FAQ layer simply never ran on /quiz and the
  // turn went to the model looking like an ordinary miss.
  //
  // This is the SECOND time this exact shape has been found. `answerLocally`
  // had `q.solution.steps` too, and /quiz read 0% coverage for months because
  // of it — a throw is invisible to a coverage count, which sees "not answered"
  // either way. Found again by scripts/measure-quiz-gap, which ran the real
  // chain instead of counting entries.
  const steps = q.solution?.steps ?? [];
  const step = stepReference(message, steps.length);

  const bank = await loadFaqBank(subject, focus.topic);
  const entries = bank?.[q.id] ?? [];
  const canReveal = answered(focus);
  const usable = entries.filter((f) => !f.reveals || canReveal);

  if (!bank) return null;
  const idf = topicIdf(bank);

  // ⚠️ THE FOREIGN-SUBJECT SCREEN, and it guards every stage below.
  //
  // `mentionsForeignNumber` stops another exercise's ARITHMETIC reaching the
  // screen. Nothing stopped another SUBJECT: "תסביר לי על וקטורים", typed on a
  // sequences question, matched that question's own entry at 0.77 and was
  // about to be served — an answer with nothing to do with vectors in it, so
  // the number screen was blind to it.
  //
  // Found the honest way. `classifyAsk` used to answer that message from a
  // template, which kept it out of this measurement entirely; anchoring
  // `classifyAsk` let it through to here and the noise gate rose from under
  // 2% to 2.5%. The fix moved the defect rather than removing it, and this is
  // where it actually gets removed.
  const questionSubject = `${q.question} ${steps.join(' ')} ${q.solution?.finalAnswer ?? ''} ${focus.topic ?? ''}`;
  const foreign = foreignSubject(message, questionSubject);
  if (foreign) return null;

  // ---- stage 1: this question's own entries ----
  if (usable.length > 0) {
    const hit = matchFaq(buildFaqIndex(usable, { idf }), message, { step });
    if (hit) return { text: hit.faq.a, source: 'faq', faqId: hit.faq.id, score: hit.score };
  }

  // ---- stage 1b: the OTHER PARTS of this same bagrut question ----
  //
  // Not the same thing as cross-question reuse below, and not subject to its
  // objection. `prob-bag-001/א` … `/ד` are סעיפים of ONE exam question: one
  // story, one set of numbers, one context that the student has on screen in
  // full. An answer written on סעיף ג is about the student's own data.
  //
  // MEASURED: "למה מכפילים ולא מחברים" asked on סעיף א scored 1.00 against
  // `prob-bag-001/ג#4` ("למה כפל ולא חיבור בין השלבים") and was going to the
  // model anyway, because only the current part was ever searched. On סעיף א
  // itself the same words tie three entries at 2/3 and are correctly refused —
  // the answer simply lives one part over.
  //
  // ALL kinds are allowed here, unlike the transfer stage: a `where-from` on a
  // sibling part refers to a number in the same table the student is reading.
  const slash = q.id.indexOf('/');
  if (slash > 0) {
    const questionId = q.id.slice(0, slash);
    const siblings: TutorFaq[] = [];
    for (const [unit, list] of Object.entries(bank)) {
      if (unit === q.id || !unit.startsWith(`${questionId}/`)) continue;
      for (const f of list) {
        if (f.reveals && !canReveal) continue;
        siblings.push(f);
      }
    }
    if (siblings.length > 0) {
      const hit = matchFaq(buildFaqIndex(siblings, { idf }), message, { step });
      if (hit) {
        return {
          source: 'faq',
          faqId: hit.faq.id,
          score: hit.score,
          // Named, because the student should know which סעיף it came from —
          // they can look at it. Opens on a Hebrew word (bidi).
          text: `זה מוסבר בסעיף ${hit.faq.id.slice(questionId.length + 1).split('#')[0]} של אותה שאלה:\n\n${hit.faq.a}`,
        };
      }
    }
  }

  // ---- stage 2: the same IDEA, authored on a different question ----
  // Only when the student did not point at a step (a step reference is about
  // THIS solution and cannot transfer), and only for TRANSFERABLE kinds.
  // Two passes so a sibling exercise wins over a distant one without matchFaq
  // having to know anything about unit ids.
  if (TRANSFER_ENABLED && step === null && !pointsAtThisExercise(message)) {
    // SAME SUB-TOPIC ONLY, and this is a measured choice, not caution for its
    // own sake. Adding a topic-wide fallback was tried and rejected:
    //
    //   same sub-topic only   fires 15.5% · unsafe 1.6%   ← shipping
    //   + whole topic         fires 26.8% · unsafe 5.6%
    //
    // 1.7x the reach for 3.5x the wrong answers. A student who is told
    // something about a different exercise stops trusting the tutor, and that
    // costs more than the model call it saved. Revisit only with a measurement.
    const myGroup = groupOf(q.id);
    const nearPool: TutorFaq[] = [];
    for (const [unit, list] of Object.entries(bank)) {
      if (unit === q.id) continue;
      if (groupOf(`${unit}#0`) !== myGroup) continue;
      for (const f of list) {
        if (!TRANSFERABLE.has(f.kind)) continue;
        if (f.reveals && !canReveal) continue;
        nearPool.push(f);
      }
    }
    // What the student can actually see, for the foreign-number screen.
    const ownText = `${q.question} ${steps.join(' ')} ${q.solution?.finalAnswer ?? ''}`;
    if (nearPool.length > 0) {
      const hit = matchFaq(buildFaqIndex(nearPool, { idf }), message, {
        threshold: FAQ_TRANSFER_THRESHOLD,
        minContentMatches: 2,
      });
      if (hit && !mentionsForeignNumber(hit.faq.a, ownText)) {
        return {
          source: 'transfer',
          faqId: hit.faq.id,
          score: hit.score,
          // Said out loud, because it is true and the student can see the
          // numbers on their own screen: this explains the idea, not this
          // exercise's arithmetic. Opens on a Hebrew word — the bubble is
          // `unicodeBidi: 'plaintext'` and a latin/maths first character flips
          // the whole paragraph to LTR.
          text: `זו שאלה שחוזרת בנושא הזה, אז ההסבר כללי ולא על המספרים שלפניך:\n\n${hit.faq.a}`,
        };
      }
    }
  }

  // No entry, but the student pointed at a step: the step explains itself,
  // with its rule. Withheld when it would hand over the answer before the
  // student has one — the same rule the help ladder applies to its rungs.
  if (step !== null) {
    const text = steps[step];
    if (!text) return null;
    // `?? ''` for the same reason as above: a /quiz question has no solution
    // object, and `leaksAnswer` against an empty string reveals nothing — which
    // is the correct answer when there is no final answer to leak.
    if (!canReveal && leaksAnswer(text, q.solution?.finalAnswer ?? '')) return null;
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
