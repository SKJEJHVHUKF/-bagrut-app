/**
 * test-turn-budget.ts — what one tutor turn costs, asserted at commit time.
 *
 *   npx tsx scripts/test-turn-budget.ts
 *
 * FREE. `messages.countTokens` is not billed. No model call.
 *
 * ============================================================
 * WHY THIS FILE IS THE ACTUAL FIX
 * ============================================================
 * Itay, after the third round of cost work: "כל פעם שאנחנו מצליחים ליעל את
 * עלויות ה-API שוב פעם לאחר כמה ימים הוא זולל הרבה יותר. אני דורש שנפתור את
 * זה אחד ולתמיד."
 *
 * He was right three rounds running, and the reason is not any one change. It
 * is that every change was measured ONCE, against the number it was meant to
 * move, and nothing measured the SUM. Each of these was a good trade on its own
 * and invisible afterwards:
 *
 *   the student snapshot          + fresh tokens, every turn
 *   the authored SOLUTION block   + fresh tokens, every turn
 *   `recent` (the local turns)    + fresh tokens, every turn
 *   a rule added to TUTOR_CORE    + cached tokens, every turn
 *
 * Four of those in a week is the cost back where it started, and no single
 * commit looks wrong in review.
 *
 * Worse, one of them silently broke caching: translating TUTOR_CORE to English
 * shrank block 0's prefix to 35 tokens UNDER Haiku's floor, so the shared entry
 * stopped forming and every topic rewrote the whole prefix. The prompt got
 * smaller and the bill did not move.
 *
 * So this asserts the WHOLE turn, in the two currencies that actually bill:
 * fresh tokens at 1.0x and cached tokens at 0.1x. A change that makes a turn
 * more expensive now fails `npm run check` and has to be argued for in a
 * number, not in a paragraph.
 *
 * ============================================================
 * RAISING A BUDGET IS ALLOWED. DOING IT SILENTLY IS NOT.
 * ============================================================
 * These are not sacred. If a change is worth more than it costs, raise the
 * number IN THE SAME COMMIT and say what was bought. The failure this prevents
 * is not "the prompt grew" — it is "the prompt grew and nobody noticed".
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { buildTutorSystem } from '../lib/agents/prompts';
import { TUTOR_TOOLS } from '../lib/agents/tools';
import { renderFocusContext } from '../lib/tutor-presence';
import { getLesson } from '../content/lessons';

const MODEL = 'claude-haiku-4-5';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ---- the budgets, and what each one is protecting -----------------

/**
 * Fresh (uncached) tokens on a warm turn, billed at 1.0x.
 *
 * ⚠️ THE ONE THAT ROTS. The cached prefix is visible in every review because
 * it is what `measure:cache` prints; fresh input is billed at TEN TIMES the
 * rate and nobody looks at it, so it is where a fix quietly puts its cost back.
 * MEASURED from the live trace: 2,523 tokens/turn on 24 Aug, 1,619 on 31 Aug —
 * it moves in both directions and only the trace ever noticed.
 *
 * The budget is the SUM of the focus brief, the replayed history and the
 * student's own message.
 */
const FRESH_BUDGET = 2600;

/**
 * What a warm turn bills, in base-input-token equivalents:
 * cached prefix x0.1 + fresh x1.0 + output x5.0.
 *
 * Sized off the measured steady state (~3,300) with room for one deliberate
 * addition, not for four accidental ones.
 */
const WARM_TURN_BUDGET = 4200;

/** The reply budget for a nudge turn — see replyBudget in app/api/chat. */
const OUTPUT_TOKENS = 200;

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

/** A real trigonometry question with a real authored solution — the heaviest
 *  common shape, so the budget is not sized off a toy. */
function realFocus() {
  const lesson = getLesson('math5', 'טריגונומטריה') as unknown as Record<string, unknown>;
  const found: Array<Record<string, unknown>> = [];
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    const o = n as Record<string, unknown>;
    const sol = o.solution as Record<string, unknown> | undefined;
    if (typeof o.question === 'string' && Array.isArray(sol?.steps)) found.push(o);
    for (const v of Object.values(o)) walk(v);
  };
  walk(lesson);
  found.sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length);
  const question = found[0];
  return {
    where: 'roadmap',
    topic: 'טריגונומטריה',
    questionText: question.question as string,
    question,
  };
}

(async () => {
  const base = (
    await client.messages.countTokens({ model: MODEL, messages: [{ role: 'user', content: 'x' }] })
  ).input_tokens;
  const count = async (o: Record<string, unknown>) =>
    (await client.messages.countTokens({
      model: MODEL,
      messages: [{ role: 'user', content: 'x' }],
      ...o,
    } as never)).input_tokens - base;

  const focus = realFocus();
  const blocks = buildTutorSystem({
    unitLevel: 5,
    formNumber: '582',
    topic: 'טריגונומטריה',
    hasQuestion: true,
  } as never);
  // ⚠️ EVERYTHING UP TO THE LAST MARKER IS CACHED, MARKER OR NOT.
  //
  // The first version of this file filtered blocks by `cache_control` and got
  // both halves wrong: TUTOR_CORE carries no marker of its own — the marker
  // sits on the block AFTER it — so filtering moved 3,098 cached tokens into
  // the "fresh" column and reported a warm turn at nearly twice its real cost.
  // A budget measured off the wrong payload is worse than no budget: it fails
  // on changes that are fine and passes the ones that are not.
  let lastMark = -1;
  blocks.forEach((b, i) => { if ((b as { cache_control?: unknown }).cache_control) lastMark = i; });
  const cached = blocks.slice(0, lastMark + 1);
  const uncachedSystem = blocks.slice(lastMark + 1);

  // ---- the pieces, exactly as app/api/chat assembles them ----------
  const brief = renderFocusContext(focus as never);
  // The student snapshot is client-side (localStorage) and capped at MAX_LEN in
  // lib/tutor-context. Represented here at its cap rather than skipped, because
  // a budget that ignores the biggest optional block is not a budget.
  const snapshot = 'STATE\n' + 'לרמה 5 · ימים לבגרות 74 · נושא טריגונומטריה · חולשה משפט הסינוסים. '.repeat(14);
  const attemptContext = `${brief}\n\n${snapshot}`.slice(0, 4000);
  // CONTEXT_MESSAGE_COUNT = 4, each capped at MAX_TURN_LEN = 500 chars.
  // ⚠️ REAL HEBREW, NOT A REPEATED CHARACTER. `'א'.repeat(500)` tokenises to
  // almost nothing — a budget sized against it would pass any change and catch
  // none. This is a local reply at roughly the 500-char cap the route applies.
  const assistantTurn =
    'ספרת קפיצה אחת יותר מדי בדרך מהאיבר הראשון לחמישי. במשולש ישר-זווית הצלע שמול הזווית ' +
    'החדה מחולקת ביתר נותנת את הסינוס, והצלע שצמודה לזווית מחולקת ביתר נותנת את הקוסינוס. ' +
    'בשאלה שלפניך נתונה הזווית והיתר, ומבקשים את הצלע שמול הזווית, ולכן הכלי המתאים הוא ' +
    'הסינוס. נסה לכתוב את השוויון בעצמך ותראה איזה מספר יוצא לך.';
  const history = Array.from({ length: 4 }, (_, i) => ({
    role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    content: i % 2 === 0 ? 'לא הבנתי את הצעד הזה, אפשר עוד פעם' : assistantTurn.slice(0, 500),
  }));
  const lastUser = `[הקשר — התלמיד עובד על:]\n${attemptContext}\n\nלמה זה לא יוצא לי`;

  console.log('\n=== the cached side, billed at 0.1x on a warm turn ===\n');
  const prefix = await count({ system: cached, tools: TUTOR_TOOLS });
  console.log(`  cached prefix                 ${String(prefix).padStart(6)} tok  → ${Math.round(prefix * 0.1)} tok-eq warm`);

  console.log('\n=== the fresh side, billed at 1.0x on EVERY turn ===\n');
  const level = await count({ system: uncachedSystem });
  const briefTok = await count({ system: [{ type: 'text', text: brief }] });
  const snapTok = await count({ system: [{ type: 'text', text: snapshot }] });
  const histTok = await count({ messages: history });
  const fresh = await count({ system: uncachedSystem, messages: [...history, { role: 'user', content: lastUser }] });

  console.log(`  focus brief (SCREEN+SOLUTION) ${String(briefTok).padStart(6)} tok`);
  console.log(`  student snapshot (STATE)      ${String(snapTok).padStart(6)} tok`);
  console.log(`  replayed history (4 turns)    ${String(histTok).padStart(6)} tok`);
  console.log(`  uncached system tail          ${String(level).padStart(6)} tok`);
  console.log(`  ───────────────────────────────────────`);
  console.log(`  FRESH TOTAL                   ${String(fresh).padStart(6)} tok   budget ${FRESH_BUDGET}`);

  ok(fresh <= FRESH_BUDGET, `fresh input is within budget (${fresh} ≤ ${FRESH_BUDGET})`);

  console.log('\n=== what a warm turn bills ===\n');
  const warm = Math.round(prefix * 0.1 + fresh + OUTPUT_TOKENS * 5);
  console.log(`  ${Math.round(prefix * 0.1)} (cache read) + ${fresh} (fresh) + ${OUTPUT_TOKENS * 5} (output)`);
  console.log(`  = ${warm} tok-eq  ≈ $${((warm / 1e6) * 1).toFixed(5)}   budget ${WARM_TURN_BUDGET}\n`);
  ok(warm <= WARM_TURN_BUDGET, `a warm turn is within budget (${warm} ≤ ${WARM_TURN_BUDGET})`);

  // ---- and the cold turn, which is what a student actually feels ----
  //
  // ⚠️ NOT A BUDGET, A REPORT. The cold write is 2x the prefix and is paid once
  // per prefix per hour, SHARED by every student on every topic — so it is the
  // one number that gets cheaper as the product grows, and gating it would be
  // gating against having users.
  const cold = Math.round(prefix * 2 + fresh + OUTPUT_TOKENS * 5);
  console.log(`  first turn after an hour of quiet: ${cold} tok-eq ≈ $${((cold / 1e6) * 1).toFixed(4)}`);
  console.log('  (paid once per hour for the WHOLE app, not per student)\n');

  console.log(
    failed === 0
      ? 'OK turn budget: a turn costs what it is supposed to cost\n'
      : `\nFAILED: ${failed}\n\n` +
          '  A turn got more expensive. That may be the right call — if it is, raise\n' +
          '  the budget IN THIS COMMIT and write down what it bought. What must not\n' +
          '  happen is the number moving without anyone deciding that it should.\n',
  );
  process.exitCode = failed === 0 ? 0 : 1;
})();
