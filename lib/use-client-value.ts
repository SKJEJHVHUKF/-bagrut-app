'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';

/** Nothing to subscribe to: these values are read once and do not change on
 *  their own. A value that DOES change while mounted should subscribe to its
 *  own change event instead of using this hook. */
const subscribeNever = () => () => {};

/**
 * Read a value that only exists on the client — localStorage, `window.location`,
 * the clock — without the `useEffect(() => setX(read()), [])` dance.
 *
 * That dance is what `react-hooks/set-state-in-effect` exists to stop: it
 * renders, paints, then setStates and renders again. `useSyncExternalStore` is
 * React's sanctioned way in, so the second render is scheduled by React itself
 * instead of cascading out of an effect.
 *
 * The server render and the hydrating render both see `serverValue`, so there
 * is no hydration mismatch; every render after hydration sees `read()`.
 *
 * `read` MUST be a stable reference — a module-level function, or one wrapped in
 * `useCallback`. Its result is cached per mount, which is what lets it return a
 * fresh array/Set or read the clock: `useSyncExternalStore` compares snapshots
 * with `Object.is` on every render, and an uncached one would re-render forever.
 * Passing a new closure each render throws that cache away and reintroduces
 * exactly that loop.
 *
 * `read` must also be side-effect free — it runs during render, not in an effect.
 */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  const getSnapshot = useMemo(() => {
    let cached: { v: T } | undefined;
    return () => (cached ??= { v: read() }).v;
  }, [read]);
  return useSyncExternalStore(subscribeNever, getSnapshot, () => serverValue);
}

/**
 * One `?name=` value from the current URL, read after hydration.
 *
 * Deliberately not `useSearchParams()`: that hook forces a Suspense boundary
 * around the page at build time, which several of these routes do not want.
 */
export function useUrlParam(name: string): string | null {
  const read = useCallback(() => new URLSearchParams(window.location.search).get(name), [name]);
  return useClientValue<string | null>(read, null);
}

const alwaysTrue = () => true;

/**
 * `false` during the server render and the hydrating render, `true` after.
 *
 * The `useState(false)` + `useEffect(() => setReady(true))` idiom this replaces
 * is the single most common reason a page renders twice on mount.
 */
export function useHydrated(): boolean {
  return useClientValue(alwaysTrue, false);
}

/**
 * A client-only value that can also change later: `read()` at hydration, then
 * whatever `set` was last given.
 *
 * Same contract as {@link useClientValue} — `read` must be stable and pure.
 * `set` is stable, so it is safe in a dependency array or an event listener.
 */
export function useClientState<T>(read: () => T, serverValue: T): [T, (value: T) => void] {
  const initial = useClientValue(read, serverValue);
  // Boxed so that setting the value to `null`/`undefined` is distinguishable
  // from "never set", which is what makes the initial read stop applying.
  const [set, setSet] = useState<{ v: T } | null>(null);
  return [set ? set.v : initial, useCallback((value: T) => setSet({ v: value }), [])];
}
