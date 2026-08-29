// ============================================================
// Authoring-time SVG generator for the מנה ושורש figures
// ============================================================
//
// WHY THIS EXISTS. Content diagrams must be `type:'custom'` raw SVG — a `fn:`
// closure breaks the RSC server→client boundary (CLAUDE.md), so the renderer's
// own functionGraph is unusable from content. That leaves hand-written
// coordinates, which is how a graph ends up claiming a root the curve does not
// pass through. So the coordinates are COMPUTED here from the real function,
// once, and the emitted string is pasted into the lesson.
//
// It samples densely, splits a polyline at a pole or at the edge of the window
// instead of drawing a vertical streak through it, and rounds every emitted
// number to 2 decimals.
//
// Palette is the app's dark-ink-on-light one; light-on-dark values are
// invisible on the ivory canvas.
//
// Run: npx tsx scripts/_gen-rq-figures.ts          (prints every figure)
//      npx tsx scripts/_gen-rq-figures.ts <id>     (prints one)

const INK = 'rgba(51,65,85,.85)';
const LABEL = '#0F172A';
const INDIGO = '#4F46E5';
const EMERALD = '#059669';
const AMBER = '#B45309';
const PINK = '#DB2777';

type Curve = {
  f: (x: number) => number;
  from?: number;
  to?: number;
  color?: string;
  dashed?: boolean;
  width?: number;
};

type Shade = {
  from: number;
  to: number;
  upper: (x: number) => number;
  /** Defaults to the x-axis. */
  lower?: (x: number) => number;
  color?: string;
  opacity?: number;
};

type Fig = {
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
  xTicks?: { x: number; label: string }[];
  yTicks?: { y: number; label: string }[];
  xLabel?: string;
  yLabel?: string;
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
  const sx = (x: number) => R(ML + ((x - x0) / (x1 - x0)) * (w - ML - MR));
  const sy = (y: number) => R(h - MB - ((y - y0) / (y1 - y0)) * (h - MT - MB));
  return { w, h, x0, x1, y0, y1, sx, sy };
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

export function render(fig: Fig): string {
  const m = mapper(fig);
  const L: string[] = [];
  const yAxisX = m.x0 <= 0 && 0 <= m.x1 ? m.sx(0) : null;
  const xAxisY = m.y0 <= 0 && 0 <= m.y1 ? m.sy(0) : null;

  // shading sits under everything
  for (const s of fig.shade ?? []) {
    L.push(
      `<path d="${shadePath(fig, s, m)}" fill="${s.color ?? EMERALD}" opacity="${s.opacity ?? 0.16}"/>`,
    );
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
  for (const t of fig.xTicks ?? []) {
    const X = m.sx(t.x);
    if (xAxisY !== null) L.push(`<line x1="${X}" y1="${R(xAxisY - 3)}" x2="${X}" y2="${R(xAxisY + 3)}" stroke="${INK}" stroke-width="1.2"/>`);
    L.push(`<text x="${X}" y="${R((xAxisY ?? m.sy(m.y0)) + 15)}" font-size="10.5" fill="${LABEL}" text-anchor="middle">${t.label}</text>`);
  }
  for (const t of fig.yTicks ?? []) {
    const Y = m.sy(t.y);
    if (yAxisX !== null) L.push(`<line x1="${R(yAxisX - 3)}" y1="${Y}" x2="${R(yAxisX + 3)}" y2="${Y}" stroke="${INK}" stroke-width="1.2"/>`);
    L.push(`<text x="${R((yAxisX ?? m.sx(m.x0)) - 6)}" y="${R(Y + 3.5)}" font-size="10.5" fill="${LABEL}" text-anchor="end">${t.label}</text>`);
  }
  // asymptotes, dashed
  for (const a of fig.vAsym ?? []) {
    const X = m.sx(a.x);
    L.push(`<line x1="${X}" y1="${m.sy(m.y1)}" x2="${X}" y2="${m.sy(m.y0)}" stroke="${AMBER}" stroke-width="1.8" stroke-dasharray="6 4"/>`);
    if (a.label) L.push(`<text x="${R(X + 5)}" y="${R(m.sy(m.y1) + 11)}" font-size="10.5" fill="${AMBER}" font-weight="bold">${a.label}</text>`);
  }
  for (const a of fig.hAsym ?? []) {
    const Y = m.sy(a.y);
    L.push(`<line x1="${m.sx(m.x0)}" y1="${Y}" x2="${m.sx(m.x1)}" y2="${Y}" stroke="${AMBER}" stroke-width="1.8" stroke-dasharray="6 4"/>`);
    if (a.label) L.push(`<text x="${m.sx(m.x1)}" y="${R(Y - 5)}" font-size="10.5" fill="${AMBER}" font-weight="bold" text-anchor="end">${a.label}</text>`);
  }
  for (const g of fig.guides ?? []) {
    L.push(
      `<line x1="${m.sx(g.x1)}" y1="${m.sy(g.y1)}" x2="${m.sx(g.x2)}" y2="${m.sy(g.y2)}" stroke="${g.color ?? EMERALD}" stroke-width="2"${g.dashed ? ' stroke-dasharray="5 3"' : ''}/>`,
    );
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
      L.push(`<text x="${R(X + (p.dx ?? 8))}" y="${R(Y + (p.dy ?? -8))}" font-size="10.5" fill="${LABEL}">${p.label}</text>`);
    }
  }
  for (const t of fig.texts ?? []) {
    L.push(
      `<text x="${m.sx(t.x)}" y="${m.sy(t.y)}" font-size="10.5" fill="${t.color ?? LABEL}" text-anchor="${t.anchor ?? 'middle'}"${t.bold ? ' font-weight="bold"' : ''}>${t.text}</text>`,
    );
  }
  return '\n' + L.join('\n') + '\n';
}

export const PALETTE = { INK, LABEL, INDIGO, EMERALD, AMBER, PINK };
export type { Fig };
