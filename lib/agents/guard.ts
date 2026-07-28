/**
 * agents/guard.ts — one gate in front of every agent route.
 *
 * Runs, in order, before a single token is spent:
 *   1. same-origin        → 403
 *   2. bot user-agent     → 403
 *   3. IP/UA rate limit   → 429   (lib/rate-limit, in-memory, per instance)
 *   4. content-type json  → 415
 *   5. Supabase auth      → 401
 *   6. per-user HOURLY    → 429   (durable, 20/hour — the spec's ceiling)
 *   7. per-user DAILY     → 429   (tier-based, free vs Pro)
 *
 * Steps 6-7 count rows in `ai_generation_log`, the same table
 * /api/questions already uses (`kind` is plain `text`, no CHECK constraint,
 * and the index is (user_id, created_at) — so it serves an hourly window as
 * happily as a daily one). No new SQL is required for these routes.
 *
 * If that table is missing the repo convention is to degrade to "no cap" —
 * which for a *paid* endpoint is a budget hole, not a graceful failure. So the
 * guard also keeps a per-instance in-memory hourly counter that applies
 * regardless. It under-counts across cold starts, but it means a missing table
 * can never leave the endpoint completely uncapped.
 */

import { checkRateLimit, getFingerprint, looksLikeBot } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { isProUser, type UserLike } from '@/lib/access';
import { AGENT_HOURLY_LIMIT, type AgentKind } from './config';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type GuardOk = {
  ok: true;
  user: { id: string } & UserLike;
  supabase: SupabaseServerClient;
  isPro: boolean;
  /** Daily calls left for this agent AFTER the current one. */
  remaining: number;
};

export type GuardResult = GuardOk | { ok: false; response: Response };

export type GuardOptions = {
  kind: AgentKind;
  /** Daily cap for a free account. */
  freeDaily: number;
  /** Daily cap for a Pro account. */
  proDaily: number;
};

// ============================================================
// Prompt-injection / control-character screen
// ============================================================

export const BLACKLIST =
  /[\x00-\x1f]|ignore\s+(all\s+)?(previous|prior|above)\s+instructions?|disregard\s+(all\s+)?(previous|prior|above)|<\s*\/?\s*(script|iframe|object|embed)/i;

/** Trim + hard-truncate. Returns '' for anything that isn't a string. */
export function sanitizeText(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, maxLen);
}

// ============================================================
// Time windows (UTC, matching every other quota in the app)
// ============================================================

function dayStartIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function hourAgoIso(): string {
  return new Date(Date.now() - 60 * 60 * 1000).toISOString();
}

// ============================================================
// In-memory hourly backstop (survives a missing/erroring table)
// ============================================================

const memoryHits = new Map<string, number[]>();

function memoryHourlyCount(userId: string, kind: AgentKind): number {
  const key = `${kind}:${userId}`;
  const cutoff = Date.now() - 60 * 60 * 1000;
  const kept = (memoryHits.get(key) ?? []).filter((t) => t > cutoff);
  if (kept.length) memoryHits.set(key, kept);
  else memoryHits.delete(key);
  return kept.length;
}

function memoryRecord(userId: string, kind: AgentKind): void {
  const key = `${kind}:${userId}`;
  const cutoff = Date.now() - 60 * 60 * 1000;
  const kept = (memoryHits.get(key) ?? []).filter((t) => t > cutoff);
  kept.push(Date.now());
  memoryHits.set(key, kept);
  // Bound the map so a burst of distinct users can't grow it without limit.
  if (memoryHits.size > 5000) {
    for (const [k, v] of memoryHits) {
      if (!v.some((t) => t > cutoff)) memoryHits.delete(k);
    }
  }
}

// ============================================================
// Durable counters
// ============================================================

/** Rows for this user + kind since `sinceIso`. `null` = table unavailable. */
async function countSince(
  supabase: SupabaseServerClient,
  userId: string,
  kind: AgentKind,
  sinceIso: string
): Promise<number | null> {
  try {
    const { count, error } = await supabase
      .from('ai_generation_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('kind', kind)
      .gte('created_at', sinceIso);
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

/**
 * Records one billable agent call. Fire-and-forget: a logging failure must
 * never fail a request the student already paid for in latency.
 */
export async function logAgentUsage(
  supabase: SupabaseServerClient,
  userId: string,
  kind: AgentKind
): Promise<void> {
  memoryRecord(userId, kind);
  try {
    await supabase.from('ai_generation_log').insert({ user_id: userId, kind });
  } catch {
    /* table not created yet — the in-memory backstop still applies */
  }
}

// ============================================================
// The gate
// ============================================================

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

function tooMany(message: string, extra: Record<string, unknown> = {}): Response {
  return Response.json({ error: message, quotaExceeded: true, ...extra }, { status: 429 });
}

export async function guardAgentRequest(
  request: Request,
  opts: GuardOptions
): Promise<GuardResult> {
  // 1-2. origin + bot
  if (!isAllowedOrigin(request) || looksLikeBot(request)) {
    return { ok: false, response: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  // 3. IP/UA burst limit
  const limit = checkRateLimit(getFingerprint(request));
  if (!limit.allowed) {
    const msg =
      limit.reason === 'minute'
        ? 'יותר מדי בקשות. נסה שוב בעוד דקה.'
        : limit.reason === 'hour'
          ? 'הגעת למכסת השעה. נסה שוב בעוד שעה.'
          : 'המערכת עמוסה כרגע. נסה שוב בעוד דקה.';
    return {
      ok: false,
      response: Response.json(
        { error: msg },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      ),
    };
  }

  // 4. content-type
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    return {
      ok: false,
      response: Response.json({ error: 'Invalid content type' }, { status: 415 }),
    };
  }

  // 5. auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: Response.json({ error: 'יש להתחבר' }, { status: 401 }) };
  }

  const isPro = isProUser(user);

  // 6. per-user hourly ceiling — the spec's "max 20 per user per hour"
  const durableHour = await countSince(supabase, user.id, opts.kind, hourAgoIso());
  const usedHour = Math.max(durableHour ?? 0, memoryHourlyCount(user.id, opts.kind));
  if (usedHour >= AGENT_HOURLY_LIMIT) {
    return {
      ok: false,
      response: tooMany(
        `הגעת ל-${AGENT_HOURLY_LIMIT} בקשות בשעה האחרונה. נסה שוב בעוד קצת.`,
        { retryAfterSeconds: 600 }
      ),
    };
  }

  // 7. per-user daily cap (tier-based)
  const dailyCap = isPro ? opts.proDaily : opts.freeDaily;
  const usedDay = (await countSince(supabase, user.id, opts.kind, dayStartIso())) ?? 0;
  if (usedDay >= dailyCap) {
    return {
      ok: false,
      response: tooMany(
        isPro
          ? `הגעת למכסה היומית (${dailyCap}). חזור מחר.`
          : `הגעת למכסה היומית של החשבון החינמי (${dailyCap}). שדרג ל-Pro להמשך.`,
        { proRequired: !isPro, remaining: 0 }
      ),
    };
  }

  return {
    ok: true,
    user,
    supabase,
    isPro,
    remaining: Math.max(0, dailyCap - (usedDay + 1)),
  };
}

/*
============================================================================
SQL — already required by /api/questions; these routes reuse it as-is.
Run once in the Supabase dashboard if it isn't there yet. `kind` is plain
text (no CHECK), so 'tutor' and 'grade' need no migration.

  create table if not exists public.ai_generation_log (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users (id) on delete cascade,
    kind        text not null,               -- 'quiz' | 'concept' | 'tutor' | 'grade'
    created_at  timestamptz not null default now()
  );

  create index if not exists ai_generation_log_user_day_idx
    on public.ai_generation_log (user_id, created_at);

  alter table public.ai_generation_log enable row level security;

  create policy "own rows read"  on public.ai_generation_log
    for select using (auth.uid() = user_id);
  create policy "own rows write" on public.ai_generation_log
    for insert with check (auth.uid() = user_id);
============================================================================
*/
