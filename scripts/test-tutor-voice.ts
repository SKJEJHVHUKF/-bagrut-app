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

import { allLessonKeys, getSubTopics } from '../content/lessons';
import { answerLocally, classifyAsk, type LocalAnswerKind } from '../lib/tutor-local';
import { focusPrompts, type TutorFocus } from '../lib/tutor-presence';
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

const DIAGS: (AnswerDiagnosis | undefined)[] = [
  undefined,
  { kind: 'sign-flip' },
  { kind: 'conjugate' },
  { kind: 'partial-set', found: 1, total: 2 },
  { kind: 'extra-root', extra: 1 },
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
console.log(`\nרונדרו ${rendered} תשובות · ${checks} בדיקות · ${missing} נפילות ל-API`);
console.log(`${failures === 0 ? '✅' : '❌'}  ${checks - failures}/${checks} passed`);
process.exit(failures === 0 ? 0 : 1);
