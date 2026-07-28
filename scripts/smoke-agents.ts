/**
 * smoke-agents.ts — LIVE check that the two agent routes' model calls work.
 *
 * Local only. Costs real money (~$0.01 per run) — it makes exactly two
 * Anthropic calls, one per agent, with tiny inputs.
 *
 * Why this exists: `tsc` and `next build` prove the code compiles, not that
 * `claude-sonnet-5` accepts `output_config.format`, that `claude-haiku-4-5`
 * still rejects `effort`, or that the API key has access to both tiers. Those
 * only fail at runtime — in production, on the owner's budget.
 *
 * Usage:
 *   npx tsx scripts/smoke-agents.ts
 *
 * Required env (.env.local): ANTHROPIC_API_KEY
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { buildTutorSystem, buildGraderSystem } from '../lib/agents/prompts';
import { GradeSchema, ERROR_TYPES } from '../lib/agents/schemas';
import {
  TUTOR_MODEL,
  GRADER_MODEL,
  TUTOR_MAX_TOKENS,
  GRADER_MAX_TOKENS,
  graderEffort,
  graderThinking,
} from '../lib/agents/config';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('✗ ANTHROPIC_API_KEY missing from .env.local');
  process.exit(1);
}
const client = new Anthropic({ apiKey });

let failures = 0;

function report(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? '✓' : '✗'} ${label} — ${detail}`);
  if (!ok) failures++;
}

async function smokeTutor() {
  const system = buildTutorSystem({ unitLevel: 5, formNumber: '572', topic: 'מספרים מרוכבים' });
  const stream = client.messages.stream({
    model: TUTOR_MODEL,
    max_tokens: TUTOR_MAX_TOKENS,
    system,
    messages: [{ role: 'user', content: 'נתקעתי בחישוב המודול של $z = 3 + 4i$. מה הצעד הראשון?' }],
    // No `effort` — Haiku 4.5 400s on it. If someone re-adds it, this fails here
    // instead of in production.
  });

  let deltas = 0;
  stream.on('text', () => deltas++);
  const final = await stream.finalMessage();
  const text = final.content.find((b) => b.type === 'text');
  const body = text && text.type === 'text' ? text.text : '';

  report(
    'tutor / ' + TUTOR_MODEL,
    deltas > 0 && body.length > 0,
    `blocks=${system.length} deltas=${deltas} in=${final.usage.input_tokens} ` +
      `out=${final.usage.output_tokens} cache_read=${final.usage.cache_read_input_tokens ?? 0} cache_write=${final.usage.cache_creation_input_tokens ?? 0}`
  );

  // The Socratic contract: a first reply that dumps the answer is a prompt bug.
  report(
    'tutor is Socratic',
    body.length < 900,
    `${body.length} chars (a full solution would be far longer)`
  );
  console.log('  ↳', body.slice(0, 160).replace(/\s+/g, ' '), '…');

  // Second identical-prefix call: proves the cache_control layout actually
  // produces a hit rather than being a silent no-op below the model minimum.
  const again = await client.messages.stream({
    model: TUTOR_MODEL,
    max_tokens: 120,
    system,
    messages: [{ role: 'user', content: 'ומה הצעד הבא אחרי שמצאתי את המודול?' }],
  }).finalMessage();

  const cacheRead = again.usage.cache_read_input_tokens ?? 0;
  report(
    'prompt cache hits on the second call',
    cacheRead > 0,
    cacheRead > 0
      ? `cache_read=${cacheRead} of ${again.usage.input_tokens + cacheRead} input tokens`
      : `cache_read=0 — prefix is under the model minimum (4096 on Haiku), caching is a no-op here`
  );
}

async function smokeGrader() {
  const system = buildGraderSystem({ unitLevel: 5, formNumber: '572', topic: 'חשבון דיפרנציאלי' });
  const stream = client.messages.stream({
    model: GRADER_MODEL,
    max_tokens: GRADER_MAX_TOKENS,
    system,
    messages: [
      {
        role: 'user',
        // Deliberately wrong: the derivative of x^3 is 3x^2, not 3x. A working
        // grader must catch it, score low, and classify it.
        content:
          '## השאלה\nמצא את נקודות הקיצון של $f(x) = x^3 - 12x$.\n\n' +
          "## הפתרון של התלמיד\nנגזור: f'(x) = 3x - 12\nנאפס: 3x - 12 = 0\nלכן x = 4\n\n" +
          'הערך את הפתרון והחזר את הממצאים במבנה הנדרש.',
      },
    ],
    thinking: graderThinking(),
    output_config: { effort: graderEffort(), format: zodOutputFormat(GradeSchema) },
  });

  const final = await stream.finalMessage();
  const grade = final.parsed_output;

  report(
    'grader / ' + GRADER_MODEL,
    !!grade,
    `structured output ${grade ? 'parsed' : 'MISSING'} · stop=${final.stop_reason} ` +
      `in=${final.usage.input_tokens} out=${final.usage.output_tokens} ` +
      `cache_read=${final.usage.cache_read_input_tokens ?? 0} cache_write=${final.usage.cache_creation_input_tokens ?? 0}`
  );
  if (!grade) return;

  report(
    'grader caught the wrong derivative',
    grade.isCorrect === false && grade.score < 60 && grade.errors.length > 0,
    `score=${grade.score} isCorrect=${grade.isCorrect} errors=${grade.errors.length}` +
      (grade.errors[0] ? ` first=${grade.errors[0].errorType}` : '')
  );
  // Surface the raw categories: anything off-list is silently coerced to 'אחר'
  // by the route, so this is the only place drift is visible.
  const raw = grade.errors.map((e) => e.errorType);
  const offList = raw.filter((t) => !(ERROR_TYPES as readonly string[]).includes(t));
  report(
    'errorType values are on-list',
    offList.length === 0,
    offList.length ? `off-list: ${JSON.stringify(offList)}` : JSON.stringify(raw)
  );
  console.log('  ↳', grade.summary.replace(/\s+/g, ' ').slice(0, 200));
}

async function main() {
  console.log('Running 2 live Anthropic calls (~$0.01)…\n');
  try {
    await smokeTutor();
  } catch (e) {
    report('tutor / ' + TUTOR_MODEL, false, String(e));
  }
  console.log('');
  try {
    await smokeGrader();
  } catch (e) {
    report('grader / ' + GRADER_MODEL, false, String(e));
  }
  console.log(failures === 0 ? '\nAll agent smoke checks passed.' : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
