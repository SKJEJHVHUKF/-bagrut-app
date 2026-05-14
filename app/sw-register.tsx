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
