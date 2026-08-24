/**
 * test-tutor-voice.ts — every template, every question, rendered.
 *
 *   npx tsx scripts/test-tutor-voice.ts
 *
 * The templates are chosen at runtime from (state × ask × ladder tier ×
 * diagnosis), so a slot that is missing on 4% of the bank is invisible until a
 * student hits it. This renders EVERY question in EVERY state through EVERY
 * ask and asserts the finished string is something a person could have written.
 *
 * The five failure shapes below are the ones the adversarial review actually
 * found — none of them throws, and none is visible in the source:
 *
 *   '{'            an unfilled slot leaked into the student's face
 *   leading '$'    the paragraph opens on maths → the whole line flips to LTR,
 *                  because the bubble is unicodeBidi:'plaintext', not dir=rtl
 *   '\n\n\n'       a slot rendered empty and left a hole
 *   Hebrew in $…$  KaTeX has no bidi support; it comes out reversed
 *   empty          a state with no template at all → silent API call
 */

const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: () => {},
    removeItem: () => {},
  },
};
(globalThis as unknown as { localStorage: unknown }).localStorage = (
  globalThis as unknown as { window: { localStorage: unknown } }
).window.localStorage;

import { allLessonKeys, getSubTopics, getLesson, getSubTopic } from '../content/lessons';
import { CONCEPT_MATH5 } from '../content/concept-quiz/math5';
import { answerLocally, classifyAsk, type LocalAnswerKind } from '../lib/tutor-local';
import { focusPrompts, partAsQuestion, type TutorFocus } from '../lib/tutor-presence';
import type { AnswerDiagnosis } from '../lib/answer-check';

let failures = 0;
let checks = 0;
const seen: string[] = [];
function bad(msg: string) {
  failures++;
  if (failures <= 12) console.log(`FAIL  ${msg}`);
}

/**
 * Hebrew inside a $…$ span — KaTeX has no bidi support and renders it reversed.
 *
 * ⚠️ This cannot be one regex. The obvious `/\$[^$]*[֐-׿][^$]*\$/` matches the
 * text BETWEEN two adjacent spans: in "מכפלתם $6$ וסכומם $-5$" it pairs the
 * CLOSING `$` of the first with the OPENING `$` of the second and reports the
 * perfectly correct Hebrew sitting between them. That produced ~19,000 false
 * failures on the first run of this file. Segments alternate outside/inside, so
 * only the ODD ones are maths.
 */
function hebrewInMath(text: string): string | null {
  const parts = text.split('$');
  for (let i = 1; i < parts.length; i += 2) {
    if (/[֐-׿]/.test(parts[i])) return parts[i];
  }
  return null;
}

/**
 * An unfilled slot, matched BY NAME.
 *
 * A bare `{` is not a defect — `\frac{a}{b}` and `\text{…}` are everywhere in
 * the authored LaTeX. Only a brace wrapping an identifier we actually define
 * means the renderer left a hole in front of the student.
 */
const SLOT_NAMES = [
  'firstStep', 'stepsLeft', 'hint', 'keyPoints3', 'keyPoint1', 'title', 'formulas',
  'steps', 'finalAnswer', 'explanation', 'chosenText', 'correctText', 'studentAnswer',
  'why', 'note',
];
const UNFILLED = new RegExp('\\{(' + SLOT_NAMES.join('|') + ')\\}');

function inspect(where: string, text: string) {
  checks++;
  const un = text.match(UNFILLED);
  if (un) bad(`${where}: unfilled slot ${un[0]}`);
  if (/\n\n\n/.test(text)) bad(`${where}: empty slot left a hole`);
  const heb = hebrewInMath(text);
  if (heb) bad(`${where}: Hebrew inside $…$ → "${heb.slice(0, 50)}"`);
  const first = text.trimStart()[0] ?? '';
  if (first === '$' || first === '`' || /[A-Za-z0-9]/.test(first))
    bad(`${where}: opens on a non-Hebrew character "${first}" → bidi flip`);
  if (!text.trim()) bad(`${where}: empty answer`);
}

// ===== /quiz: a question shape with NO `solution` =====
//
// The concept bank carries `explanation`, not `solution` — and buildSlots read
// `q?.solution.steps`, which guards `q` and not `q.solution`. Every tutor ask
// on /quiz therefore THREW, and the screen measured 0% local coverage while
// its `hint`, `distractorNotes` and `explanation` sat authored and unused.
// TypeScript could not catch it: app/quiz/page.tsx holds the bank in
// `useState<any[]>`, so the shape is erased at the boundary.
//
// Pinned here rather than in a unit test because the failure was a THROW, and
// a throw is invisible to a coverage count — it looks exactly like "no answer
// available" from the outside.
{
  const conceptQuestions: Record<string, unknown>[] = [];
  const collect = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(collect);
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (typeof o.question === 'string' && Array.isArray(o.answers)) conceptQuestions.push(o);
      else Object.values(o).forEach(collect);
    }
  };
  collect(CONCEPT_MATH5);
  if (conceptQuestions.length < 100) bad(`concept bank collapsed to ${conceptQuestions.length} questions`);
  checks++;

  const QUIZ_ASKS = ['תן לי רמז', 'למה התשובה שלי שגויה?', 'תסביר לי את השאלה הזאת מההתחלה'];
  let quizServed = 0;
  let quizTotal = 0;
  for (const q of conceptQuestions) {
    const focus = {
      where: 'בוחן',
      topic: q.topic as string | undefined,
      questionText: q.question as string,
      question: q,
      wrongAnswer: (q.answers as string[])?.[0],
      chosenIndex: 0,
    } as unknown as TutorFocus;
    for (const ask of QUIZ_ASKS) {
      quizTotal++;
      let a: ReturnType<typeof answerLocally> = null;
      try {
        a = answerLocally(ask, focus, []);
      } catch (e) {
        bad(`/quiz "${ask}" THREW on ${String(q.id)}: ${e instanceof Error ? e.message : e}`);
      }
      checks++;
      if (a?.text?.trim()) {
        quizServed++;
        inspect(`/quiz ${String(q.id)} · ${ask}`, a.text);
      }
    }
  }
  const quizRate = quizTotal ? quizServed / quizTotal : 0;
  console.log(
    `\n/quiz local coverage: ${quizServed}/${quizTotal} (${(quizRate * 100).toFixed(1)}%) — was 0% while buildSlots threw`,
  );
  // Deliberately a floor, not an equality: the number should be free to rise.
  if (quizRate < 0.6) bad(`/quiz local coverage fell to ${(quizRate * 100).toFixed(1)}% (floor 60%)`);
  checks++;
}

// Every chip the bubble can render must classify, or that button costs an API
// call on every tap.
//
// ⚠️ DERIVED from focusPrompts, never hand-copied — a hand-copied list stops
// covering the button the day a chip is added, which is exactly how
// "באיזו נוסחה משתמשים כאן?" would have shipped unasserted.
// ⚠️ And kept OUT of ASKS below: the topic chip is "תסביר לי את <נושא>", which
// is only ever produced together with that topic's focus. Feeding it into the
// every-topic × every-state render sweep asks about הסתברות while standing in
// טריגונומטריה — a question the app never asks.
const CHIPS = [
  ...focusPrompts({ wrongAnswer: '5' } as TutorFocus),
  ...focusPrompts({ questionText: 'x' } as TutorFocus),
  ...focusPrompts({ topic: 'הסתברות' } as TutorFocus),
];
if (CHIPS.length < 9) bad(`focusPrompts produced only ${CHIPS.length} chips — the derivation broke`);
checks++;
for (const a of CHIPS) {
  if (!classifyAsk(a)) bad(`the app's own chip "${a}" is not classified — it falls to the API`);
  checks++;
}

const ASKS = [
  'תן לי רמז',
  'מאיפה מתחילים?',
  'למה התשובה שלי שגויה?',
  'תראה לי את הפתרון המלא',
  'איזו נוסחה צריך פה?',
  'באיזו נוסחה משתמשים כאן?',
  'מה הכי חשוב לדעת פה לבגרות?',
];
for (const a of ASKS) {
  if (!classifyAsk(a)) bad(`the app's own chip "${a}" is not classified — it falls to the API`);
  checks++;
}

// ===== how students actually phrase the six asks =====
// The chips above are the app's own wording. Students type their own. Each
// line is a realistic phrasing with the ask it should resolve to — or null
// when abstaining is RIGHT (a genuinely new question belongs to the model).
// Every line is asserted: the vocabulary was grown FROM this list (16 of 35
// missed before), and a phrase that stops classifying is a student silently
// routed to a paid call — the regression this file exists to catch. Add the
// phrase here first, then the keyword; never the other way round.
const PHRASINGS: { text: string; expect: ReturnType<typeof classifyAsk> }[] = [
  // help
  { text: 'לא הבנתי את סעיף ב', expect: 'help' },
  { text: 'איך פותרים את זה?', expect: 'help' },
  { text: 'מה עושים עכשיו?', expect: 'help' },
  { text: 'אפשר עזרה?', expect: 'help' },
  { text: 'תעזור לי בבקשה', expect: 'help' },
  { text: 'אני לא יודע מה לעשות', expect: 'help' },
  { text: 'זה לא יוצא לי', expect: 'help' },
  { text: 'איך ניגשים לסעיף ג', expect: 'help' },
  { text: 'תן לי כיוון', expect: 'help' },
  { text: 'רק רמז קטן', expect: 'help' },
  { text: 'מאיפה אני מתחיל', expect: 'help' },
  { text: 'איך מתחילים את זה', expect: 'help' },
  { text: 'נתקעתי בסעיף א', expect: 'help' },
  { text: 'איך מחשבים את זה', expect: 'help' },
  // Bare method questions — no object, so the only thing they can be about is
  // the question on screen. Reported from a real session: "ואיך מחשבים?" cost
  // $0.01 because the bare form was left out to protect the general-method
  // cases pinned as `null` further down. Both now hold: the object is what
  // separates them.
  { text: 'ואיך מחשבים?', expect: 'help' },
  { text: 'איך מחשבים?', expect: 'help' },
  { text: 'אז איך?', expect: 'help' },
  { text: 'ואיך עושים את זה', expect: 'help' },
  { text: 'איך פותרים?', expect: 'help' },
  { text: 'ואיך?', expect: 'help' },
  // Reported from a real probability session as costing a call. A two-way
  // table is how the question is set up, so asking for it is asking for the
  // first move — which the ladder already serves from authored content.
  { text: 'תן לי הטבלה של זה', expect: 'help' },
  { text: 'תן לי את הטבלה', expect: 'help' },
  { text: 'אפשר טבלה?', expect: 'help' },
  { text: 'תבנה לי טבלה', expect: 'help' },
  { text: 'איך בונים את הטבלה', expect: 'help' },
  // why-wrong
  { text: 'למה זה לא נכון?', expect: 'why-wrong' },
  { text: 'מה לא בסדר בתשובה שלי', expect: 'why-wrong' },
  { text: 'איפה הטעות', expect: 'why-wrong' },
  { text: 'למה קיבלתי לא נכון', expect: 'why-wrong' },
  { text: 'מה עשיתי לא נכון', expect: 'why-wrong' },
  // full
  { text: 'תראה לי את הפתרון', expect: 'full' },
  { text: 'תפתור לי את זה', expect: 'full' },
  { text: 'מה התשובה?', expect: 'full' },
  { text: 'תן לי את הפתרון המלא', expect: 'full' },
  // formulas
  { text: 'איזה נוסחה?', expect: 'formulas' },
  { text: 'מה הנוסחה של זה', expect: 'formulas' },
  // key-points
  { text: 'מה חשוב פה', expect: 'key-points' },
  { text: 'מה צריך לזכור', expect: 'key-points' },
  // explain
  { text: 'תסביר לי שוב', expect: 'explain' },
  { text: 'לא הבנתי את השאלה', expect: 'explain' },
  { text: 'מה רוצים ממני פה', expect: 'explain' },
  { text: 'מה זה אומר', expect: 'explain' },
  // Also reported from a real session. `זה` points at the screen; it is not an
  // object, so there is nothing else the sentence can be about.
  { text: 'איך זה עובד', expect: 'explain' },
  { text: 'איך זה עובד?', expect: 'explain' },
  { text: 'איך זה עובד בדיוק', expect: 'explain' },
  { text: 'איך זה קשור', expect: 'explain' },
  { text: 'למה זה עובד', expect: 'explain' },
  // genuinely new — the model's job
  { text: 'האם אפשר להשתמש בנוסחת הסכום גם כשהסדרה אינסופית?', expect: null },
  { text: 'מה ההבדל בין סדרה חשבונית להנדסית', expect: null },
  { text: 'כמה זמן לוקח לפתור שאלה כזאת בבגרות', expect: null },
  { text: 'זה אמור לצאת 5 לא?', expect: null },
  // …and the method/definition questions the first vocabulary pass HIJACKED
  // into a local hint. A bare verb ("מה עושים", "איך פותרים", "מה זה אומר")
  // matches these; only the this/here/now-anchored phrases may.
  { text: 'מה עושים כשהדיסקרימיננטה שלילית', expect: null },
  { text: 'איך פותרים משוואה ריבועית עם פרמטר באופן כללי', expect: null },
  { text: 'מה זה אומר שהסדרה מתכנסת', expect: null },
  { text: 'מה הכוונה בסדרה חסומה', expect: null },
  { text: 'מה כיוון הווקטור AB', expect: null },
  { text: 'מאיפה הגיע ה-2 בשורה השלישית', expect: null },
  { text: 'איך מחשבים נגזרת של ln בכלל', expect: null },
  // The other side of the two fixes above: name a subject and it is a new
  // question again, so it keeps going to the model.
  { text: 'איך עובד חוק בייס', expect: null },
  { text: 'איך עובדת הסתברות מותנית בכלל', expect: null },
  { text: 'איך זה עובד כשיש שלושה מאורעות בלתי תלויים', expect: null },
  { text: 'מה ההבדל בין טבלה דו ממדית לדיאגרמת עץ', expect: null },
  { text: 'בעזרת איזו שיטה פותרים מערכת עם פרמטר', expect: null },
];
let phrasingMisses = 0;
for (const p of PHRASINGS) {
  const got = classifyAsk(p.text);
  if (got !== p.expect) {
    phrasingMisses++;
    bad(`ניסוח "${p.text}" → ${got ?? 'API'}, ציפיתי ל-${p.expect ?? 'API'}`);
  }
  checks++;
}
console.log(`ניסוחי תלמידים: ${PHRASINGS.length - phrasingMisses}/${PHRASINGS.length} מסווגים כמצופה`);

const DIAGS: (AnswerDiagnosis | undefined)[] = [
  undefined,
  { kind: 'sign-flip' },
  { kind: 'conjugate' },
  { kind: 'partial-set', found: 1, total: 2 },
  { kind: 'extra-root', extra: 1 },
  { kind: 'swapped' },
];

let rendered = 0;
let missing = 0;

for (const key of allLessonKeys()) {
  if (key.subject !== 'math5') continue;
  for (const st of getSubTopics(key.subject, key.topic)) {
    for (const q of st.questions ?? []) {
      const base: TutorFocus = {
        where: `תרגול · ${st.title}`,
        topic: key.topic,
        questionText: q.question,
        question: q,
        subTopic: st,
      };
      const variants: { name: string; f: TutorFocus }[] = [{ name: 'לפני מענה', f: base }];

      if (q.kind === 'mcq') {
        (q.answers ?? []).forEach((ans, i) => {
          if (i === q.correct) return;
          variants.push({ name: `טעה ב-${i}`, f: { ...base, chosenIndex: i, wrongAnswer: ans } });
        });
        variants.push({
          name: 'אחרי חשיפה',
          f: { ...base, chosenIndex: 0, wrongAnswer: q.answers?.[0], correctAnswer: q.answers?.[q.correct ?? 0] },
        });
      } else {
        for (const d of DIAGS) {
          variants.push({
            name: `פתוחה · ${d?.kind ?? 'ללא אבחון'}`,
            f: { ...base, wrongAnswer: 'x=3', ...(d ? { answerDiagnosis: d } : {}) },
          });
        }
      }

      for (const v of variants) {
        for (const ask of ASKS) {
          // Walk the escalation too — a spent ladder is its own state.
          const served: LocalAnswerKind[] = [];
          for (let turn = 0; turn < 3; turn++) {
            const a = answerLocally(ask, v.f, served);
            if (!a) {
              missing++;
              if (missing <= 5) console.log(`  ↯ ללא תשובה: ${q.id} · ${v.name} · "${ask}" (תור ${turn + 1})`);
              break;
            }
            rendered++;
            if (!served.includes(a.kind)) served.push(a.kind);
            inspect(`${q.id}·${v.name}·${ask.slice(0, 12)}`, a.text);
            if (ask !== 'תן לי רמז' && ask !== 'מאיפה מתחילים?') break;
          }
        }
      }
    }
  }
}

// The no-question screen.
for (const key of allLessonKeys()) {
  if (key.subject !== 'math5') continue;
  const st = getSubTopics(key.subject, key.topic)[0];
  if (!st) continue;
  for (const ask of ASKS) {
    const a = answerLocally(ask, { where: `שיעור · ${st.title}`, topic: key.topic, subTopic: st });
    if (!a) { missing++; console.log(`  ↯ מסך ללא שאלה: ${key.topic} · "${ask}"`); continue; }
    rendered++;
    inspect(`H·${key.topic}·${ask.slice(0, 12)}`, a.text);
  }
}

void seen;
// ===== bagrut PARTS — the same sweep, through partAsQuestion =====
// Before the adapter every part sat in state I ("I can see a question but not
// its breakdown") and every ask on it fell to the API. This renders each part
// in each state it can be in on the card — before answering, after a wrong
// answer (each diagnosis shape), after the solution is revealed — and at both
// ends of the hint ladder (no hint seen / every hint seen, where the next rung
// MUST be the rule line, never a paid call). The per-topic line at the end is
// the measured local-answer rate for parts; it is a number, not a promise.
let partsRendered = 0;
let partsMissing = 0;
const partsByTopic = new Map<string, { ok: number; miss: number; fb: number }>();
for (const key of allLessonKeys()) {
  if (key.subject !== 'math5') continue;
  const L = getLesson(key.subject, key.topic);
  for (const b of L?.bagrutQuestions ?? []) {
    const st = b.subTopicId ? getSubTopic(key.subject, key.topic, b.subTopicId) : null;
    for (const p of b.parts) {
      for (const shown of [0, p.hints.length]) {
        const q = partAsQuestion(p, { questionId: b.id, difficulty: b.difficulty, hintsShown: shown });
        const base: TutorFocus = {
          where: `שאלת בגרות · ${key.topic} · סעיף ${p.label}`,
          topic: key.topic,
          questionText: p.prompt,
          question: q,
          ...(st ? { subTopic: st } : {}),
        };
        const variants: { name: string; f: TutorFocus }[] = [
          { name: `לפני מענה · ${shown} רמזים נצפו`, f: base },
          ...DIAGS.map((d) => ({
            name: `טעה · ${d?.kind ?? 'ללא אבחון'} · ${shown} רמזים`,
            f: { ...base, wrongAnswer: 'x=3', ...(d ? { answerDiagnosis: d } : {}) },
          })),
          { name: `אחרי חשיפה · ${shown} רמזים`, f: { ...base, wrongAnswer: 'x=3', correctAnswer: p.solution.final_answer } },
        ];
        const tally = partsByTopic.get(key.topic) ?? { ok: 0, miss: 0, fb: 0 };
        for (const v of variants) {
          for (const ask of ASKS) {
            const served: LocalAnswerKind[] = [];
            for (let turn = 0; turn < 3; turn++) {
              const a = answerLocally(ask, v.f, served);
              if (!a) {
                partsMissing++;
                tally.miss++;
                if (partsMissing <= 5) console.log(`  ↯ סעיף ללא תשובה: ${q.id} · ${v.name} · "${ask}" (תור ${turn + 1})`);
                break;
              }
              partsRendered++;
              tally.ok++;
              if (a.fallback) tally.fb++;
              if (!served.includes(a.kind)) served.push(a.kind);
              inspect(`${q.id}·${v.name}·${ask.slice(0, 12)}`, a.text);
              if (ask !== 'תן לי רמז' && ask !== 'מאיפה מתחילים?') break;
            }
          }
        }
        partsByTopic.set(key.topic, tally);
      }
    }
  }
}
rendered += partsRendered;
missing += partsMissing;
// "local" is the cost number; "tailored" is the quality number. A fallback is
// still authored wording at $0, but it is the generic sentence — the share of
// them per topic says where the next content pass (hints, sub-topic key
// points) buys the most.
console.log('\nסעיפי בגרות — תשובות מקומיות לפי נושא (מקומי · מתוכן מותאם):');
for (const [topic, t] of [...partsByTopic.entries()].sort((a, b) => b[1].ok + b[1].miss - (a[1].ok + a[1].miss))) {
  const total = t.ok + t.miss;
  const tailored = t.ok ? Math.round(((t.ok - t.fb) / t.ok) * 100) : 0;
  console.log(`  ${topic.padEnd(22)} ${String(t.ok).padStart(5)}/${String(total).padEnd(5)} (${Math.round((t.ok / total) * 100)}%) · מותאם ${tailored}%`);
}
const partsTotal = partsRendered + partsMissing;
console.log(`  סה"כ סעיפים: ${partsRendered}/${partsTotal} מקומי (${partsTotal ? Math.round((partsRendered / partsTotal) * 100) : 0}%) · ${partsMissing} נפילות ל-API`);

console.log(`\nרונדרו ${rendered} תשובות · ${checks} בדיקות · ${missing} נפילות ל-API`);
console.log(`${failures === 0 ? '✅' : '❌'}  ${checks - failures}/${checks} passed`);
process.exit(failures === 0 ? 0 : 1);
