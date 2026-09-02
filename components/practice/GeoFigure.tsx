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

import { angleAt, circleRadius, names, parseGeo, validateGeo, type GeoSpec, type Pt } from '@/lib/geo-figure';

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

  const segs = (spec.segments ?? []).map((sg) => (typeof sg === 'string' ? { s: sg } : sg));
  const polys = (spec.polygons ?? []).map((pg) => (typeof pg === 'string' ? { s: pg } : pg));

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
          const mid = ta + d / 2, lr = base + 4 * (n - 1) + 12;
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
            const ns = names(l.on);
            if (ns.length !== 2 || !P[ns[0]] || !P[ns[1]]) return null;
            const A = P[ns[0]], B = P[ns[1]];
            // Anchor at the midpoint — unless a named point sits there (the
            // crossing of two diagonals): then slide to the emptier third.
            const at = (t: number): Pt => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
            const crowd = (p: Pt) => Object.entries(P).filter(([n]) => n !== ns[0] && n !== ns[1]).reduce((d, [, q]) => Math.min(d, Math.sqrt((q[0]-p[0])**2 + (q[1]-p[1])**2) * s), Infinity);
            const m = [0.5, 0.3, 0.7].map(at).find((p) => crowd(p) > 14) ?? at(0.5);
            let nx = -(B[1] - A[1]), ny = B[0] - A[0];
            const nl = Math.sqrt(nx * nx + ny * ny) || 1; nx /= nl; ny /= nl;
            // Put the length on the emptier side of the segment (outside a
            // triangle, not across its interior); tie → away from the figure.
            let pos = 0, neg = 0;
            for (const [n, q] of Object.entries(P)) {
              if (n === ns[0] || n === ns[1]) continue;
              const side = nx * (q[0] - m[0]) + ny * (q[1] - m[1]);
              if (side > 1e-9) pos++; else if (side < -1e-9) neg++;
            }
            const flip = pos !== neg ? pos > neg : nx * (m[0] - cx) + ny * (m[1] - cy) < 0;
            if (flip) { nx = -nx; ny = -ny; }
            const q = toXY(m);
            return <text key={`l${i}`} x={R(q.x + nx * 12)} y={R(q.y - ny * 12)} fill={col} fontSize={12.5} fontFamily={FONT} fontWeight={600} textAnchor="middle" dominantBaseline="middle">{l.text}</text>;
          }
          if (l.at && P[l.at]) {
            const q = pt(l.at), dir = labelDir(l.at);
            return <text key={`l${i}`} x={R(q.x + dir[0] * 32)} y={R(q.y - dir[1] * 32)} fill={col} fontSize={12.5} fontFamily={FONT} fontWeight={600} textAnchor="middle" dominantBaseline="middle">{l.text}</text>;
          }
          return null;
        })}

        {Object.keys(P).filter((n) => !hidden.has(n)).map((n) => {
          const q = pt(n), dir = labelDir(n);
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
    if (!validateGeo(parsed).some((e) => /unknown point|must be|needs|nothing to draw/.test(e))) {
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
