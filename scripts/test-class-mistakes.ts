/**
 * test-class-mistakes.ts — the overlap a teacher teaches to.
 *
 *   npx tsx scripts/test-class-mistakes.ts
 *
 * WHY THIS EXISTS
 * `classMistakes` decides whether a teacher gives a LESSON or has a five-minute
 * talk, and every way it can be wrong is quiet — none of them throw:
 *
 *   - merging two different misconceptions that share a sub-topic sends the
 *     whole class practice for a mistake most of them never made;
 *   - splitting one misconception across students hides the lesson entirely,
 *     because every group reads "1 תלמיד";
 *   - counting a student twice inflates the headcount that decides it;
 *   - unstable ordering makes the same class read differently on every reload,
 *     which is how a teacher stops trusting the screen.
 *
 * Runs the REAL function, asserts on its OUTPUT.
 */

import { classMistakes, type StudentMistakes, type Weakness } from '../lib/class-mistakes';

const names = new Map([
  ['s1', 'דנה'],
  ['s2', 'רן'],
  ['s3', 'שיר'],
]);

const w = (over: Partial<Weakness> = {}): Weakness => ({
  kind: 'misconception',
  topic: 'הסתברות',
  subTopicId: 'prob-without',
  title: 'מחשב שליפה עם החזרה כשנדרשת בלי',
  detail: 'המכנה יורד בכל שליפה.',
  chronic: false,
  ...over,
});

let ran = 0;
let failed = 0;

function check(what: string, cond: boolean, extra = '') {
  ran++;
  if (cond) console.log(`  ✓ ${what}`);
  else {
    failed++;
    console.error(`  ✗ ${what}${extra ? `\n      ${extra}` : ''}`);
  }
}

console.log('\ntest:class-mistakes — the same mistake, across a class\n');

// ── the point of the whole file ───────────────────────────────────────────
{
  const by: Record<string, StudentMistakes> = {
    s1: { weaknesses: [w()] },
    s2: { weaknesses: [w()] },
    s3: { weaknesses: [w()] },
  };
  const out = classMistakes(by, names);
  check('three students with one mistake collapse to ONE group', out.length === 1, `got ${out.length}`);
  check('and it names all three', out[0]?.students.length === 3);
  check(
    'with their ids, so the practice can go to exactly them',
    out[0]?.students.map((s) => s.id).join(',') === 's1,s2,s3',
    JSON.stringify(out[0]?.students)
  );
}

// ── the merge that would be a lie ─────────────────────────────────────────
{
  const by: Record<string, StudentMistakes> = {
    s1: { weaknesses: [w({ title: 'טעות א' })] },
    s2: { weaknesses: [w({ title: 'טעות ב' })] },
  };
  const out = classMistakes(by, names);
  check('two DIFFERENT misconceptions in one sub-topic stay apart', out.length === 2, `got ${out.length}`);
}
{
  const by: Record<string, StudentMistakes> = {
    s1: { weaknesses: [w({ subTopicId: 'a', kind: 'subtopic', title: 'חזרה' })] },
    s2: { weaknesses: [w({ subTopicId: 'b', kind: 'subtopic', title: 'חזרה' })] },
  };
  const out = classMistakes(by, names);
  check('one title in two different sub-topics stays apart', out.length === 2, `got ${out.length}`);
}

// ── double counting ───────────────────────────────────────────────────────
{
  const by: Record<string, StudentMistakes> = { s1: { weaknesses: [w(), w()] } };
  const out = classMistakes(by, names);
  check('the same student twice counts once', out[0]?.students.length === 1, `got ${out[0]?.students.length}`);
}

// ── ordering: headcount decides lesson-vs-conversation ────────────────────
{
  const by: Record<string, StudentMistakes> = {
    s1: { weaknesses: [w({ title: 'נדיר' }), w({ title: 'נפוץ' })] },
    s2: { weaknesses: [w({ title: 'נפוץ' })] },
    s3: { weaknesses: [w({ title: 'נפוץ' })] },
  };
  const out = classMistakes(by, names);
  check('the mistake three students share sorts first', out[0]?.title === 'נפוץ', `got "${out[0]?.title}"`);
  check('the one-student mistake is still reported, not dropped', out.length === 2);
}
{
  // Equal headcount: a named cause beats a merely-located one, because only
  // one of them tells the teacher what to say.
  const by: Record<string, StudentMistakes> = {
    s1: { weaknesses: [w({ kind: 'subtopic', title: 'זווית בין וקטורים', subTopicId: 'v1' })] },
    s2: { weaknesses: [w({ kind: 'misconception', title: 'מחבר וקטורים רכיב-רכיב הפוך', subTopicId: 'v2' })] },
  };
  const out = classMistakes(by, names);
  check('at equal headcount the NAMED cause sorts first', out[0]?.kind === 'misconception', `got ${out[0]?.kind}`);
}

// ── stability ─────────────────────────────────────────────────────────────
{
  const by: Record<string, StudentMistakes> = {
    s3: { weaknesses: [w()] },
    s1: { weaknesses: [w()] },
    s2: { weaknesses: [w()] },
  };
  // Insertion order of the record is deliberately scrambled; roster order wins.
  const out = classMistakes(by, names);
  check(
    'student order follows the roster, not the query',
    out[0]?.students.map((s) => s.id).join(',') === 's1,s2,s3',
    JSON.stringify(out[0]?.students.map((s) => s.id))
  );
}

// ── chronic ───────────────────────────────────────────────────────────────
{
  const by: Record<string, StudentMistakes> = {
    s1: { weaknesses: [w({ chronic: true })] },
    s2: { weaknesses: [w()] },
    s3: { weaknesses: [w({ chronic: true })] },
  };
  const out = classMistakes(by, names);
  check('counts how many it came BACK for', out[0]?.chronicCount === 2, `got ${out[0]?.chronicCount}`);
}

// ── empty ─────────────────────────────────────────────────────────────────
{
  check('a class with no data yields no claims', classMistakes({}, names).length === 0);
  check(
    'a student not on the roster is ignored, not crashed on',
    classMistakes({ ghost: { weaknesses: [w()] } }, names).length === 0
  );
}

console.log(`\n${ran} checks, ${failed} failed\n`);
if (failed > 0) process.exit(1);
