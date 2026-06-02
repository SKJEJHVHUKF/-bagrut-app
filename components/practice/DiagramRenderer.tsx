'use client';

import type { DiagramSpec } from '@/content/lessons/types';
import { MathText } from './MathText';

/**
 * DiagramRenderer — renders an array of declarative DiagramSpec objects
 * as SVG figures. Each primitive (triangle, circle, etc.) lives in its
 * own internal renderer function below.
 *
 * Theme: white-ish strokes on transparent background. Labels use a
 * sans-serif font with semi-bold weight, fill color slate-100 with a
 * subtle dark outline so they stay readable against varied backdrops.
 *
 * All diagrams render inside a <figure> with caption and a consistent
 * card style. ViewBox is square (200x200 default) so they scale nicely
 * across screen sizes.
 */
export function DiagramRenderer({ diagrams }: { diagrams: DiagramSpec[] }) {
  if (!diagrams || diagrams.length === 0) return null;
  // A lone diagram reads better full-width; multiples sit in a 2-col grid.
  const gridCols = diagrams.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2';
  return (
    <div className={`mt-3 grid ${gridCols} gap-3`}>
      {diagrams.map((d, i) => (
        <FigureCard key={i} spec={d} />
      ))}
    </div>
  );
}

function FigureCard({ spec }: { spec: DiagramSpec }) {
  return (
    <figure className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 flex flex-col items-center">
      <div className="w-full max-w-[280px] aspect-square">
        <DiagramSVG spec={spec} />
      </div>
      {spec.caption && (
        <figcaption className="mt-2 text-xs text-slate-300 text-center font-bold chat-md">
          <MathText inline>{spec.caption}</MathText>
        </figcaption>
      )}
    </figure>
  );
}

// ============================================================
// Common SVG conventions
// ============================================================

const STROKE = 'rgba(226, 232, 240, 0.85)';   // slate-200 with alpha
const FILL = 'rgba(168, 85, 247, 0.08)';      // purple-500 translucent
const ACCENT = 'rgba(244, 114, 182, 0.95)';   // pink-400 — for highlights
const LABEL_FILL = '#f1f5f9';                 // slate-100
const TICK = 'rgba(251, 191, 36, 0.95)';      // amber-400 — congruent ticks
const DEFAULT_VIEWBOX = '0 0 200 200';

function DiagramSVG({ spec }: { spec: DiagramSpec }) {
  switch (spec.type) {
    case 'triangle':
      return <TriangleSVG spec={spec} />;
    case 'twoTriangles':
      return <TwoTrianglesSVG spec={spec} />;
    case 'parallelTransversal':
      return <ParallelTransversalSVG spec={spec} />;
    case 'circle':
      return <CircleSVG spec={spec} />;
    case 'polygonInscribed':
      return <PolygonInscribedSVG spec={spec} />;
    case 'parallelogram':
      return <ParallelogramSVG spec={spec} />;
    case 'unitCircle':
      return <UnitCircleSVG spec={spec} />;
    case 'functionGraph':
      return <FunctionGraphSVG spec={spec} />;
    case 'custom':
      return (
        <svg
          viewBox={spec.viewBox ?? DEFAULT_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: spec.svg }}
        />
      );
  }
}

// ============================================================
// Helpers
// ============================================================

function Label({ x, y, text, dx = 0, dy = 0 }: { x: number; y: number; text: string; dx?: number; dy?: number }) {
  return (
    <text
      x={x + dx}
      y={y + dy}
      fill={LABEL_FILL}
      fontSize="14"
      fontFamily="Heebo, sans-serif"
      fontWeight="bold"
      textAnchor="middle"
      stroke="rgba(15, 23, 42, 0.6)"
      strokeWidth="0.4"
      paintOrder="stroke"
    >
      {text}
    </text>
  );
}

/** Tick marks across the midpoint of a segment from (x1,y1) to (x2,y2). */
function SegmentTicks({ x1, y1, x2, y2, count }: { x1: number; y1: number; x2: number; y2: number; count: number }) {
  if (count <= 0) return null;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  // Perpendicular unit vector
  const nx = -dy / len;
  const ny = dx / len;
  const tickLen = 5;
  const gap = 2.5;
  const ticks = [];
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * gap * 1.4;
    // Center each tick on the midpoint, spaced along the segment direction
    const cx = mx + (dx / len) * offset;
    const cy = my + (dy / len) * offset;
    ticks.push(
      <line
        key={i}
        x1={cx - nx * tickLen}
        y1={cy - ny * tickLen}
        x2={cx + nx * tickLen}
        y2={cy + ny * tickLen}
        stroke={TICK}
        strokeWidth="1.6"
      />
    );
  }
  return <>{ticks}</>;
}

/** A small square marking a right angle at vertex (vx, vy), between
 *  the two segments going to (ax, ay) and (bx, by). */
function RightAngleMark({ vx, vy, ax, ay, bx, by, size = 10 }: { vx: number; vy: number; ax: number; ay: number; bx: number; by: number; size?: number }) {
  // Unit vectors along the two sides
  const uax = (ax - vx) / Math.hypot(ax - vx, ay - vy);
  const uay = (ay - vy) / Math.hypot(ax - vx, ay - vy);
  const ubx = (bx - vx) / Math.hypot(bx - vx, by - vy);
  const uby = (by - vy) / Math.hypot(bx - vx, by - vy);
  const p1 = { x: vx + uax * size, y: vy + uay * size };
  const p2 = { x: vx + uax * size + ubx * size, y: vy + uay * size + uby * size };
  const p3 = { x: vx + ubx * size, y: vy + uby * size };
  return (
    <polyline
      points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
      fill="none"
      stroke={STROKE}
      strokeWidth="1.4"
    />
  );
}

// ============================================================
// Primitives
// ============================================================

function TriangleSVG({
  spec,
}: {
  spec: Extract<DiagramSpec, { type: 'triangle' }>;
}) {
  const [A, B, C] = spec.vertices ?? ['A', 'B', 'C'];
  // Default triangle coordinates — pleasant proportions
  const a = { x: 40, y: 160 };
  const b = { x: 160, y: 160 };
  const c = { x: 100, y: 50 };

  const ticks = spec.sideTicks ?? [0, 0, 0];

  // Side labels — sideLabels[i] is opposite to vertex i:
  // sideLabels[0] (opp A) → on BC  | sideLabels[1] (opp B) → on CA | sideLabels[2] (opp C) → on AB
  const sideLabels = spec.sideLabels;
  // Midpoints with small outward offset for label placement
  const sideLabelPos = (p1: {x:number;y:number}, p2: {x:number;y:number}, centerX: number, centerY: number) => {
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    // Outward direction (away from triangle center)
    const dx = mx - centerX;
    const dy = my - centerY;
    const len = Math.hypot(dx, dy) || 1;
    const offset = 14;
    return { x: mx + (dx / len) * offset, y: my + (dy / len) * offset };
  };
  const triCenter = { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };

  return (
    <svg viewBox={DEFAULT_VIEWBOX} xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`} fill={FILL} stroke={STROKE} strokeWidth="2" />
      {/* Right angle marker */}
      {spec.rightAngle === 'A' && <RightAngleMark vx={a.x} vy={a.y} ax={b.x} ay={b.y} bx={c.x} by={c.y} />}
      {spec.rightAngle === 'B' && <RightAngleMark vx={b.x} vy={b.y} ax={a.x} ay={a.y} bx={c.x} by={c.y} />}
      {spec.rightAngle === 'C' && <RightAngleMark vx={c.x} vy={c.y} ax={a.x} ay={a.y} bx={b.x} by={b.y} />}
      {/* Side ticks */}
      <SegmentTicks x1={a.x} y1={a.y} x2={b.x} y2={b.y} count={ticks[0]} />
      <SegmentTicks x1={b.x} y1={b.y} x2={c.x} y2={c.y} count={ticks[1]} />
      <SegmentTicks x1={c.x} y1={c.y} x2={a.x} y2={a.y} count={ticks[2]} />
      {/* Side labels (a, b, c) — opposite vertex labeling convention */}
      {sideLabels && (() => {
        const posBC = sideLabelPos(b, c, triCenter.x, triCenter.y);   // opp A
        const posCA = sideLabelPos(c, a, triCenter.x, triCenter.y);   // opp B
        const posAB = sideLabelPos(a, b, triCenter.x, triCenter.y);   // opp C
        return (
          <>
            <Label x={posBC.x} y={posBC.y} text={sideLabels[0]} />
            <Label x={posCA.x} y={posCA.y} text={sideLabels[1]} />
            <Label x={posAB.x} y={posAB.y} text={sideLabels[2]} />
          </>
        );
      })()}
      {/* Vertex labels */}
      <Label x={a.x} y={a.y} text={A} dx={-10} dy={6} />
      <Label x={b.x} y={b.y} text={B} dx={12} dy={6} />
      <Label x={c.x} y={c.y} text={C} dx={0} dy={-8} />
    </svg>
  );
}

function UnitCircleSVG({
  spec,
}: {
  spec: Extract<DiagramSpec, { type: 'unitCircle' }>;
}) {
  const cx = 100;
  const cy = 100;
  const r = 70;

  // Convert math-angle (degrees, CCW from +x axis) to SVG coords
  const pt = (deg: number) => ({
    x: cx + r * Math.cos((deg * Math.PI) / 180),
    y: cy - r * Math.sin((deg * Math.PI) / 180),
  });

  // Quadrant labels: I, II, III, IV
  const quadrants: { name: string; cx: number; cy: number }[] = [
    { name: 'I', cx: cx + 35, cy: cy - 35 },
    { name: 'II', cx: cx - 35, cy: cy - 35 },
    { name: 'III', cx: cx - 35, cy: cy + 40 },
    { name: 'IV', cx: cx + 35, cy: cy + 40 },
  ];

  // Sign per quadrant for sin/cos/tan
  const signs: Record<'sin' | 'cos' | 'tan', [string, string, string, string]> = {
    sin: ['+', '+', '−', '−'],   // I, II, III, IV
    cos: ['+', '−', '−', '+'],
    tan: ['+', '−', '+', '−'],
    // 'all' handled separately below
  } as const;

  const showSigns = spec.showQuadrantSigns;

  // Special angle marks: 30, 45, 60, 90, 120, 135, 150, 180, ...
  const specialAngles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];

  // Highlighted angle
  const highlight = spec.highlightAngle;

  return (
    <svg viewBox={DEFAULT_VIEWBOX} xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Axes */}
      <line x1={cx - r - 15} y1={cy} x2={cx + r + 15} y2={cy} stroke={STROKE} strokeWidth="1" opacity="0.5" />
      <line x1={cx} y1={cy - r - 15} x2={cx} y2={cy + r + 15} stroke={STROKE} strokeWidth="1" opacity="0.5" />
      {/* Axis labels */}
      <Label x={cx + r + 12} y={cy} text="x" dx={0} dy={4} />
      <Label x={cx} y={cy - r - 12} text="y" dx={0} dy={0} />
      {/* Unit circle */}
      <circle cx={cx} cy={cy} r={r} fill={FILL} stroke={STROKE} strokeWidth="2" />
      {/* Special angles ticks */}
      {spec.showSpecialAngles && specialAngles.map((deg) => {
        const p = pt(deg);
        return (
          <circle key={deg} cx={p.x} cy={p.y} r="2" fill={ACCENT} opacity="0.75" />
        );
      })}
      {/* Highlight angle */}
      {typeof highlight === 'number' && (() => {
        const p = pt(highlight);
        return (
          <>
            <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={ACCENT} strokeWidth="2.5" />
            <circle cx={p.x} cy={p.y} r="3.5" fill={ACCENT} />
            <Label x={p.x} y={p.y} text={`${highlight}°`} dx={highlight > 90 && highlight < 270 ? -16 : 16} dy={highlight > 0 && highlight < 180 ? -4 : 12} />
          </>
        );
      })()}
      {/* Quadrant signs */}
      {showSigns && showSigns !== 'all' && quadrants.map((q, i) => (
        <text
          key={q.name}
          x={q.cx}
          y={q.cy}
          fill={ACCENT}
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="Heebo, sans-serif"
        >
          {showSigns}{signs[showSigns][i]}
        </text>
      ))}
      {showSigns === 'all' && quadrants.map((q, i) => (
        <text
          key={q.name}
          x={q.cx}
          y={q.cy}
          fill={ACCENT}
          fontSize="10"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="Heebo, sans-serif"
        >
          <tspan x={q.cx} dy="0">{`sin${signs.sin[i]}`}</tspan>
          <tspan x={q.cx} dy="11">{`cos${signs.cos[i]}`}</tspan>
          <tspan x={q.cx} dy="11">{`tan${signs.tan[i]}`}</tspan>
        </text>
      ))}
      {/* Roman numeral labels — only if no signs */}
      {!showSigns && quadrants.map((q) => (
        <text
          key={q.name}
          x={q.cx}
          y={q.cy}
          fill={LABEL_FILL}
          fontSize="13"
          fontWeight="bold"
          textAnchor="middle"
          opacity="0.7"
          fontFamily="serif"
        >
          {q.name}
        </text>
      ))}
    </svg>
  );
}

function TwoTrianglesSVG({
  spec,
}: {
  spec: Extract<DiagramSpec, { type: 'twoTriangles' }>;
}) {
  const [A, B, C] = spec.labels?.left ?? ['A', 'B', 'C'];
  const [D, E, F] = spec.labels?.right ?? ['D', 'E', 'F'];
  // Left triangle
  const La = { x: 20, y: 130 };
  const Lb = { x: 90, y: 130 };
  const Lc = { x: 55, y: 50 };
  // Right triangle — similar shape, slightly different size for "similar"
  const scale = spec.relation === 'similar' ? 0.7 : 1;
  const Ra = { x: 115, y: 130 };
  const Rb = { x: 115 + 70 * scale, y: 130 };
  const Rc = { x: 115 + 35 * scale, y: 130 - 80 * scale };

  return (
    <svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <polygon points={`${La.x},${La.y} ${Lb.x},${Lb.y} ${Lc.x},${Lc.y}`} fill={FILL} stroke={STROKE} strokeWidth="2" />
      <polygon points={`${Ra.x},${Ra.y} ${Rb.x},${Rb.y} ${Rc.x},${Rc.y}`} fill={FILL} stroke={STROKE} strokeWidth="2" />
      {/* Tick marks on corresponding sides — show 1, 2, 3 ticks for AB↔DE, BC↔EF, CA↔FD */}
      <SegmentTicks x1={La.x} y1={La.y} x2={Lb.x} y2={Lb.y} count={1} />
      <SegmentTicks x1={Ra.x} y1={Ra.y} x2={Rb.x} y2={Rb.y} count={1} />
      <SegmentTicks x1={Lb.x} y1={Lb.y} x2={Lc.x} y2={Lc.y} count={2} />
      <SegmentTicks x1={Rb.x} y1={Rb.y} x2={Rc.x} y2={Rc.y} count={2} />
      {/* Vertex labels */}
      <Label x={La.x} y={La.y} text={A} dx={-8} dy={6} />
      <Label x={Lb.x} y={Lb.y} text={B} dx={10} dy={6} />
      <Label x={Lc.x} y={Lc.y} text={C} dx={0} dy={-8} />
      <Label x={Ra.x} y={Ra.y} text={D} dx={-8} dy={6} />
      <Label x={Rb.x} y={Rb.y} text={E} dx={10} dy={6} />
      <Label x={Rc.x} y={Rc.y} text={F} dx={0} dy={-8} />
      {/* Symbol */}
      <text x="100" y="100" fill={ACCENT} fontSize="20" fontWeight="bold" textAnchor="middle" fontFamily="serif">
        {spec.relation === 'congruent' ? '≅' : '∼'}
      </text>
    </svg>
  );
}

function ParallelTransversalSVG({
  spec,
}: {
  spec: Extract<DiagramSpec, { type: 'parallelTransversal' }>;
}) {
  const [L1, L2] = spec.labels?.lines ?? ['m', 'n'];
  const T = spec.labels?.transversal ?? 't';
  // Two horizontal parallel lines, one diagonal transversal
  const y1 = 60;
  const y2 = 140;
  const ax = 20;
  const bx = 180;
  // Transversal from (40, 30) to (170, 180)
  const tx1 = 40;
  const ty1 = 30;
  const tx2 = 170;
  const ty2 = 180;
  // Compute intersection of transversal with the two horizontal lines
  const slope = (ty2 - ty1) / (tx2 - tx1);
  const ixUpper = tx1 + (y1 - ty1) / slope;
  const ixLower = tx1 + (y2 - ty1) / slope;
  const [P1, P2] = spec.crossPoints ?? ['P', 'Q'];

  return (
    <svg viewBox={DEFAULT_VIEWBOX} xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Parallel lines */}
      <line x1={ax} y1={y1} x2={bx} y2={y1} stroke={STROKE} strokeWidth="2" />
      <line x1={ax} y1={y2} x2={bx} y2={y2} stroke={STROKE} strokeWidth="2" />
      {/* Parallel marks (arrows) */}
      <polyline points={`${ax + 80},${y1 - 4} ${ax + 86},${y1} ${ax + 80},${y1 + 4}`} fill="none" stroke={ACCENT} strokeWidth="1.6" />
      <polyline points={`${ax + 80},${y2 - 4} ${ax + 86},${y2} ${ax + 80},${y2 + 4}`} fill="none" stroke={ACCENT} strokeWidth="1.6" />
      {/* Transversal */}
      <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={STROKE} strokeWidth="2" />
      {/* Intersection points */}
      <circle cx={ixUpper} cy={y1} r="3" fill={ACCENT} />
      <circle cx={ixLower} cy={y2} r="3" fill={ACCENT} />
      {/* Labels */}
      <Label x={bx} y={y1} text={L1} dx={12} dy={2} />
      <Label x={bx} y={y2} text={L2} dx={12} dy={2} />
      <Label x={tx2} y={ty2} text={T} dx={10} dy={6} />
      <Label x={ixUpper} y={y1} text={P1} dx={-12} dy={-6} />
      <Label x={ixLower} y={y2} text={P2} dx={-12} dy={-6} />
    </svg>
  );
}

function CircleSVG({
  spec,
}: {
  spec: Extract<DiagramSpec, { type: 'circle' }>;
}) {
  const cx = 100;
  const cy = 100;
  const r = 70;

  // Points on the circle parameterized by angle (degrees, 0° = right)
  const pt = (deg: number) => ({
    x: cx + r * Math.cos((deg * Math.PI) / 180),
    y: cy - r * Math.sin((deg * Math.PI) / 180),
  });

  // Pre-place a few common points
  const points: Record<string, { x: number; y: number }> = {
    A: pt(150),
    B: pt(30),
    C: pt(270),
    D: pt(90),
  };

  return (
    <svg viewBox={DEFAULT_VIEWBOX} xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx={cx} cy={cy} r={r} fill={FILL} stroke={STROKE} strokeWidth="2" />

      {/* Center */}
      {spec.showCenter && (
        <>
          <circle cx={cx} cy={cy} r="2.5" fill={STROKE} />
          <Label x={cx} y={cy} text={spec.centerLabel ?? 'O'} dx={6} dy={12} />
        </>
      )}

      {/* Radius to a labeled point */}
      {spec.radiusTo && points[spec.radiusTo] && (
        <>
          <line x1={cx} y1={cy} x2={points[spec.radiusTo].x} y2={points[spec.radiusTo].y} stroke={STROKE} strokeWidth="1.6" strokeDasharray="3,3" />
          <Label x={points[spec.radiusTo].x} y={points[spec.radiusTo].y} text={spec.radiusTo} dx={10} dy={-4} />
        </>
      )}

      {/* Chord between two labeled points */}
      {spec.chord && points[spec.chord.from] && points[spec.chord.to] && (
        <>
          <line
            x1={points[spec.chord.from].x}
            y1={points[spec.chord.from].y}
            x2={points[spec.chord.to].x}
            y2={points[spec.chord.to].y}
            stroke={ACCENT}
            strokeWidth="2"
          />
          <Label x={points[spec.chord.from].x} y={points[spec.chord.from].y} text={spec.chord.from} dx={-10} dy={4} />
          <Label x={points[spec.chord.to].x} y={points[spec.chord.to].y} text={spec.chord.to} dx={10} dy={4} />
        </>
      )}

      {/* Tangent at a point */}
      {spec.tangent && points[spec.tangent.at] && (
        <>
          {(() => {
            const p = points[spec.tangent!.at];
            // Direction perpendicular to radius
            const dx = -(p.y - cy);
            const dy = p.x - cx;
            const len = Math.hypot(dx, dy);
            const ux = dx / len;
            const uy = dy / len;
            const tLen = 60;
            return (
              <>
                <line
                  x1={p.x - ux * tLen}
                  y1={p.y - uy * tLen}
                  x2={p.x + ux * tLen}
                  y2={p.y + uy * tLen}
                  stroke={ACCENT}
                  strokeWidth="2"
                />
                <circle cx={p.x} cy={p.y} r="3" fill={ACCENT} />
                <Label x={p.x} y={p.y} text={spec.tangent!.at} dx={10} dy={-6} />
              </>
            );
          })()}
        </>
      )}

      {/* Inscribed angle */}
      {spec.inscribedAngle && (
        <>
          {(() => {
            const v = points[spec.inscribedAngle!.vertex];
            const a1 = points[spec.inscribedAngle!.arc[0]];
            const a2 = points[spec.inscribedAngle!.arc[1]];
            if (!v || !a1 || !a2) return null;
            return (
              <>
                <line x1={v.x} y1={v.y} x2={a1.x} y2={a1.y} stroke={ACCENT} strokeWidth="2" />
                <line x1={v.x} y1={v.y} x2={a2.x} y2={a2.y} stroke={ACCENT} strokeWidth="2" />
                <circle cx={v.x} cy={v.y} r="2.5" fill={ACCENT} />
                <circle cx={a1.x} cy={a1.y} r="2.5" fill={ACCENT} />
                <circle cx={a2.x} cy={a2.y} r="2.5" fill={ACCENT} />
                <Label x={v.x} y={v.y} text={spec.inscribedAngle!.vertex} dx={0} dy={-8} />
                <Label x={a1.x} y={a1.y} text={spec.inscribedAngle!.arc[0]} dx={-10} dy={4} />
                <Label x={a2.x} y={a2.y} text={spec.inscribedAngle!.arc[1]} dx={10} dy={4} />
              </>
            );
          })()}
        </>
      )}
    </svg>
  );
}

function PolygonInscribedSVG({
  spec,
}: {
  spec: Extract<DiagramSpec, { type: 'polygonInscribed' }>;
}) {
  const cx = 100;
  const cy = 100;
  const r = 70;
  const n = Math.max(3, Math.min(12, spec.sides));
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2; // start at top
    points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  return (
    <svg viewBox={DEFAULT_VIEWBOX} xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={STROKE} strokeWidth="2" />
      <polygon points={polyPoints} fill={FILL} stroke={ACCENT} strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={ACCENT} />
      ))}
    </svg>
  );
}

function ParallelogramSVG({
  spec,
}: {
  spec: Extract<DiagramSpec, { type: 'parallelogram' }>;
}) {
  const [A, B, C, D] = spec.labels ?? ['A', 'B', 'C', 'D'];
  const a = { x: 30, y: 150 };
  const b = { x: 150, y: 150 };
  const c = { x: 175, y: 50 };
  const d = { x: 55, y: 50 };
  return (
    <svg viewBox={DEFAULT_VIEWBOX} xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill={FILL} stroke={STROKE} strokeWidth="2" />
      {spec.withDiagonals && (
        <>
          <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={ACCENT} strokeWidth="1.5" strokeDasharray="3,3" />
          <line x1={b.x} y1={b.y} x2={d.x} y2={d.y} stroke={ACCENT} strokeWidth="1.5" strokeDasharray="3,3" />
        </>
      )}
      <Label x={a.x} y={a.y} text={A} dx={-10} dy={6} />
      <Label x={b.x} y={b.y} text={B} dx={10} dy={6} />
      <Label x={c.x} y={c.y} text={C} dx={10} dy={-6} />
      <Label x={d.x} y={d.y} text={D} dx={-10} dy={-6} />
    </svg>
  );
}

function FunctionGraphSVG({
  spec,
}: {
  spec: Extract<DiagramSpec, { type: 'functionGraph' }>;
}) {
  const W = 200;
  const H = 200;
  const padL = 22;
  const padR = 14;
  const padT = 14;
  const padB = 20;
  const [xmin, xmax] = spec.xRange ?? [-4, 4];

  type Pt = { x: number; y: number };
  // Sample a curve into continuous segments, breaking where the function
  // is undefined (NaN/∞) so vertical asymptotes don't draw spurious lines.
  const SAMPLES = 180;
  const sampleCurve = (fn: (x: number) => number, dom?: [number, number]): Pt[][] => {
    const lo = Math.max(dom?.[0] ?? xmin, xmin);
    const hi = Math.min(dom?.[1] ?? xmax, xmax);
    const segs: Pt[][] = [];
    let cur: Pt[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const x = lo + ((hi - lo) * i) / SAMPLES;
      let y: number;
      try {
        y = fn(x);
      } catch {
        y = NaN;
      }
      if (Number.isFinite(y)) {
        cur.push({ x, y });
      } else if (cur.length) {
        segs.push(cur);
        cur = [];
      }
    }
    if (cur.length) segs.push(cur);
    return segs;
  };

  const curves = spec.curves.map((c) => ({ c, segs: sampleCurve(c.fn, c.domain) }));

  // Determine the y-window: explicit, else auto-fit from samples + features.
  let ymin: number;
  let ymax: number;
  if (spec.yRange) {
    [ymin, ymax] = spec.yRange;
  } else {
    ymin = Infinity;
    ymax = -Infinity;
    for (const { segs } of curves)
      for (const seg of segs)
        for (const p of seg) {
          if (p.y < ymin) ymin = p.y;
          if (p.y > ymax) ymax = p.y;
        }
    for (const h of spec.hAsymptotes ?? []) {
      ymin = Math.min(ymin, h.y);
      ymax = Math.max(ymax, h.y);
    }
    for (const m of spec.markedPoints ?? []) {
      ymin = Math.min(ymin, m.y);
      ymax = Math.max(ymax, m.y);
    }
    if (!Number.isFinite(ymin) || !Number.isFinite(ymax)) {
      ymin = -2;
      ymax = 2;
    }
    const span = ymax - ymin || 1;
    ymin -= span * 0.12;
    ymax += span * 0.12;
  }

  const sx = (x: number) => padL + ((x - xmin) / (xmax - xmin)) * (W - padL - padR);
  const sy = (y: number) => padT + ((ymax - y) / (ymax - ymin)) * (H - padT - padB);
  // Clamp extreme y values so near-asymptote spikes stay inside the frame.
  const ySpan = ymax - ymin;
  const clampY = (y: number) => Math.max(ymin - ySpan, Math.min(ymax + ySpan, y));

  const axisAtX0 = xmin <= 0 && xmax >= 0 ? sx(0) : null;
  const axisAtY0 = ymin <= 0 && ymax >= 0 ? sy(0) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Plot frame */}
      <rect
        x={padL}
        y={padT}
        width={W - padL - padR}
        height={H - padT - padB}
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(226,232,240,0.15)"
        strokeWidth="1"
        rx="4"
      />
      {/* Axes (drawn only when 0 is inside the window) */}
      {axisAtY0 !== null && (
        <line x1={padL} y1={axisAtY0} x2={W - padR} y2={axisAtY0} stroke={STROKE} strokeWidth="1" opacity="0.6" />
      )}
      {axisAtX0 !== null && (
        <line x1={axisAtX0} y1={padT} x2={axisAtX0} y2={H - padB} stroke={STROKE} strokeWidth="1" opacity="0.6" />
      )}
      {axisAtY0 !== null && <Label x={W - padR} y={axisAtY0} text="x" dx={-4} dy={-4} />}
      {axisAtX0 !== null && <Label x={axisAtX0} y={padT} text="y" dx={8} dy={2} />}

      {/* Horizontal asymptotes */}
      {(spec.hAsymptotes ?? []).map((h, i) => (
        <g key={`h${i}`}>
          <line x1={padL} y1={sy(h.y)} x2={W - padR} y2={sy(h.y)} stroke={TICK} strokeWidth="1.2" strokeDasharray="4,3" opacity="0.85" />
          {h.label && <Label x={W - padR} y={sy(h.y)} text={h.label} dx={-14} dy={-3} />}
        </g>
      ))}
      {/* Vertical asymptotes */}
      {(spec.vAsymptotes ?? []).map((v, i) => (
        <g key={`v${i}`}>
          <line x1={sx(v.x)} y1={padT} x2={sx(v.x)} y2={H - padB} stroke={TICK} strokeWidth="1.2" strokeDasharray="4,3" opacity="0.85" />
          {v.label && <Label x={sx(v.x)} y={padT} text={v.label} dx={0} dy={10} />}
        </g>
      ))}

      {/* Curves */}
      {curves.map(({ c, segs }, ci) =>
        segs.map((seg, si) => (
          <polyline
            key={`c${ci}-${si}`}
            points={seg.map((p) => `${sx(p.x).toFixed(2)},${sy(clampY(p.y)).toFixed(2)}`).join(' ')}
            fill="none"
            stroke={c.color ?? ACCENT}
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={c.dashed ? '5,4' : undefined}
          />
        ))
      )}

      {/* Marked points */}
      {(spec.markedPoints ?? []).map((m, i) => (
        <g key={`m${i}`}>
          <circle cx={sx(m.x)} cy={sy(m.y)} r="3" fill={LABEL_FILL} stroke={ACCENT} strokeWidth="1.6" />
          {m.label && <Label x={sx(m.x)} y={sy(m.y)} text={m.label} dx={0} dy={-7} />}
        </g>
      ))}
    </svg>
  );
}
