/**
 * measure-generator.ts — which model should generate exercises?
 *
 *   npx tsx scripts/measure-generator.ts            # 4 exercises per model
 *   npx tsx scripts/measure-generator.ts --n 8      # more samples
 *   npx tsx scripts/measure-generator.ts --models claude-haiku-4-5
 *
 * ⚠️ THIS SPENDS REAL MONEY. It prints the estimated cost and the running total.
 *
 * WHY THIS EXISTS
 * ---------------
 * /api/practice and /api/questions are ~50% of this app's API bill, and both
 * were on `claude-sonnet-4-6` — a model that lib/agents/config.ts documents as
 * NOT supporting `output_config.format`. Both routes pass that parameter anyway
 * behind an `as any` cast, so the schema they think they are enforcing may not
 * be enforced at all. That is a correctness question and a cost question at the
 * same time, and neither is answerable by reading the code.
 *
 * WHAT IT MEASURES
 * ----------------
 *   schema    did the response parse and carry every required field
 *   checks    of the self-checks the model emitted, how many did mathjs AGREE
 *             with — this is the arithmetic-hallucination rate, measured rather
 *             than assumed
 *   free      how many exercises emitted no runnable check at all (a model that
 *             dodges the check scores a perfect pass rate on zero checks, so
 *             this column is what stops that from looking like quality)
 *   cost      measured from the usage block, never estimated
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import Anthropic from '@anthropic-ai/sdk';
import { buildGeneratorPrompt, buildExerciseSchema } from '../lib/generator-prompt';
import { verifyGenerated, type SelfCheck } from '../lib/verify-generated';

// ------------------------------------------------------------
// Rate card (USD per token) — published rates, checked 2026-08-17.
// ------------------------------------------------------------
const RATES: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  'claude-sonnet-5': { input: 2 / 1_000_000, output: 10 / 1_000_000 },
  'claude-haiku-4-5': { input: 1 / 1_000_000, output: 5 / 1_000_000 },
};

const argv = process.argv.slice(2);
const argOf = (flag: string) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};

const N = Number(argOf('--n') ?? 4);
/** Raising this is nearly free — billing is per token GENERATED, not per cap.
 *  The only real ceiling is Vercel Hobby's 60s function timeout. */
const MAX_TOKENS = Number(argOf('--max-tokens') ?? 2000);
const MODELS = (argOf('--models') ?? 'claude-sonnet-4-6,claude-sonnet-5,claude-haiku-4-5').split(',');

/**
 * Per-model request options.
 *
 * ⚠️ Sonnet 5 runs ADAPTIVE THINKING when `thinking` is omitted — documented in
 * lib/agents/config.ts:96 and confirmed the hard way: the first run of this
 * script scored it 0/3, every response cut off at `stop_reason: max_tokens`
 * with the thinking block having eaten the whole budget before any JSON. That
 * is a measurement artefact, not a model that cannot generate exercises, and
 * scoring it as a failure would have picked the wrong model for the wrong
 * reason. Generation against a fixed schema is not a reasoning task; disable it.
 */
const MODEL_OPTS: Record<string, Record<string, unknown>> = {
  'claude-sonnet-5': { thinking: { type: 'disabled' } },
};

/** Fixed topics + seeds: every model is asked exactly the same questions, or the
 *  comparison is between prompts rather than between models. */
const CASES = [
  { subject: 'math5', topic: 'חשבון דיפרנציאלי', difficulty: 'normal' as const, seed: 'bench-01' },
  { subject: 'math5', topic: 'מספרים מרוכבים', difficulty: 'normal' as const, seed: 'bench-02' },
  { subject: 'math5', topic: 'טריגונומטריה', difficulty: 'harder' as const, seed: 'bench-03' },
  { subject: 'math4', topic: 'גדילה ודעיכה', difficulty: 'normal' as const, seed: 'bench-04' },
  { subject: 'math5', topic: 'הסתברות', difficulty: 'normal' as const, seed: 'bench-05' },
  { subject: 'math5', topic: 'אינטגרלים', difficulty: 'harder' as const, seed: 'bench-06' },
  { subject: 'math4', topic: 'וקטורים', difficulty: 'normal' as const, seed: 'bench-07' },
  { subject: 'math5', topic: 'לוגריתמים', difficulty: 'normal' as const, seed: 'bench-08' },
];

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY missing — put it in .env.local');
  process.exit(1);
}
const client = new Anthropic({ apiKey });

type Row = {
  model: string;
  runs: number;
  schemaOk: number;
  schemaErr: string[];
  checksRun: number;
  checksPassed: number;
  exercisesWithNoCheck: number;
  exercisesFailed: number;
  /** stop_reason === 'max_tokens'. Tracked separately because it is a BUDGET
   *  problem, not a quality problem — the fix is max_tokens, not the model. */
  truncated: number;
  costUsd: number;
  ms: number;
};

async function runOne(model: string, c: (typeof CASES)[number]) {
  const prompt = buildGeneratorPrompt(c);
  const schema = buildExerciseSchema(c.subject);
  const started = Date.now();
  const message = await client.messages.create({
    model,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...({ output_config: { format: { type: 'json_schema', schema } } } as any),
    ...(MODEL_OPTS[model] ?? {}),
  } as Anthropic.MessageCreateParamsNonStreaming);
  const ms = Date.now() - started;

  const rate = RATES[model] ?? { input: 0, output: 0 };
  const usage = message.usage as { input_tokens?: number; output_tokens?: number };
  const costUsd = (usage?.input_tokens ?? 0) * rate.input + (usage?.output_tokens ?? 0) * rate.output;

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  return { text, ms, costUsd, stopReason: message.stop_reason };
}

async function measure(model: string): Promise<Row> {
  const row: Row = {
    model, runs: 0, schemaOk: 0, schemaErr: [], checksRun: 0, checksPassed: 0,
    exercisesWithNoCheck: 0, exercisesFailed: 0, truncated: 0, costUsd: 0, ms: 0,
  };

  for (const c of CASES.slice(0, N)) {
    row.runs++;
    let out: Awaited<ReturnType<typeof runOne>>;
    try {
      out = await runOne(model, c);
    } catch (error) {
      row.schemaErr.push(`${c.topic}: API ${(error as Error).message.slice(0, 60)}`);
      continue;
    }
    row.costUsd += out.costUsd;
    row.ms += out.ms;
    if (out.stopReason === 'max_tokens') row.truncated++;

    let parsed: {
      problem?: string; hints?: unknown; solution?: { steps?: unknown };
      final_answer?: string; self_check?: SelfCheck[];
    };
    try {
      parsed = JSON.parse(out.text);
    } catch {
      row.schemaErr.push(`${c.topic}: not JSON (stop=${out.stopReason})`);
      continue;
    }

    const structurallyOk =
      !!parsed.problem && Array.isArray(parsed.hints) &&
      Array.isArray(parsed.solution?.steps) && !!parsed.final_answer;
    if (!structurallyOk) {
      row.schemaErr.push(`${c.topic}: missing required fields`);
      continue;
    }
    if (!Array.isArray(parsed.self_check)) {
      row.schemaErr.push(`${c.topic}: self_check absent — schema NOT enforced`);
      row.schemaOk++;
      row.exercisesWithNoCheck++;
      continue;
    }
    row.schemaOk++;

    const report = verifyGenerated(parsed.self_check);
    row.checksRun += report.verified + report.failed;
    row.checksPassed += report.verified;
    if (report.verified + report.failed === 0) row.exercisesWithNoCheck++;
    if (!report.ok) {
      row.exercisesFailed++;
      // Report the EXPRESSION, not the prose claim. The claim is the model's
      // Hebrew description of what it checked; only the expr says what mathjs
      // actually evaluated — and without it there is no way to tell a model
      // that did bad arithmetic from a verifier that mis-parsed good input.
      report.outcomes.forEach((o, i) => {
        if (o.status !== 'failed') return;
        const src = parsed.self_check?.[i];
        row.schemaErr.push(
          `${c.topic}: BAD MATH — expr="${src?.expr}" equals="${src?.equals}" → mathjs got ${o.got}`
        );
      });
    }
  }
  return row;
}

(async () => {
  const estimate = (N * MODELS.length * 0.02).toFixed(2);
  console.log(`\nmeasure-generator — ${N} exercises x ${MODELS.length} models`);
  console.log(`estimated cost: ~$${estimate}\n`);

  const rows: Row[] = [];
  for (const model of MODELS) {
    process.stdout.write(`  ${model} `);
    const row = await measure(model);
    rows.push(row);
    console.log(`done  $${row.costUsd.toFixed(4)}`);
  }

  console.log('\n' + '='.repeat(78));
  console.log(
    'model'.padEnd(20) + 'schema'.padEnd(9) + 'checks ok'.padEnd(12) +
    'no-check'.padEnd(10) + 'bad math'.padEnd(10) + 'trunc'.padEnd(8) + '$/ex'.padEnd(9) + 's/ex'
  );
  console.log('='.repeat(78));
  for (const r of rows) {
    const pass = r.checksRun ? `${r.checksPassed}/${r.checksRun}` : '—';
    console.log(
      r.model.padEnd(20) +
      `${r.schemaOk}/${r.runs}`.padEnd(9) +
      pass.padEnd(12) +
      `${r.exercisesWithNoCheck}/${r.runs}`.padEnd(10) +
      `${r.exercisesFailed}/${r.runs}`.padEnd(10) +
      `${r.truncated}/${r.runs}`.padEnd(8) +
      `$${(r.costUsd / Math.max(1, r.runs)).toFixed(4)}`.padEnd(9) +
      (r.ms / Math.max(1, r.runs) / 1000).toFixed(1)
    );
  }
  console.log('='.repeat(78));

  for (const r of rows) {
    if (!r.schemaErr.length) continue;
    console.log(`\n${r.model} — issues:`);
    for (const e of r.schemaErr) console.log(`  • ${e}`);
  }

  const total = rows.reduce((s, r) => s + r.costUsd, 0);
  console.log(`\ntotal spent: $${total.toFixed(4)}`);
  console.log(
    '\nreading it: "no-check" is the column that matters most — a model that\n' +
    'emits no self-check scores a perfect pass rate on nothing at all.'
  );
})();
