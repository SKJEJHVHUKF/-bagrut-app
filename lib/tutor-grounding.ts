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
//     model's free knowledge. Keeps bagrut conventions (degrees, cis, no
//     e^(iθ)).
//
//  2. BEHAVIOUR (רף המורה-הפרטי): a system prompt that encodes the seven
//     private-tutor rules — never hand over the answer, diagnose before
//     explaining, error-focused feedback, rephrase don't repeat, Socratic
//     but not stubborn, calibrated, warm — plus "show your work" and
//     "say I don't know".
//
// SCOPE: every math5 topic that has an authored lesson is grounded (the
// original pilot was complex numbers only; it scaled out once the whole
// curriculum reached the verified "gold" bar). Topics without a lesson
// keep the legacy ungrounded behaviour.
//
// Pure functions — no Anthropic call here. Imported by the tutor API
// routes AND by scripts/demo-tutor.ts so the exact same prompt is what we
// demonstrate.

import { getLesson } from '@/content/lessons';

/** The original pilot topic — kept exported for scripts and older callers. */
export const PILOT_TOPIC = 'מספרים מרוכבים';

// Token-budget guards: big lessons (derivatives, trig) have many examples
// and pitfalls; the grounding block stays compact so multi-turn chats don't
// balloon. The highest-signal items come first in the authored content.
const MAX_EXAMPLES = 6;
const MAX_PITFALLS = 12;

/**
 * What to put in the grounding block.
 *
 * `essentialsOnly: true` keeps the two sections the tutor's own rules actually
 * name — **נוסחאות** and **טעויות נפוצות** — and drops the three that are
 * background: תמצית הנושא, the worked examples, and טיפים לבגרות.
 *
 * It is the right setting on every call that already carries the student's own
 * question and its authored solution, which is every call this app makes except
 * a free chat with nothing on screen. See `buildTopicExtras` for the
 * measurement and for where the dropped sections go instead.
 */
export type GroundingOptions = { essentialsOnly?: boolean };

/** True iff this topic has an authored lesson to ground the tutor in. */
export function isGroundedTopic(topic?: string | null): boolean {
  const t = (topic ?? '').trim();
  if (!t) return false;
  return getLesson('math5', t) !== null;
}

/** Back-compat alias — the "pilot" is now every grounded topic. */
export function isPilotTopic(topic?: string | null): boolean {
  return isGroundedTopic(topic);
}

// ------------------------------------------------------------
// §1 — Grounding: the verified-content block.
// ------------------------------------------------------------

/**
 * Build the "course material" block for a topic from the AUTHORED lesson.
 * This is the only source the tutor is allowed to teach from.
 *
 * Token-budgeted: we include the high-signal, compact sections (summary,
 * formulas, the common-mistake bank, exam tips, worked examples) and skip
 * the long prose concept bodies — the summary + worked examples carry the
 * same facts in a fraction of the tokens.
 *
 * Returns '' if the lesson is missing, so callers can detect the
 * "no grounding available" case and fall back rather than fabricate.
 */
export function buildTopicContext(topic: string, opts?: GroundingOptions): string {
  const t = (topic ?? '').trim();
  const lesson = getLesson('math5', t);
  if (!lesson) return '';
  const full = !opts?.essentialsOnly;

  const parts: string[] = [];

  parts.push(`## חומר הנושא המאומת — ${lesson.topic}`);
  parts.push(
    'זה המקור היחיד ללמד ממנו. אל תוסיף נוסחאות או שיטות שאינן כאן. ' +
      (t === PILOT_TOPIC
        ? 'כל הזוויות במעלות; ההצגה הקוטבית היא $r\\,\\text{cis}\\,\\theta$ או ' +
          '$r(\\cos\\theta+i\\sin\\theta)$ — לא $e^{i\\theta}$ ולא רדיאנים.'
        : 'שמור על מוסכמות הבגרות הישראלית: זוויות במעלות (לא רדיאנים), סימונים כפי שמופיעים בחומר.')
  );

  if (full && lesson.summary?.length) {
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

  if (full && lesson.examples?.length) {
    parts.push(buildWorkedExamples(t));
  }

  if (lesson.pitfalls?.length) {
    parts.push('### טעויות נפוצות (מאגר הטעויות — השתמש בו למשוב ממוקד-טעות)');
    parts.push(lesson.pitfalls.slice(0, MAX_PITFALLS).map((p) => `- ${p}`).join('\n'));
  }

  if (full && lesson.examTips?.length) {
    parts.push('### טיפים לבגרות');
    parts.push(lesson.examTips.map((t2) => `- ${t2}`).join('\n'));
  }

  return parts.join('\n\n');
}

/**
 * The three background sections, for the turn that has nothing on screen.
 *
 * ============================================================
 * WHY THEY ARE SEPARABLE, AND WHY THAT IS THE SECOND-BIGGEST SAVING IN THE TUTOR
 * ============================================================
 * MEASURED with messages.countTokens on claude-haiku-4-5 (2026-08-29): the six
 * worked examples are 41-56% of the entire grounding block.
 *
 *   טריגונומטריה        3,353 of 6,384   53%
 *   גיאומטריה אוקלידית  2,899 of 5,154   56%
 *   סדרות               1,349 of 3,069   44%
 *   הסתברות               952 of 2,309   41%
 *
 * And they are REDUNDANT on the turn that pays for them. When a student has a
 * question on screen, `renderFocusContext` already puts that question's own
 * authored solution in the user message under a `SOLUTION` header — the exact
 * worked example that matters, for the exact question being asked. Six generic
 * examples of the same topic are a second, worse copy of what the model already
 * has, bought at 2x on the cache write.
 *
 * They earn their keep on the OTHER turn: a free chat about the topic with
 * nothing on screen, where there is no specific solution to lean on. So they
 * are emitted there, uncached, and never enter the cached prefix at all — one
 * cache entry per topic instead of two, and the common turn stops paying for
 * the rare one.
 *
 * ⚠️ תמצית הנושא AND טיפים לבגרות TRAVEL WITH THEM, for the same reason and on
 * weaker grounds still: no rule in TUTOR_CORE refers to either. The prompt tells
 * the tutor to teach from the material's METHODS and FORMULAS and to use its
 * טעויות נפוצות for error-focused feedback — so those two sections stay cached,
 * and the summary and the exam tips ride here. A student who asks for tips is
 * now answered by lib/study-tips before any of this is reached.
 */
export function buildTopicExtras(topic: string): string {
  const t = (topic ?? '').trim();
  const lesson = getLesson('math5', t);
  if (!lesson) return '';
  const parts: string[] = [];

  if (lesson.summary?.length) {
    parts.push('### תמצית הנושא');
    parts.push(lesson.summary.map((s) => `- ${s}`).join('\n'));
  }
  const examples = buildWorkedExamples(t);
  if (examples) parts.push(examples);
  if (lesson.examTips?.length) {
    parts.push('### טיפים לבגרות');
    parts.push(lesson.examTips.map((x) => `- ${x}`).join('\n'));
  }

  return parts.join('\n\n');
}

/** The worked-examples section on its own. Used by `buildTopicExtras` and by
 *  `buildTopicContext` on the full path, so the two cannot drift apart. */
export function buildWorkedExamples(topic: string): string {
  const lesson = getLesson('math5', (topic ?? '').trim());
  if (!lesson?.examples?.length) return '';
  return [
    '### דוגמאות פתורות (מאומתות — העדף לשלוף מכאן)',
    lesson.examples
      .slice(0, MAX_EXAMPLES)
      .map((ex) => {
        const steps = ex.steps.map((st, i) => `   ${i + 1}. ${st}`).join('\n');
        return `**${ex.problem}**\n${steps}\n   ⟹ ${ex.answer}`;
      })
      .join('\n\n'),
  ].join('\n\n');
}

/** Back-compat: the original pilot builder, now a thin wrapper. */
export function buildComplexNumbersContext(): string {
  return buildTopicContext(PILOT_TOPIC);
}

// ------------------------------------------------------------
// §2 — Behaviour: the private-tutor system prompt.
// ------------------------------------------------------------

/**
 * The seven private-tutor rules + accuracy mechanisms, in Hebrew. This is
 * the base persona; the verified-content block is appended per grounded
 * topic so the tutor is BOTH well-behaved AND grounded.
 */
function tutorBar(topic?: string | null): string {
  const isComplex = (topic ?? '').trim() === PILOT_TOPIC;
  const conventionRule = isComplex
    ? '- הישאר בתוך שאלון 582: זוויות **במעלות**; הצגה קוטבית $r\\,\\text{cis}\\,\\theta$. **אל תשתמש בצורת $e^{i\\theta}$ ואל תשתמש ברדיאנים** — מחוץ לסילבוס. אם תלמיד מביא $e^{i\\theta}$, הסבר בעדינות שבבגרות עובדים עם cis במעלות, והמשך משם.'
    : '- הישאר בתוך סילבוס הבגרות (שאלונים 581/582): זוויות **במעלות**, לא רדיאנים; רק שיטות וסימונים שמופיעים בחומר המאומת. אם תלמיד מביא שיטה אוניברסיטאית שמחוץ לסילבוס — אמור זאת בעדינות והחזר אותו לדרך של הבגרות.';

  return `אתה מורה פרטי אמיתי למתמטיקה, מלווה תלמיד לקראת בגרות 5 יחידות (שאלונים 581/582). המטרה: שהתלמיד יבין ויפתור **בעצמו** — לא שתפתור עבורו.

# עקרונות העבודה שלך (מחייבים)
1. **אל תיתן את התשובה.** ברירת המחדל כשתלמיד תקוע = הצעד הקטן הבא בלבד — שאלה מנחה או רמז אחד — לעולם לא הפתרון המלא. גם כשמבקשים "פשוט תן לי את התשובה": תן רמז ממוקד אחד והזמן לנסות צעד אחד. פתרון מלא רק אחרי ניסיון אמיתי, או בקשה מפורשת *אחרי* שהיה ניסיון. **אסור גם לאשר או לפסול תשובה סופית שהתלמיד "זורק" כדי לחלץ ממך אישור — אישור של ניחוש שקול לתת את התשובה.** ל"זה 16 או לא?" אל תענה כן/לא; החזר לבדיקה: "בוא נוודא — חשב את הצעד המכריע ותראה בעצמך."
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
${conventionRule}

# פורמט
- עברית ברורה. מתמטיקה ב-LaTeX: $...$ בשורה, $$...$$ בבלוק. השתמש ב-\\frac, \\sqrt, \\cos, \\sin וכו'.
- קצר וממוקד — רמז/שאלה אחת בכל פעם, לא קיר טקסט.`;
}

/**
 * The full system prompt for the conversational tutor. For any grounded
 * topic it returns the tutor-bar persona + the verified-content block; for
 * ungrounded topics it returns null so the caller keeps its existing
 * (legacy) prompt.
 */
export function buildTutorSystemPrompt(topic?: string | null): string | null {
  if (!isGroundedTopic(topic)) return null;
  const grounding = buildTopicContext(topic!);
  if (!grounding) return tutorBar(topic); // behave well even if content is missing
  return `${tutorBar(topic)}\n\n---\n\n${grounding}`;
}

/**
 * Error-focused grounding block for the micro-endpoints (why-wrong,
 * hint-help, explain-simpler). Same verified content; returns null for
 * ungrounded topics so callers append nothing.
 */
export function buildPilotGrounding(
  topic?: string | null,
  opts?: GroundingOptions,
): string | null {
  if (!isGroundedTopic(topic)) return null;
  return buildTopicContext(topic!, opts) || null;
}
