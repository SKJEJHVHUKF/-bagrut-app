/**
 * resolve-topic.ts — which topic is this message about, when the screen has no idea?
 *
 * ============================================================
 * THE SCREEN THIS EXISTS FOR
 * ============================================================
 * The tutor bubble is mounted globally. Inside an exercise the page publishes
 * the question and the topic with it, and everything downstream — the verified
 * grounding, the Topic Cards, the FAQ bank — has what it needs.
 *
 * On the ROADMAP INDEX it publishes neither. Seven consecutive turns there cost
 * $0.0461 (trace, 2026-08-31, 14:23-14:29), every one of them stamped
 * `missing_question_context` with an EMPTY topic:
 *
 *   "בכלל עובד על הסתברות"   $0.0027
 *   "שליפה עם החזרה"          $0.0045
 *   "ההסברות היא חצי"         $0.0034
 *
 * Six of the seven were about probability. The model got the generic curriculum
 * map instead of probability's verified formulas and mistake bank, no Topic
 * Card could fire, and the turns landed in their own cache entry — a cold write
 * that the app's actual probability traffic could not share.
 *
 * The topic was never missing. It was in the sentence.
 *
 * ============================================================
 * IT REFUSES UNLESS IT IS CERTAIN, AND THAT IS THE WHOLE DESIGN
 * ============================================================
 * Resolving the WRONG topic is worse than resolving none: it grounds the tutor
 * in one subject's verified material while the student is asking about another,
 * which is the exact failure the grounding exists to prevent. A wrong topic is
 * a confident wrong answer; a missing topic is only an expensive one.
 *
 * So: a curriculum name must appear in the message LITERALLY, and if two
 * different topics both appear, this returns null and the model decides. There
 * is no scoring, no nearest-match, no stemming.
 */

import { MATH5_CURRICULUM } from '@/content/bagrut-curriculum';

/**
 * Extra words that identify a topic as unambiguously as its own name.
 *
 * ⚠️ EVERY ENTRY HAS TO BE UNIQUE TO ITS TOPIC ACROSS THE WHOLE CURRICULUM, and
 * `scripts/test-resolve-topic.ts` fails if one is not. "נגזרת" belongs to
 * differential calculus and nowhere else; "פונקציה" belongs to half the
 * syllabus and is deliberately absent.
 */
const DISTINCTIVE: Record<string, string[]> = {
  'הסתברות': ['בלי החזרה', 'עם החזרה', 'הסתברות מותנית', 'בייס', 'ברנולי', 'תוחלת', 'דיאגרמת עץ'],
  'סדרות': ['סדרה חשבונית', 'סדרה הנדסית', 'איבר כללי', 'סכום סדרה'],
  'טריגונומטריה': ['משפט הסינוסים', 'משפט הקוסינוסים', 'סינוס', 'קוסינוס', 'טנגנס'],
  'חשבון דיפרנציאלי': ['נגזרת', 'נקודות קיצון', 'אסימפטוט'],
  'חשבון אינטגרלי': ['אינטגרל', 'פונקציה קדומה', 'שטח מתחת לגרף'],
  'גיאומטריה אוקלידית': ['משולשים חופפים', 'משולשים דומים', 'תיכון במשולש', 'טרפז'],
  'גאומטריה אנליטית': ['משוואת ישר', 'משוואת מעגל', 'שיפוע'],
  'וקטורים במרחב': ['וקטור', 'מכפלה סקלרית'],
  'מספרים מרוכבים': ['מספר מרוכב', 'מרוכבים', 'דה מואבר'],
  'סטטיסטיקה': ['סטיית תקן', 'שונות', 'חציון', 'שכיח'],
  'גדילה ודעיכה': ['גדילה ודעיכה', 'דעיכה'],
  'פונקציית ln': ['לוגריתם', 'ln'],
  'פונקציה מעריכית': ['פונקציה מעריכית', 'מעריכית'],
};

/** Every phrase that names a topic, longest first so the specific one wins. */
function phrases(): Array<{ topic: string; phrase: string }> {
  const out: Array<{ topic: string; phrase: string }> = [];
  for (const t of MATH5_CURRICULUM) {
    const key = String((t as { key?: unknown }).key ?? '');
    if (!key) continue;
    out.push({ topic: key, phrase: key });
    const display = String((t as { displayName?: unknown }).displayName ?? '');
    if (display && display !== key) out.push({ topic: key, phrase: display });
  }
  for (const [topic, words] of Object.entries(DISTINCTIVE)) {
    for (const w of words) out.push({ topic, phrase: w });
  }
  return out.sort((a, b) => b.phrase.length - a.phrase.length);
}

const PHRASES = phrases();

/** For the test — the same list the resolver uses, not a copy of it. */
export const TOPIC_PHRASES = PHRASES;

/**
 * The topic this message is about, or null when that is not certain.
 *
 * `null` is the safe answer and the common one. It means the turn goes to the
 * model with the generic curriculum map, exactly as it does today.
 */
export function resolveTopic(message: string): string | null {
  const text = (message ?? '').trim();
  if (!text || text.length > 300) return null;

  const hits = new Set<string>();
  for (const { topic, phrase } of PHRASES) {
    if (text.includes(phrase)) hits.add(topic);
    // Two different topics named in one sentence ("ההבדל בין סדרות להסתברות")
    // is a comparison, and neither one's material is the right grounding for it.
    if (hits.size > 1) return null;
  }
  return hits.size === 1 ? [...hits][0] : null;
}
