'use client';

import { useEffect, useRef } from 'react';

/* Grid trail — landing page only.

   The hero's graph-paper squares light up as the pointer (or, on a phone, the
   finger) passes over them, then fade out behind it. Each lit square sits
   exactly on the hero's lattice: its position is read from the hero grid
   element (`data-grid-paper` in app/page.tsx), not assumed, because that grid
   starts wherever the centred hero happens to start and it scrolls.

   Cheap by construction: a fixed pool of square divs is reused round-robin,
   each positioned with `transform` and faded with a Web Animations opacity
   animation — both compositor-only, no layout, no per-frame JS.

   Kept off the study surfaces on purpose: motion behind KaTeX competes with the
   maths for the same attention.

   Stacking: this layer is -z-10, which is visible only because body has
   `isolation: isolate` (app/globals.css). The hero grid's lines sit in a z-10
   section above this layer, so the lit fill shows under the lines, as if the
   paper itself were tinted. */

/** Must equal the hero graph paper's backgroundSize in app/page.tsx. */
const PITCH = 46;
/** Squares that can be lit at once. A fast sweep lights roughly one per 46px,
 *  so this comfortably covers a full-width flick within one fade. */
const POOL = 48;
const FADE_MS = 900;
/** Longest straight run filled in between two pointer events. Anything longer
 *  is the pointer re-entering the window, not a sweep — draw only its end. */
const MAX_STEP = 14;

export default function GridTrail() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = layer.current;
    const hero = document.querySelector<HTMLElement>('[data-grid-paper]');
    if (!root || !hero) return;
    // Decorative motion: reduced-motion gets the static page and no listeners.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const squares = Array.from(root.children) as HTMLElement[];
    let next = 0;
    let last: { col: number; row: number } | null = null;
    let pointer: { x: number; y: number } | null = null;

    const light = (col: number, row: number, ox: number, oy: number) => {
      const sq = squares[next];
      next = (next + 1) % squares.length;
      sq.style.transform = `translate3d(${ox + col * PITCH}px, ${oy + row * PITCH}px, 0)`;
      // No fill: once it finishes, the square falls back to its resting opacity 0.
      sq.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: FADE_MS,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      });
    };

    const at = (x: number, y: number) => {
      pointer = { x, y };
      const b = hero.getBoundingClientRect();
      const col = Math.floor((x - b.left) / PITCH);
      const row = Math.floor((y - b.top) / PITCH);
      if (last && last.col === col && last.row === row) return;

      // Pointer events arrive every few pixels at best; a quick sweep crosses
      // several squares between two of them. Fill the run in between so the
      // trail is continuous rather than dotted.
      const dc = last ? col - last.col : 0;
      const dr = last ? row - last.row : 0;
      const steps = Math.max(Math.abs(dc), Math.abs(dr));
      if (last && steps > 1 && steps <= MAX_STEP) {
        for (let i = 1; i < steps; i++) {
          light(last.col + Math.round((dc * i) / steps), last.row + Math.round((dr * i) / steps), b.left, b.top);
        }
      }
      light(col, row, b.left, b.top);
      last = { col, row };
    };

    const onPointer = (e: PointerEvent) => at(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      if (e.type === 'touchstart') last = null; // a new finger is not a sweep from the old one
      at(t.clientX, t.clientY);
    };
    // Scrolling slides the paper under a still pointer, so new squares pass under it.
    const onScroll = () => {
      if (pointer) at(pointer.x, pointer.y);
    };

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div ref={layer} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {Array.from({ length: POOL }, (_, i) => (
        <div
          key={i}
          className="absolute top-0 left-0"
          style={{
            // One pixel over the pitch so the square's right and bottom edges
            // land on the next lattice line, not a pixel short of it.
            width: PITCH + 1,
            height: PITCH + 1,
            opacity: 0,
            background: 'rgba(139, 92, 246, 0.14)',
            boxShadow: 'inset 0 0 0 1px rgba(139, 92, 246, 0.55)',
            willChange: 'opacity, transform',
          }}
        />
      ))}
    </div>
  );
}
