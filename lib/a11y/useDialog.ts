'use client';

// useDialog — the one place modal semantics live.
//
// The app has 16+ `fixed inset-0` overlays (profile drawer, command palette,
// formula sheet, share preview, tutor bubble, practice shell…) and not one of
// them announced itself as a dialog, trapped focus, or gave focus back to the
// control that opened it. Fixing that per-overlay is 16 near-identical diffs;
// this hook is the shared version.
//
//   const { panelRef, dialogProps } = useDialog(open, close, { label: 'הפרופיל שלי' });
//   ...
//   <motion.aside ref={panelRef} {...dialogProps}> … </motion.aside>
//
// Callers that already run their own ESC handler can drop it — this one
// captures the key first. Callers that focus a specific field themselves
// (GlobalSearch focuses its input) pass `autoFocus: false`.

import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// getClientRects() rather than offsetParent: the panels are position:fixed,
// and offsetParent is null for fixed elements even when they are on screen.
const isVisible = (el: HTMLElement) => el.getClientRects().length > 0;

export function useDialog<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onClose: () => void,
  options: { label: string; autoFocus?: boolean },
) {
  const { label, autoFocus = true } = options;
  const panelRef = useRef<T>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  // Held in a ref so an inline `() => setOpen(false)` from the caller does not
  // re-run the effect below on every render — which would re-steal focus.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    if (autoFocus && panel) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const p = panelRef.current;
      if (!p) return;

      const items = Array.from(p.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible);
      // An empty panel still must not leak focus to the page behind it.
      if (items.length === 0) {
        e.preventDefault();
        p.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const outside = !p.contains(active);

      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };

    // Capture phase: this must win over the page's own key handlers.
    document.addEventListener('keydown', onKey, true);

    return () => {
      document.removeEventListener('keydown', onKey, true);
      // Focus goes back to whatever opened the dialog. Without this, closing a
      // drawer drops the caret at the top of the document and a keyboard user
      // restarts the tab order from scratch.
      restoreTo.current?.focus?.();
    };
  }, [open, autoFocus]);

  return {
    panelRef,
    dialogProps: {
      role: 'dialog' as const,
      'aria-modal': true,
      'aria-label': label,
      tabIndex: -1,
    },
  };
}
