/**
 * replay-trace.ts — which of the turns we PAID for would still cost today?
 *
 *   npx tsx scripts/replay-trace.ts
 *   npx tsx scripts/replay-trace.ts --days 30
 *
 * FREE. Reads the trace, runs the local chain, calls nothing.
 *
 * ============================================================
 * WHY THIS EXISTS
 * ============================================================
 * `report:worklist` lists every turn that has EVER cost a model call. That is
 * the right question for "what did we spend", and the wrong one for "what
 * should I write next" — because the answer to the second changes every time a
 * gate or a rule ships, and the report cannot know that.
 *
 * Concretely: "ייעיעעיעי", "י", "אוקקי" and "חיים אתה" are still on the
 * work-list and are all blocked by lib/is-question now. Writing intent rules
 * for them would be writing rules for messages that never reach the router.
 *
 * So this replays each paid message through the chain AS IT IS TODAY and
 * splits them: already handled, versus still work.
 *
 * ============================================================
 * WHAT IT CAN AND CANNOT REPLAY
 * ============================================================
 * The trace stores `question_id`, not the question. Lesson questions are
 * resolved here by walking every lesson, which recovers the exact `ownText`
 * production builds — `"<question> <topic>"` — for the gate and for the intent
 * veto. Ids that do not resolve (bagrut questions, generated ones) replay
 * WITHOUT context, which makes both the gate and the veto stricter than
 * production. Those rows are reported separately rather than counted, because
 * a stricter replay cannot prove a message is handled.
 *
 * The layers this does NOT replay are the ones needing live state: the answer
 * library, the pending-question grader, the follow-up layer. A message this
 * calls STILL PAID may therefore already be free. It never claims the reverse,
 * which is the direction that would waste an authoring round.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { isQuestion } from '../lib/is-question';
import { offTopicRedirect } from '../lib/off-topic';
import { canonicalIntent } from '../lib/tutor-intent';
import { followUp } from '../lib/tutor-followup';
import { yesNo } from '../lib/tutor-pending';
import { PLAN_ASK_FOR_TEST } from '../lib/tutor-plan-answer';
import { getLesson, allLessonKeys } from '../content/lessons';

config({ path: '.env.local' });

const DAYS = process.argv.includes('--days')
  ? Number(process.argv[process.argv.indexOf('--days') + 1]) || 14
  : 14;

/** The confidence a rule has to clear before the router will serve it. */
const SERVE = 0.75;

type Trace = {
  screen: string;
  topic: string;
  subtopic: string;
  question_id: string;
  normalized_message: string;
  used_llm: boolean | null;
  input_tokens: number;
  output_tokens: number;
  cached_read: number;
  cached_write: number;
};

/** id -> question text, for every lesson question in the app. */
function questionText(): Map<string, string> {
  const map = new Map<string, string>();
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    if (typeof o.id === 'string' && typeof o.question === 'string') map.set(o.id, o.question);
    for (const v of Object.values(o)) walk(v);
  };
  for (const { subject, topic } of allLessonKeys()) walk(getLesson(subject, topic));
  return map;
}

(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('missing Supabase credentials');
    process.exit(2);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });

  const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000).toISOString();
  const { data, error } = await db
    .from('tutor_trace')
    .select('*')
    .gte('created_at', since)
    .limit(20000);
  if (error) {
    console.error(`could not read tutor_trace (${error.code}: ${error.message})`);
    process.exit(2);
  }

  const spentNothing = (t: Trace) =>
    (t.input_tokens ?? 0) === 0 && (t.output_tokens ?? 0) === 0 && (t.cached_read ?? 0) === 0;
  const paid = ((data ?? []) as Trace[]).filter(
    (t) => t.used_llm !== false && !spentNothing(t) && (t.normalized_message ?? '').trim(),
  );

  const texts = questionText();

  type Verdict = 'gate' | 'off-topic' | 'rule' | 'weak-rule' | 'layer' | 'paid';
  const rows: Array<{ msg: string; where: string; verdict: Verdict; note: string; ctx: boolean }> = [];

  for (const t of paid) {
    const msg = t.normalized_message.trim();
    const q = texts.get(t.question_id);
    // The exact string production builds — see components/tutor/TutorBubble.
    const own = q ? `${q} ${t.topic ?? ''}` : t.topic || undefined;
    const ctx = Boolean(q);

    const where = [t.screen || '(no screen)', t.topic || '(no topic)', t.question_id]
      .filter(Boolean)
      .join(' › ');

    if (!isQuestion(msg, own).isQuestion) {
      rows.push({ msg, where, verdict: 'gate', note: 'nothing was asked', ctx });
      continue;
    }
    if (offTopicRedirect(msg, own)) {
      rows.push({ msg, where, verdict: 'off-topic', note: 'not about studying', ctx });
      continue;
    }
    const m = canonicalIntent(msg, own);
    if (m.intent && m.confidence >= SERVE) {
      rows.push({ msg, where, verdict: 'rule', note: `${m.intent} ${m.confidence}`, ctx });
      continue;
    }
    if (m.intent) {
      rows.push({ msg, where, verdict: 'weak-rule', note: `${m.intent} ${m.confidence} < ${SERVE}`, ctx });
      continue;
    }

    // ---- the three layers that need state this cannot reconstruct ----
    //
    // ⚠️ REPORTED SEPARATELY AND NEVER AS HANDLED. Each of these fires only in
    // a conversation the trace does not store: `followUp` needs the previous
    // turn to have been local, `yesNo` needs the tutor to have asked something
    // answerable with yes or no, `planAnswer` needs a plan with tasks in it and
    // no question on screen. All three shipped AFTER the rows being replayed,
    // which is why "בטוח" and "לא יודע" are still on the paid list at all.
    //
    // Calling them handled would quietly shrink the work-list on a condition
    // that may never hold; calling them unhandled would send the next round to
    // write rules that duplicate a layer. So they get their own bucket.
    const layer =
      followUp(msg) ? `followUp:${followUp(msg)}` :
      yesNo(msg) !== null ? `yesNo:${yesNo(msg)}` :
      PLAN_ASK_FOR_TEST.test(msg) ? 'planAnswer' : null;
    if (layer) {
      rows.push({ msg, where, verdict: 'layer', note: `${layer} — only when the turn allows it`, ctx });
      continue;
    }

    rows.push({ msg, where, verdict: 'paid', note: 'no rule recognises it', ctx });
  }

  const of = (v: Verdict) => rows.filter((r) => r.verdict === v);
  console.log(`\nreplayed ${rows.length} paid turns from the last ${DAYS} days\n`);
  console.log(`  blocked by the gate now      ${of('gate').length}`);
  console.log(`  redirected as off-topic now  ${of('off-topic').length}`);
  console.log(`  a rule answers it now        ${of('rule').length}`);
  console.log(`  a rule matches but too weak  ${of('weak-rule').length}`);
  console.log(`  a conditional layer may take ${of('layer').length}`);
  console.log(`  STILL no rule                ${of('paid').length}`);

  if (of('layer').length) {
    console.log('\n=== a layer would take these, if the turn allows it ===\n');
    for (const r of of('layer')) console.log(`  "${r.msg}" — ${r.note}`);
  }

  const still = [...of('paid'), ...of('weak-rule')];
  // Group by message: the same phrasing in four places is one rule, not four.
  const byMsg = new Map<string, { n: number; where: Set<string>; note: string; ctx: boolean }>();
  for (const r of still) {
    const g = byMsg.get(r.msg) ?? { n: 0, where: new Set<string>(), note: r.note, ctx: r.ctx };
    g.n++;
    g.where.add(r.where);
    byMsg.set(r.msg, g);
  }

  console.log(`\n=== the round: ${byMsg.size} distinct phrasings still reach the model ===\n`);
  for (const [msg, g] of [...byMsg.entries()].sort((a, b) => b[1].n - a[1].n)) {
    const mark = g.ctx ? ' ' : '?';
    console.log(`  ${String(g.n).padStart(2)}×${mark} "${msg}"`);
    console.log(`        ${g.note}`);
    console.log(`        ${[...g.where][0]}${g.where.size > 1 ? ` (+${g.where.size - 1} more)` : ''}`);
  }
  console.log('\n  ? = the question id did not resolve, so this replayed without');
  console.log('      context and both the gate and the veto were stricter than live.\n');
})();
