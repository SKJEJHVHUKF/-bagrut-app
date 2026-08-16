// announce — say something to a screen reader from anywhere.
//
// Before this the app had exactly two aria-live regions, both inside /scan.
// Everything that makes practice *work* — correct/incorrect, a revealed hint,
// a level unlocking, a streak ticking up — changed silently. A blind student
// answered a question and heard nothing at all.
//
// One region beats one-per-component: the alternative is threading a ref
// through every card, and duplicate live regions in the same view make
// screen readers announce twice or drop one.
//
// Uses the same window-CustomEvent idiom the app already uses for
// 'open-profile-drawer' / 'open-global-search' / 'bagrut-paper-changed'.

export const A11Y_ANNOUNCE_EVENT = 'a11y-announce';

export type Announcement = {
  message: string;
  /** 'assertive' interrupts the user. Reserve it for errors. */
  urgency?: 'polite' | 'assertive';
};

export function announce(message: string, urgency: 'polite' | 'assertive' = 'polite') {
  if (typeof window === 'undefined' || !message) return;
  window.dispatchEvent(
    new CustomEvent<Announcement>(A11Y_ANNOUNCE_EVENT, { detail: { message, urgency } }),
  );
}
