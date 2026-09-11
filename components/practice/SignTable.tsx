'use client';

// SignTable — the sign table exactly as Itay draws it on the board (photo,
// 2026-09-10): the x-axis runs LEFT TO RIGHT with ranges and separating
// points alternating, each point carries its verdict above the value
// ("קיצון" in green, "מחוץ לתחום" in red), and the derivative row shows a
// rising green arrow where it is positive, a falling red arrow where it is
// negative, "max"/"min" at the extremum points, and a red hatched column
// where the function is not defined. Authored in content as a ```signtable
// fenced block holding a JSON spec (lib/sign-table.ts); MathText picks the
// fence up and renders this component.
//
// A GFM table could do none of this — no colour, no arrows, no hatching —
// and rendered inside the RTL page it also ran the number line backwards
// ("x > 2" on the left). The grid here is LTR because it IS a number line;
// the labels inside the cells are maths (KaTeX via MathText) or short Hebrew
// notes, each in its own direction.

import { parseSignTable, type SignTableSpec } from '@/lib/sign-table';
import { MathText } from './MathText';

const GREEN = 'text-emerald-700';
const RED = 'text-rose-600';
const HATCH = { backgroundImage: 'repeating-linear-gradient(135deg, rgba(225,29,72,0.16) 0 5px, transparent 5px 12px)' };

function noteTone(note: string): string {
  if (/אין/.test(note)) return 'text-slate-500';
  if (/קיצון|מקס|מינ|max|min/.test(note)) return GREEN;
  if (/מחוץ|לא מוגדר|אינה מוגדרת/.test(note)) return RED;
  return 'text-slate-600';
}

function Arrow({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className="w-8 h-8" aria-hidden>
      <line x1="6" y1={up ? 34 : 6} x2="34" y2={up ? 6 : 34} stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <polyline points={up ? '22,6 34,6 34,18' : '22,34 34,34 34,22'} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cell({ v, result }: { v: string; result: boolean }) {
  const t = v.trim();
  if (t === '') return null;
  if (t === '+' || t === '-') {
    const up = t === '+';
    return (
      <span className={`inline-flex items-center gap-1.5 font-black ${up ? GREEN : RED}`}>
        <span className="text-lg leading-none">{up ? '+' : '−'}</span>
        {result && <Arrow up={up} />}
      </span>
    );
  }
  if (t === 'max' || t === 'min') {
    return (
      <span className={`font-black ${GREEN}`}>
        <span className="block text-sm leading-none">0</span>
        <span className="block text-xs mt-1">{t === 'max' ? 'max · מקסימום' : 'min · מינימום'}</span>
      </span>
    );
  }
  if (t === '0') return <span className="font-black text-slate-800">0</span>;
  if (t === 'out') return <span className={`text-[11px] font-bold ${RED}`}>אינה מוגדרת</span>;
  return (
    <span className="text-sm text-slate-800">
      <MathText inline>{t}</MathText>
    </span>
  );
}

export function SignTable({ spec }: { spec: SignTableSpec }) {
  const result = spec.rows.find((r) => r.result);
  const outCols = new Set<number>();
  result?.cells.forEach((c, i) => { if (c.trim() === 'out') outCols.add(i); });
  spec.cols.forEach((c, i) => { if ('point' in c && c.note && /מחוץ/.test(c.note)) outCols.add(i); });

  return (
    <div dir="ltr" className="my-3 overflow-x-auto">
      <table className="mx-auto border-collapse text-center" style={{ minWidth: 'max-content' }}>
        <thead>
          <tr>
            <th className="border border-slate-300 bg-violet-50 px-3 py-2 text-slate-900 font-black">
              <MathText inline>{'$x$'}</MathText>
            </th>
            {spec.cols.map((c, i) => (
              <th
                key={i}
                className={`border border-slate-300 px-3 py-2 align-bottom font-bold whitespace-nowrap ${'point' in c ? 'bg-violet-50/70' : 'bg-white'}`}
                style={outCols.has(i) ? HATCH : undefined}
              >
                {'point' in c && c.note && (
                  <div className={`text-[11px] font-bold mb-1 ${noteTone(c.note)}`} dir="rtl">{c.note}</div>
                )}
                <div className="text-slate-900">
                  <MathText inline>{'range' in c ? c.range : c.point}</MathText>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.rows.map((r, ri) => (
            <tr key={ri} className={r.result ? 'bg-slate-50/60' : ''}>
              <th className="border border-slate-300 bg-violet-50 px-3 py-2 text-slate-900 font-black whitespace-nowrap">
                <MathText inline>{r.label}</MathText>
              </th>
              {spec.cols.map((_, ci) => (
                <td
                  key={ci}
                  className={`border border-slate-300 px-3 ${r.result ? 'py-3' : 'py-2'} min-w-[64px] whitespace-nowrap`}
                  style={r.result && outCols.has(ci) ? HATCH : undefined}
                >
                  <Cell v={r.cells[ci] ?? ''} result={!!r.result} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SignTableFromJson({ json }: { json: string }) {
  // Parse inside the try, render outside it: only parseSignTable can throw here.
  let spec: SignTableSpec | null = null;
  try {
    const parsed = parseSignTable(json);
    if (parsed.cols.length > 0 && parsed.rows.length > 0) spec = parsed;
  } catch {
    spec = null;
  }
  if (!spec) {
    return (
      <div dir="rtl" className="my-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
        (טבלת הסימנים אינה זמינה)
      </div>
    );
  }
  return <SignTable spec={spec} />;
}
