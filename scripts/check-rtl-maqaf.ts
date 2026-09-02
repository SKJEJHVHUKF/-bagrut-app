/**
 * check-rtl-maqaf.ts — the maqaf-before-maths defect, repo-wide.
 *
 *   npx tsx scripts/check-rtl-maqaf.ts            gate the enforced surfaces
 *   npx tsx scripts/check-rtl-maqaf.ts --all      report every file
 *
 * THE DEFECT. In RTL Hebrew a maqaf glued to the front of a maths island reads
 * as a MINUS SIGN: `ל-$2\sin x$` renders to a student as "minus 2 sin x", and
 * `מ-$a_1$` as "minus a-one". Nothing in the type system, the renderer or any
 * other gate can see it — it is valid Hebrew, valid markdown and valid KaTeX.
 * It has been swept by hand at least four times in this repo (49 defects in one
 * replay batch, 69 in another, 26 in a third), each time discovered late.
 *
 * WHY A SOURCE SCAN AND NOT A RUNTIME WALK. A runtime walk has to know the shape
 * of every content type, so it silently misses whatever it was not taught about
 * — which is how three separate tools in this project reported success while
 * seeing nothing. `[א-ת]-$` can only ever occur inside a string literal, so
 * reading the files is both complete and safe.
 *
 * ENFORCED vs REPORTED. The surfaces below are clean today and must stay clean.
 * The rest of `content/` carries a pre-existing backlog that predates the rule;
 * those are printed with counts so the number can only go down, but they do not
 * fail the build. Add a directory to ENFORCED once you have swept it — never
 * widen the allowance.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const MAQAF = /[\u05d0-\u05ea]-\$/g;

/** Swept and required to stay clean. Prefix match on the posix-style path. */
const ENFORCED = [
  'content/lessons/math5/trig-functions/',
  'content/ghost-replay/math5/trig-functions.ts',
];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = walk('content')
  .filter((f) => f.endsWith('.ts'))
  .map((f) => f.split('\\').join('/'));

const rows: Array<{ file: string; n: number; enforced: boolean }> = [];
for (const file of files) {
  const n = (readFileSync(file, 'utf8').match(MAQAF) ?? []).length;
  if (!n) continue;
  rows.push({ file, n, enforced: ENFORCED.some((p) => file.startsWith(p)) });
}
rows.sort((a, b) => b.n - a.n);

const broken = rows.filter((r) => r.enforced);
const backlog = rows.filter((r) => !r.enforced);
const backlogTotal = backlog.reduce((s, r) => s + r.n, 0);

if (process.argv.includes('--all')) {
  for (const r of backlog) console.log(`  ${String(r.n).padStart(4)}  ${r.file}`);
}

console.log(
  `rtl-maqaf: scanned ${files.length} content modules · ` +
    `${broken.length} enforced file(s) broken · ` +
    `backlog ${backlogTotal} hit(s) in ${backlog.length} unswept file(s)`,
);

if (broken.length) {
  console.log('\nA maqaf glued to a maths island renders as a minus sign in RTL:');
  for (const r of broken) console.log(`  FAIL  ${r.n}  ${r.file}`);
  console.log(
    '\nRephrase rather than delete the maqaf: `ל-$x$` -> `לביטוי $x$`, ' +
      '`ב-$0$` -> `בערך $0$`, `מ-$3$` -> `מהערך $3$`, `ו-$y$` -> `וגם $y$`.',
  );
  process.exitCode = 1;
}

export {};
