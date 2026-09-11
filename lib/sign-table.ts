/**
 * sign-table.ts — the ```signtable fence: a sign table drawn the way it is
 * drawn on the board (Itay's photo, 2026-09-10): the x-axis runs LEFT TO
 * RIGHT with ranges and separating points alternating, each point carries its
 * verdict ("קיצון", "מחוץ לתחום"), and the derivative row shows arrows.
 *
 * Rendered by components/practice/SignTable.tsx; this module is the shared
 * spec + the content-gate check, so a fence that would render as "(טבלת
 * הסימנים אינה זמינה)" — or one whose verdicts contradict its own signs —
 * fails `verify:content` instead of shipping.
 */

export type SignCol =
  /** an open interval, e.g. "$x < 0$" or "$0 < x < 1$" */
  | { range: string }
  /** a separating point, e.g. "$x = 0$", and its verdict ("קיצון", "מחוץ לתחום", …) */
  | { point: string; note?: string };

export type SignRow = {
  /** row label, e.g. "$f'(x)$", "$x - 3$", "מציבים" */
  label: string;
  /** one entry per column: "+", "-", "0", "max", "min", "out" (not defined),
   *  "" (empty), or any other text/maths rendered as is */
  cells: string[];
  /** the row the verdict is read from: gets the arrows and the hatched columns */
  result?: boolean;
};

export type SignTableSpec = { cols: SignCol[]; rows: SignRow[] };

export const SIGNTABLE_FENCE = /```signtable\s*\n([\s\S]*?)```/g;

export function parseSignTable(json: string): SignTableSpec {
  const spec = JSON.parse(json) as SignTableSpec;
  if (!spec || !Array.isArray(spec.cols) || !Array.isArray(spec.rows)) throw new Error('signtable: cols and rows are required');
  return spec;
}

/** Every ```signtable fence in a text, parsed and checked. */
export function checkSignTableFences(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(SIGNTABLE_FENCE)) {
    let spec: SignTableSpec;
    try {
      spec = parseSignTable(m[1]);
    } catch (e) {
      out.push(`signtable: invalid JSON (${(e as Error).message})`);
      continue;
    }
    if (spec.cols.length < 2) out.push('signtable: fewer than two columns');
    if (spec.rows.length === 0) out.push('signtable: no rows');
    spec.cols.forEach((c, i) => {
      const ok = ('range' in c && typeof c.range === 'string' && c.range.trim()) || ('point' in c && typeof c.point === 'string' && c.point.trim());
      if (!ok) out.push(`signtable: column ${i + 1} is neither a range nor a point`);
      if (i > 0 && 'point' in c && 'point' in spec.cols[i - 1]) out.push(`signtable: two separating points in a row at column ${i + 1} — a range is missing between them`);
    });
    spec.rows.forEach((r) => {
      if (!r.label || !r.label.trim()) out.push('signtable: a row has no label');
      if (!Array.isArray(r.cells) || r.cells.length !== spec.cols.length) out.push(`signtable: row "${r.label}" has ${r.cells?.length ?? 0} cells for ${spec.cols.length} columns`);
    });
    const result = spec.rows.find((r) => r.result);
    if (!result) { out.push('signtable: no result row (the one the verdict is read from)'); continue; }
    // a verdict over a point must agree with the result row under it
    spec.cols.forEach((c, i) => {
      if (!('point' in c)) return;
      const cell = (result.cells[i] ?? '').trim();
      const note = c.note ?? '';
      if (/מחוץ/.test(note) && cell !== 'out') out.push(`signtable: "${c.point}" is marked outside the domain but the result row shows "${cell}", not "out"`);
      if (cell === 'out' && !/מחוץ/.test(note)) out.push(`signtable: the result row is not defined at "${c.point}" but the point is not marked מחוץ לתחום`);
      if ((cell === 'max' || cell === 'min') && !/קיצון/.test(note)) out.push(`signtable: "${c.point}" shows ${cell} but is not marked קיצון`);
      const l = (result.cells[i - 1] ?? '').trim(), r = (result.cells[i + 1] ?? '').trim();
      if (cell === 'max' && !(l === '+' && r === '-')) out.push(`signtable: "${c.point}" is a maximum but the signs around it are ${l || '?'} / ${r || '?'}`);
      if (cell === 'min' && !(l === '-' && r === '+')) out.push(`signtable: "${c.point}" is a minimum but the signs around it are ${l || '?'} / ${r || '?'}`);
    });
  }
  return out;
}

export const hasSignTable = (text: string) => /```signtable/.test(text);
