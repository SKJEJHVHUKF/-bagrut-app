'use client';

// ============================================================
// components/scan/ScanTheme.tsx — a scoped light/dark theme for /scan only.
// ============================================================
//
// The app is deliberately light-only (CLAUDE.md, "premium white"), and
// flipping that globally would touch every screen and every hand-tuned
// contrast pair in the design system. But a scanner is the one surface where
// dark actually earns its place: a student photographs homework at night, and
// a full-white viewfinder page is a torch to the face.
//
// So the theme is SCOPED. Every rule below is nested under
// `[data-scan-theme]`, which only ever appears on the /scan wrapper, and the
// rest of the app is untouched by construction. There is precedent: /quiz is
// already a self-contained inline-`<style>` island with its own variables.
//
// Components use the `scan-*` classes, never raw colours, so the two themes
// stay in step. Contrast was chosen against WCAG AA (4.5:1 for body text,
// 3:1 for large text and UI borders) in BOTH themes — this repo has shipped
// a 2.48:1 disabled state before and had to fix it after the fact.

import { useCallback, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export type ScanTheme = 'light' | 'dark';

const STORAGE_KEY = 'bagrut.scan.theme.v1';

export function useScanTheme(): [ScanTheme, () => void] {
  // Always start 'light' so the server-rendered markup and the first client
  // render agree; the stored preference is applied in an effect. Reading
  // localStorage during render is a hydration mismatch, which React 19
  // reports as an error in the console the owner reads.
  const [theme, setTheme] = useState<ScanTheme>('light');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        setTheme(stored);
        return;
      }
      // No stored choice → follow the device.
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) setTheme('dark');
    } catch {
      /* private mode — light is a fine default */
    }
  }, []);

  const toggle = useCallback(() => {
    /**
     * Suspend transitions for exactly one paint before flipping the theme.
     *
     * Without this the page half-changes: every card, chip and formula turns
     * dark and the page background stays ivory. The cause is not specificity
     * or inheritance — both are fine — it is that a property with a
     * `transition` whose value comes from a custom property does NOT repaint
     * when that custom property changes. Verified directly in the browser:
     * setting `transition: none` on the stuck element snapped it from
     * rgb(253,253,251) to rgb(11,16,32) instantly.
     *
     * Turning transitions off for the frame in which the attribute changes
     * lets the new values apply as ordinary computed styles, and the class
     * is removed on the next frame so hover animations keep working.
     */
    const root = document.documentElement;
    root.classList.add('scan-no-transition');
    setTheme((current) => {
      const next: ScanTheme = current === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* no-op */
      }
      return next;
    });
    // Two frames: one for React to commit the attribute, one to paint it.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove('scan-no-transition'));
    });
  }, []);

  return [theme, toggle];
}

export function ScanThemeToggle({ theme, onToggle }: { theme: ScanTheme; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="scan-icon-btn"
      aria-label={theme === 'dark' ? 'מעבר למצב בהיר' : 'מעבר למצב כהה'}
      title={theme === 'dark' ? 'מצב בהיר' : 'מצב כהה'}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

/** The scoped stylesheet. Mounted once by the /scan page. */
export function ScanThemeStyles() {
  return (
    <style>{`
      [data-scan-theme] {
        --scan-bg: #FDFDFB;
        --scan-card: #FFFFFF;
        --scan-card-2: #F6F6F2;
        --scan-ink: #0F172A;
        --scan-ink-soft: #475569;
        --scan-ink-faint: #64748B;
        --scan-line: rgba(15, 23, 42, 0.10);
        --scan-line-strong: rgba(15, 23, 42, 0.18);
        --scan-primary: #4F46E5;
        --scan-primary-ink: #FFFFFF;
        --scan-primary-soft: rgba(79, 70, 229, 0.10);
        --scan-success: #047857;
        --scan-success-soft: rgba(4, 120, 87, 0.10);
        --scan-warn: #B45309;
        --scan-warn-soft: rgba(180, 83, 9, 0.10);
        --scan-danger: #B91C1C;
        --scan-danger-soft: rgba(185, 28, 28, 0.10);
        --scan-shadow: 0 1px 2px rgba(15,23,42,.04), 0 8px 24px -12px rgba(15,23,42,.18);
      }

      [data-scan-theme='dark'] {
        --scan-bg: #0B1020;
        --scan-card: #141B2E;
        --scan-card-2: #1B2439;
        /* #E8ECF6 on #141B2E ≈ 13.6:1 — comfortably past AA for body text. */
        --scan-ink: #E8ECF6;
        --scan-ink-soft: #B4BED4;
        --scan-ink-faint: #93A0BC;
        --scan-line: rgba(232, 236, 246, 0.12);
        --scan-line-strong: rgba(232, 236, 246, 0.22);
        /* Indigo-600 is too dark to read on a dark card; indigo-400 keeps the
           brand hue and clears 3:1 against --scan-card for UI text. */
        --scan-primary: #818CF8;
        --scan-primary-ink: #0B1020;
        --scan-primary-soft: rgba(129, 140, 248, 0.16);
        --scan-success: #34D399;
        --scan-success-soft: rgba(52, 211, 153, 0.16);
        --scan-warn: #FBBF24;
        --scan-warn-soft: rgba(251, 191, 36, 0.16);
        --scan-danger: #F87171;
        --scan-danger-soft: rgba(248, 113, 113, 0.16);
        --scan-shadow: 0 1px 2px rgba(0,0,0,.4), 0 12px 32px -16px rgba(0,0,0,.7);
      }

      /* Applied to a CHILD of [data-scan-theme], never to the same element —
         see the comment in app/scan/page.tsx. */
      .scan-root {
        background: var(--scan-bg);
        color: var(--scan-ink);
        min-height: 100vh;
        transition: background-color .25s ease, color .25s ease;
      }
      .scan-card {
        background: var(--scan-card);
        border: 1px solid var(--scan-line);
        border-radius: 1rem;
        box-shadow: var(--scan-shadow);
      }
      .scan-card-flat {
        background: var(--scan-card-2);
        border: 1px solid var(--scan-line);
        border-radius: 1rem;
      }
      .scan-muted { color: var(--scan-ink-soft); }
      .scan-faint { color: var(--scan-ink-faint); }

      .scan-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
        border-radius: 1rem; padding: .875rem 1.25rem; font-weight: 800;
        border: 1px solid var(--scan-line-strong);
        background: var(--scan-card); color: var(--scan-ink);
        transition: transform .15s ease, background-color .2s ease, border-color .2s ease;
      }
      .scan-btn:hover:not(:disabled) { border-color: var(--scan-primary); }
      .scan-btn:active:not(:disabled) { transform: scale(.985); }
      .scan-btn:disabled { opacity: .55; cursor: not-allowed; }
      .scan-btn-primary {
        background: var(--scan-primary); color: var(--scan-primary-ink);
        border-color: transparent;
      }
      .scan-btn-primary:hover:not(:disabled) { filter: brightness(1.06); }
      .scan-icon-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 2.25rem; height: 2.25rem; border-radius: .75rem;
        border: 1px solid var(--scan-line-strong);
        background: var(--scan-card); color: var(--scan-ink-soft);
      }
      .scan-icon-btn:hover { color: var(--scan-ink); border-color: var(--scan-primary); }

      .scan-chip {
        display: inline-flex; align-items: center; gap: .375rem;
        border-radius: 999px; padding: .25rem .625rem;
        font-size: .6875rem; font-weight: 800; line-height: 1.4;
        border: 1px solid var(--scan-line-strong); color: var(--scan-ink-soft);
      }
      .scan-chip-success { color: var(--scan-success); background: var(--scan-success-soft); border-color: transparent; }
      .scan-chip-warn    { color: var(--scan-warn);    background: var(--scan-warn-soft);    border-color: transparent; }
      .scan-chip-danger  { color: var(--scan-danger);  background: var(--scan-danger-soft);  border-color: transparent; }
      .scan-chip-primary { color: var(--scan-primary); background: var(--scan-primary-soft); border-color: transparent; }

      .scan-input {
        width: 100%; border-radius: .875rem; padding: .75rem .875rem;
        background: var(--scan-card-2); color: var(--scan-ink);
        border: 1px solid var(--scan-line-strong);
        font-family: inherit; font-size: .9375rem; line-height: 1.7;
      }
      .scan-input:focus { outline: 2px solid var(--scan-primary); outline-offset: 1px; }

      /* KaTeX inherits the page colour, so formulas stay legible in dark mode
         without restyling the maths itself. */
      [data-scan-theme] .katex { color: var(--scan-ink); }

      /* The floor rule from globals.css applies here too, but this island can
         be rendered without a .chat-md ancestor, and an un-isolated formula
         inherits dir=rtl from <html> and displays reversed. */
      [data-scan-theme] .katex { direction: ltr; unicode-bidi: isolate; }

      /* Set for one frame while the theme flips — see useScanTheme. */
      .scan-no-transition [data-scan-theme],
      .scan-no-transition [data-scan-theme] * {
        transition: none !important;
      }

      @media (prefers-reduced-motion: reduce) {
        .scan-root, .scan-btn { transition: none; }
      }
    `}</style>
  );
}
