// ============================================================
// fn-figure — a function graph that is DRAWN FROM THE FUNCTION
// ============================================================
//
// A sketch in a solution is a claim: "this is what $f(x) = \dfrac{x+3}{x-2}$
// looks like, its vertical asymptote is $x = 2$, it meets the axes here." The
// only way that claim stays true after an edit is if the picture is generated
// from the function itself and its labelled features are checked against it,
// which is what lib/geo-figure.ts does for geometry and lib/prob-figure.ts for
// probability trees.
//
// A spec names the function as a plain TS callback plus the features the
// solution asserts. `renderFnFigure` samples the callback and returns the SVG
// body (the DiagramSpec `custom` shape: no <svg> wrapper, viewBox '0 0 300 260');
// `checkFnFigure` re-derives every asserted feature numerically and returns the
// disagreements. Neither trusts the author's arithmetic.

export type FnPoint = { x: number; y: number; label?: string; hole?: boolean };

export type FnFigureSpec = {
  /** The function itself. Return null where it is undefined (a hole, a root of
   *  a negative number, division by zero) and the curve breaks there. */
  f: (x: number) => number | null;
  /** Plot window. yMin/yMax may be omitted and are then taken from the samples. */
  xMin: number;
  xMax: number;
  yMin?: number;
  yMax?: number;
  /** Vertical asymptotes: the curve is cut at each, and each is drawn dashed. */
  vAsymptotes?: number[];
  /** Horizontal asymptotes, drawn dashed with their label. */
  hAsymptotes?: number[];
  /** Marked points — intercepts, extrema, a hole (hole: true draws it open). */
  points?: FnPoint[];
  /** Domain edges for a root function: a filled dot and no curve beyond. */
  domainFrom?: number;
  domainTo?: number;
  caption?: string;
};

const W = 300;
const H = 260;
const PAD = { l: 26, r: 16, t: 16, b: 22 };

const EPS = 1e-9;
const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

/** Sample the function, splitting into continuous runs at asymptotes, at holes,
 *  and wherever it leaves the plot window. */
function runs(spec: FnFigureSpec, yMin: number, yMax: number, steps = 240): { x: number; y: number }[][] {
  const cuts = (spec.vAsymptotes ?? []).slice().sort((a, b) => a - b);
  const out: { x: number; y: number }[][] = [];
  let run: { x: number; y: number }[] = [];
  const lo = spec.domainFrom ?? spec.xMin;
  const hi = spec.domainTo ?? spec.xMax;
  const dx = (hi - lo) / steps;
  for (let i = 0; i <= steps; i++) {
    const x = lo + i * dx;
    const onCut = cuts.some((c) => Math.abs(x - c) < dx * 0.75);
    const y = onCut ? null : spec.f(x);
    if (y === null || !Number.isFinite(y) || y < yMin || y > yMax) {
      if (run.length > 1) out.push(run);
      run = [];
      continue;
    }
    run.push({ x, y });
  }
  if (run.length > 1) out.push(run);
  return out;
}

function autoY(spec: FnFigureSpec): [number, number] {
  if (spec.yMin != null && spec.yMax != null) return [spec.yMin, spec.yMax];
  const ys: number[] = [];
  const lo = spec.domainFrom ?? spec.xMin;
  const hi = spec.domainTo ?? spec.xMax;
  for (let i = 0; i <= 200; i++) {
    const x = lo + ((hi - lo) * i) / 200;
    if ((spec.vAsymptotes ?? []).some((c) => Math.abs(x - c) < 0.15)) continue;
    const y = spec.f(x);
    if (y !== null && Number.isFinite(y) && Math.abs(y) < 50) ys.push(y);
  }
  for (const p of spec.points ?? []) ys.push(p.y);
  for (const h of spec.hAsymptotes ?? []) ys.push(h);
  const min = Math.min(...ys, 0);
  const max = Math.max(...ys, 0);
  const pad = Math.max(1, (max - min) * 0.15);
  return [spec.yMin ?? min - pad, spec.yMax ?? max + pad];
}

export function renderFnFigure(spec: FnFigureSpec): string {
  const [yMin, yMax] = autoY(spec);
  const sx = (x: number) => PAD.l + ((x - spec.xMin) / (spec.xMax - spec.xMin)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - ((y - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const n = (v: number) => Number(v.toFixed(1));
  const parts: string[] = [];

  const y0 = sy(0);
  const x0 = sx(0);
  parts.push(`<line x1="${PAD.l}" y1="${n(y0)}" x2="${W - PAD.r}" y2="${n(y0)}" stroke="rgba(51,65,85,.85)" stroke-width="1.5"/>`);
  parts.push(`<text x="${W - PAD.r}" y="${n(y0 - 7)}" font-size="11" fill="#0F172A" text-anchor="end">x</text>`);
  if (x0 > PAD.l && x0 < W - PAD.r) {
    parts.push(`<line x1="${n(x0)}" y1="${PAD.t}" x2="${n(x0)}" y2="${H - PAD.b}" stroke="rgba(51,65,85,.85)" stroke-width="1.5"/>`);
    parts.push(`<text x="${n(x0 + 7)}" y="${PAD.t + 10}" font-size="11" fill="#0F172A">y</text>`);
  }

  // Numbered ticks, so the reader can tell a bump from a spike: without a scale
  // a graph is a shape, not a claim about sizes. At most ~9 per axis.
  const tickStep = (lo: number, hi: number) => {
    const raw = (hi - lo) / 9;
    for (const s of [0.5, 1, 2, 5, 10, 20, 50, 100]) if (s >= raw) return s;
    return Math.ceil(raw);
  };
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  // A point sitting ON an axis already prints its coordinates there, so its tick
  // number would be drawn on top of them.
  const onXAxis = (spec.points ?? []).filter((p) => Math.abs(p.y) < 1e-9 && p.label).map((p) => p.x);
  const onYAxis = (spec.points ?? []).filter((p) => Math.abs(p.x) < 1e-9 && p.label).map((p) => p.y);
  const stepX = tickStep(spec.xMin, spec.xMax);
  for (let t = Math.ceil(spec.xMin / stepX) * stepX; t <= spec.xMax + 1e-9; t += stepX) {
    if (Math.abs(t) < 1e-9) continue;
    if (onXAxis.some((px) => Math.abs(sx(px) - sx(t)) < 20)) continue;
    parts.push(`<line x1="${n(sx(t))}" y1="${n(y0 - 3)}" x2="${n(sx(t))}" y2="${n(y0 + 3)}" stroke="rgba(51,65,85,.85)" stroke-width="1.2"/>`);
    parts.push(`<text x="${n(sx(t))}" y="${n(y0 + 15)}" font-size="10" fill="#0F172A" text-anchor="middle">${fmt(t)}</text>`);
  }
  if (x0 > PAD.l && x0 < W - PAD.r) {
    const stepY = tickStep(yMin, yMax);
    for (let t = Math.ceil(yMin / stepY) * stepY; t <= yMax + 1e-9; t += stepY) {
      if (Math.abs(t) < 1e-9) continue;
      if (onYAxis.some((py) => Math.abs(sy(py) - sy(t)) < 12)) continue;
      parts.push(`<line x1="${n(x0 - 3)}" y1="${n(sy(t))}" x2="${n(x0 + 3)}" y2="${n(sy(t))}" stroke="rgba(51,65,85,.85)" stroke-width="1.2"/>`);
      parts.push(`<text x="${n(x0 - 6)}" y="${n(sy(t) + 3.5)}" font-size="10" fill="#0F172A" text-anchor="end">${fmt(t)}</text>`);
    }
  }

  for (const a of spec.vAsymptotes ?? []) {
    parts.push(`<line x1="${n(sx(a))}" y1="${PAD.t}" x2="${n(sx(a))}" y2="${H - PAD.b}" stroke="#B45309" stroke-width="1.8" stroke-dasharray="6 4"/>`);
    // An asymptote close to the y-axis would print its label on top of the "y",
    // so drop it a line. Seen on the contact sheet, not by any check.
    // Compare the label's own RIGHT EDGE with the axis letter, not the
    // asymptote's distance: "x = -2" is six characters wide and reached the "y"
    // from 29px away, which the distance test let through.
    const labelW = `x = ${a}`.length * 5.5;
    const clash = sx(a) + 5 < x0 + 12 && sx(a) + 5 + labelW > x0 - 4;
    parts.push(`<text x="${n(sx(a) + 5)}" y="${PAD.t + (clash ? 25 : 11)}" font-size="10.5" fill="#B45309" font-weight="bold">x = ${a}</text>`);
  }
  for (const a of spec.hAsymptotes ?? []) {
    parts.push(`<line x1="${PAD.l}" y1="${n(sy(a))}" x2="${W - PAD.r}" y2="${n(sy(a))}" stroke="#B45309" stroke-width="1.8" stroke-dasharray="6 4"/>`);
    // Right edge, where the curve has flattened onto it — unless the asymptote
    // runs close to the x-axis, whose own "x" label lives in that corner.
    const nearAxis = Math.abs(sy(a) - y0) < 18;
    parts.push(
      nearAxis
        ? `<text x="${PAD.l + 2}" y="${n(sy(a) - 5)}" font-size="10.5" fill="#B45309" font-weight="bold">y = ${a}</text>`
        : `<text x="${W - PAD.r - 2}" y="${n(sy(a) - 5)}" font-size="10.5" fill="#B45309" font-weight="bold" text-anchor="end">y = ${a}</text>`,
    );
  }

  for (const r of runs(spec, yMin, yMax)) {
    const pts = r.map((p) => `${n(sx(p.x))},${n(sy(p.y))}`).join(' ');
    parts.push(`<polyline points="${pts}" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linejoin="round"/>`);
  }

  // Labels are placed alternately above and below so two nearby points do not
  // print on top of each other — the failure a passing check could not see.
  let flip = false;
  for (const p of spec.points ?? []) {
    const cx = n(sx(p.x));
    const cy = n(sy(p.y));
    parts.push(
      p.hole
        ? `<circle cx="${cx}" cy="${cy}" r="4" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2"/>`
        : `<circle cx="${cx}" cy="${cy}" r="4" fill="#4F46E5"/>`,
    );
    if (p.label) {
      flip = !flip;
      if (Math.abs(p.x) < 1e-9) {
        // A y-intercept: put the label BESIDE the point, or the vertical axis
        // and its tick numbers run straight through it.
        parts.push(`<text x="${n(sx(p.x) + 7)}" y="${n(cy + 4)}" font-size="10.5" fill="#0F172A" text-anchor="start">${p.label}</text>`);
      } else {
        // Keep a label off the "y" that sits at the top of the vertical axis.
        const topClash = Math.abs(cx - x0) < 24 && cy - 9 < PAD.t + 16;
        parts.push(`<text x="${cx}" y="${n(topClash ? cy + 17 : flip ? cy - 9 : cy + 17)}" font-size="10.5" fill="#0F172A" text-anchor="middle">${p.label}</text>`);
      }
    }
  }
  return `\n${parts.join('\n')}\n`;
}

/** Re-derive every asserted feature from the function. Returns the mismatches. */
export function checkFnFigure(spec: FnFigureSpec): string[] {
  const out: string[] = [];

  for (const a of spec.vAsymptotes ?? []) {
    const l = spec.f(a - 1e-4);
    const r = spec.f(a + 1e-4);
    const blows = (v: number | null) => v === null || !Number.isFinite(v) || Math.abs(v) > 1e3;
    if (!blows(l) && !blows(r)) out.push(`fn-figure: x = ${a} is drawn as a vertical asymptote but the function stays finite on both sides`);
    if (spec.f(a) !== null && Number.isFinite(spec.f(a) as number)) out.push(`fn-figure: the function is defined at x = ${a}, so it is not a vertical asymptote`);
  }

  for (const a of spec.hAsymptotes ?? []) {
    const far = [1e4, 1e5].map((x) => spec.f(spec.xMax > 0 ? x : -x)).filter((v): v is number => v !== null && Number.isFinite(v));
    if (!far.length) out.push(`fn-figure: y = ${a} is drawn as a horizontal asymptote but the function has no value far out`);
    else if (!near(far[far.length - 1], a, 1e-2)) out.push(`fn-figure: y = ${a} is drawn as a horizontal asymptote but the function tends to ${far[far.length - 1].toFixed(3)}`);
  }

  for (const p of spec.points ?? []) {
    if (p.hole) {
      if (spec.f(p.x) !== null) out.push(`fn-figure: (${p.x}, ${p.y}) is drawn as a hole but the function has a value there`);
      continue;
    }
    const y = spec.f(p.x);
    if (y === null || !Number.isFinite(y)) {
      out.push(`fn-figure: the point (${p.x}, ${p.y}) is marked but the function is undefined at x = ${p.x}`);
    } else if (!near(y, p.y, 1e-3)) {
      out.push(`fn-figure: the point (${p.x}, ${p.y}) is marked but the function gives ${y.toFixed(4)} there`);
    }
  }

  if (spec.domainFrom != null && spec.f(spec.domainFrom - 0.05) !== null) {
    out.push(`fn-figure: the domain is drawn as starting at x = ${spec.domainFrom} but the function is defined to its left`);
  }
  if (spec.domainTo != null && spec.f(spec.domainTo + 0.05) !== null) {
    out.push(`fn-figure: the domain is drawn as ending at x = ${spec.domainTo} but the function is defined to its right`);
  }

  const [yMin, yMax] = autoY(spec);
  if (!runs(spec, yMin, yMax).length) out.push('fn-figure: nothing to draw — every sample falls outside the window');
  if (spec.xMin >= spec.xMax) out.push('fn-figure: xMin is not below xMax');
  void EPS;
  return out;
}

/** Both at once: the SVG, refusing to render a figure whose labels are wrong. */
export function fnFigure(spec: FnFigureSpec): { svg: string; errors: string[] } {
  const errors = checkFnFigure(spec);
  return { svg: errors.length ? '' : renderFnFigure(spec), errors };
}
