/**
 * /api/admin/activity — what each student actually did, and what they cost.
 *
 *   GET                 → one summary row per student, for the table
 *   GET ?userId=<id>    → everything about one student
 *
 * Admin only, same allowlist as the rest of /api/admin. Read-only: there is no
 * POST here and there should never be one — this endpoint exists to look, and a
 * mutation next to a full activity dump is a mistake waiting to be made.
 *
 * ============================================================
 * WHAT IS ACTUALLY KNOWABLE PER STUDENT, AND WHAT IS NOT
 * ============================================================
 * Six tables carry a user id and can be attributed:
 *
 *   chat_messages      tokens_in / tokens_out — the real cost, per message
 *   ai_generation_log  one row per billed turn
 *   ai_daily_usage     the AI allowance, per Israeli day
 *   conversations      what they opened and on which topic
 *   scan_log           photographed questions
 *   learning_state     roadmap, plan, and `results` — every question answered
 *
 * ⚠️ `tutor_trace` DOES NOT, AND THAT IS DELIBERATE. It holds no user id by
 * design (see supabase-tutor-trace.sql), so "why did this student's turn reach
 * the model" is unanswerable per student and answerable app-wide. The dashboard
 * says so rather than leaving a suspicious blank.
 *
 * ============================================================
 * THE COST NUMBER IS A FLOOR, AND IT SAYS SO
 * ============================================================
 * `chat_messages.tokens_in` is Anthropic's `input_tokens`, which EXCLUDES
 * cache reads. The cached prefix is billed at a tenth of the input rate and is
 * not stored per message, so a per-student total computed from these columns
 * misses it — measured app-wide at roughly a fifth of the input cost.
 *
 * Rather than model that per student and argue about the multiplier, the exact
 * part is reported per student and the app-wide total INCLUDING cache comes
 * from `tutor_trace`, which does store it. Two honest numbers beat one
 * confident estimate.
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/access';
import { RATES, CACHE_READ, CACHE_WRITE_1H } from '@/lib/mathscan/cost';
import { TUTOR_MODEL } from '@/lib/agents/config';

export const dynamic = 'force-dynamic';

/** The chat runs on one model; chat_messages does not record which. */
const RATE = RATES[TUTOR_MODEL as keyof typeof RATES] ?? RATES['claude-haiku-4-5'];

type ResultRow = {
  ts?: number;
  topic?: string;
  source?: string;
  correct?: boolean;
  difficulty?: string;
  questionId?: string;
};

export async function GET(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const db = createAdminClient();
  if (!db) return Response.json({ error: 'Service key not configured' }, { status: 503 });

  const wanted = new URL(request.url).searchParams.get('userId');

  // ---- the six attributable tables, in one pass each ----
  const [msgs, calls, quota, convos, scans, states] = await Promise.all([
    db.from('chat_messages').select('user_id, role, tokens_in, tokens_out, created_at').limit(20000),
    db.from('ai_generation_log').select('user_id, kind, created_at').limit(20000),
    db.from('ai_daily_usage').select('user_id, usage_date, successful_ai_calls, daily_limit').limit(5000),
    db.from('conversations').select('user_id, topic, created_at, updated_at').limit(5000),
    db.from('scan_log').select('user_id, source, created_at').limit(5000),
    db.from('learning_state').select('user_id, results, roadmap, updated_at').limit(2000),
  ]);

  type Agg = {
    userId: string;
    aiCalls: number;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    messages: number;
    conversations: number;
    scans: number;
    answered: number;
    correct: number;
    topics: Record<string, { answered: number; correct: number }>;
    quotaToday: { used: number; cap: number } | null;
    lastActivity: string | null;
  };
  const by = new Map<string, Agg>();
  const get = (id: string): Agg => {
    let a = by.get(id);
    if (!a) {
      a = {
        userId: id, aiCalls: 0, tokensIn: 0, tokensOut: 0, costUsd: 0, messages: 0,
        conversations: 0, scans: 0, answered: 0, correct: 0, topics: {},
        quotaToday: null, lastActivity: null,
      };
      by.set(id, a);
    }
    return a;
  };
  const touch = (a: Agg, when: unknown) => {
    if (typeof when !== 'string') return;
    if (!a.lastActivity || when > a.lastActivity) a.lastActivity = when;
  };

  for (const m of (msgs.data ?? []) as Record<string, unknown>[]) {
    const a = get(String(m.user_id));
    a.messages++;
    touch(a, m.created_at);
    // Only assistant rows carry usage; a user row's zeros would just add noise.
    if (m.role === 'assistant') {
      a.tokensIn += Number(m.tokens_in ?? 0);
      a.tokensOut += Number(m.tokens_out ?? 0);
    }
  }
  for (const a of by.values()) a.costUsd = a.tokensIn * RATE.input + a.tokensOut * RATE.output;

  for (const c of (calls.data ?? []) as Record<string, unknown>[]) {
    const a = get(String(c.user_id));
    a.aiCalls++;
    touch(a, c.created_at);
  }
  for (const c of (convos.data ?? []) as Record<string, unknown>[]) {
    const a = get(String(c.user_id));
    a.conversations++;
    touch(a, c.updated_at ?? c.created_at);
  }
  for (const s of (scans.data ?? []) as Record<string, unknown>[]) {
    const a = get(String(s.user_id));
    a.scans++;
    touch(a, s.created_at);
  }

  // Today, in Israel — the same calendar the quota itself uses.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date());
  for (const q of (quota.data ?? []) as Record<string, unknown>[]) {
    if (String(q.usage_date) !== today) continue;
    const a = get(String(q.user_id));
    a.quotaToday = { used: Number(q.successful_ai_calls ?? 0), cap: Number(q.daily_limit ?? 10) };
  }

  const detailFor = new Map<string, { recent: ResultRow[]; roadmap: unknown }>();
  for (const s of (states.data ?? []) as Record<string, unknown>[]) {
    const id = String(s.user_id);
    const a = get(id);
    touch(a, s.updated_at);
    const results = Array.isArray(s.results) ? (s.results as ResultRow[]) : [];
    for (const r of results) {
      a.answered++;
      if (r.correct) a.correct++;
      const t = r.topic ?? '(ללא נושא)';
      const bucket = (a.topics[t] ??= { answered: 0, correct: 0 });
      bucket.answered++;
      if (r.correct) bucket.correct++;
    }
    if (id === wanted) {
      detailFor.set(id, {
        recent: [...results].sort((x, y) => (y.ts ?? 0) - (x.ts ?? 0)).slice(0, 60),
        roadmap: s.roadmap ?? null,
      });
    }
  }

  // ---- what only tutor_trace knows, and only app-wide ----
  //
  // No user id there by design, so this is the whole app rather than one
  // student. It is included because it is the only place the CACHE cost lives,
  // and because "why did turns reach the model" has no per-student answer.
  const { data: trace } = await db
    .from('tutor_trace')
    .select('used_llm, input_tokens, output_tokens, cached_read, cached_write, fallback_reason')
    .limit(20000);
  let appCost = 0;
  let appPaid = 0;
  let appLocal = 0;
  const reasons: Record<string, number> = {};
  for (const t of (trace ?? []) as Record<string, number | string | boolean>[]) {
    const inT = Number(t.input_tokens ?? 0);
    const outT = Number(t.output_tokens ?? 0);
    const cr = Number(t.cached_read ?? 0);
    const cw = Number(t.cached_write ?? 0);
    const paid = t.used_llm !== false && inT + outT + cr > 0;
    if (!paid) { appLocal++; continue; }
    appPaid++;
    appCost += inT * RATE.input + outT * RATE.output + cw * RATE.input * CACHE_WRITE_1H + cr * RATE.input * CACHE_READ;
    const r = String(t.fallback_reason ?? '');
    reasons[r] = (reasons[r] ?? 0) + 1;
  }

  const rows = [...by.values()].sort((a, b) => b.costUsd - a.costUsd);
  const appWide = {
    turns: appPaid + appLocal,
    local: appLocal,
    paid: appPaid,
    localRate: appPaid + appLocal ? appLocal / (appPaid + appLocal) : 0,
    costUsdIncludingCache: appCost,
    reasons,
    note:
      'tutor_trace אינו שומר מזהה משתמש במכוון, ולכן הפירוק הזה הוא של האפליקציה כולה ולא של תלמיד יחיד. זה גם המקום היחיד שבו עלות המטמון נשמרת.',
  };

  if (wanted) {
    const one = by.get(wanted);
    if (!one) return Response.json({ user: null, appWide });
    const d = detailFor.get(wanted);
    return Response.json({
      user: one,
      recent: d?.recent ?? [],
      roadmap: d?.roadmap ?? null,
      quotaHistory: ((quota.data ?? []) as Record<string, unknown>[])
        .filter((q) => String(q.user_id) === wanted)
        .sort((a, b) => String(b.usage_date).localeCompare(String(a.usage_date)))
        .slice(0, 14),
      appWide,
    });
  }

  return Response.json({ rows, appWide });
}
