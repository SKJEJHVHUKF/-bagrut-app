/**
 * tutor-flags.ts — which tutor layers are switched on for THIS browser.
 *
 * ============================================================
 * WHY localStorage AND NOT AN ENV VAR
 * ============================================================
 * A `NEXT_PUBLIC_` variable is one value for everyone: setting it turns the
 * layer on for every student at once, which is exactly what a first rollout
 * must not do. It also needs a deploy to change, so the loop between "try it"
 * and "turn it off" is minutes long.
 *
 * A localStorage key is per browser, instant in both directions, and needs no
 * deploy — the one person testing can switch it on, use the app, and switch it
 * off without anyone else being affected. There is no server-side default and
 * no way for it to leak to other students, because nothing sets it for them.
 *
 * To turn a layer on, in the browser console:
 *   localStorage.setItem('mathup-flags', 'compiler')
 * and to turn it off:
 *   localStorage.removeItem('mathup-flags')
 *
 * ⚠️ OFF IS THE DEFAULT AND MUST STAY THE DEFAULT. Every reader below returns
 * false when the key is missing, when it is malformed, and when there is no
 * `window` at all (server render). A flag that fails open is not a flag.
 */

const KEY = 'mathup-flags';

export type TutorFlag =
  /** Route through lib/tutor-compiler before falling back to the model. */
  | 'compiler'
  /** Send the diagnostic trace with each /api/chat request. */
  | 'trace';

function enabled(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
  } catch {
    // Private browsing, a disabled storage quota, a hostile extension — any of
    // them throws here, and none of them is a reason to enable a feature.
    return new Set();
  }
}

export function tutorFlag(flag: TutorFlag): boolean {
  return enabled().has(flag);
}

/** For a report or a debug line: what is on right now. */
export function activeTutorFlags(): string[] {
  return [...enabled()].sort();
}
