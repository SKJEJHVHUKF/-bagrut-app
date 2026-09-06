/**
 * _split-crowded-geo.ts — one line, one move, in the geometry solutions.
 *
 *   npx tsx scripts/_split-crowded-geo.ts [--write]
 *
 * WHY. Itay: the solutions read as cramped on a phone. claude-3a's
 * scripts/_probe-step-density.ts puts geometry at 6.3% of solution lines
 * carrying two or more calculations (סדרות 15.7%, טריגונומטריה 13.7%).
 *
 * NOT every flagged line is split. The rule applied is Itay's own — "every step
 * is a line a student writes on the exam paper":
 *
 *   SPLIT  two SEQUENTIAL moves — do A, then from A do B. Separate lines.
 *   KEEP   two PARALLEL facts of one kind — check this ratio and that one, or
 *          the same computation for both triangles. One line, and splitting
 *          them adds noise and lengthens a solution that is already capped at
 *          15 steps.
 *
 * Tables are excluded outright: a claim-reason table is already one move per
 * row. A step that starts with prose and carries a table further down does NOT
 * start with a pipe, which is how the equivalent probability probe lost its
 * longest chains — so the test is for a pipe anywhere, not a leading one.
 *
 * THE REMAINDER IS DELIBERATE. After this ran, _probe-step-density reports
 * geometry at 4.3% (35 lines), down from 6.3% (50). Those 35 are the KEEP class
 * above, and driving the number to 0 would mean splitting lines that are
 * correct as they stand — trading a solution Itay can read for a metric that
 * looks tidy. If you are here because the percentage is not zero: that is the
 * intended state, not unfinished work.
 *
 * Patches are written in PARSED form (single backslashes) and escaped on the
 * way to source, so the table stays readable and the escaping cannot drift.
 */
import { readFileSync, writeFileSync } from 'node:fs';

type Patch = { where: string; find: string; parts: string[] };

const PATCHES: Patch[] = [
  // ── three moves on one line ────────────────────────────────────────────────
  {
    where: 'eg-bag-008/ב',
    find: 'בדיקה: $AB = 2 \\cdot AD = 10$, ומסעיף א',
    parts: [
      'בדיקה: $AB = 2 \\cdot AD = 10$.',
      'מסעיף א ידוע $DE \\parallel BC$, ולכן לפי משפט תאלס המורחב $\\dfrac{DE}{BC} = \\dfrac{AD}{AB} = \\dfrac{5}{10} = \\dfrac{1}{2}$.',
      'ואכן $DE = \\dfrac{1}{2} \\cdot 14 = 7$ ✓.',
    ],
  },
  {
    where: 'eg-bag-007/ג',
    find: 'בדיקה: מהדמיון $\\dfrac{BH}{BA}',
    parts: [
      'בדיקה: מהדמיון $\\dfrac{BH}{BA} = \\dfrac{AB}{CB}$.',
      'ומכאן $BH = \\dfrac{9 \\cdot 9}{15} = 5.4$.',
      'ולכן שטח $\\triangle ABH$ הוא $\\dfrac{1}{2} \\cdot 5.4 \\cdot 7.2 = 19.44$.',
    ],
  },
  {
    where: 'eg-sub-thales-004',
    find: 'מכאן $\\triangle ADE \\sim \\triangle ABC$, ויחס הדמיון נמדד',
    parts: [
      'מכאן $\\triangle ADE \\sim \\triangle ABC$.',
      'יחס הדמיון נמדד מול הצלע השלמה, ולכן קודם $AB = AD + DB = 3 + 5 = 8$.',
      'ומכאן $k = \\dfrac{AD}{AB} = \\dfrac{3}{8}$.',
    ],
  },
  {
    where: 'eg-mix-005',
    find: 'בדיקה: $AC^2 = 18^2 + 24^2 = 900$',
    parts: [
      'בדיקה: $AC^2 = 18^2 + 24^2 = 900$, ולכן $AC = 30$.',
      'וגם $BC^2 = 32^2 + 24^2 = 1600$, ולכן $BC = 40$.',
      'ואכן $\\dfrac{30 \\cdot 40}{2} = 600$ ✓.',
    ],
  },
  {
    where: 'eg-ang-010',
    find: 'הצבה חזרה: $\\angle AMN = 108°$',
    parts: [
      'הצבה חזרה: $\\angle AMN = \\alpha = 108°$.',
      '$\\angle BMN = 180° - 108° = 72°$.',
      '$\\angle KMN = \\dfrac{108}{2} = 54°$.',
    ],
  },
  // ── two sequential moves ──────────────────────────────────────────────────
  {
    where: 'eg-mixed.lesson[1]',
    find: 'בדיקה: $BC^2 = 16^2 + 12^2 = 400$',
    parts: [
      'בדיקה: $BC^2 = 16^2 + 12^2 = 400$, כלומר $BC = 20$.',
      'ואכן $\\dfrac{AC \\cdot BC}{2} = \\dfrac{15 \\cdot 20}{2} = 150$ ✓.',
    ],
  },
  {
    where: 'eg-bag-008/ג',
    find: 'לכן $\\triangle DGE \\sim \\triangle CGB$ לפי ז.ז',
    parts: [
      'לכן $\\triangle DGE \\sim \\triangle CGB$ לפי ז.ז.',
      'יחס הדמיון, לפי סעיף ב: $\\dfrac{DE}{CB} = \\dfrac{7}{14} = \\dfrac{1}{2}$.',
    ],
  },
  {
    where: 'eg-shp-014 (AB)',
    find: 'המיתר $AB$: חציו',
    parts: [
      'המיתר $AB$: חציו $\\dfrac{48}{2} = 24$ ס"מ.',
      'ולכן מרחקו מהמרכז $OM = \\sqrt{25^2 - 24^2} = \\sqrt{625 - 576} = \\sqrt{49} = 7$ ס"מ.',
    ],
  },
  {
    where: 'eg-shp-014 (CD)',
    find: 'המיתר $CD$: חציו',
    parts: [
      'המיתר $CD$: חציו $\\dfrac{14}{2} = 7$ ס"מ.',
      'ולכן מרחקו מהמרכז $ON = \\sqrt{25^2 - 7^2} = \\sqrt{625 - 49} = \\sqrt{576} = 24$ ס"מ.',
    ],
  },
  {
    where: 'eg-bag-007/ג (area)',
    find: 'שטח $\\triangle ABC$ הוא $\\dfrac{1}{2} \\cdot 9 \\cdot 12 = 54$',
    parts: [
      'שטח $\\triangle ABC$ הוא $\\dfrac{1}{2} \\cdot 9 \\cdot 12 = 54$.',
      'ואכן $\\dfrac{19.44}{54} = 0.36 = \\dfrac{9}{25}$ ✓.',
    ],
  },
  {
    where: 'eg-sub-thales-006 (first)',
    find: 'הישר הראשון: $\\triangle ADE \\sim \\triangle ABC$',
    parts: [
      'הישר הראשון: $\\triangle ADE \\sim \\triangle ABC$.',
      'יחס הדמיון: $\\dfrac{AD}{AB} = \\dfrac{3}{12} = \\dfrac14$.',
    ],
  },
  {
    where: 'eg-sub-thales-006 (second)',
    find: 'הישר השני: $AF = AD + DF = 3 + 3 = 6$',
    parts: [
      'הישר השני: $AF = AD + DF = 3 + 3 = 6$ ס"מ.',
      'ולכן $\\dfrac{AF}{AB} = \\dfrac{6}{12} = \\dfrac12$.',
    ],
  },
  {
    where: 'eg-mix-004',
    find: 'יחס השטחים: $\\dfrac{S_{ADE}}{S_{ABC}} = k^2 = \\dfrac19$',
    parts: [
      'יחס השטחים: $\\dfrac{S_{ADE}}{S_{ABC}} = k^2 = \\dfrac19$.',
      'כלומר $S_{ADE} = \\dfrac19 S_{ABC}$.',
    ],
  },
  {
    where: 'eg-sub-sim-008',
    find: 'יחס הדמיון: $k = \\dfrac{AE}{AB} = \\dfrac{3}{9} = \\dfrac{1}{3}$',
    parts: [
      'יחס הדמיון: $k = \\dfrac{AE}{AB} = \\dfrac{3}{9} = \\dfrac{1}{3}$.',
      'ולכן יחס השטחים הוא $k^2 = \\dfrac{1}{9}$.',
    ],
  },
  {
    where: 'eg-sub-sim-004',
    find: 'לכן $k^2 = \\dfrac{16}{25}$, ומכאן',
    parts: [
      'לכן $k^2 = \\dfrac{16}{25}$.',
      'ומכאן $k = \\sqrt{\\dfrac{16}{25}} = \\dfrac{4}{5}$.',
    ],
  },
  {
    where: 'eg-bag-006/ג',
    find: 'בדיקה: $\\angle ABC = \\angle ABD + \\angle DBC$',
    parts: [
      'בדיקה: $\\angle ABC = \\angle ABD + \\angle DBC$.',
      'האלכסון $BD$ הוא חותך של המקבילים $AD \\parallel BC$, ולכן $\\angle DBC = \\angle ADB = 80°$, זוויות מתחלפות.',
      'ואכן $35° + 80° = 115°$ ✓.',
    ],
  },
  {
    where: 'eg-method.lesson[3] (given)',
    find: 'נתון: $AB = AC$, $AD = AE$, ומסעיף א',
    parts: [
      'נתון: $AB = AC$, $AD = AE$, ומסעיף א $\\triangle ABE \\cong \\triangle ACD$.',
      'צריך להוכיח: $\\triangle BDF \\cong \\triangle CEF$.',
    ],
  },
  {
    where: 'eg-method.lesson[3] (adjacent)',
    // Anchored on the CONCLUSION clause, not the opening: this split leaves two
    // parallel facts together in part one, so part one stays "crowded" by the
    // detector and the opening alone would re-match after the split.
    find: 'זוויות צמודות, לכן $\\angle BDF = \\angle CEF$',
    parts: [
      '(3) $\\angle BDF = 180° - \\angle ADC$ וגם $\\angle CEF = 180° - \\angle AEB$, זוויות צמודות.',
      'ומכיוון ש-$\\angle ADC = \\angle AEB$, נובע $\\angle BDF = \\angle CEF$.',
    ],
  },
];

const FILES = [
  'content/lessons/math5/euclidean-geometry.ts',
  'content/lessons/math5/euclidean-stages.ts',
  'content/lessons/math5/euclidean-angles.ts',
];

/** Parsed form → source form. The ONLY transform: a backslash is doubled. */
const toSource = (s: string) => s.split('\\').join('\\\\');

/**
 * Is this line still crowded? claude-3a's detector, and the guard that makes
 * this codemod safe to run twice.
 *
 * Most `find` needles are PREFIXES that survive into the first part of their
 * own split, so a second run would happily split an already-split line and
 * report success while corrupting the content. After a split, part one carries
 * a single calculation and fails this test — so the patch simply does not
 * match, and the script becomes a no-op instead of a wrecking ball.
 */
const isStillCrowded = (line: string) => {
  const calc = (line.match(/\$[^$\n]+\$/g) ?? []).filter(
    (s) => (/\\\\dfrac|\\\\binom|\\\\frac/.test(s) && /=|\\\\cdot|\+|-/.test(s)) || /\\\\cdot/.test(s) || s.length > 22,
  );
  return calc.length >= 2 || calc.join('').length > 85;
};

const WRITE = process.argv.includes('--write');
let applied = 0;
let missing = 0;
let already = 0;

const state = new Map<string, { lines: string[]; eol: string }>();
for (const f of FILES) {
  const raw = readFileSync(f, 'utf8');
  state.set(f, { lines: raw.split(raw.includes('\r\n') ? '\r\n' : '\n'), eol: raw.includes('\r\n') ? '\r\n' : '\n' });
}

for (const p of PATCHES) {
  const needle = toSource(p.find);
  const found: { file: string; idx: number }[] = [];
  for (const [file, st] of state) {
    for (let idx = 0; idx < st.lines.length; idx++) {
      if (st.lines[idx].includes(needle) && isStillCrowded(st.lines[idx])) found.push({ file, idx });
    }
  }
  // Not an error. This is a one-shot codemod; once its split is applied the
  // line is no longer crowded and the patch has nothing to do. Re-running is a
  // no-op that exits 0, which is the behaviour a codemod left in the tree
  // should have.
  if (found.length === 0) { console.log(`  ·  ${p.where} — already applied`); already++; continue; }
  // Ambiguity is a hard stop, not a "take the first": several of these lines
  // are near-identical across bagrut parts, and patching the wrong one would
  // look like success.
  if (found.length > 1) { console.log(`  ❌ ${p.where} — ${found.length} matches, ambiguous`); missing++; continue; }

  const hit = found[0];
  const st = state.get(hit.file)!;
  const line = st.lines[hit.idx];
  const indent = /^\s*/.exec(line)![0];
  const quote = line.trim()[0];
  if (quote !== "'" && quote !== '`') { console.log(`  ❌ ${p.where} — unexpected quote ${quote}`); missing++; continue; }
  if (p.parts.some((t) => t.includes(quote))) { console.log(`  ❌ ${p.where} — a part contains the quote char`); missing++; continue; }
  if (!line.trimEnd().endsWith(quote + ',')) { console.log(`  ❌ ${p.where} — step spans lines`); missing++; continue; }

  st.lines.splice(hit.idx, 1, ...p.parts.map((t) => indent + quote + toSource(t) + quote + ','));
  applied++;
  console.log(`  ✅ ${p.where} — 1 line → ${p.parts.length}`);
}

if (WRITE && !missing) {
  for (const [f, st] of state) writeFileSync(f, st.lines.join(st.eol), 'utf8');
}
console.log(
  `\n${applied} split, ${already} already applied, ${missing} unresolved` +
    `${WRITE ? '' : '  (dry run — pass --write)'}`,
);
if (missing) process.exit(1);
