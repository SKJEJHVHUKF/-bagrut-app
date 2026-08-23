/**
 * verify-content.ts — content quality gate for every hand-authored lesson.
 *   npx tsx scripts/verify-content.ts          (errors fail, warnings print)
 *   npx tsx scripts/verify-content.ts --strict (warnings fail too)
 *
 * Supersedes check-katex-hebrew.ts, which enforced a single rule.
 *
 * WHY IT IMPORTS THE MODULES INSTEAD OF GREPPING THE SOURCE
 * Half these rules are field-scoped: '$= 4 - 3i$' is a perfectly good
 * solution.steps entry and the exact same string is a defect in keyPoints.
 * A raw text scan cannot tell them apart and would drown the real findings in
 * thousands of false positives. Importing also gives us the RENDERED string
 * (\dfrac, not \\dfrac), collapses multi-line template literals into one
 * value, and removes the need to guess about `${}` interpolation.
 * The cost is losing line numbers; `locate()` wins most of them back.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { pathToFileURL } from 'url';
import { checkGeoFences } from '../lib/geo-figure';

const STRICT = process.argv.includes('--strict');
const HEB = /[֐-׿]/;

// Fields carrying Hebrew prose meant for a student to read.
const PROSE_FIELDS = new Set([
  'keyPoints', 'teach', 'summary', 'tagline', 'note', 'meaning', 'explanation',
  'hint', 'hints', 'why', 'mistake', 'correction', 'whereItAppears', 'when',
  'selfCheck', 'payoff', 'hook', 'body', 'plain', 'intro', 'quickReview',
  'title', 'caption', 'brief', 'trap', 'consequence', 'avoid', 'context',
  'problem', 'question', 'finalAnswer', 'answer', 'steps', 'distractorNotes',
  // examTips was missing until 2026-07-28 and is a favourite home for
  // decorative emoji, so its ⚠/🎯/✏️ went unflagged across several lessons.
  'examTips', 'tips', 'tip',
]);

// Fields that are NOT delimited prose — never lint them for $ rules.
//  latex/sym: raw LaTeX by contract (FormulaCard wraps them in $ itself)
//  svg: raw markup; emoji: intentional; expected: machine grading input
const RAW_MATH_FIELDS = new Set(['latex', 'sym']);
const SKIP_FIELDS = new Set([
  'svg', 'viewBox', 'color', 'link', 'id', 'subject', 'topic', 'kind',
  'difficulty', 'answer_type', 'topic_tag', 'subTopicId', 'expected', 'emoji',
  'type', 'paper', 'weight', 'source', 'solutionSource',
]);

// ✓ ✗ ∎ are semantic proof/answer marks, not decoration.
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const EMOJI_ALLOW = new Set(['✓', '✗', '∎', '→', '←', '⇒', '⇔']);

/**
 * The author thinking out loud, shipped to students.
 *
 * Found by a content audit in three places: a word problem whose steps read
 * "אבל זה לא תרגיל יפה — נבדוק שוב" and never fixed the numbers, a part whose
 * solution told the student "בניסוח המקורי של השאלה נפלה טעות סימן", and a
 * "prove the circles are external" question whose own solution admitted they
 * are tangent. Every existing gate passed all three: the LaTeX parses and the
 * arithmetic is internally consistent — it is the PROSE that is broken.
 *
 * Patterns are narrow on purpose. Plain "בעצם" is ordinary Hebrew; only the
 * self-correcting "בעצם:" is not. Negative-tested against 5 planted defects
 * and 5 normal lines before being wired in.
 */
const AUTHOR_MONOLOGUE: { re: RegExp; why: string }[] = [
  { re: /נבדוק שוב|נבדק שוב/, why: 'author re-checking their own work' },
  // Must blame the QUESTION, not the student's working. A bare "נפלה טעות" is
  // exactly what a good distractor note says about the mistake the student made
  // ("בפתרון המשוואה נפלה טעות סימן…") — matching that flagged correct content.
  { re: /בניסוח המקורי|טעות בניסוח|נפלה טעות בשאלה|יש טעות בשאלה/, why: 'admits the question is broken' },
  { re: /לא ריבוע שלם|לא יוצא יפה|לא תרגיל יפה|לא נותן ערך יפה|ערך יפה/, why: 'complains the numbers are ugly' },
  { re: /נסה ערכים|ננסה ערכים|נציב ערכים ונראה/, why: 'author guessing values' },
  { re: /לא תרגיל סטנדרטי|לא סטנדרטי/, why: 'flags the question as odd' },
  { re: /בעצם:|בעצם תשובה|למעשה תשובה/, why: 'self-correction mid-solution' },
  { re: /לא .{0,12} ממש, אלא|בעצם נוגעים/, why: 'solution contradicts its own prompt' },
  { re: /החסר .{0,20}ברשימה|חסרה אופציה|אין אופציה/, why: 'notes a missing option' },
];

type Sev = 'error' | 'warn';
type Finding = { rule: string; sev: Sev; file: string; path: string; value: string };
const findings: Finding[] = [];
const add = (rule: string, sev: Sev, file: string, path: string, value: string) =>
  findings.push({ rule, sev, file, path, value });

/** Split a string into its math spans, neutralising escaped `\$` (currency). */
function mathSpans(s: string): string[] {
  const spans: string[] = [];
  const t = s.replace(/\\+\$/g, '¤');
  t.replace(/\$\$([\s\S]*?)\$\$/g, (_m, g: string) => (spans.push(g), ' '))
    .replace(/\$([^$\n]+?)\$/g, (_m, g: string) => (spans.push(g), ' '));
  return spans;
}

/** Count of unescaped `$`. Odd ⇒ a delimiter was never closed. */
const dollarCount = (s: string) => (s.replace(/\\+\$/g, '¤').match(/\$/g) ?? []).length;

/** Strip all math, leaving only the prose. */
const proseOnly = (s: string) =>
  s.replace(/\\+\$/g, '¤').replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$[^$\n]+?\$/g, '');

function checkString(file: string, path: string, key: string, value: string) {
  if (!value.trim()) return;

  // Raw-LaTeX fields: the whole value is math, so Hebrew anywhere is a bug.
  if (RAW_MATH_FIELDS.has(key)) {
    if (HEB.test(value)) add('hebrew-in-math', 'error', file, path, value);
    return;
  }
  if (SKIP_FIELDS.has(key)) return;

  // A ```geo sketch is a model of the question: every mark it makes (right
  // angle, "50°", parallel, equal ticks, point on circle, lengths to scale) is
  // checked against its own coordinates, so a figure can never contradict the
  // question it illustrates.
  if (value.includes('```geo')) for (const e of checkGeoFences(value)) add('geo-figure', 'error', file, path, e);

  for (const span of mathSpans(value)) {
    if (HEB.test(span)) add('hebrew-in-math', 'error', file, path, span);
  }

  if (dollarCount(value) % 2 !== 0) add('unbalanced-dollars', 'error', file, path, value);

  // $$display$$ is a standalone block; prose on the same line breaks the layout.
  if (value.includes('$$')) {
    for (const line of value.split('\n')) {
      if (line.includes('$$') && proseOnly(line).trim() !== '') {
        add('display-math-inline', 'error', file, path, line);
      }
    }
  }

  // DELIBERATELY NOT CHECKED — these were bidi workarounds, and the bidi bug
  // they worked around is now fixed at the rendering layer. Re-adding them
  // would bury the real findings under ~14k false alarms:
  //   trailing-math-punct   "…$math$."  — 8343 hits. Verified in-browser: the
  //     trailing period lands correctly at the left end of the RTL line.
  //     Each .katex is unicode-bidi:isolate (an atomic neutral) inside a
  //     dir="rtl" paragraph, so UAX#9 N1 resolves the neutral run to RTL.
  //   prose-starts-with-math — 1298 hits. Verified: a bullet opening with
  //     "$z \cdot \bar{z} = |z|^2$" now renders in source order, dir:rtl.
  //     The old `:has(> .katex:first-child){direction:ltr}` rule was what
  //     broke these; it is gone.
  //   dfrac-inline — 4185 hits, and STYLE_GUIDE prescribes \dfrac as house
  //     style. Taller line boxes are the intended look, not a defect.
  const isProse = PROSE_FIELDS.has(key);
  if (isProse && HEB.test(value)) {
    for (const ch of value) {
      if (EMOJI.test(ch) && !EMOJI_ALLOW.has(ch)) {
        add('decorative-emoji', 'warn', file, path, `${ch}  in: ${value.slice(0, 60)}`);
        break;
      }
    }
  }

  // Total length, NOT prose-only: stripping the math first penalises perfectly
  // good math-dense takeaways ("וייטה: $x_1+x_2=-b/a$, $x_1x_2=c/a$.") whose
  // whole value IS the point. Only a bullet that is short outright is thin.
  if (key === 'keyPoints' && value.trim().length < 30) {
    add('terse-keypoint', 'warn', file, path, value);
  }

  for (const { re, why } of AUTHOR_MONOLOGUE) {
    const m = value.match(re);
    if (m) add(`author-monologue:${why}`, 'error', file, path, `"${m[0]}"  in: ${value.slice(0, 90)}`);
  }

  // The American parabola, taught as if it were ours.
  //
  // CLAUDE.md rule 6: the 5-unit convention is y²=2px, focus (p/2,0), directrix
  // x=-p/2. A past paper's worked solution stated y²=4px, focus (p,0) — and the
  // final numbers still came out right (the question hands you the focus), so
  // every existing gate passed it. The student learned 2px, was marked wrong for
  // 4px in the quiz, then met 4px again in the Pro archive as "canonical".
  //
  // Scoped to past-bagruyot ON PURPOSE: lessons/ and concept-quiz/ name 4px five
  // times as the foreign convention to avoid, and a blanket rule would flag
  // exactly the passages that teach the distinction.
  if (file.includes('past-bagruyot') && /4px/.test(value)) {
    add('foreign-parabola-convention', 'error', file, path, value.slice(0, 120));
  }
}

function walkValue(file: string, path: string, key: string, v: unknown) {
  if (typeof v === 'string') return checkString(file, path, key, v);
  if (Array.isArray(v)) return v.forEach((x, i) => walkValue(file, `${path}[${i}]`, key, x));
  if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      walkValue(file, `${path}.${k}`, k, val);
    }
  }
}

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkFiles(p, out);
    else if (name.endsWith('.ts') && name !== 'types.ts' && name !== 'index.ts') out.push(p);
  }
  return out;
}

/**
 * Typed walking gives us the rendered string but loses the source line.
 * Re-derive it by searching the raw file for the value with JS escaping
 * re-applied. Falls back to null for template literals and .join()ed values.
 */
function locate(file: string, value: string): number | null {
  const needle = value.slice(0, 40).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  if (needle.length < 8) return null;
  const lines = readFileSync(file, 'utf8').split(/\r?\n/); // CRLF-safe
  const i = lines.findIndex((l) => l.includes(needle));
  return i === -1 ? null : i + 1;
}

const ROOTS = [
  'content/lessons',
  'content/learning-paths',
  'content/advanced-courses',
  'content/past-bagruyot',
  'content/concept-quiz',
  'content/cognition',
  'content/ghost-replay',
  'content/topics',
].filter((d) => {
  try {
    return statSync(d).isDirectory();
  } catch {
    return false;
  }
});

const files = ROOTS.flatMap((d) => walkFiles(d));
let loaded = 0;

// Wrapped in an async main: tsx transforms to CJS, which has no top-level await.
async function main() {
for (const f of files) {
  let mod: Record<string, unknown>;
  try {
    mod = (await import(pathToFileURL(f).href)) as Record<string, unknown>;
  } catch (e) {
    console.log(`  ! could not import ${f}: ${(e as Error).message.split('\n')[0]}`);
    continue;
  }
  loaded++;
  const rel = relative(process.cwd(), f).replace(/\\/g, '/');
  for (const [name, val] of Object.entries(mod)) walkValue(rel, name, name, val);
}

// ── report ────────────────────────────────────────────────────────────────
// Key on rule+severity: a rule can emit both, and grouping on the rule alone
// would label the whole group by whichever finding happened to land first.
const byRule = new Map<string, Finding[]>();
for (const f of findings) {
  const k = `${f.sev} ${f.rule}`;
  if (!byRule.has(k)) byRule.set(k, []);
  byRule.get(k)!.push(f);
}

const errors = findings.filter((f) => f.sev === 'error');
const warns = findings.filter((f) => f.sev === 'warn');
const CAP = 20;

for (const [, list] of [...byRule.entries()].sort((a, b) => {
  const s = (x: Finding[]) => (x[0].sev === 'error' ? 0 : 1);
  return s(a[1]) - s(b[1]) || b[1].length - a[1].length;
})) {
  const sev = list[0].sev;
  console.log(`\n${sev === 'error' ? '✗' : '⚠'} ${list[0].rule} — ${list.length}`);
  for (const f of list.slice(0, CAP)) {
    const ln = locate(f.file, f.value);
    console.log(
      `   ${f.file}${ln ? ':' + ln : ''}  ${f.path}\n     «${f.value.replace(/\s+/g, ' ').trim().slice(0, 100)}»`,
    );
  }
  if (list.length > CAP) console.log(`   … and ${list.length - CAP} more`);
}

console.log(
  `\nscanned ${loaded}/${files.length} content modules — ${errors.length} error(s), ${warns.length} warning(s).`,
);
if (errors.length > 0 || (STRICT && warns.length > 0)) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

export {};
