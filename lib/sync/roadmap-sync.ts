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

const ROADMAP_KEY = 'bagrut-roadmap-v1';
const PLAN_KEY = 'bagrut-study-plan-v1';

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

// ---- Sync ----

/** Pull → merge → push. Returns true if a real sync happened. */
export async function syncNow(): Promise<boolean> {
  if (!isBrowser()) return false;
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return false;

    const { data: remote, error } = await supabase
      .from('learning_state')
      .select('roadmap, plan')
      .eq('user_id', uid)
      .maybeSingle();
    if (error) return false; // table missing / RLS / offline → degrade

    const localRoadmap = readJSON<RoadmapStore>(ROADMAP_KEY, {});
    const remoteRoadmap = (remote?.roadmap as RoadmapStore) ?? {};
    const mergedRoadmap = mergeRoadmap(localRoadmap, remoteRoadmap);
    writeJSON(ROADMAP_KEY, mergedRoadmap);

    // Plan: a fresh device with no local plan adopts the remote one; otherwise
    // the local plan (what the student is using here) wins and is pushed up.
    let localPlan = readJSON<unknown | null>(PLAN_KEY, null);
    if (!localPlan && remote?.plan) {
      writeJSON(PLAN_KEY, remote.plan);
      localPlan = remote.plan;
    }

    await supabase.from('learning_state').upsert(
      {
        user_id: uid,
        roadmap: mergedRoadmap,
        plan: localPlan ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    window.dispatchEvent(new Event('bagrut-state-synced'));
    return true;
  } catch {
    return false;
  }
}

let started = false;
let debounce: ReturnType<typeof setTimeout> | null = null;

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
    debounce = setTimeout(() => void syncNow(), 4000);
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
