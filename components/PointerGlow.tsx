'use client';

import { useEffect, useRef } from 'react';

/* Pointer-reactive ambient glow — landing page only.
   A fourth field for the Lumina canvas (app/globals.css, "Global Lumina
   canvas"), in the same violet + cyan, except this one follows the visitor.

   Deliberately NOT part of the body background: moving a radial-gradient
   repaints the whole page every frame, which janks scroll on a phone. Only
   `transform` changes here, and the easing is a CSS transition rather than a
   requestAnimationFrame loop — so the whole animation lives on the compositor
   and the main thread does one style write per pointer event, not one per
   frame. Each pointermove restarts the transition from wherever the blob
   currently is, which is what produces the trailing feel.

   Kept off the study surfaces (roadmap / quiz / bagrut) on purpose: a moving
   field behind KaTeX competes with the maths for the same attention, and costs
   battery in exactly the screens a student sits in for 40 minutes. */

/* On alpha: the static Lumina fields sit at 0.06–0.09 because they are meant to
   be felt and never seen. This one has the opposite job — a field nobody can
   see cannot read as reacting to you — so it runs louder, calibrated against
   the live page until the tint was legible on the #FCF8FF canvas without
   competing with the hero. It is still well under the 3:1 line that any text
   or icon has to clear, because it never carries contrast for anything. */

/** The two blobs chase the same point at different speeds. That difference IS
 *  the effect — matched durations read as one shape stuck to the cursor. */
const LAG = ['850ms', '1650ms'];
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function PointerGlow() {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = wrap.current ? (Array.from(wrap.current.children) as HTMLElement[]) : [];
    if (!els.length) return;
    // The app already honours this in globals.css; the glow is decorative, so
    // reduced-motion keeps the static field and attaches no listeners at all.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const aim = (x: number, y: number) => {
      for (const el of els) {
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
    };

    const onPointer = (e: PointerEvent) => aim(e.clientX, e.clientY);

    /* Touch never hovers. A finger only reports a position while it is down,
       and on a page like this that is almost always a scroll — so following it
       would mean the glow lives only during a gesture that is about to take
       the section off screen. Scroll depth is the honest mobile input: the
       field drifts across the page as the visitor reads down it. */
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      aim(window.innerWidth * (0.25 + 0.5 * p), window.innerHeight * (0.25 + 0.4 * p));
    };

    const fine = window.matchMedia('(pointer: fine)').matches;
    const evt = fine ? 'pointermove' : 'scroll';
    const handler = (fine ? onPointer : onScroll) as EventListener;
    window.addEventListener(evt, handler, { passive: true });

    return () => window.removeEventListener(evt, handler);
  }, []);

  const blob = 'absolute top-0 left-0 rounded-full will-change-transform';
  // Starts where the eye already is on first paint — the hero — so the field
  // is part of the composition before anyone has moved anything.
  const start = 'translate3d(50vw, 35vh, 0) translate(-50%, -50%)';

  return (
    <div ref={wrap} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className={`${blob} h-[560px] w-[820px]`}
        style={{
          transform: start,
          transition: `transform ${LAG[0]} ${EASE}`,
          background:
            'radial-gradient(closest-side, rgba(139, 92, 246, 0.34) 0%, rgba(139, 92, 246, 0) 72%)',
        }}
      />
      <div
        className={`${blob} h-[680px] w-[940px]`}
        style={{
          transform: start,
          transition: `transform ${LAG[1]} ${EASE}`,
          background:
            'radial-gradient(closest-side, rgba(34, 211, 238, 0.26) 0%, rgba(34, 211, 238, 0) 68%)',
        }}
      />
    </div>
  );
}
