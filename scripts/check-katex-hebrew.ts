/**
 * check-katex-hebrew.ts — guard against Hebrew inside KaTeX math.
 * Hebrew between $...$ or $$...$$ renders REVERSED (KaTeX has no bidi). This
 * scans every content file, extracts each inline/display math span, and flags
 * any span containing a Hebrew character — whether via \text{}, a subscript,
 * or raw. Hebrew must always live OUTSIDE the math.
 *   npx tsx scripts/check-katex-hebrew.ts
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const HEB = /[֐-׿]/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|json|md)$/.test(name)) out.push(p);
  }
  return out;
}

function mathSpans(line: string): string[] {
  const spans: string[] = [];
  // Escaped dollar (currency like \$5000) is NOT a math delimiter — neutralize.
  line = line.replace(/\\+\$/g, '¤');
  // display $$...$$ first
  let s = line.replace(/\$\$([^$]*)\$\$/g, (_m, g: string) => {
    spans.push(g);
    return ' ';
  });
  // then inline $...$ — but NOT JS template interpolation `${...}`.
  s.replace(/\$(?!\{)([^$\n]+?)\$/g, (_m, g: string) => {
    spans.push(g);
    return ' ';
  });
  return spans;
}

// Only the dirs that actually hold KaTeX lesson data (skip prompt/config code).
const ROOTS = [
  'content/lessons',
  'content/learning-paths',
  'content/advanced-courses',
  'content/past-bagruyot',
  'content/topics',
].filter((d) => {
  try {
    return statSync(d).isDirectory();
  } catch {
    return false;
  }
});
const files = ROOTS.flatMap((d) => walk(d));
let problems = 0;
const offenders = new Set<string>();
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const span of mathSpans(line)) {
      if (HEB.test(span)) {
        problems++;
        offenders.add(f);
        console.log(`  ✗ ${f}:${i + 1}  «${span.trim().slice(0, 80)}»`);
      }
    }
  });
}
console.log(
  `\n${problems} Hebrew-in-KaTeX span(s) across ${offenders.size} file(s); scanned ${files.length} files.`,
);
if (problems > 0) process.exit(1);

export {};
