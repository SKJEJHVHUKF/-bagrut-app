/**
 * smoke-teach.ts — live persona + cost check for "למד את הבוט".
 *
 * ⚠️ SPENDS REAL MONEY (~1.5¢ per run) and is deliberately NOT part of
 * `npm run check`. Run it by hand after touching lib/teach/prompt.ts.
 *
 * WHY IT EXISTS: /api/teach is auth-gated, so a browser can't exercise the
 * model path, and no automated gate can judge whether נועה sounds like a real
 * confused classmate or like a bot pretending to be one. That judgement is
 * eyeball-only — this script just puts the evidence in front of you.
 *
 * It drives the exact prompt + schema the route builds, and feeds a
 * deliberately PARTIAL explanation: the scripted student covers the root count
 * and the equal-modulus idea but never mentions the 360°/n spacing or the
 * Vieta sum. What to check in the output:
 *   • נועה asks ONE question per turn, stays in character, never teaches.
 *   • Covered ids light up ONLY for what the student actually said —
 *     kp-2 and kp-3 must still be listed as uncovered at the end. A judge that
 *     marks them covered is rubber-stamping, and the whole feature is a lie.
 *   • The printed cost matches what config.ts documents.
 *
 *   npx tsx scripts/smoke-teach.ts
 */

import fs from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { buildRubric, coerceCoveredIds, type Rubric } from '../lib/teach/rubric';
import { buildTeachSystem } from '../lib/teach/prompt';
import { TeachReplySchema } from '../lib/teach/schemas';
import { TEACH_MODEL, TEACH_MAX_TOKENS } from '../lib/agents/config';

// .env.local isn't loaded by tsx.
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}

const TOPIC = 'מספרים מרוכבים';
const SUB = 'complex-roots';

const maybeRubric = buildRubric('math5', TOPIC, SUB);
if (!maybeRubric) throw new Error(`no rubric for ${TOPIC}/${SUB}`);
// Re-bound with an explicit type: control-flow narrowing from the throw above
// does not follow into the async main() closure below.
const rubric: Rubric = maybeRubric;

console.log(`\n=== ${rubric.title} — ${rubric.points.length} נקודות רובריקה ===`);
for (const p of rubric.points) console.log(`  ${p.id}: ${p.text.slice(0, 90)}`);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// A deliberately PARTIAL student: covers the count and the equal-modulus idea,
// says nothing about the 360/n spacing or the Vieta sum. A working coverage
// judge must light up some points and leave others dark.
const script = [
  '',
  'תראי, למשוואה z בחזקת n שווה w תמיד יש בדיוק n שורשים שונים, כל עוד w לא אפס. זה תמיד n, לא פחות.',
  'כל השורשים יושבים על אותו מעגל, כי לכולם יש בדיוק אותו גודל — שורש n-י של הגודל של w.',
];

let history: { role: 'user' | 'assistant'; content: string }[] = [];
let covered: string[] = [];
let totalIn = 0;
let totalOut = 0;

// Wrapped: tsx transforms to CJS here, where top-level await is unavailable.
async function main() {
for (let i = 0; i < script.length; i++) {
  const message = script[i];
  const opening = message === '';
  const messages = [
    ...history,
    { role: 'user' as const, content: opening ? '[התלמיד פתח את הסשן ומחכה שתתחילי. פתחי בבלבול שלך.]' : message },
  ];

  const res = await client.messages
    .stream({
      model: TEACH_MODEL,
      max_tokens: TEACH_MAX_TOKENS,
      system: buildTeachSystem({
        unitLevel: 5,
        formNumber: '572',
        rubric,
        covered,
        opening,
      }),
      messages,
      output_config: { format: zodOutputFormat(TeachReplySchema) },
    })
    .finalMessage();

  totalIn += res.usage.input_tokens;
  totalOut += res.usage.output_tokens;
  const turn = res.parsed_output!;
  const fresh = coerceCoveredIds(rubric, turn.coveredPointIds);
  covered = Array.from(new Set([...covered, ...fresh]));

  if (!opening) console.log(`\n👨‍🎓 התלמיד: ${message}`);
  console.log(`🙋‍♀️ נועה: ${turn.reply}`);
  console.log(
    `   [כוסה עכשיו: ${fresh.join(', ') || '—'} · סה"כ ${covered.length}/${rubric.points.length}` +
      ` · probe=${turn.probeTargetId || '—'} · understood=${turn.understood}` +
      ` · in=${res.usage.input_tokens} out=${res.usage.output_tokens}]`
  );

  history = [...messages, { role: 'assistant', content: turn.reply }];
}
}

void main().then(() => {

// Haiku 4.5: $1 / $5 per MTok.
const cost = (totalIn / 1e6) * 1 + (totalOut / 1e6) * 5;
console.log(
  `\n=== ${script.length} תורות · in=${totalIn} out=${totalOut} · ` +
    `עלות בפועל $${cost.toFixed(5)} (${(cost * 100).toFixed(2)}¢) ===`
);
console.log(`מדוד: ~0.5¢ לתור. סשן מלא (${script.length > 0 ? '6 קריאות' : ''}) ≈ 3¢ — ראה FREE_DAILY_TEACH ב-lib/agents/config.ts.\n`);
console.log(`לא כוסה (אמור להישאר): ${rubric.points.filter((p) => !covered.includes(p.id)).map((p) => p.id).join(', ') || '—'}`);
});
