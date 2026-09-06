/** Probe: how crowded is a solution step? Itay, 2026-09-06, on a phone:
 *  "בפתרונות התשובות דחוסים... שום דבר לא יהיה דחוס והכל יהיה מובן."
 *  A step that packs two or more calculations into one running line wraps into
 *  a wall of fractions on a narrow screen. Count them, per topic and per file. */
import { getLesson } from '../content/lessons';
import type { PracticeQuestion } from '../content/lessons/types';

const TOPICS = process.argv[2] ? [process.argv[2]] : ['הסתברות'];

/** Math islands in one line, ignoring display math (already on its own line). */
function islands(line: string): string[] {
  return line.match(/\$[^$\n]+\$/g) ?? [];
}
/** A TALL island: a fraction, a binomial or a multiplication chain. `$n = 6$`
 *  is not what makes a line unreadable on a phone; three stacked fractions are. */
const isCalc = (s: string) =>
  (/\\dfrac|\\binom|\\frac/.test(s) && /=|\\cdot|\+|-/.test(s)) || /\\cdot/.test(s) || s.length > 22;

let steps = 0;
let crowded = 0;
const worst: { id: string; n: number; chars: number; text: string }[] = [];

for (const topic of TOPICS) {
  const lesson = getLesson('math5', topic);
  if (!lesson) continue;
  const qs: { id: string; steps: string[] }[] = [];
  for (const st of lesson.subTopics ?? []) {
    for (const q of (st.questions ?? []) as PracticeQuestion[]) {
      qs.push({ id: q.id, steps: q.solution?.steps ?? [] });
    }
  }
  for (const b of lesson.bagrutQuestions ?? []) {
    for (const p of b.parts ?? []) qs.push({ id: `${b.id}/${p.label}`, steps: p.solution?.steps ?? [] });
  }
  for (const q of qs) {
    for (const step of q.steps) {
      for (const line of step.split('\n')) {
        // A display block alone on its line IS the airy form — that is the fix,
        // so counting it as crowding would make the measure unable to go green.
        const tl = line.trim();
        // A pipe mid-line is conditional notation, not a table row.
        if (!tl || tl.startsWith('```') || tl.startsWith('$$') || tl.startsWith('|')) continue;
        steps++;
        const calc = islands(line).filter(isCalc);
        const mathChars = calc.join('').length;
        // 85, not 60: a label plus ONE product with its reduction
        // ("המסלול חלב-חלב: $\dfrac38 \cdot \dfrac27 = \dfrac{6}{56} = \dfrac{3}{28}$")
        // is the target form and wraps at most once on a phone. Beyond ~85 the
        // chain needs its own display line.
        if (calc.length >= 2 || mathChars > 85) {
          crowded++;
          worst.push({ id: q.id, n: calc.length, chars: mathChars, text: line.slice(0, 90) });
        }
      }
    }
  }
}

worst.sort((a, b) => b.n - a.n || b.chars - a.chars);
console.log(`${TOPICS.join(', ')}: ${crowded} crowded line(s) of ${steps} — ${((crowded / steps) * 100).toFixed(1)}%`);
const byId = new Map<string, number>();
for (const w of worst) byId.set(w.id, (byId.get(w.id) ?? 0) + 1);
console.log(`${byId.size} question(s)/part(s) affected\n`);
const LIMIT = Number(process.argv[3] ?? 20);
for (const w of worst.slice(0, LIMIT)) console.log(`  ${w.id.padEnd(22)} ${w.n} calcs, ${w.chars} chars  ${w.text}`);
const fam = new Map<string, number>();
for (const w of worst) {
  const f = w.id.replace(/\/.*$/, '').replace(/-\d+$/, '');
  fam.set(f, (fam.get(f) ?? 0) + 1);
}
console.log('\nby family:');
for (const [f, n] of [...fam].sort((a, b) => b[1] - a[1])) console.log(`  ${f.padEnd(24)} ${n}`);
