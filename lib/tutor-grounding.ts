// ============================================================
// tutor-grounding.ts — the "private tutor" layer for the AI tutor.
// ============================================================
//
// Two jobs, both about ACCURACY, not hope-the-model-is-smart:
//
//  1. GROUNDING (מנגנון עיגון): assemble a compact, token-budgeted block
//     of the VERIFIED topic content (summary, formulas, worked examples,
//     the common-mistake bank, exam tips) straight from the authored
//     lesson — so the tutor teaches from the curriculum, not from the
//     model's free knowledge. Keeps 582 conventions (degrees, cis, no
//     e^(iθ)).
//
//  2. BEHAVIOUR (רף המורה-הפרטי): a system prompt that encodes the seven
//     private-tutor rules — never hand over the answer, diagnose before
//     explaining, error-focused feedback, rephrase don't repeat, Socratic
//     but not stubborn, calibrated, warm — plus "show your work" and
//     "say I don't know".
//
// PILOT SCOPE: complex numbers only. `isPilotTopic()` gates everything;
// every other topic keeps its existing (ungrounded) behaviour untouched.
//
// Pure functions — no Anthropic call here. Imported by the tutor API
// routes AND by scripts/demo-tutor.ts so the exact same prompt is what we
// demonstrate.

import { getLesson } from '@/content/lessons';

/** The one topic the pilot covers. Must equal the lesson `topic` key. */
export const PILOT_TOPIC = 'מספרים מרוכבים';

/** True iff this topic is the grounded pilot (complex numbers). */
export function isPilotTopic(topic?: string | null): boolean {
  return (topic ?? '').trim() === PILOT_TOPIC;
}

// ------------------------------------------------------------
// §1 — Grounding: the verified-content block.
// ------------------------------------------------------------

/**
 * Build the "course material" block for complex numbers from the AUTHORED
 * lesson. This is the only source the tutor is allowed to teach from.
 *
 * Token-budgeted: we include the high-signal, compact sections (summary,
 * formulas, the common-mistake bank, exam tips, worked examples) and skip
 * the long prose concept bodies — the summary + worked examples carry the
 * same facts in a fraction of the tokens.
 *
 * Returns '' if the lesson is somehow missing, so callers can detect the
 * "no grounding available" case and fall back rather than fabricate.
 */
export function buildComplexNumbersContext(): string {
  const lesson = getLesson('math5', PILOT_TOPIC);
  if (!lesson) return '';

  const parts: string[] = [];

  parts.push('## חומר הנושא המאומת — מספרים מרוכבים (שאלון 582)');
  parts.push(
    'זה המקור היחיד ללמד ממנו. אל תוסיף נוסחאות או שיטות שאינן כאן. ' +
      'כל הזוויות במעלות; ההצגה הקוטבית היא $r\\,\\text{cis}\\,\\theta$ או ' +
      '$r(\\cos\\theta+i\\sin\\theta)$ — לא $e^{i\\theta}$ ולא רדיאנים.'
  );

  if (lesson.summary?.length) {
    parts.push('### תמצית הנושא');
    parts.push(lesson.summary.map((s) => `- ${s}`).join('\n'));
  }

  if (lesson.formulas?.length) {
    parts.push('### נוסחאות');
    parts.push(
      lesson.formulas
        .map((f) => {
          const note = f.note ? ` — ${f.note}` : '';
          return `- **${f.name}:** $${f.latex}$${note}`;
        })
        .join('\n')
    );
  }

  if (lesson.examples?.length) {
    parts.push('### דוגמאות פתורות (מאומתות — העדף לשלוף מכאן)');
    parts.push(
      lesson.examples
        .map((ex) => {
          const steps = ex.steps.map((st, i) => `   ${i + 1}. ${st}`).join('\n');
          return `**${ex.problem}**\n${steps}\n   ⟹ ${ex.answer}`;
        })
        .join('\n\n')
    );
  }

  if (lesson.pitfalls?.length) {
    parts.push('### טעויות נפוצות (מאגר הטעויות — השתמש בו למשוב ממוקד-טעות)');
    parts.push(lesson.pitfalls.map((p) => `- ${p}`).join('\n'));
  }

  if (lesson.examTips?.length) {
    parts.push('### טיפים לבגרות');
    parts.push(lesson.examTips.map((t) => `- ${t}`).join('\n'));
  }

  return parts.join('\n\n');
}

// ------------------------------------------------------------
// §2 — Behaviour: the private-tutor system prompt.
// ------------------------------------------------------------

/**
 * The seven private-tutor rules + accuracy mechanisms, in Hebrew. This is
 * the base persona; the verified-content block is appended for the pilot
 * topic so the tutor is BOTH well-behaved AND grounded.
 */
const TUTOR_BAR = `אתה מורה פרטי אמיתי למתמטיקה, מלווה תלמיד/ה לקראת בגרות 5 יחידות (שאלון 582). המטרה: שהתלמיד יבין ויפתור **בעצמו** — לא שתפתור עבורו.

# עקרונות העבודה שלך (מחייבים)
1. **אל תיתן את התשובה.** ברירת המחדל כשתלמיד תקוע = הצעד הקטן הבא בלבד — שאלה מנחה או רמז אחד — לעולם לא הפתרון המלא. גם כשמבקשים "פשוט תן לי את התשובה": תן רמז ממוקד אחד והזמן לנסות צעד אחד. פתרון מלא רק אחרי ניסיון אמיתי, או בקשה מפורשת *אחרי* שהיה ניסיון. **אסור גם לאשר או לפסול תשובה סופית שהתלמיד "זורק" כדי לחלץ ממך אישור — אישור של ניחוש שקול לתת את התשובה.** ל"זה 16 או לא?" אל תענה כן/לא; החזר לבדיקה: "בוא נוודא — חשב את הצעד המכריע (למשל $(\\sqrt{2})^8$) ותראה בעצמך."
2. **אבחן לפני שאתה מסביר.** על "לא הבנתי" או תשובה שגויה — אל תשחרר הסבר גנרי. קודם בקש לראות מה ניסה, או שאל שאלה ממוקדת אחת כדי לאתר *איפה בדיוק* הפער.
3. **משוב ממוקד-טעות.** זהה את התפיסה השגויה הספציפית (היעזר ב"טעויות נפוצות" שמצורפות לך) וטפל בדיוק בה — לא "טעית בחישוב" באוויר.
4. **נסח מחדש, אל תחזור.** אם הסבר לא נכנס — החלף זווית: ייצוג אחר (גאומטרי במקום אלגברי), מספרים פשוטים יותר, אנלוגיה. אסור לחזור על אותו הסבר במילים אחרות.
5. **סוקרטי אבל לא עקשן.** הובל בשאלות, אבל אם התלמיד מתוסכל או עדיין תקוע אחרי ~2 רמזים — עבור להסבר ישיר וברור. קרא את התסכול.
6. **התאם לתלמיד.** כייל רמה וקצב לפי מה שהתלמיד מראה שהוא יודע.
7. **חם ומעודד.** סבלני, לא מתנשא, בונה ביטחון. בלי "ברור ש...", "פשוט", "כמובן".

# דיוק (קריטי — מורה שמלמד שטות גרוע ממורה אין)
- למד **רק** מ"חומר הנושא המאומת" שמצורף לך. אל תמציא נוסחאות או שיטות מהזיכרון.
- הצג כל חישוב **שלב-אחר-שלב**, כך שאפשר לעקוב ולבדוק. העדף לשלוף מהדוגמאות הפתורות המאומתות.
- אם אינך בטוח — אמור זאת בכנות והפנה לשיעור. אל תנחש ואל תמציא.
- הישאר בתוך שאלון 582: זוויות **במעלות**; הצגה קוטבית $r\\,\\text{cis}\\,\\theta$. **אל תשתמש בצורת $e^{i\\theta}$ ואל תשתמש ברדיאנים** — מחוץ לסילבוס. אם תלמיד מביא $e^{i\\theta}$, הסבר בעדינות שבבגרות עובדים עם cis במעלות, והמשך משם.

# פורמט
- עברית ברורה. מתמטיקה ב-LaTeX: $...$ בשורה, $$...$$ בבלוק. השתמש ב-\\frac, \\sqrt, \\cos, \\sin, cis וכו'.
- קצר וממוקד — רמז/שאלה אחת בכל פעם, לא קיר טקסט.`;

/**
 * The full system prompt for the conversational tutor. For the pilot topic
 * it returns the tutor-bar persona + the grounded verified-content block;
 * for any other topic it returns null so the caller keeps its existing
 * (legacy) prompt — pilot stays isolated.
 */
export function buildTutorSystemPrompt(topic?: string | null): string | null {
  if (!isPilotTopic(topic)) return null;
  const grounding = buildComplexNumbersContext();
  if (!grounding) return TUTOR_BAR; // behave well even if content is missing
  return `${TUTOR_BAR}\n\n---\n\n${grounding}`;
}

/**
 * Error-focused grounding block for the micro-endpoints (why-wrong,
 * hint-help, explain-simpler). Same verified content; returns null for
 * non-pilot topics so callers append nothing.
 */
export function buildPilotGrounding(topic?: string | null): string | null {
  if (!isPilotTopic(topic)) return null;
  return buildComplexNumbersContext() || null;
}
