/**
 * check-tichon-notation.ts — keep university notation out of student-facing content.
 *
 * The app teaches 5-יח"ל תיכון, not a university logic course. A student who has
 * never seen ∀ or P(n) reads them as noise, so every symbol below has to be
 * written in Hebrew words instead. Added after an induction formula card shipped
 * reading "P(1) ∧ (P(k) ⇒ P(k+1)) ⇒ ∀n P(n)".
 *
 *   npx tsx scripts/check-tichon-notation.ts
 *
 * NOT banned, deliberately: ⟹ / ⇐ / \Longrightarrow — those are the ordinary
 * step arrows Israeli teachers write on the board ("לכן", "נובע"), in both
 * text directions. Ban them and half the solution chains lose their connector.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

import { TICHON_NOTATION_RULES as RULES } from '../lib/tichon-notation';

// Only student-facing content. lib/ prompts and scripts/ are developer-facing.
const ROOTS = [
  'content/lessons',
  'content/learning-paths',
  'content/advanced-courses',
  'content/past-bagruyot',
  'content/topics',
  'content/ghost-replay',
  'content/concept-quiz',
  'content/cognition',
].filter((d) => {
  try {
    return statSync(d).isDirectory();
  } catch {
    return false;
  }
});

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|json|md)$/.test(name)) out.push(p);
  }
  return out;
}

// Developer comments are not shown to students. "* " is a JSDoc continuation;
// "**bold**" is Markdown and must still be checked.
const isComment = (l: string) => /^\s*(\/\/|\/\*|\*\s)/.test(l);
const INDUCTION = /אינדוקצי|הנחת|הטענה|טענה/;

const files = ROOTS.flatMap((d) => walk(d));
let problems = 0;
const offenders = new Set<string>();
for (const f of files) {
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (isComment(line)) return;
      for (const { pattern, why } of RULES) {
        // the proposition rule needs induction context to avoid probability P(k)
        if (pattern.source.startsWith('\\bP\\(') && !INDUCTION.test(line)) continue;
        const hits = line.match(pattern);
        if (!hits) continue;
        problems += hits.length;
        offenders.add(f);
        console.log(`  ✗ ${f}:${i + 1}  «${hits[0]}» — ${why}`);
      }
    });
}
console.log(
  `\n${problems} university-notation hit(s) across ${offenders.size} file(s); scanned ${files.length} files.`,
);
if (problems > 0) process.exit(1);

export {};
