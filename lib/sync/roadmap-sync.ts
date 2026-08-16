/**
 * roadmap-sync.ts — cross-device sync for the learning path.
 *
 * localStorage stays the synchronous source of truth; this layer mirrors it to
 * a single Supabase `learning_state` row so progress follows the student across
 * devices. Everything is best-effort: if the table is missing or the network is
 * down, every call degrades to a silent no-op and the app keeps working locally.
 *
 * Conflict handling is convergent + monotonic: each sync PULLS the remote blob,
 * MERGES it with local taking the max of every progress field (cleared, stars,
 * attempts…), then PUSHES the merged result back. Because progress only ever
 * moves forward, devices converge regardless of sync order — no lost stars.
 */

import { createClient } from '@/lib/supabase/client';
import { MAX_EVENTS } from '@/lib/results';

const ROADMAP_KEY = 'bagrut-roadmap-v1';
const PLAN_KEY = 'bagrut-study-plan-v1';
const RESULTS_KEY = 'bagrut-results-v1';
/** Derived from the log, never synced — rebuilt after every merge. */
const RESULTS_SEEN_KEY = 'bagrut-results-seen-v1';
/** Whose work the local stores hold. See `claimForUser`. */
const OWNER_KEY = 'bagrut-owner-v1';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / disabled — ignore */
  }
}

// ---- Merge (max-wins) for the roadmap progress store ----

type LevelRec = {
  cleared?: boolean;
  stars?: number;
  bestScore?: number;
  total?: number;
  clearedAt?: number;
  attempts?: number;
};
type NodeRec = {
  passed?: boolean;
  bestScore?: number;
  total?: number;
  completedAt?: number;
  levels?: Record<string, LevelRec>;
};
type RoadmapStore = Record<string, NodeRec>;

function minDefined(a?: number, b?: number): number | undefined {
  if (a == null) return b;
  if (b == null) return a;
  return Math.min(a, b);
}

function mergeLevel(a: LevelRec = {}, b: LevelRec = {}): LevelRec {
  return {
    cleared: !!a.cleared || !!b.cleared,
    stars: Math.max(a.stars ?? 0, b.stars ?? 0),
    bestScore: Math.max(a.bestScore ?? 0, b.bestScore ?? 0),
    total: a.total ?? b.total,
    attempts: Math.max(a.attempts ?? 0, b.attempts ?? 0),
    clearedAt: minDefined(a.clearedAt, b.clearedAt),
  };
}

function mergeNode(a: NodeRec = {}, b: NodeRec = {}): NodeRec {
  const levels: Record<string, LevelRec> = { ...(a.levels ?? {}) };
  for (const [kind, lr] of Object.entries(b.levels ?? {})) {
    levels[kind] = mergeLevel(levels[kind], lr);
  }
  return {
    passed: !!a.passed || !!b.passed,
    bestScore: Math.max(a.bestScore ?? 0, b.bestScore ?? 0) || undefined,
    total: a.total ?? b.total,
    completedAt: minDefined(a.completedAt, b.completedAt),
    levels,
  };
}

export function mergeRoadmap(a: RoadmapStore, b: RoadmapStore): RoadmapStore {
  const out: RoadmapStore = { ...a };
  for (const [key, rec] of Object.entries(b)) {
    out[key] = out[key] ? mergeNode(out[key], rec) : rec;
  }
  return out;
}

// ---- Merge (union) for the answer log ----
//
// The roadmap store is a MAP of progress that only moves forward, so max-wins
// converges. The answer log is an append-only SEQUENCE of events, and the right
// merge is a set union: every answer really happened, on whichever device.
//
// The index signature is load-bearing. Events carry diagnostic fields the sync
// layer knows nothing about (chosenIndex, selfReported, optionCount…), and a
// merge that rebuilt each event field-by-field would silently strip them and
// blind lib/cognition on any student who ever syncs.

type LoggedEvent = {
  ts: number;
  subject: string;
  topic: string;
  questionId?: string;
  source: string;
  correct: boolean;
  repeat?: boolean;
  [field: string]: unknown;
};

/** Identity of an answer. Two devices that both hold the same synced event
 *  produce the same key, so a union never duplicates it. */
function eventKey(e: LoggedEvent): string {
  return `${e.ts}|${e.source}|${e.questionId ?? ''}|${e.subject}|${e.topic}`;
}

/**
 * Union two answer logs, oldest-first, capped like the local store.
 *
 * `repeat` is RE-DERIVED rather than merged. It means "this (source,
 * questionId) was already answered before", and each device only ever knew
 * about its own history — so device B legitimately recorded a first answer to a
 * question device A had already logged, and a naive union would count both as
 * measurements and inflate the grade prediction. Recomputing the flag over the
 * merged, time-ordered log makes the result identical no matter which device
 * syncs first, and fixes the flags that were wrong while the two were apart.
 */
export function mergeResults(a: LoggedEvent[], b: LoggedEvent[]): LoggedEvent[] {
  const byKey = new Map<string, LoggedEvent>();
  for (const e of [...a, ...b]) {
    if (!e || typeof e.ts !== 'number') continue;
    const key = eventKey(e);
    const prev = byKey.get(key);
    // Same event from both sides: keep the richer copy, so a device that
    // recorded the diagnostic fields wins over one that did not.
    if (!prev || Object.keys(e).length > Object.keys(prev).length) byKey.set(key, e);
  }

  const merged = [...byKey.values()].sort((x, y) => x.ts - y.ts);
  const capped = merged.length > MAX_EVENTS ? merged.slice(merged.length - MAX_EVENTS) : merged;

  const seen = new Set<string>();
  return capped.map((e) => {
    if (!e.questionId) {
      const { repeat: _drop, ...rest } = e;
      void _drop;
      return rest as LoggedEvent;
    }
    const k = `${e.source}:${e.questionId}`;
    if (seen.has(k)) return { ...e, repeat: true };
    seen.add(k);
    const { repeat: _drop, ...rest } = e;
    void _drop;
    return rest as LoggedEvent;
  });
}

/** The companion "already counted" set is derivable from the log, so it is
 *  never synced — it is rebuilt here so the next local write agrees with the
 *  merged history instead of re-flagging events as first attempts. */
export function rebuildSeen(events: LoggedEvent[]): string[] {
  const seen = new Set<string>();
  for (const e of events) if (e.questionId) seen.add(`${e.source}:${e.questionId}`);
  return [...seen];
}

// ---- Sync ----

/** Body of the last successful push, so an unchanged state is never re-sent.
 *  Declared here, above its only reader, because `syncNow` depends on it. */
let lastPushed: string | null = null;

/** Pull → merge → push. Returns true if a real sync happened. */
/**
 * Make the local stores belong to `uid`, wiping them first if they belong to
 * SOMEONE ELSE.
 *
 * Signing out is a server-only route (a form POST → `supabase.auth.signOut()` →
 * redirect), so no client code runs and nothing clears localStorage. Without
 * this check the next student to sign in on the same browser — a family laptop,
 * a school computer — has the previous student's answers merged into their row
 * and pushed to Supabase, where it is irreversible. It poisons the streak, the
 * weakest-topic ranking and the predicted grade.
 *
 * Adoption stays intact where it is wanted: a student who worked anonymously
 * and THEN signed up has no stored owner, so their work is claimed, not wiped.
 */
function claimForUser(uid: string): void {
  let owner: string | null = null;
  try {
    owner = window.localStorage.getItem(OWNER_KEY);
  } catch {
    return; // storage disabled — nothing to protect
  }
  if (owner === uid) return;
  if (owner) {
    // A different signed-in student left this browser. Their work is already on
    // the server under their own user_id; drop the local copy.
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith('bagrut-') || k.startsWith('bagrut.')) && k !== OWNER_KEY) keys.push(k);
      }
      for (const k of keys) window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
    // A push from the previous student may have been deduped against this.
    lastPushed = null;
  }
  try {
    window.localStorage.setItem(OWNER_KEY, uid);
  } catch {
    /* ignore */
  }
}

export async function syncNow(): Promise<boolean> {
  if (!isBrowser()) return false;
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return false;

    // BEFORE any read of the local stores.
    claimForUser(uid);

    // `select('*')` on purpose, not a column list: a table created from an
    // older copy of supabase-learning-path.sql might not have `results`, and
    // naming a missing column would fail the whole SELECT — taking the roadmap
    // sync that already works down with it. A star select just returns fewer
    // keys.
    const { data: remote, error } = await supabase
      .from('learning_state')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();
    if (error) return false; // table missing / RLS / offline → degrade

    const localRoadmap = readJSON<RoadmapStore>(ROADMAP_KEY, {});
    const remoteRoadmap = (remote?.roadmap as RoadmapStore) ?? {};
    const mergedRoadmap = mergeRoadmap(localRoadmap, remoteRoadmap);
    writeJSON(ROADMAP_KEY, mergedRoadmap);

    // Answer log: union, then re-derive the "already counted" flags over the
    // merged history (see mergeResults).
    const localResults = readJSON<LoggedEvent[]>(RESULTS_KEY, []);
    const remoteResults = Array.isArray(remote?.results) ? (remote.results as LoggedEvent[]) : [];
    const mergedResults = mergeResults(localResults, remoteResults);
    writeJSON(RESULTS_KEY, mergedResults);
    writeJSON(RESULTS_SEEN_KEY, rebuildSeen(mergedResults));

    // Plan: a fresh device with no local plan adopts the remote one; otherwise
    // the local plan (what the student is using here) wins and is pushed up.
    let localPlan = readJSON<unknown | null>(PLAN_KEY, null);
    if (!localPlan && remote?.plan) {
      writeJSON(PLAN_KEY, remote.plan);
      localPlan = remote.plan;
    }

    // The answer log made the payload roughly twenty times bigger — a full log
    // is ~200KB of JSON, and these students are on phones. Two cheap guards:
    // skip the write entirely when nothing changed (visibilitychange and
    // beforeunload both fire right after a debounced push and would otherwise
    // re-upload the same 200KB), and a longer debounce in initSync below.
    const body = { roadmap: mergedRoadmap, plan: localPlan ?? null, results: mergedResults };
    const signature = JSON.stringify(body);
    if (signature === lastPushed) {
      window.dispatchEvent(new Event('bagrut-state-synced'));
      return true;
    }

    const payload = { user_id: uid, ...body, updated_at: new Date().toISOString() };
    const { error: upsertError } = await supabase
      .from('learning_state')
      .upsert(payload, { onConflict: 'user_id' });
    if (upsertError) {
      // Same defence as the star select, on the write side: rather than let a
      // missing `results` column break roadmap sync, drop it and push the rest.
      const { results: _omit, ...legacy } = payload;
      void _omit;
      await supabase.from('learning_state').upsert(legacy, { onConflict: 'user_id' });
    } else {
      lastPushed = signature;
    }

    window.dispatchEvent(new Event('bagrut-state-synced'));
    return true;
  } catch {
    return false;
  }
}

let started = false;
let debounce: ReturnType<typeof setTimeout> | null = null;

/** How long to wait after the last local change before pushing.
 *  Raised from 4s when the answer log joined the payload: a student answering
 *  a question a minute would otherwise upload the whole log a minute. Leaving
 *  the page still flushes immediately via visibilitychange / beforeunload, so
 *  nothing is at risk of being lost. */
const PUSH_DEBOUNCE_MS = 15000;

/** Notify the sync layer that local progress changed (debounced push). */
export function markDirty() {
  if (isBrowser()) window.dispatchEvent(new Event('bagrut-state-dirty'));
}

/** Start syncing: pull on mount, then push on change / when the tab is hidden.
 *  Safe to call once; returns a cleanup. */
export function initSync(): () => void {
  if (!isBrowser() || started) return () => {};
  started = true;

  void syncNow(); // initial pull + merge

  const onDirty = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => void syncNow(), PUSH_DEBOUNCE_MS);
  };
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') void syncNow();
  };

  window.addEventListener('bagrut-state-dirty', onDirty);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('beforeunload', onVisibility);

  return () => {
    window.removeEventListener('bagrut-state-dirty', onDirty);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('beforeunload', onVisibility);
    if (debounce) clearTimeout(debounce);
    started = false;
  };
}
