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
  cache_creation_input_tokens?: number | null;
};

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
 * shared. Rates: 5-minute cache write 1.25x, read 0.1x.
 */
export function costOfUsage(model: string, usage: UsageLike | undefined | null): number {
  const rate = RATES[model as ModelId];
  if (!rate || !usage) return 0;
  return (
    (usage.input_tokens ?? 0) * rate.input +
    (usage.output_tokens ?? 0) * rate.output +
    (usage.cache_read_input_tokens ?? 0) * rate.input * 0.1 +
    (usage.cache_creation_input_tokens ?? 0) * rate.input * 1.25
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
export function logCost(label: string, model: string, usage: UsageLike | undefined | null): number {
  const usd = costOfUsage(model, usage);
  console.log(
    `[cost] ${label} ${model} in=${usage?.input_tokens ?? 0} out=${usage?.output_tokens ?? 0} ` +
      `cache_read=${usage?.cache_read_input_tokens ?? 0} cache_write=${usage?.cache_creation_input_tokens ?? 0} ` +
      `usd=${usd.toFixed(5)}`
  );
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
