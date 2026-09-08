// geo-figure — the data model of a geometry sketch (the figure printed next to a
// bagrut geometry question) plus its validator. Authored in content as a
// ```geo fenced block holding JSON; rendered by components/practice/GeoFigure.tsx
// wherever MathText renders (question text, bagrut context, solution steps,
// teach). Pure TS so scripts/verify-content.ts can gate every fence at check
// time without React.
//
// Coordinates are MATH coordinates (y up), in any unit: the renderer fits the
// figure to the card. Point names start with a capital letter, optionally
// followed by digits or primes: A, B1, O, M'. Segments/polygons are written as
// runs of names — "AB", "ABCD", "A1B".
//
// The figure is a MODEL, not a picture: every mark that claims something
// (a right angle, "50°", parallel chevrons, equal ticks, a point on a circle,
// a numeric length) is checked against the coordinates by validateGeo, so a
// figure can never tell the student something its geometry does not.

export type Pt = [number, number];

export type GeoSegment = { s: string; dashed?: boolean; accent?: boolean };
export type GeoCircle = {
  center: string;
  /** radius in figure units; or give `through` — a point on the circle */
  r?: number;
  through?: string;
  /** points asserted to lie on the circle (validated) */
  on?: string[];
  accent?: boolean;
  dashed?: boolean;
};
export type GeoAngle = {
  at: string;
  from: string;
  to: string;
  /** text drawn at the arc, e.g. "50°", "α", "x" — a numeric "NN°" is validated */
  label?: string;
  accent?: boolean;
  /** number of arcs (1–3) — equal angles get the same count */
  n?: number;
};
export type GeoSpec = {
  points: Record<string, Pt>;
  segments?: (string | GeoSegment)[];
  /** closed, lightly filled; accent → stronger tint */
  polygons?: (string | { s: string; accent?: boolean })[];
  circles?: GeoCircle[];
  angles?: GeoAngle[];
  /** right-angle squares at `at`, between rays to `from` and `to` */
  right?: { at: string; from: string; to: string }[];
  /** equal-segment tick marks; same n ⇒ equal length (validated) */
  ticks?: { on: string; n: number }[];
  /** parallel chevrons; same n ⇒ parallel (validated) */
  parallel?: { on: string; n?: number }[];
  /** text beside a segment's midpoint (`on`) or beside a point (`at`) */
  labels?: { on?: string; at?: string; text: string; accent?: boolean }[];
  /** construction points drawn without dot or name */
  hidden?: string[];
  /** rendered width in px (default 260) */
  width?: number;
};

export const GEO_FENCE = /```geo\s*\n([\s\S]*?)```/g;

/** Text for a model or a chat bubble: figure fences (```geo / ```probtree)
 *  replaced by a short marker, so a JSON sketch never eats a prompt budget. */
export function stripFigureFences(text: string, marker = '[סרטוט]'): string {
  return text.replace(/```(?:geo|probtree)\s*\n[\s\S]*?```/g, marker).replace(/[ \t]*\n{3,}/g, '\n\n').trim();
}

const NAME = /[A-Z][0-9']*/g;
const NAME_EXACT = /^[A-Z][0-9']*$/;

/** "ABCD" → ["A","B","C","D"]; "A1B" → ["A1","B"]. */
export function names(run: string): string[] {
  return run.match(NAME) ?? [];
}

export function parseGeo(json: string): GeoSpec {
  const spec = JSON.parse(json) as GeoSpec;
  if (!spec || typeof spec !== 'object' || !spec.points) throw new Error('no points');
  return spec;
}

const deg = (rad: number) => (rad * 180) / Math.PI;
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Angle at V between rays V→A and V→B, in degrees (0–180). */
export function angleAt(v: Pt, a: Pt, b: Pt): number {
  const ax = a[0] - v[0], ay = a[1] - v[1], bx = b[0] - v[0], by = b[1] - v[1];
  const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
  if (la === 0 || lb === 0) return NaN;
  return deg(Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)))));
}

export function circleRadius(spec: GeoSpec, c: GeoCircle): number {
  if (typeof c.r === 'number') return c.r;
  const o = spec.points[c.center], t = c.through ? spec.points[c.through] : undefined;
  return o && t ? dist(o, t) : NaN;
}

/** Every problem with the spec, as human-readable strings. Empty ⇒ valid. */
/**
 * Prefix for complaints about how a figure LOOKS rather than whether it is a
 * consistent model. The renderer must skip these: a tick sitting under a letter
 * is worth blocking at author time, but the figure still draws, and falling
 * back to "(הסרטוט אינו זמין)" over it would hide a working picture.
 */
export const LAYOUT_ISSUE = 'layout: ';

export function validateGeo(spec: GeoSpec): string[] {
  const errs: string[] = [];
  const P = spec.points ?? {};
  const known = new Set(Object.keys(P));

  for (const [k, v] of Object.entries(P)) {
    if (!NAME_EXACT.test(k)) errs.push(`point name "${k}" must be A, B1, O, M' …`);
    if (!Array.isArray(v) || v.length !== 2 || !v.every((n) => typeof n === 'number' && Number.isFinite(n)))
      errs.push(`point ${k} must be [x, y]`);
  }
  if (known.size < 2) errs.push('a figure needs at least 2 points');
  if (errs.length) return errs;

  const ref = (n: string, ctx: string) => {
    if (!known.has(n)) errs.push(`${ctx}: unknown point "${n}"`);
    return known.has(n);
  };
  const pair = (run: string, ctx: string): [Pt, Pt] | null => {
    const ns = names(run);
    if (ns.length !== 2) { errs.push(`${ctx}: "${run}" must name exactly 2 points`); return null; }
    if (!ns.every((n) => ref(n, ctx))) return null;
    const a = P[ns[0]], b = P[ns[1]];
    if (dist(a, b) === 0) { errs.push(`${ctx}: "${run}" has zero length`); return null; }
    return [a, b];
  };

  for (const s of spec.segments ?? []) pair(typeof s === 'string' ? s : s.s, 'segment');
  for (const p of spec.polygons ?? []) {
    const run = typeof p === 'string' ? p : p.s;
    const ns = names(run);
    if (ns.length < 3) errs.push(`polygon "${run}" needs 3+ points`);
    ns.forEach((n) => ref(n, `polygon ${run}`));
  }
  if (!(spec.segments?.length || spec.polygons?.length || spec.circles?.length)) errs.push('nothing to draw');

  for (const c of spec.circles ?? []) {
    if (!ref(c.center, 'circle')) continue;
    if (c.through && !ref(c.through, 'circle.through')) continue;
    const r = circleRadius(spec, c);
    if (!(r > 0)) { errs.push(`circle at ${c.center}: give r > 0 or through`); continue; }
    for (const n of c.on ?? []) {
      if (!ref(n, 'circle.on')) continue;
      const d = dist(P[c.center], P[n]);
      if (Math.abs(d - r) > r * 0.015) errs.push(`point ${n} is not on the circle at ${c.center} (distance ${d.toFixed(3)}, r=${r.toFixed(3)})`);
    }
  }

  for (const a of spec.angles ?? []) {
    if (![a.at, a.from, a.to].every((n) => ref(n, 'angle'))) continue;
    const got = angleAt(P[a.at], P[a.from], P[a.to]);
    if (!Number.isFinite(got)) { errs.push(`angle at ${a.at}: degenerate`); continue; }
    const m = a.label?.match(/^(\d+(?:\.\d+)?)°$/);
    if (m && Math.abs(got - Number(m[1])) > 0.75)
      errs.push(`angle ${a.from}${a.at}${a.to} is labelled ${a.label} but measures ${got.toFixed(1)}°`);
  }

  for (const r of spec.right ?? []) {
    if (![r.at, r.from, r.to].every((n) => ref(n, 'right'))) continue;
    const got = angleAt(P[r.at], P[r.from], P[r.to]);
    if (!(Math.abs(got - 90) <= 0.5)) errs.push(`right-angle mark at ${r.at} but angle ${r.from}${r.at}${r.to} measures ${got.toFixed(1)}°`);
  }

  const byTick = new Map<number, { run: string; len: number }[]>();
  for (const t of spec.ticks ?? []) {
    const pq = pair(t.on, 'ticks');
    if (!pq) continue;
    if (!(t.n >= 1 && t.n <= 3)) errs.push(`ticks on ${t.on}: n must be 1–3`);
    byTick.set(t.n, [...(byTick.get(t.n) ?? []), { run: t.on, len: dist(pq[0], pq[1]) }]);
  }
  for (const [n, group] of byTick) {
    const ref0 = group[0];
    for (const g of group.slice(1))
      if (Math.abs(g.len - ref0.len) > ref0.len * 0.01)
        errs.push(`ticks n=${n}: ${ref0.run} (${ref0.len.toFixed(3)}) and ${g.run} (${g.len.toFixed(3)}) are not equal`);
  }

  // A tick is drawn hard at the MIDPOINT of its segment — unlike a length
  // label, which slides to 0.3/0.7 when the midpoint is crowded. So if a named
  // point sits mid-segment on a ticked side, its dot and letter print on top of
  // the tick ("האותיות הם על הפסים"). The model is valid, so nothing above
  // catches it; and a tick cannot be slid aside, because a tick at 0.3 of AB
  // reads as marking a sub-segment. It has to be an authoring error.
  for (const m of (spec.ticks ?? []).map((t) => ({ on: t.on, what: 'tick' }))) {
    const pq = pair(m.on, 'marks');
    if (!pq) continue;
    const [a, b] = pq;
    const len = dist(a, b);
    const ends = new Set(names(m.on));
    const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    for (const [name, px] of Object.entries(P)) {
      if (ends.has(name)) continue;
      // Straight distance to where the mark prints — NOT "is the point on the
      // line". The figure the owner reported had D drawn 6% off AB, so an
      // on-the-segment precondition skipped the very case it was written for.
      const gap = dist(px, mid);
      if (gap < len * 0.2)
        errs.push(
          `${LAYOUT_ISSUE}${m.what} on ${m.on} prints at its midpoint, and point ${name} is only ${((gap / len) * 100).toFixed(0)}% of ${m.on} away from there — the mark and the letter land on top of each other. Mark the sub-segments instead, or move the marking off this side.`,
        );
    }
    // NOT checked: a tick colliding with its OWN endpoint's letter (the "|B"
    // that read as one glyph on an all-collinear figure). Tried it as a
    // segment-length ratio; it flagged 38 figures that rasterise perfectly,
    // because whether the letter lands on the tick depends on which direction
    // labelDir pushes it, not on how long the segment is. Catching it honestly
    // means replicating the renderer's label placement, so for now it stays a
    // rasterise-and-look check (scripts/_probe-geo3-sheets.tsx), not a gate.
  }

  const byPar = new Map<number, { run: string; d: Pt }[]>();
  for (const p of spec.parallel ?? []) {
    const pq = pair(p.on, 'parallel');
    if (!pq) continue;
    const n = p.n ?? 1;
    byPar.set(n, [...(byPar.get(n) ?? []), { run: p.on, d: [pq[1][0] - pq[0][0], pq[1][1] - pq[0][1]] }]);
  }
  for (const [n, group] of byPar) {
    if (group.length < 2) errs.push(`parallel n=${n}: only one segment (${group[0].run}) — marks need a pair`);
    const a = group[0];
    for (const g of group.slice(1)) {
      const cross = a.d[0] * g.d[1] - a.d[1] * g.d[0];
      const sin = Math.abs(cross) / (Math.hypot(...a.d) * Math.hypot(...g.d));
      if (sin > 0.01) errs.push(`parallel n=${n}: ${a.run} and ${g.run} are not parallel`);
    }
  }

  // Numeric length labels must share ONE scale — a figure "not to scale" lies.
  const scales: { run: string; k: number }[] = [];
  for (const l of spec.labels ?? []) {
    if (!l.text) errs.push('label without text');
    if (l.on) {
      const pq = pair(l.on, 'label');
      if (!pq) continue;
      const m = l.text.match(/^(\d+(?:\.\d+)?)$/);
      if (m) scales.push({ run: l.on, k: Number(m[1]) / dist(pq[0], pq[1]) });
    } else if (l.at) ref(l.at, 'label');
    else errs.push(`label "${l.text}" needs on or at`);
  }
  if (scales.length > 1) {
    const k0 = scales[0].k;
    for (const s of scales.slice(1))
      if (Math.abs(s.k - k0) > k0 * 0.02)
        errs.push(`length labels not to one scale: ${scales[0].run} vs ${s.run} (${k0.toFixed(3)} vs ${s.k.toFixed(3)} per unit)`);
  }

  for (const h of spec.hidden ?? []) ref(h, 'hidden');
  if (spec.width !== undefined && !(spec.width >= 120 && spec.width <= 520)) errs.push('width must be 120–520');
  return errs;
}

/** All ```geo fences in a text, parsed; a broken one reports instead of throwing. */
export function checkGeoFences(text: string): string[] {
  const errs: string[] = [];
  let i = 0;
  for (const m of text.matchAll(GEO_FENCE)) {
    i++;
    try {
      errs.push(...validateGeo(parseGeo(m[1])).map((e) => `geo#${i}: ${e}`));
    } catch (e) {
      errs.push(`geo#${i}: invalid JSON — ${(e as Error).message}`);
    }
  }
  return errs;
}
