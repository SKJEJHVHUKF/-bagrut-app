'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker on mount.
 * Renders nothing — purely a side-effect component.
 *
 * Safe to drop into the root layout: bails out cleanly when the
 * Service Worker API isn't available (older browsers / non-secure contexts).
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // ⚠️ NEVER in development. The worker caches the app shell and its chunks,
    // so on localhost it happily serves the build from before your last edit:
    // the dev server recompiles, the page reloads, and nothing changes on
    // screen. It cost a full round of "I don't see what you did" before the
    // browser console named it ("module factory is not available … a service
    // worker serving outdated responses").
    //
    // Unregistering rather than merely skipping matters: a worker installed by
    // an earlier dev session keeps serving stale files until something removes
    // it, and nobody thinks to look in DevTools → Application for that.
    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker
        .getRegistrations()
        .then((all) => Promise.all(all.map((r) => r.unregister())))
        .catch(() => {});
      return;
    }

    // Register on load to avoid competing with first-paint resources
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => {
          // Don't surface to the user — SW registration is a progressive
          // enhancement, the app works fine without it
          console.warn('SW registration failed:', err);
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);

  return null;
}
