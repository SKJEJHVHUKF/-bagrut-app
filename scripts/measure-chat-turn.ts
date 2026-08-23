/**
 * measure-chat-turn.ts — where does the money in one tutor turn actually go?
 *
 *   npx tsx scripts/measure-chat-turn.ts [topic]
 *
 * FREE — token counting, not generation.
 *
 * Builds the EXACT payload /api/chat sends (system blocks from
 * lib/agents/prompts, focus context from lib/tutor-presence, the student
 * snapshot, replayed history) and prices each part separately, for a cold
 * first turn and for a warm follow-up. Written because "a short chat cost
 * $0.02" needs a breakdown, not a theory: the parts differ by 10x in cost and
 * only a measurement says which one to cut.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import Anthropic from '@anthropic-ai/sdk';
import { buildTutorSystem } from '../lib/agents/prompts';
import { renderFocusContext, partAsQuestion } from '../lib/tutor-presence';
import { getLesson } from '../content/lessons';

const TOPIC = process.argv[2] ?? 'הסתברות';
const MODEL = 'claude-haiku-4-5';
const RATE = { input: 1 / 1e6, output: 5 / 1e6 };
const WRITE_5M = 1.25;
const WRITE_1H = 2.0;
const CACHE_READ = 0.1;
/** What buildTutorSystem actually declares today. Keep in sync with CACHE_1H. */
const CACHE_WRITE = WRITE_1H;
/** Observed answer length. max_tokens is 800; a tutor reply is rarely that long. */
const TYPICAL_OUTPUT = 380;

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) { console.error('ANTHROPIC_API_KEY missing'); process.exit(1); }
const client = new Anthropic({ apiKey });

const count = async (text: string) =>
  text.trim()
    ? (await client.messages.countTokens({ model: MODEL, messages: [{ role: 'user', content: text }] })).input_tokens
    : 0;

(async () => {
  const L = getLesson('math5', TOPIC);
  const b = L?.bagrutQuestions?.[0];
  const p = b?.parts?.[0];
  if (!b || !p) { console.error(`no bagrut question in ${TOPIC}`); process.exit(1); }

  // ---- system: the cached prefix + the uncached tail ----
  const blocks = buildTutorSystem({ unitLevel: 5, formNumber: '571', topic: TOPIC, memory: '' });
  let cached = 0;
  let tail = 0;
  for (const blk of blocks) {
    const n = await count(blk.text);
    if (blk.cache_control) cached += n; else tail += n;
  }

  // ---- per-turn context ----
  const q = partAsQuestion(p, { questionId: b.id, difficulty: b.difficulty, hintsShown: 0 });
  const focus = renderFocusContext({
    where: `שאלת בגרות · ${TOPIC} · סעיף ${p.label}`,
    topic: TOPIC, questionText: p.prompt, question: q, wrongAnswer: 'x=3',
  });
  const focusTokens = await count(focus);
  const solutionOnly = await count(q.solution.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'));
  const { buildStudentSnapshot } = await import('../lib/tutor-context');
  const snapshot = buildStudentSnapshot('math5', TOPIC);
  const snapTokens = await count(snapshot);
  const message = await count('אני לא בטוח למה משתמשים כאן דווקא בכלל הכפל ולא בחיבור, אפשר להסביר?');
  const history = await count(
    'תלמיד: לא הבנתי את הסעיף\nמורה: בוא נתחיל מהכלל. איזה תנאי מאפיין את המצב הזה?\n' +
    'תלמיד: לא יודע\nמורה: תסתכל על המילה "מבין" בשאלה. מה היא אומרת על המכנה?',
  );

  const usd = (inTok: number, outTok = 0) => inTok * RATE.input + outTok * RATE.output;
  const row = (label: string, tok: number, cost: number, note = '') =>
    console.log(`  ${label.padEnd(34)} ${String(tok).padStart(6)} tok  $${cost.toFixed(5)}  ${note}`);

  console.log(`\n=== one tutor turn · ${TOPIC} · ${MODEL} ===\n`);
  console.log('FIRST turn of a conversation (writes the cache):');
  row('system prefix (cached blocks)', cached, usd(cached * CACHE_WRITE), '× 1.25 write premium');
  row('system tail (level, memory)', tail, usd(tail));
  row('focus: question + state', focusTokens - solutionOnly, usd(focusTokens - solutionOnly));
  row('focus: authored solution', solutionOnly, usd(solutionOnly), '← added for accuracy');
  row('student snapshot', snapTokens, usd(snapTokens), '← static all session, re-sent every turn');
  row('replayed history (6 msgs)', history, usd(history));
  row('the message itself', message, usd(message));
  row('the reply', TYPICAL_OUTPUT, usd(0, TYPICAL_OUTPUT), `${TYPICAL_OUTPUT} tok at $5/MTok`);
  const first =
    usd(cached * CACHE_WRITE) + usd(tail) + usd(focusTokens) + usd(snapTokens) + usd(history) + usd(message) +
    usd(0, TYPICAL_OUTPUT);
  console.log(`  ${'TOTAL'.padEnd(34)} ${' '.repeat(6)}      $${first.toFixed(5)}\n`);

  console.log('FOLLOW-UP turn (reads the cache):');
  const warm =
    usd(cached * CACHE_READ) + usd(tail) + usd(focusTokens) + usd(snapTokens) + usd(history) + usd(message) +
    usd(0, TYPICAL_OUTPUT);
  row('system prefix (cache read)', cached, usd(cached * CACHE_READ), '× 0.1');
  row('everything else, unchanged', tail + focusTokens + snapTokens + history + message, usd(tail + focusTokens + snapTokens + history + message));
  row('the reply', TYPICAL_OUTPUT, usd(0, TYPICAL_OUTPUT));
  console.log(`  ${'TOTAL'.padEnd(34)} ${' '.repeat(6)}      $${warm.toFixed(5)}\n`);

  // ---- the TTL question, which is what actually decides the bill ----
  // A student pauses to work between questions. At a 5-minute TTL every pause
  // longer than that turns the next turn back into a cold write.
  const perTurnRest = usd(tail) + usd(focusTokens) + usd(snapTokens) + usd(history) + usd(message) + usd(0, TYPICAL_OUTPUT);
  const cold5m = usd(cached * WRITE_5M) + perTurnRest;
  const cold1h = usd(cached * WRITE_1H) + perTurnRest;
  const read = usd(cached * CACHE_READ) + perTurnRest;

  console.log('SAME 3 QUESTIONS, spread over ~30 minutes (a student working on paper between them):');
  console.log(`  5-minute TTL   3 cold writes                 $${(cold5m * 3).toFixed(4)}`);
  console.log(`  1-hour TTL     1 write + 2 reads             $${(cold1h + read * 2).toFixed(4)}   ← now shipping`);
  console.log(`  saving                                       ${(((cold5m * 3 - (cold1h + read * 2)) / (cold5m * 3)) * 100).toFixed(0)}%`);
  console.log(`\n  …and the prefix carries no per-student data, so with N students on this`);
  console.log(`  topic within the hour it is ONE write and N-1 reads:`);
  for (const n of [5, 15, 30]) {
    const withTtl = cold1h + read * (n - 1);
    const without = cold5m * n;
    console.log(`    ${String(n).padStart(2)} turns/hour   5-min $${without.toFixed(4)}   1-hour $${withTtl.toFixed(4)}   −${(((without - withTtl) / without) * 100).toFixed(0)}%`);
  }

  console.log(`\nWhat is left after the TTL fix, per warm turn:`);
  const parts: [string, number][] = [
    ['the reply itself', usd(0, TYPICAL_OUTPUT)],
    ['focus: question + solution', usd(focusTokens)],
    ['cache read', usd(cached * CACHE_READ)],
    ['history + snapshot + message', usd(history) + usd(snapTokens) + usd(message)],
    ['system tail', usd(tail)],
  ];
  for (const [what, cost] of parts.sort((a, b) => b[1] - a[1])) {
    console.log(`  $${cost.toFixed(5)}  ${((cost / read) * 100).toFixed(0).padStart(3)}%  ${what}`);
  }
  console.log(`\n  → output tokens are now the largest single item; the input side is`);
  console.log(`    already down to noise. Cutting cost further means fewer CALLS`);
  console.log(`    (the FAQ bank), not a smaller prompt.\n`);
})();
