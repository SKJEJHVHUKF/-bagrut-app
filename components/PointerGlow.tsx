'use client';

import { useEffect, useRef } from 'react';

/* Pointer-reactive ambient background — landing page only.

   Two parts, both following the visitor:

   1. Two soft colour fields, members of the Lumina canvas (app/globals.css,
      "Global Lumina canvas") in the same violet + cyan.
   2. A grid trail: a soft disc in which graph paper shows around the pointer,
      drawn in phase with the hero's own graph paper (app/page.tsx,
      `data-grid-paper`), so it reads as the page's grid lighting up rather than
      a second grid sliding over the first.

   Only `transform` and `opacity` change here, eased by CSS transitions rather
   than a requestAnimationFrame loop, so the animation lives on the compositor
   and the main thread does a few style writes per event instead of work every
   frame. Neither the body background nor a mask is ever moved: either would
   repaint a full-screen layer per frame and jank scroll on a phone.

   Kept off the study surfaces (roadmap / quiz / bagrut) on purpose: a moving
   field behind KaTeX competes with the maths for the same attention, and costs
   battery in exactly the screens a student sits in for 40 minutes. */

/* On alpha: the static Lumina fields sit at 0.06–0.09 because they are meant to
   be felt and never seen. These have the opposite job — a field nobody can see
   cannot read as reacting to you — so they run louder, calibrated against the
   live page until the tint was legible on the #FCF8FF canvas without competing
   with the hero. They still never carry contrast for any text or icon. */

/** Each layer chases the same point at its own speed. That spread IS the
 *  effect — matched durations read as one shape stuck to the cursor. */
const LAG = { violet: '850ms', cyan: '1650ms', grid: '620ms' };
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** The lit disc's box. */
const WIN = 520;

/* Must equal the hero graph paper's backgroundSize in app/page.tsx. The phase
   correction lines the two lattices up only when the pitch matches; with any
   other pitch the trail reads as a second grid. Only the alpha is raised, from
   the hero's 0.07 to 0.26. */
const PITCH = 46;
const GRID_LINE = 'rgba(167, 139, 250, 0.26)';

export default function PointerGlow() {
  const violet = useRef<HTMLDivElement>(null);
  const cyan = useRef<HTMLDivElement>(null);
  const win = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const v = violet.current;
    const c = cyan.current;
    const w = win.current;
    const k = counter.current;
    const p = paper.current;
    if (!v || !c || !w || !k || !p) return;
    // The app already honours this in globals.css. These layers are decorative:
    // reduced-motion keeps the static colour fields, never reveals the grid
    // trail (it only means something while it moves), and attaches no listeners.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* The hero's graph paper scrolls with the page while this layer is pinned
       to the viewport, so where its lines fall changes on every scroll — and
       its origin is wherever the centred hero happens to start, not a multiple
       of the pitch (measured: 10.8px / 31.6px out on a 1536px screen). Shifting
       the paper by that phase, mod one pitch, puts both lattices on the same
       lines. No transition on this layer: it has to track the scroll exactly,
       not ease towards it. */
    const hero = document.querySelector<HTMLElement>('[data-grid-paper]');
    const mod = (n: number) => ((n % PITCH) + PITCH) % PITCH;
    const setPhase = () => {
      if (!hero) return;
      const b = hero.getBoundingClientRect();
      p.style.transform = `translate3d(${mod(b.left) - PITCH}px, ${mod(b.top) - PITCH}px, 0)`;
    };

    let shown = false;
    const aim = (x: number, y: number) => {
      const centred = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      v.style.transform = centred;
      c.style.transform = centred;
      w.style.transform = centred;
      /* The counter-move: the disc is a moving WINDOW onto paper that stays
         put. `background-attachment: fixed` cannot do this — a transformed
         ancestor becomes the containing block, so the grid would ride along
         with the disc. Same duration and easing as the disc, written in the
         same event, so the two cancel exactly at every point of the transition. */
      k.style.transform = `translate3d(${WIN / 2 - x}px, ${WIN / 2 - y}px, 0)`;
      setPhase();
      // Revealed on first interaction, and only after the phase is set: until
      // then the paper sits at phase 0, which lines up with the hero only by
      // coincidence. It is a trail — it has nothing to say before you move.
      if (!shown) {
        shown = true;
        w.style.opacity = '1';
      }
    };

    const onPointer = (e: PointerEvent) => aim(e.clientX, e.clientY);

    /* Touch never hovers. A finger reports a position only while it is down,
       and on a page like this that is almost always a scroll — so following it
       would mean the field lives only during a gesture that is about to take
       the section off screen. Scroll depth is the honest mobile input: it
       drifts across the page as the visitor reads down. On a mouse, scrolling
       does not move the pointer relative to the viewport — only the hero's
       lines move — so scroll there re-phases the paper and nothing else. */
    const fine = window.matchMedia('(pointer: fine)').matches;
    const onScroll = fine
      ? setPhase
      : () => {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          const t = max > 0 ? Math.min(1, window.scrollY / max) : 0;
          aim(window.innerWidth * (0.25 + 0.5 * t), window.innerHeight * (0.25 + 0.4 * t));
        };

    if (fine) window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const blob = 'absolute top-0 left-0 rounded-full will-change-transform';
  // Starts where the eye already is on first paint — the hero — so the colour
  // field is part of the composition before anyone has moved anything.
  const start = 'translate3d(50vw, 35vh, 0) translate(-50%, -50%)';
  const counterStart = `translate3d(calc(${WIN / 2}px - 50vw), calc(${WIN / 2}px - 35vh), 0)`;

  const gridPaint =
    `linear-gradient(${GRID_LINE} 1px, transparent 1px),` +
    `linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px)`;
  const softEdge = 'radial-gradient(closest-side, #000 22%, rgba(0,0,0,0) 74%)';

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        ref={violet}
        className={`${blob} h-[560px] w-[820px]`}
        style={{
          transform: start,
          transition: `transform ${LAG.violet} ${EASE}`,
          background:
            'radial-gradient(closest-side, rgba(139, 92, 246, 0.34) 0%, rgba(139, 92, 246, 0) 72%)',
        }}
      />
      <div
        ref={cyan}
        className={`${blob} h-[680px] w-[940px]`}
        style={{
          transform: start,
          transition: `transform ${LAG.cyan} ${EASE}`,
          background:
            'radial-gradient(closest-side, rgba(34, 211, 238, 0.26) 0%, rgba(34, 211, 238, 0) 68%)',
        }}
      />
      {/* The moving window. Its mask is static relative to itself, so the soft
          edge costs nothing to move. */}
      <div
        ref={win}
        className="absolute top-0 left-0 overflow-hidden will-change-transform"
        style={{
          width: WIN,
          height: WIN,
          opacity: 0,
          transform: start,
          transition: `transform ${LAG.grid} ${EASE}, opacity 500ms ease-out`,
          maskImage: softEdge,
          WebkitMaskImage: softEdge,
        }}
      >
        {/* Cancels the window's movement, pinning what is inside to the viewport. */}
        <div
          ref={counter}
          className="absolute top-0 left-0 will-change-transform"
          style={{ transform: counterStart, transition: `transform ${LAG.grid} ${EASE}` }}
        >
          {/* The paper. One pitch of overscan on every side, so a phase shift of
              up to one pitch never uncovers an edge of the viewport. */}
          <div
            ref={paper}
            className="absolute top-0 left-0 will-change-transform"
            style={{
              width: `calc(100vw + ${2 * PITCH}px)`,
              height: `calc(100vh + ${2 * PITCH}px)`,
              transform: `translate3d(${-PITCH}px, ${-PITCH}px, 0)`,
              backgroundImage: gridPaint,
              backgroundSize: `${PITCH}px ${PITCH}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
