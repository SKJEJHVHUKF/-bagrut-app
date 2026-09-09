'use client';

// GeoFigure — the geometry sketch printed beside a bagrut question, drawn from
// a ```geo JSON spec (lib/geo-figure.ts). Math coordinates in, a fitted SVG
// out: lines, circles, right-angle squares, angle arcs with their labels, equal
// ticks, parallel chevrons, side lengths, and point names placed away from the
// lines that meet at each point. Accented elements (the two triangles a proof
// compares, an auxiliary segment) are drawn in the app's purple so a solution
// step can show exactly what it is talking about.
//
// Labels are plain text on purpose (12, x, 50°, α) — no KaTeX inside the SVG,
// exactly like the exam sheet.

import { angleAt, circleRadius, names, parseGeo, validateGeo, LAYOUT_ISSUE, type GeoSpec, type Pt } from '@/lib/geo-figure';

const INK = '#1E1B4B';
const LINE = '#334155';
const ACCENT = '#7c3aed';
const FILL = 'rgba(124, 58, 237, 0.06)';
const FILL_ACCENT = 'rgba(124, 58, 237, 0.16)';
const PAD = 34; // ≥ the 32px offset of an `at` label, so one anchored at the bbox edge stays inside
const FONT = 'Heebo, system-ui, sans-serif';

type XY = { x: number; y: number };

/**
 * Round every coordinate before it becomes an SVG attribute.
 *
 * `Math.cos`/`sin`/`hypot` are implementation-defined in ECMAScript, so Node
 * and the browser can disagree in the last ULP. React then sees a different
 * `points` string on the client than the server sent and logs a hydration
 * mismatch (caught in the browser on the angle arcs). Two decimals is far
 * below one screen pixel and makes both sides emit byte-identical markup.
 */
const R = (v: number) => Math.round(v * 100) / 100;

export function GeoFigure({ spec }: { spec: GeoSpec }) {
  const P = spec.points;
  const hidden = new Set(spec.hidden ?? []);
  const circles = (spec.circles ?? []).map((c) => ({ ...c, r: circleRadius(spec, c) })).filter((c) => c.r > 0 && P[c.center]);

  // --- fit: bbox over points and circles → pixel transform -----------------
  const xs: number[] = [], ys: number[] = [];
  for (const [x, y] of Object.values(P)) { xs.push(x); ys.push(y); }
  for (const c of circles) {
    const [x, y] = P[c.center];
    xs.push(x - c.r, x + c.r); ys.push(y - c.r, y + c.r);
  }
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const bw = Math.max(maxX - minX, 1e-6), bh = Math.max(maxY - minY, 1e-6);
  const wantW = spec.width ?? 260;
  let s = (wantW - 2 * PAD) / bw;
  if (bh * s + 2 * PAD > 340) s = (340 - 2 * PAD) / bh;
  const W = Math.round(bw * s + 2 * PAD), H = Math.round(bh * s + 2 * PAD);
  const toXY = (p: Pt): XY => ({ x: R(PAD + (p[0] - minX) * s), y: R(PAD + (maxY - p[1]) * s) });
  const pt = (n: string): XY => toXY(P[n]);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;

  // --- neighbours per point, for label placement ---------------------------
  const nb = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    if (!P[a] || !P[b]) return;
    nb.set(a, [...(nb.get(a) ?? []), b]);
    nb.set(b, [...(nb.get(b) ?? []), a]);
  };
  for (const sg of spec.segments ?? []) { const ns = names(typeof sg === 'string' ? sg : sg.s); if (ns.length === 2) link(ns[0], ns[1]); }
  for (const pg of spec.polygons ?? []) { const ns = names(typeof pg === 'string' ? pg : pg.s); ns.forEach((n, i) => link(n, ns[(i + 1) % ns.length])); }
  for (const c of circles) for (const n of c.on ?? []) link(n, c.center);

  /** unit vector (math coords) pointing to empty space around a point */
  const labelDir = (n: string): Pt => {
    const p = P[n];
    let sx = 0, sy = 0;
    for (const m of nb.get(n) ?? []) {
      const q = P[m], d = Math.sqrt((q[0]-p[0])**2 + (q[1]-p[1])**2) || 1;
      sx += (q[0] - p[0]) / d; sy += (q[1] - p[1]) / d;
    }
    let len = Math.sqrt(sx * sx + sy * sy);
    if (len < 0.35) { sx = p[0] - cx; sy = p[1] - cy; len = Math.sqrt(sx * sx + sy * sy); if (len < 1e-9) return [0, 1]; return [sx / len, sy / len]; }
    return [-sx / len, -sy / len];
  };
  const unit = (a: XY, b: XY): XY => { const d = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2) || 1; return { x: (b.x - a.x) / d, y: (b.y - a.y) / d }; };

  /**
   * Where each angle LABEL will be drawn, in the same geometry the angles block
   * below uses. A point's letter radiates from the same vertex, and at a
   * crossing (four neighbours summing to ~0) labelDir falls back to "away from
   * the figure centre" — which can aim the letter straight through the angle
   * label, so O and "126°" printed as one smudge.
   */
  const angleLabelDirs = new Map<string, Pt[]>();
  const byVertex = new Map<string, { i: number; mid: number; at: string; text: string; n: number; base: number }[]>();
  (spec.angles ?? []).forEach((an, i) => {
    if (!an.label || !P[an.at] || !P[an.from] || !P[an.to]) return;
    const v = P[an.at], a = P[an.from], b = P[an.to];
    const ta = Math.atan2(a[1] - v[1], a[0] - v[0]), tb = Math.atan2(b[1] - v[1], b[0] - v[0]);
    let d = tb - ta;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d <= -Math.PI) d += 2 * Math.PI;
    const mid = ta + d / 2;
    angleLabelDirs.set(an.at, [...(angleLabelDirs.get(an.at) ?? []), [Math.cos(mid), Math.sin(mid)]]);
    byVertex.set(an.at, [...(byVertex.get(an.at) ?? []), {
      i, mid, at: an.at, text: an.label,
      n: Math.max(1, Math.min(3, Math.round(an.n ?? 1))),
      base: angleAt(v, a, b) < 20 ? 22 : 15,
    }]);
  });
  /**
   * Extra radius per angle label, so two labels sharing a vertex do not print
   * on one another. Both sit on their own bisector at the same distance, so
   * "45°" and "45°" at a right angle landed 20px apart and merged; pushing the
   * second one further out separates them without moving either off its arc.
   */
  const labelBump = new Map<number, number>();
  for (const group of byVertex.values()) {
    // Compare the label BOXES, not the angle between them: "4x+10" and
    // "2x+20" sat 90° apart — far past any angular threshold — and still
    // overlapped, because each is ~39px wide at a 27px radius.
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    for (const g of [...group].sort((x, y) => x.mid - y.mid)) {
      const v = pt(g.at);
      const w = 0.62 * 12 * g.text.length + 5, h = 17;
      let bump = 0;
      for (;;) {
        const lr = g.base + 4 * (g.n - 1) + 12 + bump;
        const x = v.x + Math.cos(g.mid) * lr, y = v.y - Math.sin(g.mid) * lr;
        const hits = placed.some((q) =>
          Math.abs(x - q.x) < (w + q.w) / 2 && Math.abs(y - q.y) < (h + q.h) / 2);
        if (!hits || bump > 60) {
          placed.push({ x, y, w, h });
          if (bump) labelBump.set(g.i, bump);
          break;
        }
        bump += 12;
      }
    }
  }
  const COS55 = Math.cos((55 * Math.PI) / 180);
  /**
   * labelDir, nudged off any angle label sharing this vertex — and off any
   * length label that would land on the letter. `segLabelApprox` is the
   * midpoint anchor plus the sideways step: it does NOT depend on pointDir, so
   * consulting it here introduces no circularity, while the exact position
   * (which does depend on pointDir) is settled later.
   */
  const pointDir = (n: string): Pt => {
    const base = labelDir(n);
    const away = angleLabelDirs.get(n);
    const near = segLabelApprox.filter((q) => Math.hypot(q.x - pt(n).x, q.y - pt(n).y) < 34);
    if (!away?.length && !near.length) return base;
    const at13 = (d: Pt) => { const o = pt(n); return { x: o.x + d[0] * 13, y: o.y - d[1] * 13 }; };
    const clear = (d: Pt) =>
      (away ?? []).every((w) => d[0] * w[0] + d[1] * w[1] < COS55) &&
      near.every((q) => { const p2 = at13(d); return Math.hypot(p2.x - q.x, p2.y - q.y) > 16; });
    if (clear(base)) return base;
    const p = P[n];
    const edges = (nb.get(n) ?? []).map((m) => {
      const q = P[m], L = Math.sqrt((q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2) || 1;
      return [(q[0] - p[0]) / L, (q[1] - p[1]) / L] as Pt;
    });
    // Score, never filter: a crossing ringed by four angle labels has no
    // direction 55° clear of all of them, and a hard filter there selects
    // nothing and leaves the letter exactly where it collided. Farthest-
    // available always beats giving up.
    let best = base, bestScore = -Infinity;
    for (let k = 0; k < 24; k++) {
      const th = (k / 24) * 2 * Math.PI;
      const cand: Pt = [Math.cos(th), Math.sin(th)];
      const off = (away ?? []).length
        ? Math.min(...(away ?? []).map((w) => 1 - (cand[0] * w[0] + cand[1] * w[1])))
        : 2;
      const lab = near.length
        ? Math.min(...near.map((q) => { const p2 = at13(cand); return Math.hypot(p2.x - q.x, p2.y - q.y); })) / 16
        : 2;
      const gap = edges.length ? Math.min(...edges.map((e) => 1 - (cand[0] * e[0] + cand[1] * e[1]))) : 1;
      const score = Math.min(off, lab) + 0.25 * gap; // clearing labels dominates; edges break ties
      if (score > bestScore) { bestScore = score; best = cand; }
    }
    return best;
  };

  const segs = (spec.segments ?? []).map((sg) => (typeof sg === 'string' ? { s: sg } : sg));
  const polys = (spec.polygons ?? []).map((pg) => (typeof pg === 'string' ? { s: pg } : pg));
  /** Approximate landing spot of each length label — no pointDir involved. */
  const segLabelApprox = (spec.labels ?? []).flatMap((l) => {
    if (!l.on) return [];
    const ns = names(l.on);
    if (ns.length !== 2 || !P[ns[0]] || !P[ns[1]]) return [];
    const A = P[ns[0]], B = P[ns[1]];
    const mid: Pt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    let nx = -(B[1] - A[1]), ny = B[0] - A[0];
    const nl = Math.sqrt(nx * nx + ny * ny) || 1; nx /= nl; ny /= nl;
    const owner = polys
      .map((pg) => names(pg.s).filter((n) => P[n]))
      .find((vs) => {
        const i = vs.indexOf(ns[0]), j = vs.indexOf(ns[1]);
        return i >= 0 && j >= 0 && (Math.abs(i - j) === 1 || Math.abs(i - j) === vs.length - 1);
      });
    let flip: boolean;
    if (owner?.length) {
      const gx = owner.reduce((t, n) => t + P[n][0], 0) / owner.length;
      const gy = owner.reduce((t, n) => t + P[n][1], 0) / owner.length;
      flip = nx * (gx - mid[0]) + ny * (gy - mid[1]) > 0;
    } else {
      let pos = 0, neg = 0;
      for (const [n, q] of Object.entries(P)) {
        if (n === ns[0] || n === ns[1]) continue;
        const side = nx * (q[0] - mid[0]) + ny * (q[1] - mid[1]);
        if (side > 1e-9) pos++; else if (side < -1e-9) neg++;
      }
      flip = pos !== neg ? pos > neg : nx * (mid[0] - cx) + ny * (mid[1] - cy) < 0;
    }
    if (flip) { nx = -nx; ny = -ny; }
    const c = toXY(mid);
    return [{ x: c.x + nx * 12, y: c.y - ny * 12 }];
  });

  /**
   * Final position of every length label, placed SEQUENTIALLY so each one also
   * avoids the labels already placed. Placing them independently is what put
   * "5" on "24" and "12" on "16": each was individually clear of every point
   * letter, and neither could see the other.
   */
  const labelPlan = new Map<number, XY>();
  {
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    (spec.labels ?? []).forEach((l, i) => {
      if (!l.on) return;
      const ns = names(l.on);
      if (ns.length !== 2 || !P[ns[0]] || !P[ns[1]]) return;
      const A = P[ns[0]], B = P[ns[1]];
      const at = (t: number): Pt => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
      // A tick is pinned to the segment's midpoint and cannot move, so a label
      // on a ticked segment steps off by the tick's half-width plus its own.
      const tickN = (spec.ticks ?? [])
        .filter((t) => { const tn = names(t.on); return tn.length === 2 && tn.includes(ns[0]) && tn.includes(ns[1]); })
        .reduce((n, t) => Math.max(n, Math.max(1, Math.min(3, Math.round(t.n)))), 0);
      const segPx = Math.sqrt((B[0] - A[0]) ** 2 + (B[1] - A[1]) ** 2) * s;
      const step = tickN
        ? Math.min(0.34, ((tickN - 1) * 2.5 + 4.5 + 0.31 * 12.5 * l.text.length + 3) / Math.max(segPx, 1))
        : 0;
      const cands = step ? [0.5 - step, 0.5 + step] : [0.5, 0.35, 0.65, 0.28, 0.72];
      const mid0 = at(0.5);
      let nx = -(B[1] - A[1]), ny = B[0] - A[0];
      const nl = Math.sqrt(nx * nx + ny * ny) || 1; nx /= nl; ny /= nl;
      // Put the length OUTSIDE the shape the segment belongs to. When the
      // segment is a polygon edge, that polygon's centroid settles it exactly.
      // A head-count over every point in the figure gets this backwards as soon
      // as a second shape stands nearby: in a two-triangle congruence figure
      // ABC's three vertices outvoted F and pushed DE's "5" inside DEF.
      const owner = polys
        .map((pg) => names(pg.s).filter((n) => P[n]))
        .find((vs) => {
          const a = vs.indexOf(ns[0]), b = vs.indexOf(ns[1]);
          return a >= 0 && b >= 0 && (Math.abs(a - b) === 1 || Math.abs(a - b) === vs.length - 1);
        });
      let flip: boolean;
      if (owner?.length) {
        const gx = owner.reduce((t, n) => t + P[n][0], 0) / owner.length;
        const gy = owner.reduce((t, n) => t + P[n][1], 0) / owner.length;
        flip = nx * (gx - mid0[0]) + ny * (gy - mid0[1]) > 0; // centroid on +n → label to −n
      } else {
        let pos = 0, neg = 0;
        for (const [n, q] of Object.entries(P)) {
          if (n === ns[0] || n === ns[1]) continue;
          const side = nx * (q[0] - mid0[0]) + ny * (q[1] - mid0[1]);
          if (side > 1e-9) pos++; else if (side < -1e-9) neg++;
        }
        flip = pos !== neg ? pos > neg : nx * (mid0[0] - cx) + ny * (mid0[1] - cy) < 0;
      }
      if (flip) { nx = -nx; ny = -ny; }
      // Glyph BOX, not a circle: two labels 20px apart but stacked vertically
      // still overlap, and a radius model scored that as clear.
      const wSelf = 0.62 * 12.5 * l.text.length + 5, hSelf = 17.5;
      // Clearance is measured where the label ACTUALLY lands — after the 12px
      // sideways step — against every point's LETTER (this segment's own
      // endpoints included: a letter sits 13px out from its dot, so on a short
      // segment it is nearer the label than the dot ever was) and against the
      // labels already placed.
      const clear = (p: Pt) => {
        const c = toXY(p), lx = c.x + nx * 12, ly = c.y - ny * 12;
        const toLetters = Object.keys(P).filter((n) => !hidden.has(n)).reduce((d, n) => {
          const lp = pt(n), ld = pointDir(n);
          return Math.min(d, Math.hypot(lx - (lp.x + ld[0] * 13), ly - (lp.y - ld[1] * 13)));
        }, Infinity);
        const toLabels = placed.length
          ? Math.min(...placed.map((q) => Math.max(
              Math.abs(lx - q.x) - (wSelf + q.w) / 2,
              Math.abs(ly - q.y) - (hSelf + q.h) / 2,
            ))) + 16
          : Infinity;
        return Math.min(toLetters, toLabels);
      };
      const pts = cands.map(at);
      const m = pts.find((q) => clear(q) > 18)
        ?? pts.reduce((best, q) => (clear(q) > clear(best) ? q : best), pts[0]);
      const c = toXY(m);
      const final = { x: c.x + nx * 12, y: c.y - ny * 12 };
      labelPlan.set(i, final);
      placed.push({ ...final, w: wSelf, h: hSelf });
    });
  }

  return (
    <div className="my-2 flex justify-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%', height: 'auto' }} role="img" aria-label="סרטוט">
        {polys.map((pg, i) => {
          const ns = names(pg.s).filter((n) => P[n]);
          return <polygon key={`pg${i}`} points={ns.map((n) => { const q = pt(n); return `${R(q.x)},${R(q.y)}`; }).join(' ')} fill={pg.accent ? FILL_ACCENT : FILL} stroke={pg.accent ? ACCENT : LINE} strokeWidth={pg.accent ? 2.2 : 1.8} strokeLinejoin="round" />;
        })}
        {circles.map((c, i) => {
          const o = pt(c.center);
          return <circle key={`c${i}`} cx={R(o.x)} cy={R(o.y)} r={R(c.r * s)} fill="none" stroke={c.accent ? ACCENT : LINE} strokeWidth={c.accent ? 2.2 : 1.8} strokeDasharray={c.dashed ? '5,4' : undefined} />;
        })}
        {segs.map((sg, i) => {
          const ns = names(sg.s);
          if (ns.length !== 2 || !P[ns[0]] || !P[ns[1]]) return null;
          const a = pt(ns[0]), b = pt(ns[1]);
          return <line key={`s${i}`} x1={R(a.x)} y1={R(a.y)} x2={R(b.x)} y2={R(b.y)} stroke={sg.accent ? ACCENT : LINE} strokeWidth={sg.accent ? 2.4 : 1.8} strokeDasharray={sg.dashed ? '5,4' : undefined} strokeLinecap="round" />;
        })}

        {(spec.ticks ?? []).map((t, i) => {
          const ns = names(t.on);
          if (ns.length !== 2 || !P[ns[0]] || !P[ns[1]]) return null;
          const a = pt(ns[0]), b = pt(ns[1]), u = unit(a, b), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const n = Math.max(1, Math.min(3, Math.round(t.n)));
          return Array.from({ length: n }, (_, k) => {
            const off = (k - (n - 1) / 2) * 5, c = { x: m.x + u.x * off, y: m.y + u.y * off };
            return <line key={`t${i}-${k}`} x1={R(c.x + u.y * 4.5)} y1={R(c.y - u.x * 4.5)} x2={R(c.x - u.y * 4.5)} y2={R(c.y + u.x * 4.5)} stroke={INK} strokeWidth={1.8} />;
          });
        })}
        {(spec.parallel ?? []).map((pr, i) => {
          const ns = names(pr.on);
          if (ns.length !== 2 || !P[ns[0]] || !P[ns[1]]) return null;
          const a = pt(ns[0]), b = pt(ns[1]), u = unit(a, b), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const n = Math.max(1, Math.min(3, Math.round(pr.n ?? 1)));
          return Array.from({ length: n }, (_, k) => {
            const off = (k - (n - 1) / 2) * 5, tip = { x: m.x + u.x * (off + 3), y: m.y + u.y * (off + 3) };
            const l = { x: tip.x - u.x * 6 + u.y * 4.5, y: tip.y - u.y * 6 - u.x * 4.5 };
            const r = { x: tip.x - u.x * 6 - u.y * 4.5, y: tip.y - u.y * 6 + u.x * 4.5 };
            return <polyline key={`p${i}-${k}`} points={`${R(l.x)},${R(l.y)} ${R(tip.x)},${R(tip.y)} ${R(r.x)},${R(r.y)}`} fill="none" stroke={INK} strokeWidth={1.7} strokeLinejoin="round" />;
          });
        })}
        {(spec.right ?? []).map((r, i) => {
          if (!P[r.at] || !P[r.from] || !P[r.to]) return null;
          const v = pt(r.at), ua = unit(v, pt(r.from)), ub = unit(v, pt(r.to)), k = 8;
          const p1 = { x: v.x + ua.x * k, y: v.y + ua.y * k }, p3 = { x: v.x + ub.x * k, y: v.y + ub.y * k };
          const p2 = { x: p1.x + ub.x * k, y: p1.y + ub.y * k };
          return <polyline key={`r${i}`} points={`${R(p1.x)},${R(p1.y)} ${R(p2.x)},${R(p2.y)} ${R(p3.x)},${R(p3.y)}`} fill="none" stroke={LINE} strokeWidth={1.5} />;
        })}
        {(spec.angles ?? []).map((an, i) => {
          if (!P[an.at] || !P[an.from] || !P[an.to]) return null;
          const v = P[an.at], a = P[an.from], b = P[an.to];
          const ta = Math.atan2(a[1] - v[1], a[0] - v[0]), tb = Math.atan2(b[1] - v[1], b[0] - v[0]);
          let d = tb - ta;
          while (d > Math.PI) d -= 2 * Math.PI;
          while (d <= -Math.PI) d += 2 * Math.PI;
          const n = Math.max(1, Math.min(3, Math.round(an.n ?? 1)));
          const vs = pt(an.at), col = an.accent ? ACCENT : INK;
          const arc = (rad: number) => Array.from({ length: 15 }, (_, k) => {
            const t = ta + (d * k) / 14;
            return `${R(vs.x + Math.cos(t) * rad)},${R(vs.y - Math.sin(t) * rad)}`;
          }).join(' ');
          const base = angleAt(v, a, b) < 20 ? 22 : 15;
          const mid = ta + d / 2, lr = base + 4 * (n - 1) + 12 + (labelBump.get(i) ?? 0);
          return (
            <g key={`a${i}`}>
              {Array.from({ length: n }, (_, k) => <polyline key={k} points={arc(base + k * 4)} fill="none" stroke={col} strokeWidth={1.5} />)}
              {an.label && (
                <text x={R(vs.x + Math.cos(mid) * lr)} y={R(vs.y - Math.sin(mid) * lr)} fill={col} fontSize={12} fontFamily={FONT} fontWeight={600} textAnchor="middle" dominantBaseline="middle">{an.label}</text>
              )}
            </g>
          );
        })}

        {(spec.labels ?? []).map((l, i) => {
          const col = l.accent ? ACCENT : INK;
          if (l.on) {
            const q = labelPlan.get(i);
            if (!q) return null;
            return <text key={`l${i}`} x={R(q.x)} y={R(q.y)} fill={col} fontSize={12.5} fontFamily={FONT} fontWeight={600} textAnchor="middle" dominantBaseline="middle">{l.text}</text>;
          }
          if (l.at && P[l.at]) {
            const q = pt(l.at), dir = labelDir(l.at);
            return <text key={`l${i}`} x={R(q.x + dir[0] * 32)} y={R(q.y - dir[1] * 32)} fill={col} fontSize={12.5} fontFamily={FONT} fontWeight={600} textAnchor="middle" dominantBaseline="middle">{l.text}</text>;
          }
          return null;
        })}

        {Object.keys(P).filter((n) => !hidden.has(n)).map((n) => {
          const q = pt(n), dir = pointDir(n);
          return (
            <g key={`pt${n}`}>
              <circle cx={R(q.x)} cy={R(q.y)} r={2.6} fill={INK} />
              <text x={R(q.x + dir[0] * 13)} y={R(q.y - dir[1] * 13)} fill={INK} fontSize={13.5} fontFamily={FONT} fontWeight={700} textAnchor="middle" dominantBaseline="middle">{n}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** JSON-fence entry point used by MathText; a broken spec degrades to a quiet note. */
export function GeoFigureFromJson({ json }: { json: string }) {
  // Parse inside the try, render outside it: JSX is lazy, so <GeoFigure/> only
  // builds an element here and its own render errors were never caught by this
  // catch. Only parseGeo/validateGeo can actually throw.
  let spec: ReturnType<typeof parseGeo> | null = null;
  try {
    const parsed = parseGeo(json);
    // LAYOUT_ISSUE marks a complaint about how the figure LOOKS (a tick under a
    // letter). Those draw fine, so they must never reach this test — matching
    // the message prose alone once blanked 38 working figures, because a new
    // cosmetic rule happened to use the word "needs".
    const fatal = validateGeo(parsed).filter((e) => !e.startsWith(LAYOUT_ISSUE));
    if (!fatal.some((e) => /unknown point|must be|needs|nothing to draw/.test(e))) {
      spec = parsed;
    }
  } catch {
    spec = null;
  }
  if (!spec) {
    return (
      <div dir="rtl" className="my-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
        (הסרטוט אינו זמין)
      </div>
    );
  }
  return <GeoFigure spec={spec} />;
}
