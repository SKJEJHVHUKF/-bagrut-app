// ============================================================
// plot-svg — a function plot COMPUTED from the real functions
// ============================================================
//
// WHY THIS EXISTS. Content diagrams must be `type:'custom'` raw SVG — a `fn:`
// closure breaks the RSC server→client boundary (CLAUDE.md), so the renderer's
// own functionGraph is unusable from content. That leaves hand-written
// coordinates, which is how a graph ends up claiming a root the curve does not
// pass through. So the coordinates are COMPUTED here from the real function and
// the emitted string is stored with the content (or, for a generated question,
// built at render time — which is why this lives in lib/ and not in scripts/).
//
// It samples densely, splits a polyline at a pole or at the edge of the window
// instead of drawing a vertical streak through it, and rounds every emitted
// number to 1 decimal.
//
// Palette is the app's dark-ink-on-light one; light-on-dark values are
// invisible on the ivory canvas.

const INK = 'rgba(51,65,85,.85)';
const LABEL = '#0F172A';
const INDIGO = '#4F46E5';
const EMERALD = '#059669';
const EMERALD_DEEP = '#047857';
const AMBER = '#B45309';
const PINK = '#DB2777';
/** The canvas colour, used as a halo behind a label that sits on hatching. */
const CANVAS = '#FDFDFB';

export type Curve = {
  f: (x: number) => number;
  from?: number;
  to?: number;
  color?: string;
  dashed?: boolean;
  width?: number;
};

export type Shade = {
  from: number;
  to: number;
  upper: (x: number) => number;
  /** Defaults to the x-axis. */
  lower?: (x: number) => number;
  color?: string;
  opacity?: number;
  /** Diagonal hatching clipped to the region, on top of the fill. An area a
   *  student is asked to compute is marked this way (Itay, 2026-09-13: "צבע
   *  ירוק שמסמן את השטח"), so it reads as a region and not as a tint. */
  hatch?: boolean;
  /** Dashed vertical segments at `from` and `to`, from the lower boundary to
   *  the upper one — the lines that bound the integral. Skipped where the two
   *  boundaries meet (an intersection point needs no line). */
  bounds?: boolean;
};

export type Fig = {
  w?: number;
  h?: number;
  xRange: [number, number];
  yRange: [number, number];
  curves: Curve[];
  shade?: Shade[];
  vAsym?: { x: number; label?: string }[];
  hAsym?: { y: number; label?: string }[];
  /** Straight guide segments in MATH coordinates. */
  guides?: { x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean }[];
  points?: { x: number; y: number; label?: string; hollow?: boolean; color?: string; dx?: number; dy?: number }[];
  /** Free text placed in MATH coordinates. */
  texts?: { x: number; y: number; text: string; color?: string; anchor?: 'start' | 'middle' | 'end'; bold?: boolean }[];
  /** `above` prints the number over the axis — for a limit whose dashed bound
   *  line runs DOWN from the axis and would strike through a label below it. */
  xTicks?: { x: number; label: string; above?: boolean }[];
  yTicks?: { y: number; label: string }[];
  xLabel?: string;
  yLabel?: string;
  /** Put a canvas-coloured halo behind point labels and free texts, so a label
   *  that lands on hatching or on a curve stays legible. */
  halo?: boolean;
};

// One decimal is below the eye's resolution at this viewBox size and keeps the
// emitted string small — 600-sample polylines rounded to 2 decimals added ~4 KB
// each to a lesson file that ships to the browser.
const R = (v: number) => Math.round(v * 10) / 10;
const ML = 26, MR = 16, MT = 16, MB = 22;

// FigureCard wraps every diagram in `w-full max-w-[280px] aspect-square`, so a
// wide viewBox is letterboxed inside a square and renders small with empty
// bands. 300x260 is close enough to 1:1 to fill the card and keep the labels
// legible; 340x220 lost about a fifth of the height to whitespace.
function mapper(fig: Fig) {
  const w = fig.w ?? 300, h = fig.h ?? 260;
  const [x0, x1] = fig.xRange;
  const [y0, y1] = fig.yRange;
  // Unrounded, for geometry that is computed in screen space (the hatching).
  const ux = (x: number) => ML + ((x - x0) / (x1 - x0)) * (w - ML - MR);
  const uy = (y: number) => h - MB - ((y - y0) / (y1 - y0)) * (h - MT - MB);
  const toX = (X: number) => x0 + ((X - ML) / (w - ML - MR)) * (x1 - x0);
  const sx = (x: number) => R(ux(x));
  const sy = (y: number) => R(uy(y));
  return { w, h, x0, x1, y0, y1, sx, sy, ux, uy, toX };
}

/** Sample a curve into polyline runs, breaking at poles and window edges. */
function runs(fig: Fig, c: Curve, m: ReturnType<typeof mapper>): string[] {
  const from = c.from ?? m.x0;
  const to = c.to ?? m.x1;
  const N = 150;
  const out: string[] = [];
  let cur: string[] = [];
  let prevY: number | null = null;
  for (let i = 0; i <= N; i++) {
    const x = from + ((to - from) * i) / N;
    const y = c.f(x);
    const bad =
      !Number.isFinite(y) ||
      y < m.y0 ||
      y > m.y1 ||
      // a jump of more than half the window between adjacent samples is a pole
      (prevY !== null && Math.abs(y - prevY) > (m.y1 - m.y0) * 0.5);
    if (bad) {
      if (cur.length > 1) out.push(cur.join(' '));
      cur = [];
      prevY = Number.isFinite(y) ? y : null;
      continue;
    }
    cur.push(`${m.sx(x)},${m.sy(y)}`);
    prevY = y;
  }
  if (cur.length > 1) out.push(cur.join(' '));
  return out;
}

function shadePath(fig: Fig, s: Shade, m: ReturnType<typeof mapper>): string {
  const N = 90;
  const up: string[] = [];
  const lo: string[] = [];
  const lower = s.lower ?? (() => 0);
  for (let i = 0; i <= N; i++) {
    const x = s.from + ((s.to - s.from) * i) / N;
    const yu = Math.min(m.y1, Math.max(m.y0, s.upper(x)));
    const yl = Math.min(m.y1, Math.max(m.y0, lower(x)));
    up.push(`${m.sx(x)},${m.sy(yu)}`);
    lo.push(`${m.sx(x)},${m.sy(yl)}`);
  }
  lo.reverse();
  return `M ${up.join(' L ')} L ${lo.join(' L ')} Z`;
}

/** 45° hatching clipped to the region between the two boundaries, as explicit
 *  segments. No <pattern>/<clipPath>: those need document-unique ids, and a
 *  pattern defined inside a figure that is not displayed paints nothing in the
 *  figures that reference it. */
function hatchPath(s: Shade, m: ReturnType<typeof mapper>): string {
  const lower = s.lower ?? (() => 0);
  const clamp = (y: number) => Math.min(m.y1, Math.max(m.y0, y));
  const X0 = Math.min(m.ux(s.from), m.ux(s.to));
  const X1 = Math.max(m.ux(s.from), m.ux(s.to));
  // screen y of the region's top and bottom edge at screen x. The x is clamped
  // into [from, to]: the screen→math round trip lands a hair outside, and √ of
  // a value just below 0 is NaN, which then poisons the whole hatch loop.
  const lo = Math.min(s.from, s.to), hi = Math.max(s.from, s.to);
  const edges = (X: number): [number, number] => {
    const x = Math.min(hi, Math.max(lo, m.toX(X)));
    const a = clamp(s.upper(x));
    const b = clamp(lower(x));
    return [m.uy(Math.max(a, b)), m.uy(Math.min(a, b))];
  };
  const inside = (X: number, c: number) => {
    if (X < X0 || X > X1) return false;
    const [top, bottom] = edges(X);
    const Y = c - X;
    return Number.isFinite(top) && Number.isFinite(bottom) && Y >= top && Y <= bottom;
  };
  // refine the crossing between an inside and an outside sample
  const edge = (a: number, b: number, c: number) => {
    let lo = a, hi = b; // inside(lo) !== inside(hi)
    const loIn = inside(lo, c);
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (inside(mid, c) === loIn) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const STEP = 9; // X+Y=c every 9 px → a perpendicular gap of ~6.4 px
  const DX = 0.5;
  let top = Infinity, bottom = -Infinity;
  for (let X = X0; X <= X1; X += DX) {
    const [t, b] = edges(X);
    if (Number.isFinite(t)) top = Math.min(top, t);
    if (Number.isFinite(b)) bottom = Math.max(bottom, b);
  }
  if (!Number.isFinite(top) || !Number.isFinite(bottom)) return '';
  const segs: string[] = [];
  for (let c = Math.ceil((X0 + top) / STEP) * STEP; c <= X1 + bottom; c += STEP) {
    let start: number | null = null;
    let prev = X0;
    let prevIn = inside(X0, c);
    if (prevIn) start = X0;
    for (let X = X0 + DX; X <= X1 + 1e-9; X += DX) {
      const now = inside(X, c);
      if (now !== prevIn) {
        const at = edge(prev, X, c);
        if (now) start = at;
        else if (start !== null) {
          if (at - start > 1) segs.push(`M${R(start)},${R(c - start)}L${R(at)},${R(c - at)}`);
          start = null;
        }
      }
      prev = X;
      prevIn = now;
    }
    if (prevIn && start !== null && prev - start > 1) segs.push(`M${R(start)},${R(c - start)}L${R(prev)},${R(c - prev)}`);
  }
  return segs.join('');
}

// SVG is XML: a bare `<` in a label ("f'(x) < 0") makes the document
// unparseable. HTML's lenient parser hides it in the browser, so it only
// surfaces in a real XML consumer — escape at the single point of emission.
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderPlot(fig: Fig): string {
  const m = mapper(fig);
  const L: string[] = [];
  const yAxisX = m.x0 <= 0 && 0 <= m.x1 ? m.sx(0) : null;
  const xAxisY = m.y0 <= 0 && 0 <= m.y1 ? m.sy(0) : null;
  const halo = fig.halo ? ` stroke="${CANVAS}" stroke-width="3" stroke-linejoin="round" paint-order="stroke"` : '';

  // shading sits under everything
  for (const s of fig.shade ?? []) {
    L.push(
      `<path d="${shadePath(fig, s, m)}" fill="${s.color ?? EMERALD}" opacity="${s.opacity ?? 0.16}"/>`,
    );
    if (s.hatch) {
      L.push(`<path d="${hatchPath(s, m)}" fill="none" stroke="${s.color ?? EMERALD}" stroke-width="1.1" opacity="0.7"/>`);
    }
  }
  // axes
  if (xAxisY !== null) {
    L.push(`<line x1="${m.sx(m.x0)}" y1="${xAxisY}" x2="${m.sx(m.x1)}" y2="${xAxisY}" stroke="${INK}" stroke-width="1.5"/>`);
    L.push(`<text x="${m.sx(m.x1)}" y="${R(xAxisY - 7)}" font-size="11" fill="${LABEL}" text-anchor="end">${fig.xLabel ?? 'x'}</text>`);
  }
  if (yAxisX !== null) {
    L.push(`<line x1="${yAxisX}" y1="${m.sy(m.y1)}" x2="${yAxisX}" y2="${m.sy(m.y0)}" stroke="${INK}" stroke-width="1.5"/>`);
    L.push(`<text x="${R(yAxisX + 7)}" y="${R(m.sy(m.y1) + 10)}" font-size="11" fill="${LABEL}">${fig.yLabel ?? 'y'}</text>`);
  }
  // ticks
  // A tick at the same x as a vertical asymptote gets the dashed line drawn
  // straight through its label. The asymptote's own label already names that x.
  const asymX = (fig.vAsym ?? []).map((a) => m.sx(a.x));
  for (const t of fig.xTicks ?? []) {
    const X = m.sx(t.x);
    if (asymX.some((ax) => Math.abs(ax - X) < 8)) continue;
    if (xAxisY !== null) L.push(`<line x1="${X}" y1="${R(xAxisY - 3)}" x2="${X}" y2="${R(xAxisY + 3)}" stroke="${INK}" stroke-width="1.2"/>`);
    L.push(`<text x="${X}" y="${R((xAxisY ?? m.sy(m.y0)) + (t.above ? -6 : 15))}" font-size="10.5" fill="${LABEL}" text-anchor="middle"${halo}>${t.label}</text>`);
  }
  for (const t of fig.yTicks ?? []) {
    const Y = m.sy(t.y);
    if (yAxisX !== null) L.push(`<line x1="${R(yAxisX - 3)}" y1="${Y}" x2="${R(yAxisX + 3)}" y2="${Y}" stroke="${INK}" stroke-width="1.2"/>`);
    L.push(`<text x="${R((yAxisX ?? m.sx(m.x0)) - 6)}" y="${R(Y + 3.5)}" font-size="10.5" fill="${LABEL}" text-anchor="end"${halo}>${t.label}</text>`);
  }
  // asymptotes, dashed
  for (const a of fig.vAsym ?? []) {
    const X = m.sx(a.x);
    L.push(`<line x1="${X}" y1="${m.sy(m.y1)}" x2="${X}" y2="${m.sy(m.y0)}" stroke="${AMBER}" stroke-width="1.8" stroke-dasharray="6 4"/>`);
    // A vertical asymptote AT x = 0 lies under the y-axis, whose own "y" label
    // occupies the same corner — flip this one to the other side of the line.
    const onYAxis = yAxisX !== null && Math.abs(X - yAxisX) < 12;
    if (a.label)
      L.push(
        `<text x="${R(onYAxis ? X - 5 : X + 5)}" y="${R(m.sy(m.y1) + 11)}" font-size="10.5" fill="${AMBER}" font-weight="bold"${onYAxis ? ' text-anchor="end"' : ''}>${a.label}</text>`,
      );
  }
  for (const a of fig.hAsym ?? []) {
    const Y = m.sy(a.y);
    L.push(`<line x1="${m.sx(m.x0)}" y1="${Y}" x2="${m.sx(m.x1)}" y2="${Y}" stroke="${AMBER}" stroke-width="1.8" stroke-dasharray="6 4"/>`);
    if (a.label) L.push(`<text x="${R(m.sx(m.x0) + 4)}" y="${R(Y - 5)}" font-size="10.5" fill="${AMBER}" font-weight="bold">${a.label}</text>`);
  }
  for (const g of fig.guides ?? []) {
    L.push(
      `<line x1="${m.sx(g.x1)}" y1="${m.sy(g.y1)}" x2="${m.sx(g.x2)}" y2="${m.sy(g.y2)}" stroke="${g.color ?? EMERALD}" stroke-width="2"${g.dashed ? ' stroke-dasharray="5 3"' : ''}/>`,
    );
  }
  // the lines that bound each integral — above the axes, under the curves
  for (const s of fig.shade ?? []) {
    if (!s.bounds) continue;
    const lower = s.lower ?? (() => 0);
    for (const x of [s.from, s.to]) {
      const yu = Math.min(m.y1, Math.max(m.y0, s.upper(x)));
      const yl = Math.min(m.y1, Math.max(m.y0, lower(x)));
      if (!Number.isFinite(yu) || !Number.isFinite(yl) || Math.abs(m.uy(yu) - m.uy(yl)) < 1.5) continue;
      L.push(`<line x1="${m.sx(x)}" y1="${m.sy(yl)}" x2="${m.sx(x)}" y2="${m.sy(yu)}" stroke="${EMERALD_DEEP}" stroke-width="2" stroke-dasharray="5 3"/>`);
    }
  }
  // curves
  for (const c of fig.curves) {
    for (const pts of runs(fig, c, m)) {
      L.push(
        `<polyline points="${pts}" fill="none" stroke="${c.color ?? INDIGO}" stroke-width="${c.width ?? 2.5}" stroke-linejoin="round"${c.dashed ? ' stroke-dasharray="5 3"' : ''}/>`,
      );
    }
  }
  // points
  for (const p of fig.points ?? []) {
    const X = m.sx(p.x), Y = m.sy(p.y);
    const col = p.color ?? EMERALD;
    L.push(
      p.hollow
        ? `<circle cx="${X}" cy="${Y}" r="4.5" fill="#FFFFFF" stroke="${col}" stroke-width="2"/>`
        : `<circle cx="${X}" cy="${Y}" r="4.5" fill="${col}"/>`,
    );
    if (p.label) {
      L.push(`<text x="${R(X + (p.dx ?? 8))}" y="${R(Y + (p.dy ?? -8))}" font-size="10.5" fill="${LABEL}"${halo}>${esc(p.label)}</text>`);
    }
  }
  for (const t of fig.texts ?? []) {
    L.push(
      `<text x="${m.sx(t.x)}" y="${m.sy(t.y)}" font-size="10.5" fill="${t.color ?? LABEL}" text-anchor="${t.anchor ?? 'middle'}"${t.bold ? ' font-weight="bold"' : ''}${halo}>${esc(t.text)}</text>`,
    );
  }
  return '\n' + L.join('\n') + '\n';
}

export const PALETTE = { INK, LABEL, INDIGO, EMERALD, EMERALD_DEEP, AMBER, PINK };
