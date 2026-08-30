/**
 * _scan-rtl-dashes.ts — count the two RTL dash defects on the STUDENT-VISIBLE
 * strings of Ghost Replays, per topic.
 *
 *   npx tsx scripts/_scan-rtl-dashes.ts [--detail]
 *
 * Walks the replay objects rather than the file text, so English header
 * comments, ids and option keys cannot inflate the count. Counting is done here
 * and never in bash: a bash-escaped `\$` probe silently returns 0.
 *
 * Two defects, both from the owner's RTL rule:
 *   maqaf gluing a Hebrew prefix onto a maths island   מ-$a$
 *   an em-dash TOUCHING a maths island                 $a$ — …   or   … — $a$
 * A dash with no maths beside it is ordinary Hebrew typography and is counted
 * separately as "prose" so it is never swept by mistake.
 */
import { getGhostReplays } from '../content/ghost-replay';
import type { GhostReplay } from '../content/ghost-replay/types';

const TOPICS = process.argv.filter((a) => !a.startsWith('-')).slice(2);
const LIST = TOPICS.length
  ? TOPICS
  : ['גיאומטריה אוקלידית', 'גאומטריה אנליטית', 'הסתברות', 'סדרות'];
const detail = process.argv.includes('--detail');

/** Every string a student can read in one replay, with a path for reporting. */
function strings(r: GhostReplay): Array<[string, string]> {
  const out: Array<[string, string]> = [['prompt', r.prompt], ['title', r.title], ['closing', r.closing]];
  r.steps.forEach((s, i) => {
    const p = `step${s.stepNumber ?? i + 1}`;
    out.push([`${p}.title`, s.title], [`${p}.coreLogic`, s.coreLogic], [`${p}.reveal`, s.reveal]);
    if (s.examinerTrap) {
      out.push([`${p}.trap.warning`, s.examinerTrap.warning], [`${p}.trap.description`, s.examinerTrap.description]);
    }
    out.push([`${p}.q`, s.commitPrompt.question]);
    s.commitPrompt.options.forEach((o, j) => out.push([`${p}.opt${j}`, o.text]));
    s.branches.forEach((b, j) => {
      out.push([`${p}.br${j}.why`, b.whyItFails], [`${p}.br${j}.back`, b.backOnTrack]);
      if (b.costInExam) out.push([`${p}.br${j}.cost`, b.costInExam]);
    });
  });
  return out.filter(([, v]) => typeof v === 'string' && v.length > 0);
}

const MAQAF = /[א-ת]-\$/g;
const TOUCHING = /(\$[^$\n]{0,80}\$\s*—|—\s*\$)/g;
const ANY_DASH = / — /g;

let grand = 0;
for (const topic of LIST) {
  const replays = getGhostReplays('math5', topic);
  if (!replays.length) { console.log(`\n${topic}: no replays registered`); continue; }
  let maqaf = 0, touching = 0, prose = 0, n = 0;
  const hits: string[] = [];
  for (const r of replays) {
    for (const [path, s] of strings(r)) {
      n += 1;
      const m = s.match(MAQAF) ?? [];
      const t = s.match(TOUCHING) ?? [];
      const d = s.match(ANY_DASH) ?? [];
      maqaf += m.length;
      touching += t.length;
      prose += Math.max(0, d.length - t.length);
      if (detail && (m.length || t.length)) {
        for (const frag of [...m, ...t]) {
          const at = s.indexOf(frag.trim());
          hits.push(`    ${r.id}/${path}: …${s.slice(Math.max(0, at - 40), at + frag.length + 30).replace(/\n/g, ' ')}…`);
        }
      }
    }
  }
  grand += maqaf + touching;
  const verdict = maqaf + touching === 0 ? 'CLEAN' : `${maqaf + touching} TO FIX`;
  console.log(
    `\n${topic}\n  ${replays.length} replays · ${n} strings` +
      `\n  maqaf before maths : ${maqaf}` +
      `\n  dash touching maths: ${touching}` +
      `\n  prose dashes (keep): ${prose}   -> ${verdict}`,
  );
  if (detail) hits.slice(0, 40).forEach((h) => console.log(h));
}
console.log(`\nTOTAL defects across the scanned topics: ${grand}`);

export {};
