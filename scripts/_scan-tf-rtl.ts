/** RTL dash scan for the new trig-functions stages — the two defects the prose
 *  gates do not cover on this surface. Counting is done here, never in bash:
 *  a bash-escaped `\$` probe silently returns 0. TEMP. */
import { TF_STAGES } from '../content/lessons/math5/trig-functions';
import { TF_GHOST_REPLAYS } from '../content/ghost-replay/math5/trig-functions';

const MAQAF = /[א-ת]-\$/g;
const TOUCHING = /(\$[^$\n]{0,80}\$\s*—|—\s*\$)/g;
const ANY = / — /g;

for (const st of TF_STAGES) {
  const bits: string[] = [st.title, st.tagline ?? '', st.summary ?? '', ...(st.keyPoints ?? [])];
  for (const f of st.formulas ?? []) {
    bits.push(f.name, f.note ?? '', ...(f.variables ?? []).map((v) => v.meaning));
  }
  for (const s of st.lesson ?? []) {
    bits.push(s.title, s.teach);
    if (s.example) bits.push(s.example.problem, ...s.example.steps, s.example.answer);
    const d = s.drill;
    if (d) {
      bits.push(String(d.question), d.hint ?? '', ...(d.answers ?? []).map(String));
      bits.push(...(d.distractorNotes ?? []).filter(Boolean).map(String));
      if (d.solution) bits.push(...d.solution.steps, d.solution.finalAnswer, d.solution.explanation ?? '');
    }
  }
  for (const q of st.questions ?? []) {
    bits.push(String(q.question), q.hint ?? '', ...(q.answers ?? []).map(String));
    bits.push(...(q.distractorNotes ?? []).filter(Boolean).map(String));
    bits.push(...(q.wrongAnswers ?? []).map((w) => w.note));
    if (q.solution) bits.push(...q.solution.steps, q.solution.finalAnswer, q.solution.explanation ?? '');
  }

  report(st.id, bits);
}

// The replays are a SECOND prose surface on the same track. The rq batch shipped
// 69 maqaf defects there while every lesson file scanned clean, because the
// scanner only ever read the lessons.
for (const r of TF_GHOST_REPLAYS) {
  const bits: string[] = [r.title, r.prompt, r.closing];
  for (const s of r.steps) {
    bits.push(s.title, s.coreLogic, s.reveal, s.commitPrompt.question);
    if (s.examinerTrap) bits.push(s.examinerTrap.warning, s.examinerTrap.description);
    bits.push(...s.commitPrompt.options.map((o) => o.text));
    for (const b of s.branches) bits.push(b.whyItFails, b.costInExam ?? '', b.backOnTrack);
  }
  report(r.id, bits);
}

function report(id: string, bits: string[]) {
  let maqaf = 0, touching = 0, prose = 0;
  const hits: string[] = [];
  for (const b of bits.filter(Boolean)) {
    const m = b.match(MAQAF) ?? [];
    const t = b.match(TOUCHING) ?? [];
    maqaf += m.length;
    touching += t.length;
    prose += Math.max(0, (b.match(ANY) ?? []).length - t.length);
    for (const frag of [...m, ...t]) {
      const at = b.indexOf(frag.trim());
      hits.push(`      …${b.slice(Math.max(0, at - 45), at + 40).replace(/\n/g, ' ')}…`);
    }
  }
  console.log(
    `${id}: maqaf ${maqaf} · dash-touching-maths ${touching} · prose dashes kept ${prose}` +
      `  -> ${maqaf + touching === 0 ? 'CLEAN' : 'TO FIX'}`,
  );
  hits.slice(0, 20).forEach((h) => console.log(h));
}

export {};
