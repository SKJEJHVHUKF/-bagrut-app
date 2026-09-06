/**
 * prob-figure.ts — the probability figures a solution can carry, checked as a
 * MODEL rather than as text.
 *
 * Two figure kinds exist in this app and neither had a validator:
 *
 *   ```probtree  — a JSON tree spec rendered by components/practice/ProbTree.
 *                  Nothing checked that sibling branches sum to 1 or that the
 *                  number under a leaf is the product along its path, so a tree
 *                  could quietly contradict the steps beside it.
 *   GFM table    — a probability table is an ordinary markdown table (the
 *                  renderer rings a cell wrapped in `((…))` as the answer).
 *                  Nothing checked that a margin equals the sum of its cells.
 *
 * Both checks are numeric only where the entries are numeric — a branch
 * labelled `x` or `1-p` is a legitimate unknown and is skipped, not failed.
 * Same contract as lib/geo-figure.checkGeoFences: returns a list of human-
 * readable problems, empty when the figure is consistent with itself.
 */

export type ProbBranch = { p: string; label: string; result?: string; pick?: boolean; children?: ProbBranch[] };
export type ProbTreeSpec = { root?: string; children: ProbBranch[] };

export const PROBTREE_FENCE = /```probtree\s*\n([\s\S]*?)```/g;

/** "0.35", "3/8", "7/22", "35%" → number; anything else (x, p, 1-p) → null. */
export function numeric(s: string | undefined): number | null {
  if (s == null) return null;
  const t = s.trim().replace(/\$/g, '').replace(/\\d?frac\{(\d+)\}\{(\d+)\}/, '$1/$2');
  let m = t.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (m) return Number(m[1]) / 100;
  m = t.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  m = t.match(/^-?\d+(?:\.\d+)?$/);
  if (m) return Number(t);
  return null;
}

const close = (a: number, b: number, tol = 1e-4) => Math.abs(a - b) <= tol;

export function checkProbTree(spec: ProbTreeSpec): string[] {
  const out: string[] = [];
  if (!spec || !Array.isArray(spec.children) || spec.children.length === 0) return ['probtree: no children'];

  const walk = (children: ProbBranch[], path: string, product: number | null) => {
    const ps = children.map((c) => numeric(c.p));
    if (ps.every((p) => p !== null)) {
      const sum = ps.reduce((a, b) => a + (b as number), 0);
      if (!close(sum, 1)) out.push(`probtree: branches under "${path || 'root'}" sum to ${sum.toFixed(4)}, not 1 (${children.map((c) => c.p).join(' + ')})`);
    }
    for (const c of children) {
      if (!c.p || !String(c.p).trim()) out.push(`probtree: a branch under "${path || 'root'}" has no probability`);
      if (!c.label || !String(c.label).trim()) out.push(`probtree: a branch under "${path || 'root'}" has no label`);
      const p = numeric(c.p);
      const here = product !== null && p !== null ? product * p : null;
      const name = path ? `${path} → ${c.label}` : c.label;
      if (c.children?.length) {
        if (c.result) out.push(`probtree: "${name}" is not a leaf but carries a result`);
        walk(c.children, name, here);
      } else if (c.result != null) {
        const r = numeric(c.result);
        if (r !== null && here !== null && !close(r, here)) {
          out.push(`probtree: leaf "${name}" shows ${c.result} but the path multiplies to ${here.toFixed(5)}`);
        }
      }
    }
  };
  walk(spec.children, '', 1);
  return out;
}

/** Every ```probtree fence in a text, parsed and checked. */
export function checkProbTreeFences(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(PROBTREE_FENCE)) {
    let spec: ProbTreeSpec;
    try {
      spec = JSON.parse(m[1]) as ProbTreeSpec;
    } catch (e) {
      out.push(`probtree: invalid JSON (${(e as Error).message})`);
      continue;
    }
    out.push(...checkProbTree(spec));
  }
  return out;
}

/** The picked leaves of every tree in a text, summed — what the tree claims the answer is. */
export function pickedTotal(text: string): number | null {
  let total = 0;
  let any = false;
  for (const m of text.matchAll(PROBTREE_FENCE)) {
    let spec: ProbTreeSpec;
    try { spec = JSON.parse(m[1]) as ProbTreeSpec; } catch { return null; }
    const walk = (b: ProbBranch) => {
      if (b.children?.length) b.children.forEach(walk);
      else if (b.pick) { const r = numeric(b.result); if (r === null) throw new Error('symbolic'); total += r; any = true; }
    };
    try { spec.children.forEach(walk); } catch { return null; }
  }
  return any ? total : null;
}

/**
 * GFM tables. A row whose header ends in a total column ("סה״כ" / "סך הכול" /
 * "סה"כ") is checked: last numeric cell = sum of the others. The last row is
 * checked the same way when its first cell is a total label. Cells may be
 * ringed with `((…))`, wrapped in `$…$`, or symbolic (skipped).
 */
export function checkProbTables(text: string): string[] {
  const out: string[] = [];
  const lines = text.split(/\r?\n/);
  const rows: string[][] = [];
  const flush = () => {
    if (rows.length >= 2) checkOne(rows, out);
    rows.length = 0;
  };
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('|')) {
      const cells = t.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim().replace(/^\(\(|\)\)$/g, '').trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // the alignment row
      rows.push(cells);
    } else flush();
  }
  flush();
  return out;
}

const TOTAL = /סה[״"']?כ|סך הכול|סה"כ|סך־הכול/;

function checkOne(rows: string[][], out: string[]) {
  const header = rows[0];
  const width = header.length;
  for (const r of rows.slice(1)) if (r.length !== width) out.push(`table: row "${r[0]}" has ${r.length} cells, header has ${width}`);
  const totalCol = TOTAL.test(header[width - 1] ?? '');
  for (const r of rows.slice(1)) {
    if (r.length !== width) continue;
    const nums = r.slice(1).map(numeric);
    if (totalCol && nums.every((n) => n !== null) && nums.length >= 2) {
      const body = nums.slice(0, -1).reduce((a, b) => a + (b as number), 0);
      const last = nums[nums.length - 1] as number;
      if (!close(body, last)) out.push(`table: row "${r[0]}" sums to ${body.toFixed(4)} but its total cell says ${last}`);
    }
  }
  const lastRow = rows[rows.length - 1];
  if (TOTAL.test(lastRow[0] ?? '') && rows.length >= 3) {
    for (let c = 1; c < width; c++) {
      const col = rows.slice(1, -1).map((r) => numeric(r[c]));
      const tot = numeric(lastRow[c]);
      if (col.every((n) => n !== null) && tot !== null) {
        const sum = col.reduce((a, b) => a + (b as number), 0);
        if (!close(sum, tot)) out.push(`table: column "${header[c]}" sums to ${sum.toFixed(4)} but its total cell says ${lastRow[c]}`);
      }
    }
  }
}

export const hasProbTree = (text: string) => /```probtree/.test(text);
export const hasTable = (text: string) => /^\s*\|.*\|\s*$/m.test(text);
