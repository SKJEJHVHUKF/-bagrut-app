// ============================================================
// mathscan/cost.ts — cost per question, MEASURED not estimated.
// ============================================================
//
// This repo has been burned by an estimate written into a code comment and
// then treated as fact: "/teach costs ~1.2¢ per session" turned out to be
// ~3¢ — 2.5× off — because the estimate forgot that the system prompt and
// the output schema are re-billed on every turn. So the scanner does not
// estimate. Every stage reports what it actually spent, the trace is stored,
// and "מה עלתה השאלה הזאת" is a sum over recorded stages.
//
// Prices below are the published per-token rates and are the ONLY numbers
// here that aren't measured; each one is dated so a stale rate is visible
// rather than invisible. Everything else — token counts, hit rates,
// durations — comes from the response.

import type { ScanStage, ScanStageName, ScanTrace } from './types';

// ------------------------------------------------------------
// Rate card (USD per token) — published rates, checked 2026-08-05.
// ------------------------------------------------------------

export const RATES = {
  'claude-sonnet-4-5': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  'claude-sonnet-4-6': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  /** Introductory pricing, checked 2026-08-17. */
  'claude-sonnet-5': { input: 2 / 1_000_000, output: 10 / 1_000_000 },
  'claude-haiku-4-5': { input: 1 / 1_000_000, output: 5 / 1_000_000 },
} as const;

export type ModelId = keyof typeof RATES;

/** The `usage` block of a Messages response, as the SDK returns it. */
export type UsageLike = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  /** The SDK types these two as `number | null`, not `undefined`. */
  cache_read_input_tokens?: number | null;
  /** TOTAL tokens written, across both TTL buckets. Priced at two different
   *  multipliers, so this number alone cannot produce a correct cost. */
  cache_creation_input_tokens?: number | null;
  /** The same write, broken down by TTL. This is the only field that can. */
  cache_creation?: {
    ephemeral_5m_input_tokens?: number | null;
    ephemeral_1h_input_tokens?: number | null;
  } | null;
};

/**
 * Cache-write multipliers, per TTL. A longer TTL costs more to write and the
 * same to read, which is the whole trade lib/agents/prompts.ts reasons about.
 */
export const CACHE_WRITE_5M = 1.25;
export const CACHE_WRITE_1H = 2;
/** Reads are the same price whichever TTL wrote the entry. */
export const CACHE_READ = 0.1;

/**
 * USD for the cache WRITE on one call, at the right multiplier per TTL.
 *
 * ⚠️ THIS USED TO BE `cache_creation_input_tokens * 1.25`, FLAT — and that is
 * wrong for the busiest route in the app. `/api/chat` writes its prefix with
 * `ttl: '1h'` (CACHE_1H in lib/agents/prompts.ts), which costs 2x, not 1.25x.
 * MEASURED on a real cold turn (2026-08-26, הסתברות, Haiku 4.5): write=3,796
 * tokens, i.e. $0.0076 actual against $0.0047 reported — every `[cost]` line
 * for a cold chat turn was UNDER-REPORTING BY 38%.
 *
 * Both multipliers are live in this codebase and neither is "the" default: the
 * tutor writes at 1h, the grader deliberately writes at 5m (a one-shot call
 * cannot earn a 1h premium). So the TTL has to be read, not assumed.
 *
 * `usage.cache_creation` is the per-bucket breakdown and is authoritative when
 * present. The fallback exists for a usage object that predates the field or
 * comes from a test fixture, and it deliberately assumes 1h — over-reporting a
 * cost is a decision made with open eyes, under-reporting one is a surprise on
 * the invoice.
 */
export function cacheWriteCost(usage: UsageLike, inputRate: number): number {
  const bucket = usage.cache_creation;
  if (bucket) {
    return (
      (bucket.ephemeral_5m_input_tokens ?? 0) * inputRate * CACHE_WRITE_5M +
      (bucket.ephemeral_1h_input_tokens ?? 0) * inputRate * CACHE_WRITE_1H
    );
  }
  return (usage.cache_creation_input_tokens ?? 0) * inputRate * CACHE_WRITE_1H;
}

/**
 * USD for one call, CACHE-AWARE.
 *
 * `input_tokens` EXCLUDES cached tokens: a prompt whose 5,000-token prefix
 * was read from cache reports ~1,500 input tokens, and one whose prefix was
 * just WRITTEN reports the same ~1,500. Ignore the two cache fields and a
 * cached turn looks 4x cheaper than it is while an uncached one looks
 * identical to a cached one — which is exactly how "a short chat cost $0.06"
 * became unanswerable from the app's own numbers (2026-08-22).
 *
 * A `costOfCall` used to live here, omitted the cache fields, and had zero
 * call sites; /api/scan-solve kept a correct inline copy. This is that copy,
 * shared. Write is priced per TTL by `cacheWriteCost` above; read is 0.1x.
 */
export function costOfUsage(model: string, usage: UsageLike | undefined | null): number {
  const rate = RATES[model as ModelId];
  if (!rate || !usage) return 0;
  return (
    (usage.input_tokens ?? 0) * rate.input +
    (usage.output_tokens ?? 0) * rate.output +
    (usage.cache_read_input_tokens ?? 0) * rate.input * CACHE_READ +
    cacheWriteCost(usage, rate.input)
  );
}

/**
 * One line per paid call, for Vercel's log viewer. Filter on `[cost]`.
 *
 * This exists because production has no durable accounting: the
 * `ai_generation_log` table was never created (PGRST205, verified
 * 2026-08-22), so `logAgentUsage` fails silently and the only record of
 * spend is the Anthropic console, which cannot say WHICH route spent it.
 * Until the migration is applied, this line is the audit trail.
 */
export function logCost(
  label: string,
  model: string,
  usage: UsageLike | undefined | null,
  options: {
    /**
     * Whether this call was SUPPOSED to hit a cache. Default true.
     *
     * Pass false for a call whose input is inherently per-request and has
     * nothing reusable in it — a one-off image transcription, for instance,
     * where the bulk of `input_tokens` is the photo itself. Without this the
     * silent-miss warning below fires on every such call and becomes noise,
     * which is how a real warning stops being read.
     */
    expectCache?: boolean;
  } = {}
): number {
  const usd = costOfUsage(model, usage);
  // The write is split by TTL because the two buckets are priced 1.25x and 2x.
  // Printing only the total hides which one was billed — and hides the failure
  // mode where a `ttl: '1h'` request is silently served as a 5-minute entry,
  // which no derived cost number can reveal.
  const w5 = usage?.cache_creation?.ephemeral_5m_input_tokens ?? 0;
  const w1h = usage?.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  const writeTotal = usage?.cache_creation_input_tokens ?? 0;
  const writeDetail = usage?.cache_creation
    ? `${writeTotal}(5m=${w5},1h=${w1h})`
    : `${writeTotal}(ttl=?)`;
  console.log(
    `[cost] ${label} ${model} in=${usage?.input_tokens ?? 0} out=${usage?.output_tokens ?? 0} ` +
      `cache_read=${usage?.cache_read_input_tokens ?? 0} cache_write=${writeDetail} ` +
      `usd=${usd.toFixed(5)}`
  );

  // ⚠️ SILENT CACHE MISS.
  //
  // A `cache_control` marker on a prefix shorter than the model's minimum does
  // nothing at all: no error, no write, no read, no extra charge — and no
  // saving. VERIFIED on the live API (scripts/probe-chat-cache.ts,
  // 2026-08-25): /api/chat with no `topic` builds a 3,490-token prefix against
  // Haiku 4.5's 4,096 minimum, and BOTH cache fields came back 0 on two
  // consecutive identical-prefix calls. It had never cached once.
  //
  // Minimum cacheable prefix, by model — not monotonic across generations:
  //   claude-haiku-4-5, claude-opus-4-6   4096
  //   claude-sonnet-4-6, claude-sonnet-5  1024
  //
  // Both fields zero on a large prompt means one of three things, and this line
  // is how you find out which: the prefix is under the minimum, something in it
  // drifts between calls, or the entry expired. `cache_write > 0` on every turn
  // is the drift case; `write=0, read=0` on every turn is this one.
  const cached = (usage?.cache_read_input_tokens ?? 0) + (usage?.cache_creation_input_tokens ?? 0);
  if ((options.expectCache ?? true) && cached === 0 && (usage?.input_tokens ?? 0) > 2000) {
    console.warn(
      `[cache-miss] ${label} ${model} sent ${usage?.input_tokens} uncached input tokens and cached NOTHING. ` +
        'Either the marked prefix is under the model minimum (silent no-op) or it drifts between calls. ' +
        'Run scripts/probe-chat-cache.ts.'
    );
  }
  return usd;
}

// ------------------------------------------------------------
// The per-scan meter
// ------------------------------------------------------------

export class CostMeter {
  private readonly stages: ScanStage[] = [];
  private readonly startedAt = now();
  private readonly openStages = new Map<ScanStageName, number>();

  begin(name: ScanStageName): void {
    this.openStages.set(name, now());
  }

  /** Close a stage. Safe to call for a stage that was never begun — the
   *  duration is simply 0, which is right for a stage that was skipped. */
  end(
    name: ScanStageName,
    outcome: ScanStage['outcome'],
    options: { costUsd?: number; detail?: string } = {}
  ): void {
    const started = this.openStages.get(name);
    this.openStages.delete(name);
    const costUsd = options.costUsd ?? 0;
    this.stages.push({
      name,
      durationMs: started === undefined ? 0 : Math.round(now() - started),
      costUsd,
      paid: costUsd > 0,
      outcome,
      detail: options.detail,
    });
  }

  /** Record a stage that never ran. Keeps the trace complete, so "the AI was
   *  never called" is a positive fact in the log rather than an absence. */
  skip(name: ScanStageName, detail?: string): void {
    this.stages.push({ name, durationMs: 0, costUsd: 0, paid: false, outcome: 'skip', detail });
  }

  build(id: string): ScanTrace {
    const totalCostUsd = this.stages.reduce((sum, s) => sum + s.costUsd, 0);
    return {
      id,
      createdAt: Date.now(),
      stages: [...this.stages],
      // Round to 6 decimals: at $3/Mtok a single token is 3e-6, so this is
      // the last digit that means anything.
      totalCostUsd: Math.round(totalCostUsd * 1e6) / 1e6,
      totalDurationMs: Math.round(now() - this.startedAt),
      usedPaidPath: this.stages.some((s) => s.paid),
    };
  }
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

// ------------------------------------------------------------
// Rolling aggregate (localStorage)
// ------------------------------------------------------------

const STORAGE_KEY = 'bagrut.mathscan.cost.v1';
const MAX_TRACES = 100;

export type CostSummary = {
  scans: number;
  freeScans: number;
  paidScans: number;
  totalCostUsd: number;
  /** The headline: average USD per scanned question. */
  averageCostUsd: number;
  /** Share of scans that never touched a paid API, 0..1. */
  freeRatio: number;
  medianDurationMs: number;
};

export function recordTrace(trace: ScanTrace): void {
  if (typeof window === 'undefined') return;
  try {
    const all = readTraces();
    all.unshift(trace);
    if (all.length > MAX_TRACES) all.length = MAX_TRACES;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // A full quota must never break a scan — the solution matters, the
    // bookkeeping does not.
  }
}

export function readTraces(): ScanTrace[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScanTrace[]) : [];
  } catch {
    return [];
  }
}

export function summarizeCost(traces: ScanTrace[] = readTraces()): CostSummary {
  if (traces.length === 0) {
    return {
      scans: 0,
      freeScans: 0,
      paidScans: 0,
      totalCostUsd: 0,
      averageCostUsd: 0,
      freeRatio: 1,
      medianDurationMs: 0,
    };
  }
  const paidScans = traces.filter((t) => t.usedPaidPath).length;
  const totalCostUsd = traces.reduce((sum, t) => sum + t.totalCostUsd, 0);
  const durations = traces.map((t) => t.totalDurationMs).sort((a, b) => a - b);
  return {
    scans: traces.length,
    freeScans: traces.length - paidScans,
    paidScans,
    totalCostUsd: Math.round(totalCostUsd * 1e6) / 1e6,
    averageCostUsd: Math.round((totalCostUsd / traces.length) * 1e6) / 1e6,
    freeRatio: (traces.length - paidScans) / traces.length,
    medianDurationMs: durations[Math.floor(durations.length / 2)],
  };
}

/** "$0.0000" is noise to a student; agorot are not. */
export function formatCostIls(usd: number, usdToIls = 3.7): string {
  const agorot = usd * usdToIls * 100;
  if (agorot === 0) return 'חינם';
  if (agorot < 1) return 'פחות מאגורה';
  return `${agorot.toFixed(1)} אגורות`;
}
