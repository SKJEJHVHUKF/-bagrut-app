'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Recover from the 404 that is not a 404.
 *
 * ============================================================
 * THE FAILURE
 * ============================================================
 * A tab holds the build manifest from the deployment it loaded with. When a new
 * deployment goes out, a CLIENT-SIDE navigation still asks for the route chunk
 * by its old hashed name, the server does not have it, and the App Router
 * renders `not-found` — for a route that is perfectly healthy. A hard refresh
 * always fixes it, which is why it reads as random and why nobody reports it
 * accurately.
 *
 * Reported on /admin during a session with five deployments in an hour. The
 * route answered 307 to /login the whole time.
 *
 * ============================================================
 * WHY THIS CANNOT LOOP, WHICH IS THE ONLY THING THAT MATTERS HERE
 * ============================================================
 * A reload on the 404 page is a reload into a page that can 404 again. Two
 * independent brakes, and either alone is enough:
 *
 *  1. IT ONLY FIRES ON A SOFT NAVIGATION. `performance`'s navigation entry
 *     records the URL the DOCUMENT was loaded with. If that is the URL in the
 *     bar, this page was loaded from the server — the server really did say 404
 *     and reloading would only ask it the same question again. Only when they
 *     differ did we arrive by client-side routing, which is the stale-manifest
 *     case and the only one a reload can fix.
 *
 *  2. ONE ATTEMPT PER PATH PER TAB, recorded in sessionStorage before the
 *     reload is issued. A path that 404s again after a reload renders the page.
 *
 * `sessionStorage` throws in some privacy modes, so a failure to read it is
 * treated as "already tried" — the page renders and nothing reloads. Failing
 * closed here costs a manual refresh; failing open costs an infinite loop.
 */
export default function StaleDeployHeal() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      // No entry at all: cannot tell how we got here, so do nothing.
      if (!nav) return;
      const loadedUrl = new URL(nav.name, window.location.href);
      // Brake 1: the document was loaded with this very URL → a real 404.
      if (loadedUrl.pathname === window.location.pathname) return;

      // Brake 2: once per path per tab.
      const key = `mathup-nf:${pathname}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');

      // A full document load, not router.refresh(): the whole point is to throw
      // away the manifest this tab is holding.
      window.location.reload();
    } catch {
      /* storage blocked, performance unavailable — render the page. */
    }
  }, [pathname]);

  return null;
}
