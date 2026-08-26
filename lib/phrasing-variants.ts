/**
 * phrasing-variants.ts — the other ways to say the same thing, for free.
 *
 * ============================================================
 * THE PROBLEM THIS SOLVES
 * ============================================================
 * The answer library stores what ONE student typed. The next student asks the
 * same thing in different words and the stored answer is not found, so the
 * model is paid again for an answer we already own.
 *
 * An authored FAQ entry does not have this problem because a person wrote five
 * phrasings for it. The library has one, and nobody is going to write four more
 * for every row.
 *
 * Measured on nine realistic re-wordings of stored questions: the library's
 * matching found 3, the real FAQ matcher found 5, and every one of the four it
 * still missed differed by VERB FORM alone:
 *
 *   "למה מחלקים ב-3"  vs  "למה צריך לחלק בשלוש"
 *   "למה לא מחסרים"   vs  "למה לא לחסר במקום"
 *   "למה הטבלה בנויה" vs  "למה בונים את הטבלה"
 *
 * ============================================================
 * WHY MORPHOLOGY AND NOT A MODEL
 * ============================================================
 * Itay's constraint, and it is the right one: expanding phrasings must not
 * itself cost API. A model asked for paraphrases would cost per row forever,
 * to solve a problem that is grammar.
 *
 * Hebrew present tense and infinitive are mechanical: מחלקים / לחלק / חילקנו
 * all carry the stem חלק. Producing the sibling forms of a verb is a rule, not
 * a judgement, so it runs offline, deterministically, at zero cost, and gives
 * the same answer every time — which a model would not.
 *
 * ============================================================
 * WHAT IT DELIBERATELY IS NOT
 * ============================================================
 * Not a stemmer for the shared tokenizer. `tokenGroups` in lib/tutor-faq is
 * used by the whole FAQ bank, and a clitic change there was tried once and
 * came back a NET REGRESSION across 156 content lines. This module produces
 * extra PHRASINGS for one library row; the tokenizer is untouched, and the
 * bank's measured recall and noise cannot move because of it.
 */

/**
 * Verb families, written as the forms students actually type.
 *
 * ⚠️ ONE FAMILY PER LINE, AND EVERY MEMBER IS A REAL FORM. The temptation is to
 * derive these with a prefix/suffix rule — strip מ, strip ים, add ל — and it
 * produces non-words at a rate that puts noise into the index. Hebrew verb
 * morphology is regular enough to look mechanical and irregular enough to
 * punish it: מחלקים → חלק is right, מקבלים → קבל is right, but מבין → בין is
 * not a form anybody types.
 *
 * A closed list is boring, checkable, and cannot invent. It grows from the
 * trace when a real miss shows a family is absent.
 */
const VERB_FAMILIES: string[][] = [
  ['מחלקים', 'לחלק', 'מחלק', 'חילקנו', 'חילקתי', 'חלוקה'],
  ['מכפילים', 'להכפיל', 'מכפיל', 'הכפלנו', 'הכפלתי', 'כפל'],
  ['מחברים', 'לחבר', 'מחבר', 'חיברנו', 'חיברתי', 'חיבור'],
  ['מחסרים', 'לחסר', 'מחסר', 'חיסרנו', 'חיסרתי', 'חיסור'],
  ['מציבים', 'להציב', 'מציב', 'הצבנו', 'הצבתי', 'הצבה'],
  ['מחשבים', 'לחשב', 'מחשב', 'חישבנו', 'חישבתי', 'חישוב'],
  ['פותרים', 'לפתור', 'פותר', 'פתרנו', 'פתרתי', 'פתרון'],
  ['בודקים', 'לבדוק', 'בודק', 'בדקנו', 'בדקתי', 'בדיקה'],
  ['מוצאים', 'למצוא', 'מוצא', 'מצאנו', 'מצאתי'],
  ['בונים', 'לבנות', 'בונה', 'בנינו', 'בנויה', 'בנוי'],
  ['כותבים', 'לכתוב', 'כותב', 'כתבנו', 'כתבתי'],
  ['מסמנים', 'לסמן', 'מסמן', 'סימנו', 'סימון'],
  ['מוחקים', 'למחוק', 'מוחק'],
  ['מעלים', 'להעלות', 'מעלה'],
  ['מורידים', 'להוריד', 'מוריד'],
  ['סופרים', 'לספור', 'סופר', 'ספירה'],
  ['בוחרים', 'לבחור', 'בוחר', 'בחרנו', 'בחירה'],
  ['מוציאים', 'להוציא', 'מוציא', 'הוצאנו', 'הוצאה'],
  ['משתמשים', 'להשתמש', 'משתמש', 'שימוש'],
  ['יודעים', 'לדעת', 'יודע', 'ידענו'],
  ['מבינים', 'להבין', 'מבין', 'הבנתי'],
  ['מתחילים', 'להתחיל', 'מתחיל', 'התחלנו', 'התחלה'],
  ['ממשיכים', 'להמשיך', 'ממשיך', 'המשך'],
  ['מקבלים', 'לקבל', 'מקבל', 'קיבלנו', 'קיבלתי'],
  ['מסדרים', 'לסדר', 'מסדר', 'סידור'],
  ['מכנים', 'לכנות', 'נקרא', 'נקראת'],
];

/** Digits students write as words, and the reverse. */
const NUMBER_WORDS: Array<[string, string]> = [
  ['1', 'אחד'], ['2', 'שתיים'], ['3', 'שלוש'], ['4', 'ארבע'], ['5', 'חמש'],
  ['6', 'שש'], ['7', 'שבע'], ['8', 'שמונה'], ['9', 'תשע'], ['10', 'עשר'],
  ['2', 'שניים'], ['3', 'שלושה'], ['4', 'ארבעה'], ['5', 'חמישה'],
];

/** Question openers that mean the same ask. */
const OPENERS: string[][] = [
  ['למה', 'מדוע'],
  ['איך', 'כיצד'],
  ['מאיפה', 'מהיכן', 'מניין'],
  ['מה קורה', 'מה יקרה', 'מה משתנה'],
  ['צריך', 'חייבים', 'אמורים'],
];

const FAMILY_OF = new Map<string, string[]>();
for (const fam of [...VERB_FAMILIES, ...OPENERS]) for (const w of fam) FAMILY_OF.set(w, fam);

/** Cap so one long question cannot produce a hundred rows. */
const MAX_VARIANTS = 8;

/**
 * Other ways to write the same question. Never includes the original.
 *
 * Deterministic and order-stable: the same input always produces the same list,
 * so a row regenerated tomorrow matches the row stored today. One substitution
 * at a time — combining them multiplies out to nonsense far faster than it adds
 * coverage, and every extra phrasing is a chance for the index to match the
 * wrong entry.
 */
export function expandPhrasing(q: string): string[] {
  const src = q.trim();
  if (!src) return [];
  const out = new Set<string>();
  const tokens = src.split(/\s+/);

  for (let i = 0; i < tokens.length && out.size < MAX_VARIANTS * 3; i++) {
    const bare = tokens[i].replace(/[?!.,]/g, '');
    const fam = FAMILY_OF.get(bare);
    if (fam) {
      for (const alt of fam) {
        if (alt === bare) continue;
        const copy = [...tokens];
        copy[i] = tokens[i].replace(bare, alt);
        out.add(copy.join(' '));
      }
    }
    // A digit written as a word, and the reverse. Both directions, because
    // "ב-3" and "בשלוש" are the same question and neither is the canonical one.
    for (const [digit, word] of NUMBER_WORDS) {
      if (bare === digit || bare === `ב${digit}` || bare === `ב-${digit}`) {
        const copy = [...tokens];
        copy[i] = tokens[i].replace(digit, word).replace('-', '');
        out.add(copy.join(' '));
      } else if (bare === word || bare === `ב${word}`) {
        const copy = [...tokens];
        copy[i] = tokens[i].replace(word, digit);
        out.add(copy.join(' '));
      }
    }
  }

  out.delete(src);
  return [...out].slice(0, MAX_VARIANTS);
}

/**
 * A number the student named that the stored question does not, or null.
 *
 * ⚠️ THIS IS THE SCREEN THAT MAKES THE WHOLE THING SAFE.
 *
 * Measured before it existed: "למה מחלקים ב-12" was served the answer to "למה
 * מחלקים ב-3". Same verb, same shape, one different digit — and the reply
 * explains an arithmetic step that is not the student's. That is the single
 * worst failure this system can produce, worse than paying for the call,
 * because it is specific and it is confident.
 *
 * The FAQ bank runs the same idea as `mentionsForeignNumber`. Here it is the
 * cheaper direction: a number in the QUESTION that the stored phrasing never
 * mentions means they are not the same question, whatever else they share.
 *
 * Number words count as their digits, so "בשלוש" does not read as foreign to a
 * stored "ב-3".
 */
export function foreignNumber(message: string, stored: string): string | null {
  const digits = (t: string) => {
    let s = ` ${t} `;
    for (const [d, w] of NUMBER_WORDS) s = s.replace(new RegExp(w, 'g'), ` ${d} `);
    return new Set((s.match(/\d+(?:\.\d+)?/g) ?? []));
  };
  const mine = digits(stored);
  for (const n of digits(message)) if (!mine.has(n)) return n;
  return null;
}
