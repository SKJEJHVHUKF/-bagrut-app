/**
 * report-worklist.ts — where students got stuck, how often, and what to write.
 *
 *   npm run report:worklist
 *   npm run report:worklist -- --days 14 --top 40
 *   npm run report:worklist -- --screen quiz
 *   npm run report:worklist -- --json logs/faq-misses.json
 *
 * FREE, read-only.
 *
 * ============================================================
 * WHAT THIS IS FOR
 * ============================================================
 * Itay's loop, in his words: every so often, go over everything students asked
 * that cost a model call, write the phrasings and the answers, ship them, and
 * do it again until the cost is near zero.
 *
 * That loop needs one thing the phrasing list does not give: WHERE. A question
 * asked eleven times on one quiz question is one entry to write. The same
 * eleven asks spread across eleven different exercises is eleven entries, or a
 * rule, or a card — and the two look identical in a list sorted by phrasing.
 *
 * So this groups by PLACE first: screen, topic, sub-topic, question. Then by
 * what was asked inside it. Then it says what the fix is, because the fallback
 * reason already knows.
 *
 * ============================================================
 * WHY THE ORDER IS BY COUNT AND NOT BY DATE
 * ============================================================
 * Every row is a model call that was paid for. Ten students stuck on the same
 * question is ten calls, and it will be ten more next week; a single stray
 * message is one. Sorting by frequency is sorting by what the next hour of
 * authoring is worth, and that is the only sort that makes the loop converge.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => {
  const i = argv.indexOf(k);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const DAYS = Number(opt('--days', '14'));
const TOP = Number(opt('--top', '25'));
const SCREEN = opt('--screen');
const TOPIC = opt('--topic');
const JSON_OUT = opt('--json');

type Trace = {
  created_at: string;
  screen: string;
  topic: string;
  subtopic: string;
  question_id: string;
  normalized_message: string;
  intent: string;
  fallback_reason: string;
  used_llm: boolean;
  input_tokens: number;
  output_tokens: number;
  cached_read: number;
  cached_write: number;
};

/**
 * What to do about each reason.
 *
 * ⚠️ THE REASON ALREADY KNOWS. That is the whole point of it being an enum
 * rather than free text: `unknown_intent` and `no_faq_match` are different
 * jobs — one is a rule in lib/tutor-intent that takes minutes, the other is a
 * bank entry that takes an hour — and a report that lumps them together sends
 * someone to write content for a phrasing that never reaches the bank.
 */
const ACTION: Record<string, string> = {
  unknown_intent: 'RULE — no rule recognised the phrasing. lib/tutor-intent.ts, then npm run test:intent.',
  unsupported_phrase: 'RULE — the intent is known, nothing routes on it. lib/tutor-compiler.ts.',
  no_faq_match: 'ENTRY — the bank was searched and had nothing for this question.',
  no_local_content: 'CONTENT — the intent is groundable, this question has none: hint, steps, or a card.',
  missing_question_context: 'LAYER — no question on screen. Needs a screen-level answer (see lib/tutor-plan-answer).',
  low_confidence: 'RULE — a rule matched but below 0.75, so it is labelled and never served.',
  multi_part_question: 'LEAVE — one answer cannot serve a multi-section bagrut question.',
  proof_or_open_ended: 'LEAVE — a proof or an open discussion is the model’s job.',
  explicit_personalized_explanation: 'LEAVE — the student asked for a personal explanation.',
  deterministic_solver_failed: 'ENGINE — the maths engine was right and could not finish.',
  unsafe_cross_question_match: 'ENTRY — reuse had a candidate and the safety screen refused it.',
  no_fallback: 'BUG — the trace arrived malformed. Check the client, not the content.',
};

/** Sonnet-class pricing, for a number rather than a feeling. */
const cost = (t: Trace) =>
  (t.input_tokens * 1 + t.output_tokens * 5 + t.cached_write * 1.25 + t.cached_read * 0.1) / 1_000_000;

(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error('missing Supabase credentials'); process.exit(2); }
  const db = createClient(url, key, { auth: { persistSession: false } });

  const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000).toISOString();
  const { data, error } = await db
    .from('tutor_trace').select('*').gte('created_at', since).limit(20000);
  if (error) {
    console.error(`\n⛔ could not read tutor_trace (${error.code}: ${error.message})`);
    console.error('   Run supabase-tutor-trace.sql if the table is not there yet.\n');
    process.exit(2);
  }

  const all = (data ?? []) as Trace[];
  const paid = all.filter(
    (t) => t.used_llm !== false && (!SCREEN || t.screen === SCREEN) && (!TOPIC || t.topic === TOPIC),
  );
  const local = all.filter((t) => t.used_llm === false);

  console.log(`\nlast ${DAYS} days${SCREEN ? ` · screen ${SCREEN}` : ''}${TOPIC ? ` · topic ${TOPIC}` : ''}`);
  console.log(`  answered locally  ${local.length}`);
  console.log(`  cost a model call ${paid.length}   ~$${paid.reduce((s, t) => s + cost(t), 0).toFixed(3)}`);
  if (!paid.length) {
    console.log('\nNothing to write. Either nobody used the tutor, or everything was local.\n');
    return;
  }

  // ---- group by PLACE, then by what was asked inside it ----
  type Place = {
    screen: string; topic: string; subtopic: string; questionId: string;
    n: number; spend: number;
    asks: Map<string, { n: number; reason: string; intent: string }>;
  };
  const places = new Map<string, Place>();
  for (const t of paid) {
    const key = `${t.screen}|${t.topic}|${t.subtopic}|${t.question_id}`;
    const p = places.get(key) ?? {
      screen: t.screen, topic: t.topic, subtopic: t.subtopic, questionId: t.question_id,
      n: 0, spend: 0, asks: new Map(),
    };
    p.n++;
    p.spend += cost(t);
    const a = p.asks.get(t.normalized_message) ?? { n: 0, reason: t.fallback_reason, intent: t.intent };
    a.n++;
    p.asks.set(t.normalized_message, a);
    places.set(key, p);
  }

  const ranked = [...places.values()].sort((a, b) => b.n - a.n);
  console.log(`\n=== ${Math.min(TOP, ranked.length)} of ${ranked.length} places, most-asked first ===\n`);
  console.log('  Sorted by how many calls each place cost, which is what the next hour');
  console.log('  of authoring is worth. A place with one stray ask is not worth an entry.\n');

  for (const p of ranked.slice(0, TOP)) {
    const where = [p.screen || '(no screen)', p.topic || '(no topic)', p.subtopic, p.questionId]
      .filter(Boolean)
      .join(' › ');
    console.log(`  ${String(p.n).padStart(3)} calls  ~$${p.spend.toFixed(3)}   ${where}`);
    for (const [msg, a] of [...p.asks.entries()].sort((x, y) => y[1].n - x[1].n)) {
      console.log(`        ${String(a.n).padStart(3)} × "${msg}"${a.intent ? `  [${a.intent}]` : ''}`);
      console.log(`             ${ACTION[a.reason] ?? a.reason}`);
    }
    console.log('');
  }

  // ---- what the whole window says to do, in one place ----
  const byReason = new Map<string, number>();
  for (const t of paid) byReason.set(t.fallback_reason, (byReason.get(t.fallback_reason) ?? 0) + 1);
  console.log('=== the round, by job ===\n');
  for (const [r, n] of [...byReason.entries()].sort((a, b) => b[1] - a[1])) {
    const job = (ACTION[r] ?? r).split(' — ')[0];
    console.log(`  ${String(n).padStart(4)}  ${job.padEnd(9)} ${r}`);
  }
  const leavable = [...byReason.entries()]
    .filter(([r]) => (ACTION[r] ?? '').startsWith('LEAVE'))
    .reduce((s, [, n]) => s + n, 0);
  console.log(`\n  ${leavable} of ${paid.length} are LEAVE — genuinely the model's, and no amount of`);
  console.log('  authoring removes them. The floor is not zero, and pretending it is');
  console.log('  turns a finished job into an endless one.\n');

  // ---- optional: the shape scripts/generate-faq-from-logs.ts reads ----
  if (JSON_OUT) {
    const rows = paid
      .filter((t) => t.fallback_reason === 'no_faq_match' && t.question_id)
      .map((t) => ({ topic: t.topic, unit: t.question_id, msg: t.normalized_message, count: 1 }));
    // Collapse duplicates so the generator sees a count, which the Vercel log
    // line never carried.
    const merged = new Map<string, { topic: string; unit: string; msg: string; count: number }>();
    for (const r of rows) {
      const k = `${r.unit}|${r.msg}`;
      const m = merged.get(k) ?? { ...r, count: 0 };
      m.count++;
      merged.set(k, m);
    }
    writeFileSync(JSON_OUT, JSON.stringify([...merged.values()], null, 2), 'utf8');
    console.log(`wrote ${JSON_OUT} — ${merged.size} distinct asks, ready for:`);
    console.log(`  npx tsx scripts/generate-faq-from-logs.ts --logs ${JSON_OUT} --dry-run\n`);
  }
})();
