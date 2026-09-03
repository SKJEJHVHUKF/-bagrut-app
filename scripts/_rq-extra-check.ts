/**
 * _rq-extra-check.ts — the per-stage gate for the EXTRA מנה ושורש questions.
 *
 *   npx tsx scripts/_rq-extra-check.ts rq-domain      (one stage)
 *   npx tsx scripts/_rq-extra-check.ts all            (all eight)
 *
 * WHY A DEDICATED GATE. The repo's gates (verify-content, verify-rule-lines,
 * verify-specs, check-tichon-notation, check-rtl-maqaf) each see one slice of
 * the house rules, several are scoped to topics that do not include פונקציות,
 * and none of them asserts that a question actually REACHES the ladder. This
 * runs every rule the authoring brief states, on the file an author is
 * writing, through the REAL engines (checkAnswer, leaksAnswer, getSubTopic),
 * in a few seconds — so an author can iterate without tsc or the full check.
 *
 * What it proves: structure, notation, RTL hygiene, machine-gradability,
 * distinct number sets vs the stage's existing material, and ladder wiring.
 * What it CANNOT prove: that an answer is RIGHT. That is what
 * scripts/_rq-extra-checks/<stage>.ts (independent re-derivation) is for.
 */
import { getLesson, getSubTopic } from '../content/lessons';
import { RQ_EXTRA } from '../content/lessons/math5/rq-extra';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';
import { checkAnswer, checkAnswerParts, matchKnownMistake } from '../lib/answer-check';
import { leaksAnswer } from '../lib/help-ladder';

const TOPIC = 'פונקציות';

/** Stage → id prefix + the MINIMUM extra questions per rung (owner's widening). */
const STAGES: Record<string, { prefix: string; min: { easy: number; mid: number; hard: number } }> = {
  'rq-domain': { prefix: 'rq-sub-dom-', min: { easy: 3, mid: 3, hard: 3 } },
  'rq-intersections': { prefix: 'rq-sub-int-', min: { easy: 3, mid: 4, hard: 2 } },
  'rq-asymptotes': { prefix: 'rq-sub-asy-', min: { easy: 4, mid: 3, hard: 2 } },
  'rq-derivative': { prefix: 'rq-sub-der-', min: { easy: 4, mid: 3, hard: 3 } },
  'rq-sketch': { prefix: 'rq-sub-sk-', min: { easy: 4, mid: 4, hard: 3 } },
  'rq-transformations': { prefix: 'rq-sub-tr-', min: { easy: 4, mid: 4, hard: 2 } },
  'rq-integral': { prefix: 'rq-sub-in-', min: { easy: 4, mid: 3, hard: 2 } },
  'rq-bagrut-mixed': { prefix: 'rq-sub-bg-', min: { easy: 2, mid: 4, hard: 2 } },
};

const HEB = /[֐-׿]/;
const RULE = '**הכלל:**';

/** University notation — same list as scripts/check-tichon-notation.ts. */
const BANNED: { re: RegExp; why: string }[] = [
  { re: /\\{1,2}forall|∀/, why: 'כתוב "לכל" במילים' },
  { re: /\\{1,2}exists|∃/, why: 'כתוב "קיים" במילים' },
  { re: /\\{1,2}(?:wedge|land)|∧/, why: 'כתוב "וגם"' },
  { re: /\\{1,2}(?:vee|lor)|∨/, why: 'כתוב "או"' },
  { re: /\\{1,2}(?:neg|lnot)|¬/, why: 'כתוב "לא"' },
  { re: /\\{1,2}(?:iff|Leftrightarrow|Longleftrightarrow)|⟺|⇔/, why: 'כתוב "אם ורק אם" / "כלומר"' },
  { re: /\\{1,2}emptyset|\\{1,2}varnothing|∅/, why: 'כתוב "אין"' },
  { re: /\\{1,2}mathbb\s*\{?\s*[RCZNQ]\s*\}?|[ℝℂℤℕℚ]/, why: 'כתוב "לכל x ממשי"' },
  { re: /\\{1,2}setminus|∖/, why: 'כתוב "פרט ל"' },
  { re: /\\{1,2}blacksquare|■|⬛|∎/, why: 'כתוב מש״ל' },
  { re: /\\{1,2}(?:subseteq|supseteq)|⊆|⊇/, why: 'סימון קבוצות אינו בתוכנית' },
  { re: /\\{1,2}therefore|∴/, why: 'כתוב "לכן"' },
  { re: /כלל השרשרת/, why: 'המונח אסור — כותבים "כופלים בנגזרת הפנימית"' },
  { re: /\\{1,2}(?:sin|cos|tan|ln|log)\b|\b(?:sin|cos|tan|ln)\b|\be\^/, why: 'הנושא הוא מנה ושורש — בלי טריגו/מעריכית/לוגריתם' },
  { re: /°/, why: 'אין מעלות בנושא הזה' },
];

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const EMOJI_ALLOW = new Set(['✓', '✗', '→', '←', '⇒']);

/** The author thinking out loud (verify-content's list). */
const MONOLOGUE = [
  /נבדוק שוב|נבדק שוב/, /בניסוח המקורי|טעות בניסוח|נפלה טעות בשאלה|יש טעות בשאלה/,
  /לא ריבוע שלם|לא יוצא יפה|לא תרגיל יפה|לא נותן ערך יפה|ערך יפה/, /נסה ערכים|ננסה ערכים|נציב ערכים ונראה/,
  /לא תרגיל סטנדרטי|לא סטנדרטי/, /בעצם:|בעצם תשובה|למעשה תשובה/, /החסר .{0,20}ברשימה|חסרה אופציה|אין אופציה/,
];

/** LaTeX commands that must never appear bare inside math (a lost backslash). */
const BARE_MATH = /(?<![\\A-Za-z])(dfrac|frac|sqrt|cdot|ldots|approx|times|infty|left|right|neq|geq|leq|ne|le|ge|int|quad|text|pm)(?![A-Za-z])/;

function mathSpans(s: string): string[] {
  const spans: string[] = [];
  const t = s.replace(/\\+\$/g, '¤');
  t.replace(/\$\$([\s\S]*?)\$\$/g, (_m, g: string) => (spans.push(g), ' '))
    .replace(/\$([^$\n]+?)\$/g, (_m, g: string) => (spans.push(g), ' '));
  return spans;
}
const dollarCount = (s: string) => (s.replace(/\\+\$/g, '¤').match(/\$/g) ?? []).length;
const norm = (s: string) =>
  s.replace(/\\dfrac/g, '\\frac').replace(/\\left|\\right/g, '').replace(/\\,|\\;|\\!/g, '').replace(/\s+/g, '').toLowerCase();

type Sev = 'error' | 'warn';
const findings: { sev: Sev; where: string; rule: string; detail: string }[] = [];
const err = (where: string, rule: string, detail = '') => findings.push({ sev: 'error', where, rule, detail });
const warn = (where: string, rule: string, detail = '') => findings.push({ sev: 'warn', where, rule, detail });

/** Every student-visible string rule, applied to one field. */
function checkText(where: string, value: string) {
  if (!value.trim()) return err(where, 'empty-string');
  if (dollarCount(value) % 2 !== 0) err(where, 'unbalanced-dollars', value.slice(0, 80));
  for (const span of mathSpans(value)) {
    if (HEB.test(span)) err(where, 'hebrew-in-math', span);
    const bare = span.match(BARE_MATH);
    if (bare) err(where, 'lost-backslash', `bare "${bare[1]}" in $${span}$`);
  }
  if (value.includes('$$')) err(where, 'display-math-in-question', 'use inline $…$ only');
  if (/[א-ת]-\$/.test(value)) err(where, 'maqaf-glued-to-math', value.match(/.{0,12}[א-ת]-\$.{0,12}/)?.[0] ?? '');
  if (/[א-ת]-\d/.test(value)) err(where, 'maqaf-glued-to-digit', value.match(/.{0,12}[א-ת]-\d.{0,12}/)?.[0] ?? '');
  if (/\$\s*—|—\s*\$/.test(value)) err(where, 'dash-touching-math', value.match(/.{0,20}(\$\s*—|—\s*\$).{0,20}/)?.[0] ?? '');
  if (/ – /.test(value)) warn(where, 'en-dash', 'use a comma or a full stop');
  for (const { re, why } of BANNED) {
    const m = value.match(re);
    if (m) err(where, 'banned-notation', `"${m[0]}" — ${why}`);
  }
  for (const ch of value) {
    if (EMOJI.test(ch) && !EMOJI_ALLOW.has(ch)) { err(where, 'decorative-emoji', ch); break; }
  }
  for (const re of MONOLOGUE) {
    const m = value.match(re);
    if (m) err(where, 'author-monologue', `"${m[0]}"`);
  }
}

/** All strings under a value, for the reuse pool. */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v as Record<string, unknown>).forEach((x) => strings(x, out));
  return out;
}

/** `f(x) = <rhs>` definitions inside the maths of a question, normalised. */
function functionDefs(q: string): string[] {
  const out: string[] = [];
  for (const span of mathSpans(q)) {
    const m = span.match(/^\s*[a-zA-Z]\s*\(\s*x\s*\)\s*=\s*(.+?)\s*$/);
    if (m && norm(m[1]).length >= 6) out.push(norm(m[1]));
  }
  return out;
}

function checkQuestion(q: PracticeQuestion, stageId: string, prefix: string) {
  const w = q.id || '(no id)';
  if (!new RegExp(`^${prefix}1\\d\\d$`).test(q.id)) err(w, 'bad-id', `expected ${prefix}1NN`);
  if (!['easy', 'mid', 'hard'].includes(q.difficulty)) err(w, 'bad-difficulty', String(q.difficulty));
  if (!['mcq', 'open'].includes(q.kind)) err(w, 'bad-kind', String(q.kind));

  // --- text rules on every student-visible field
  checkText(`${w}.question`, q.question ?? '');
  if (!q.hint?.trim()) err(w, 'missing-hint'); else checkText(`${w}.hint`, q.hint);
  (q.answers ?? []).forEach((a, i) => checkText(`${w}.answers[${i}]`, a));
  (q.distractorNotes ?? []).forEach((n, i) => { if (n) checkText(`${w}.distractorNotes[${i}]`, n); });
  (q.wrongAnswers ?? []).forEach((x, i) => checkText(`${w}.wrongAnswers[${i}].note`, x.note));
  const sol = q.solution;
  if (!sol) return err(w, 'missing-solution');
  (sol.steps ?? []).forEach((s, i) => checkText(`${w}.steps[${i}]`, s));
  checkText(`${w}.finalAnswer`, sol.finalAnswer ?? '');
  if (!sol.explanation?.trim()) warn(w, 'missing-explanation'); else checkText(`${w}.explanation`, sol.explanation);

  // --- solution shape
  const steps = sol.steps ?? [];
  if (steps.length < 4) err(w, 'too-few-steps', `${steps.length} (need ≥4: rule line + 3 working lines)`);
  if (steps.length > 12) warn(w, 'long-solution', `${steps.length} steps — one idea per step, but is it the shortest correct path?`);
  if (!steps[0]?.startsWith(RULE)) err(w, 'no-rule-line', `steps[0] must start with ${RULE}`);
  if (steps[0] && leaksAnswer(steps[0], sol.finalAnswer ?? '')) err(w, 'rule-line-leaks-answer');
  if (q.hint && leaksAnswer(q.hint, sol.finalAnswer ?? '')) err(w, 'hint-leaks-answer');
  if (q.hint && steps[0] && norm(steps[0]).includes(norm(q.hint))) err(w, 'rule-line-restates-hint');
  steps.forEach((s, i) => { if (s.length > 230) warn(`${w}.steps[${i}]`, 'packed-step', `${s.length} chars`); });
  const dup = steps.findIndex((s, i) => i > 0 && norm(s) === norm(steps[i - 1]));
  if (dup > 0) err(w, 'duplicate-consecutive-steps', `steps[${dup - 1}] = steps[${dup}]`);
  const formulaIdx = steps.findIndex((s) => s.startsWith('**הנוסחה:**'));
  const substIdx = steps.findIndex((s) => s.startsWith('**ההצבה:**'));
  if (formulaIdx >= 0 && substIdx >= 0 && substIdx < formulaIdx) warn(w, 'substitution-before-formula', 'הנוסחה comes before ההצבה');

  // --- MCQ
  if (q.kind === 'mcq') {
    const ans = q.answers ?? [];
    if (ans.length !== 4) err(w, 'mcq-needs-4-options', String(ans.length));
    if (q.correct !== 0) err(w, 'mcq-correct-must-be-index-0', `correct=${q.correct} (house rule: correct first, shuffled at render)`);
    const seen = new Set<string>();
    ans.forEach((a, i) => { const n = norm(a); if (seen.has(n)) err(w, 'duplicate-option', `answers[${i}]`); seen.add(n); });
    const notes = q.distractorNotes ?? [];
    if (notes.length !== ans.length) err(w, 'distractorNotes-length', `${notes.length} vs ${ans.length}`);
    else {
      notes.forEach((n, i) => {
        if (i === q.correct) { if (n) err(w, 'note-on-correct-option', 'must be empty string'); }
        else if (!n || n.trim().length < 20) err(w, 'thin-distractor-note', `[${i}]`);
      });
      const ns = notes.filter((_, i) => i !== q.correct).map((n) => norm(n ?? ''));
      if (new Set(ns).size !== ns.length) err(w, 'duplicate-distractor-notes');
    }
    if (q.wrongAnswers?.length) warn(w, 'wrongAnswers-on-mcq', 'only open questions have typed input');
    if (q.answerLabels?.length) err(w, 'answerLabels-on-mcq');
  }

  // --- open
  if (q.kind === 'open') {
    if (q.answers?.length || q.correct !== undefined || q.distractorNotes?.length) err(w, 'mcq-fields-on-open');
    const spec = q.expected as { kind: string; value?: string; values?: string[]; reason?: string } | undefined;
    if (!spec) err(w, 'missing-expected', "open questions need expected (value / set / manual)");
    else if (spec.kind === 'manual') {
      if (!spec.reason) warn(w, 'manual-without-reason');
    } else if (spec.kind === 'value' || spec.kind === 'set') {
      const input = spec.kind === 'value' ? (spec.value ?? '') : (spec.values ?? []).join(' , ');
      const res = q.answerLabels?.length
        ? checkAnswerParts(spec.values ?? [], q.expected as never)
        : checkAnswer(input, q.expected as never);
      if (res.verdict !== 'correct') err(w, 'expected-does-not-grade', `verdict=${res.verdict} readAs=${res.readAs ?? '—'} spec=${JSON.stringify(spec)}`);
      if (!q.wrongAnswers?.length) err(w, 'missing-wrongAnswers', 'every machine-graded open question needs ≥1 predictable wrong value + note');
      if (q.answerLabels) {
        if (spec.kind !== 'set') err(w, 'answerLabels-need-set');
        else if (q.answerLabels.length !== (spec.values ?? []).length) err(w, 'answerLabels-length', `${q.answerLabels.length} vs ${spec.values?.length}`);
        if (q.answerLabels.some((l) => /\$|\\/.test(l))) err(w, 'answerLabels-must-be-plain-text', 'unicode subscripts, no LaTeX');
      }
      for (const x of q.wrongAnswers ?? []) {
        const asInput = q.answerLabels?.length ? x.value.split(',').map((s) => s.trim()) : x.value;
        const matched = matchKnownMistake(asInput, [x]);
        const vs = Array.isArray(asInput) ? checkAnswerParts(asInput, q.expected as never).verdict : checkAnswer(asInput, q.expected as never).verdict;
        if (!matched) err(w, 'wrongAnswer-unparseable', x.value);
        else if (vs === 'correct') err(w, 'wrongAnswer-equals-correct', x.value);
        if (x.note.trim().length < 25) err(w, 'thin-wrongAnswer-note', x.value);
      }
    } else err(w, 'bad-expected-kind', spec.kind);
  }

  // --- figures
  for (const [i, d] of (sol.diagrams ?? []).entries()) {
    const dd = d as { type: string; svg?: string; viewBox?: string; caption?: string };
    if (dd.type !== 'custom') err(w, 'diagram-not-custom', `diagrams[${i}].type=${dd.type} (fn: closures break the RSC boundary)`);
    if (!dd.svg?.trim()) err(w, 'diagram-empty-svg', `diagrams[${i}]`);
    if (!dd.viewBox) err(w, 'diagram-no-viewBox', `diagrams[${i}]`);
    if (dd.svg && HEB.test(dd.svg)) err(w, 'hebrew-in-svg', `diagrams[${i}] — Hebrew goes in caption`);
    if (dd.svg && /#f1f5f9|rgba\(226,\s*232,\s*240|#e2e8f0|#fff\b|white/i.test(dd.svg)) err(w, 'light-on-dark-svg', `diagrams[${i}] — dark-ink-on-light palette only`);
    if (!dd.caption) warn(w, 'diagram-no-caption', `diagrams[${i}]`); else checkText(`${w}.diagrams[${i}].caption`, dd.caption);
  }
}

function checkStage(stageId: string): boolean {
  const cfg = STAGES[stageId];
  const extra = RQ_EXTRA[stageId] ?? [];
  const st = getSubTopic('math5', TOPIC, stageId) as SubTopic | undefined;
  const before = findings.length;
  if (!st) { err(stageId, 'stage-not-found'); return false; }

  const extraIds = new Set(extra.map((q) => q.id));
  const existing = (st.questions ?? []).filter((q) => !extraIds.has(q.id));

  // wiring: every extra question must come back from the real accessor
  for (const q of extra) if (!(st.questions ?? []).some((x) => x.id === q.id)) err(q.id, 'not-reaching-ladder');

  // ids unique across the whole topic (sub-topic banks + top-level)
  const L = getLesson('math5', TOPIC);
  const allIds = new Map<string, number>();
  for (const s of L?.subTopics ?? []) for (const q of s.questions ?? []) allIds.set(q.id, (allIds.get(q.id) ?? 0) + 1);
  for (const q of L?.questions ?? []) allIds.set(q.id, (allIds.get(q.id) ?? 0) + 1);
  for (const q of extra) if ((allIds.get(q.id) ?? 0) > 1) err(q.id, 'duplicate-id-in-topic');

  // distinct number sets: no function definition or whole question reused
  const pool = norm(strings({ existing, lesson: st.lesson, bagrut: L?.bagrutQuestions?.filter((b) => b.subTopicId === stageId) }).join('\n'));
  const seenDefs = new Map<string, string>();
  const seenQ = new Map<string, string>();
  for (const q of extra) {
    const nq = norm(q.question ?? '');
    if (seenQ.has(nq)) err(q.id, 'duplicate-question-in-file', `same as ${seenQ.get(nq)}`);
    seenQ.set(nq, q.id);
    for (const ex of existing) if (norm(ex.question) === nq) err(q.id, 'duplicate-of-existing-question', ex.id);
    for (const def of functionDefs(q.question ?? '')) {
      if (pool.includes(def)) err(q.id, 'function-reused-from-stage', `${def.slice(0, 40)} already appears in this stage's lesson/questions/bagrut — pick a distinct number set`);
      if (seenDefs.has(def)) err(q.id, 'function-reused-in-file', `same as ${seenDefs.get(def)}`);
      seenDefs.set(def, q.id);
    }
  }

  for (const q of extra) checkQuestion(q, stageId, cfg.prefix);

  // counts + mix
  const c = (d: string) => extra.filter((q) => q.difficulty === d).length;
  for (const d of ['easy', 'mid', 'hard'] as const) {
    if (c(d) < cfg.min[d]) err(stageId, 'below-minimum', `${d}: ${c(d)} < ${cfg.min[d]}`);
  }
  const mcq = extra.filter((q) => q.kind === 'mcq').length;
  if (extra.length >= 6 && (mcq < extra.length * 0.35 || mcq > extra.length * 0.65)) warn(stageId, 'mcq-open-mix', `${mcq} mcq / ${extra.length - mcq} open — aim for roughly half and half`);

  const mine = findings.slice(before);
  const errors = mine.filter((f) => f.sev === 'error');
  console.log(
    `\n${stageId.padEnd(20)} extra ${String(extra.length).padStart(2)} (easy ${c('easy')} mid ${c('mid')} hard ${c('hard')} · mcq ${mcq} open ${extra.length - mcq}) ` +
      `→ stage total ${(st.questions ?? []).length} · ${errors.length} error(s), ${mine.length - errors.length} warning(s)`,
  );
  for (const f of mine) console.log(`   ${f.sev === 'error' ? '✗' : '⚠'} ${f.where}  ${f.rule}${f.detail ? '  — ' + f.detail : ''}`);
  return errors.length === 0;
}

const arg = process.argv[2];
if (!arg || (arg !== 'all' && !STAGES[arg])) {
  console.error(`usage: npx tsx scripts/_rq-extra-check.ts <${Object.keys(STAGES).join('|')}|all>`);
  process.exit(2);
}
const ids = arg === 'all' ? Object.keys(STAGES) : [arg];
const ok = ids.map(checkStage).every(Boolean);
console.log(ok ? '\n✅ clean — now run the numeric re-derivation (scripts/_rq-extra-checks/<stage>.ts)' : '\n❌ fix the errors above');
process.exit(ok ? 0 : 1);
