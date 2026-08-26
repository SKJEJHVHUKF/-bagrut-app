/**
 * measure-reply-budget.ts — are the reply caps in /api/chat sized correctly?
 *   npm run measure:budget
 *
 * ============================================================
 * THE QUESTION THIS ANSWERS
 * ============================================================
 * `replyBudget` in app/api/chat/route.ts hands each turn one of three
 * `max_tokens` values. Both failure directions cost money and neither is
 * visible from the outside:
 *
 *   TOO LOW  → the answer is cut off mid-sentence, the student asks again, and
 *              that re-ask costs a whole extra turn (~50x what the cap saved).
 *   TOO HIGH → Haiku 4.5 EXPANDS TO FILL IT. MEASURED: the same question
 *              produced 80 output tokens at a 140 cap and 376 at a 400 cap,
 *              both ending naturally. The cap is read as an instruction, not
 *              just as a rail, so a generous one is not free.
 *
 * So the caps cannot be reasoned about — they have to be measured, on real
 * סדרות/הסתברות turns, through the real prompt, with the real context blocks.
 *
 * ⚠️ THIS SPENDS MONEY. It makes SAMPLES x 6 live calls (18 by default, roughly
 * $0.06). It is not part of `npm run check` for that reason. Run it after any
 * edit to TUTOR_CORE's length rules, to replyBudget's constants, or to what the
 * context blocks carry.
 *
 * ============================================================
 * THE BASELINE TO BEAT
 * ============================================================
 *   flat 220, no per-turn budget      5/6  turns truncated
 *   200/400 + brevity rules + word
 *     limit, no context block         3/18 truncated   ← the number to restore
 *   200/400, brevity rules, word
 *     limit REMOVED, with context     9/18 truncated
 *
 * ⚠️ The last two rows differ in TWO ways (the word limit AND the context
 * block), so they are not a clean A/B and neither change is proven to be the
 * cause. Reproduce them one at a time before drawing a conclusion from either.
 * The word limit now lives in the cached TUTOR_CORE rather than the uncached
 * tail; that configuration has NOT been measured (the API usage limit was
 * reached on 2026-08-26 before it could be).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import Anthropic from '@anthropic-ai/sdk';
import { buildTutorSystem } from '@/lib/agents/prompts';
import { TUTOR_TOOLS } from '@/lib/agents/tools';
import { renderMemoryBlock } from '@/lib/tutor-memory';
import { renderFocusContext } from '@/lib/tutor-presence';
import { getSubTopics } from '@/content/lessons';
import { costOfUsage } from '@/lib/mathscan/cost';

const c = new Anthropic();
const MODEL = 'claude-haiku-4-5';
const SAMPLES = 3;
/** Keep in step with replyBudget() in app/api/chat/route.ts. */
const CAP_NUDGE = 200;
const CAP_CONCEPT = 400;

const memory = renderMemoryBlock([
  { text: 'הבגרות שלו ב-12 במרץ.', ts: 1 },
  { text: 'הוא מעדיף דוגמה מספרית לפני הכלל.', ts: 2 },
  { text: 'המורה שלו בכיתה מלמדת עץ הסתברות אחרת.', ts: 3 },
]);

/** A realistic STATE block, at the size lib/tutor-context actually emits. */
const snapshot = `STATE
lvl: 5 מתקדם
exam_d: 34
scope: הסתברות
insight: הוא מזהה נכון מתי להשתמש בהסתברות מותנית אבל נשבר בהצבה במכנה.
weak: הסתברות מותנית <- מרחב מדגם
misc: מכנה לא מעודכן בלי החזרה 4/7 · חיבור במקום כפל בעץ 3/5
next: תרגול עץ הסתברות — שם נופלות רוב הטעויות שלו
top_err: שכחת תנאי x7
due: 6`;

/** The context the bubble builds, off a REAL authored question. */
function ctxFor(topic: string): string {
  const st = getSubTopics('math5', topic)[0];
  const q = st.questions![0];
  return [
    renderFocusContext({
      where: 'תרגול · ' + st.title,
      topic,
      subTopic: st,
      question: q,
      questionText: q.question,
    }),
    snapshot,
  ].join('\n\n');
}

/** A question is on screen — the student is stuck on THIS exercise. */
const NUDGE: [string, string][] = [
  ['הסתברות', 'יש 10 כדורים, 4 אדומים. הוצאתי שניים בלי החזרה וכתבתי 4/10 כפול 4/10.'],
  ['סדרות', 'חישבתי את האיבר החמישי לפי a1+5d'],
  ['סדרות', 'הצבתי בנוסחת הסכום החשבונית בשביל סדרה הנדסית'],
];
/** No exercise on screen — the concept questions that dominate this route. */
const CONCEPT: [string, string][] = [
  ['הסתברות', 'מה זה בעצם הסתברות מותנית'],
  ['סדרות', 'למה בסכום הנדסי יש חזקה ולמה בחשבוני לא'],
  ['סדרות', 'איך יודעים אם סדרה היא חשבונית או הנדסית'],
];

async function bucket(name: string, cases: [string, string][], cap: number, withCtx: boolean) {
  let cut = 0;
  let usd = 0;
  let fresh = 0;
  let out = 0;
  let n = 0;
  for (const [topic, msg] of cases) {
    for (let i = 0; i < SAMPLES; i++) {
      const r = await c.messages.create({
        model: MODEL,
        max_tokens: cap,
        system: buildTutorSystem({ unitLevel: 5, formNumber: '572', topic, memory }),
        tools: TUTOR_TOOLS,
        messages: [
          {
            role: 'user',
            content: withCtx ? `[הקשר — התלמיד עובד על:]\n${ctxFor(topic)}\n\n${msg}` : msg,
          },
        ],
      });
      n++;
      fresh += r.usage.input_tokens;
      out += r.usage.output_tokens;
      usd += costOfUsage(MODEL, r.usage);
      if (r.stop_reason === 'max_tokens') cut++;
    }
  }
  console.log(
    `  ${name.padEnd(8)} cap ${String(cap).padStart(3)}  fresh ${(fresh / n).toFixed(0).padStart(4)}  ` +
      `out ${(out / n).toFixed(0).padStart(3)}  truncated ${cut}/${n}  ` +
      `$${(usd / n).toFixed(5)} = ${((usd / n) * 3.7 * 100).toFixed(2)} אגורות`,
  );
  return { cut, n, usd };
}

(async () => {
  const a = await bucket('NUDGE', NUDGE, CAP_NUDGE, true);
  const b = await bucket('CONCEPT', CONCEPT, CAP_CONCEPT, false);
  const cut = a.cut + b.cut;
  const n = a.n + b.n;
  console.log(`\n  truncation ${cut}/${n}  (${Math.round((cut / n) * 100)}%)`);
  console.log(`  warm turn: ${(((a.usd + b.usd) / n) * 3.7 * 100).toFixed(2)} אגורות average`);
  console.log(
    cut / n > 0.25
      ? '\n  ⚠️ over 25% truncated. Raise the cap for whichever bucket is cutting —\n' +
          '     shortening is the prompt\'s job, and a cut-off answer costs a re-ask.'
      : '\n  ✅ truncation is bounded.',
  );
})();
