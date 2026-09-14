// Round-3 re-derivation helpers: the CLAIM is read from the live content, the
// COMPUTATION is the verifier's own.
//
// The round-1/2 checkers in this folder typed each published value in by hand
// (`check('101', olderTent, 30)`). A checker holding its own copy of the answer
// keeps passing after the question changes — measured on another topic, a
// re-derivation file printed 279/279 over four questions that had been
// rewritten. So round 3 never copies an answer:
//
//   checkLive(label, ref, got)   ref = 'pr-x-tab-305' or 'prob-bag-x-tab-07/ב';
//                                `got` is computed from the statement; the
//                                expected value is read from the content now.
//   reviewedByHand(ref, why)     a part with no numeric answer (a justification,
//                                a non-numeric MCQ) — read and judged, and SAID so.
//   coverage(stageId)            fails every round-3 item nobody checked.
//
// PLANT=<ref> perturbs that one published value, to prove the binding: the run
// must then fail on exactly that ref.
import { create, all } from 'mathjs';
import { getLesson } from '../../content/lessons';
import { check } from './_lib';

const math = create(all, { number: 'number' });
const TOPIC = 'הסתברות';
const lesson = getLesson('math5', TOPIC);
const touched = new Set<string>();
let unbound = 0;

type Spec = { kind: string; value?: string; values?: string[] } | undefined;

const evalNum = (s: string): number => {
  const t = s
    .trim()
    .replace(/\$/g, '')
    .replace(/\\d?frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\d?frac(\d)(\d)/g, '($1)/($2)') // \dfrac14, the brace-less form content also uses
    .replace(/\\cdot/g, '*');
  return Number(math.evaluate(t));
};

/** The published value(s) of a ladder question or a bagrut part, from the live lesson. */
function published(ref: string): { values: number[]; ordered: boolean } | null {
  const [id, label] = ref.split('/');
  if (label) {
    const b = lesson?.bagrutQuestions?.find((x) => x.id === id);
    const p = b?.parts.find((x) => x.label === label);
    const spec = p?.expected as Spec;
    if (!p || !spec || spec.kind === 'manual') return null;
    return { values: (spec.kind === 'value' ? [spec.value ?? ''] : (spec.values ?? [])).map(evalNum), ordered: !!p.answerLabels?.length };
  }
  for (const st of lesson?.subTopics ?? []) {
    const q = st.questions?.find((x) => x.id === id);
    if (!q) continue;
    if (q.kind === 'mcq') {
      const opt = q.answers?.[q.correct ?? 0] ?? '';
      const n = evalNum(opt);
      return Number.isFinite(n) ? { values: [n], ordered: true } : null;
    }
    const spec = q.expected as Spec;
    if (!spec || spec.kind === 'manual') return null;
    return { values: (spec.kind === 'value' ? [spec.value ?? ''] : (spec.values ?? [])).map(evalNum), ordered: !!q.answerLabels?.length };
  }
  return null;
}

export function checkLive(label: string, ref: string, got: number | number[], tol = 1e-9) {
  touched.add(ref);
  const pub = published(ref);
  const g = Array.isArray(got) ? got : [got];
  if (!pub) {
    unbound++;
    check(`${label} — ${ref} has no numeric published answer (use reviewedByHand)`, NaN, NaN);
    return;
  }
  const want = [...pub.values];
  if (process.env.PLANT === ref) want[0] += 1e-3;
  if (want.length !== g.length) {
    check(`${label} — ${ref} publishes ${want.length} value(s), computed ${g.length}`, NaN, NaN);
    return;
  }
  if (pub.ordered) {
    want.forEach((w, i) => check(`${label} [${i}] (${ref})`, g[i], w, tol));
  } else {
    const gs = [...g].sort((a, b) => a - b);
    const ws = [...want].sort((a, b) => a - b);
    ws.forEach((w, i) => check(`${label} {${i}} (${ref})`, gs[i], w, tol));
  }
}

export function reviewedByHand(ref: string, why: string) {
  touched.add(ref);
  if (why.trim().length < 20) check(`${ref} — reviewedByHand needs the criterion that was checked`, NaN, NaN);
}

/** Every round-3 question and every part of a round-3 bagrut question of the stage must have been checked. */
export function coverage(stageId: string) {
  const r3 = (lesson?.subTopics ?? []).find((s) => s.id === stageId)?.questions?.filter((q) => /-3\d\d$/.test(q.id)) ?? [];
  const bag = (lesson?.bagrutQuestions ?? []).filter((b) => b.subTopicId === stageId && /-(?:0[2-9]|[1-9]\d)$/.test(b.id));
  const refs = [...r3.map((q) => q.id), ...bag.flatMap((b) => b.parts.map((p) => `${b.id}/${p.label}`))];
  const missing = refs.filter((r) => !touched.has(r));
  check(`coverage ${stageId}: ${refs.length - missing.length}/${refs.length} round-3 items checked${missing.length ? `; UNCHECKED: ${missing.join(', ')}` : ''}`, missing.length, 0);
  if (refs.length === 0) check(`coverage ${stageId}: found no round-3 items at all (wrong stage id?)`, NaN, NaN);
  return { refs: refs.length, missing: missing.length, unbound };
}
