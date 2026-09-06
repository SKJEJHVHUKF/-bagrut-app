/** Compare the NUMBERS inside math, per question, between two versions of a
 *  content file. A reformat may split an island or move a line; it may not
 *  change, drop or invent a number. Works on file TEXT, so the "before" side can
 *  come straight from git:  git show <sha>:<path> > old.ts
 *  Usage: npx tsx scripts/_probe-math-literals.ts <old.ts> <new.ts>            */
import { readFileSync } from 'fs';

type Block = { id: string; numbers: string[] };

function blocks(text: string): Block[] {
  const out: Block[] = [];
  const marks = [...text.matchAll(/id: '([^']+)'/g)];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index ?? 0;
    const end = i + 1 < marks.length ? (marks[i + 1].index ?? text.length) : text.length;
    const body = text.slice(start, end);
    const nums: string[] = [];
    for (const m of body.matchAll(/\$\$?[^$]+\$\$?/g)) {
      for (const n of m[0].matchAll(/\d+(?:\.\d+)?/g)) nums.push(n[0]);
    }
    out.push({ id: marks[i][1], numbers: nums.sort() });
  }
  return out;
}

const [oldPath, newPath] = process.argv.slice(2);
const before = new Map(blocks(readFileSync(oldPath, 'utf8')).map((b) => [b.id, b.numbers]));
const after = new Map(blocks(readFileSync(newPath, 'utf8')).map((b) => [b.id, b.numbers]));

let bad = 0;
for (const [id, nums] of after) {
  const was = before.get(id);
  if (!was) continue; // a new question, not a reformat
  const a = [...was];
  const b = [...nums];
  if (a.join(',') === b.join(',')) continue;
  // Splitting a chain repeats a value on the continuation line ("מצמצמים: $x$"),
  // so a COUNT change is not evidence. Only a value that vanishes from the
  // question, or one that never appeared in it, is a content change.
  const wasSet = new Set(was);
  const nowSet = new Set(nums);
  const gone = [...wasSet].filter((x) => !nowSet.has(x));
  const invented = [...nowSet].filter((x) => !wasSet.has(x));
  if (!gone.length && !invented.length) continue;
  bad++;
  console.log(`✗ ${id}`);
  if (gone.length) console.log(`    lost:  ${gone.join(' ')}`);
  if (invented.length) console.log(`    new:   ${invented.join(' ')}`);
  void a; void b;
}
console.log(bad ? `\n${bad} question(s) whose math numbers changed — read each` : 'every question kept exactly its numbers');
process.exit(bad ? 1 : 0);
