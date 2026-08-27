/**
 * test-tichon-notation.ts — the runtime half of the notation gate.
 *
 *   npx tsx scripts/test-tichon-notation.ts
 *
 * FREE. `check:notation` scans authored files; this covers
 * `findUniversityNotation`, which runs on GENERATED solutions at request time.
 * The first case below is copied from a real production screenshot
 * (2026-08-26) — a scanned solution that rendered set-theory notation to a
 * 5-unit student while the build-time gate stayed green.
 */

import { findUniversityNotation } from '../lib/tichon-notation';

let checks = 0;
let failures = 0;
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) {
    failures++;
    console.log(`FAIL  ${msg}`);
  }
};

// ---- what actually shipped to a student ----
{
  const real = 'כאשר $a$ הוא פרמטר חיובי, והתחום: $x \\in \\mathbb{R}$.';
  ok(findUniversityNotation(real).length > 0, 'catches \\mathbb{R} as it appeared in production');
}
{
  const real = 'תחום חיוביות: $x \\in \\mathbb{R} \\setminus \\{0\\}$';
  const hits = findUniversityNotation(real);
  ok(hits.length >= 2, 'catches both \\mathbb{R} and \\setminus in the same line');
}
for (const sym of ['\\forall', '\\exists', '\\emptyset', '\\therefore', '∀', 'ℝ', '■']) {
  ok(findUniversityNotation(`צעד: ${sym} משהו`).length > 0, `catches ${sym}`);
}

// ---- what must NOT be flagged ----
{
  // The rewrite the prompt asks for.
  ok(findUniversityNotation('לכל $x$ פרט לאפס מתקיים $h(x) > 0$').length === 0,
    'the Hebrew rewrite is clean');
}
{
  // Probability is written P(description) by house rule and is legitimate.
  ok(findUniversityNotation('P(מאורע) $= 0.4$').length === 0, 'probability notation is not flagged');
  ok(findUniversityNotation('$P(A \\cap B) = 0.2$').length === 0, 'P(A∩B) is not flagged');
}
{
  // ⟹ is the ordinary step arrow Israeli teachers write; banning it would
  // strip the connector out of half the solution chains.
  ok(findUniversityNotation('$x^2 = 4 \\Longrightarrow x = \\pm 2$').length === 0,
    '\\Longrightarrow stays allowed');
}
{
  ok(findUniversityNotation('').length === 0, 'empty text is clean');
}

console.log(`\n${failures === 0 ? '✅' : '❌'}  ${checks - failures}/${checks} passed`);
process.exit(failures === 0 ? 0 : 1);
