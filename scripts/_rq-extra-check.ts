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
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';
import { RQ_EXTRA } from '../content/lessons/math5/rq-extra';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';
import { checkAnswer, checkAnswerParts, matchKnownMistake } from '../lib/answer-check';
import { leaksAnswer } from '../lib/help-ladder';

const TOPIC = 'פונקציות';

/** Stage → id prefix + the MINIMUM extra questions per rung (owner's widening). */
const STAGES: Record<string, { prefix: string; min: { easy: number; mid: number; hard: number }; shapes: number }> = {
  'rq-domain': { prefix: 'rq-sub-dom-', min: { easy: 3, mid: 3, hard: 3 }, shapes: 4 },
  'rq-intersections': { prefix: 'rq-sub-int-', min: { easy: 3, mid: 4, hard: 2 }, shapes: 4 },
  'rq-asymptotes': { prefix: 'rq-sub-asy-', min: { easy: 4, mid: 3, hard: 2 }, shapes: 4 },
  'rq-derivative': { prefix: 'rq-sub-der-', min: { easy: 4, mid: 3, hard: 3 }, shapes: 4 },
  'rq-sketch': { prefix: 'rq-sub-sk-', min: { easy: 4, mid: 4, hard: 3 }, shapes: 4 },
  'rq-transformations': { prefix: 'rq-sub-tr-', min: { easy: 4, mid: 4, hard: 2 }, shapes: 4 },
  'rq-integral': { prefix: 'rq-sub-in-', min: { easy: 4, mid: 3, hard: 2 }, shapes: 4 },
  'rq-bagrut-mixed': { prefix: 'rq-sub-bg-', min: { easy: 2, mid: 4, hard: 2 }, shapes: 4 },
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
  // 1NN was the first widening, 2NN the second, 3NN this round's — all valid.
  if (!new RegExp(`^${prefix}[123]\\d\\d$`).test(q.id)) err(w, 'bad-id', `expected ${prefix}1NN, ${prefix}2NN or ${prefix}3NN`);
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
  // A drawn sign table is long because it is a TABLE, not because the step is
  // packed — measure the prose around it, or the rule punishes the very figure
  // the owner asked for.
  steps.forEach((s, i) => {
    const prose = s.replace(/^\s*\|.*\|\s*$/gm, '').replace(/```[\s\S]*?```/g, '');
    if (prose.length > 230) warn(`${w}.steps[${i}]`, 'packed-step', `${prose.length} chars of prose`);
  });
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

  // --- a multi-part question is READ before it is solved
  // Itay, 2026-09-06: "תראה איך השאלה עצמה דחוסה ומסורבלת במקום להיות מסודרת
  // ויפה לעיין." Parts run together in one paragraph on a phone; each gets its
  // own line (the stem renders through <MathText> in block mode, so \n\n is a
  // paragraph break). A label echoed into the answer box has to be short too.
  const stem = q.question ?? '';
  const partMarks = [...stem.matchAll(/(?:^|\s)([אבגדה])\.\s/g)].map((m) => m[1]);
  if (partMarks.length >= 2 && stem.split('\n').length < partMarks.length) {
    err(w, 'parts-on-one-line', `${partMarks.join(', ')} run together — give each part its own line (\\n\\n)`);
  }
  for (const [i, lab] of (q.answerLabels ?? []).entries()) {
    if (lab.replace(/\$[^$]*\$/g, '').length > 28) {
      err(w, 'long-answer-label', `answerLabels[${i}] is a sentence — name the quantity: "${lab.slice(0, 40)}…"`);
    }
  }

  // --- ask the way the exam asks
  for (const [name, re] of OFF_STYLE) {
    if (re.test(q.question ?? '')) {
      err(w, 'off-style-ask', `${name} — the bagrut does not ask this; ask for the mathematical object instead (מצאו / חשבו / הוכיחו / סרטטו / נמקו)`);
      break;
    }
  }

  // --- one line, one move (Itay, 2026-09-06: "שהתשובות יהיו מובנות ולא דחוסות")
  for (const line of crowdedLines((sol.steps ?? []).join('\n'))) {
    err(w, 'crowded-line', `two calculations on one line — give each its own line (\\n\\n): "${line}…"`);
  }

  // --- name the formula (Itay: "שבכל תשובה יהיה מוסבר באיזו נוסחה בדיוק השתמשו")
  const stepsText = (sol.steps ?? []).join('\n');
  if (!/\*\*הנוסחה:\*\*/.test(stepsText)) err(w, 'no-formula-line', 'no **הנוסחה:** step — name the rule the solution applies, before substituting');
  else if (!/\*\*ההצבה:\*\*/.test(stepsText)) warn(w, 'formula-without-substitution', '**הנוסחה:** with no **ההצבה:** step after it');

  // --- draw what the solution says it draws
  const saysSketch = /סקיצה|סרטט|שרטט|גרף הפונקציה|הגרף של/.test(stepsText);
  // טבלה / טבלת / הטבלה / בטבלת — one more inflection the gate was blind to.
  const saysTable = /טבל[הת]|בטבלה/.test(stepsText);
  const hasTable = /^\s*\|.*\|\s*$/m.test(stepsText);
  if (saysSketch && !(sol.diagrams ?? []).length) err(w, 'sketch-without-figure', 'the solution sketches the graph — attach the drawn figure (lib/fn-figure)');
  if (saysTable && !hasTable) err(w, 'table-without-table', 'the solution builds a sign table — draw it as a markdown table');

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

// ---------------------------------------------------------------------------
// Difficulty model — the same shape as scripts/_prob-extra-check.ts, with this
// topic's mechanisms. Itay, 2026-09-06: "בקצב הדרגתי שעולה ברמה שלו, ושזה מגיע
// לשאלות שתלמיד באמת צריך לחשוב ולהתאמץ." A rung is not harder because it is
// labelled harder, so the gradient is measured from the authored content and
// compared with the archived papers.
// ---------------------------------------------------------------------------

/** Named moves a quotient/root question can require. Read from the question AND
 *  its solution, because the move often shows only in the working. */
const MECHANISMS: [string, RegExp][] = [
  ['domain', /תחום ההגדרה|תחום הגדרה|מוגדרת עבור|מכנה שונה מ|ביטוי שתחת השורש|אי[- ]שוויון/],
  // 🔴 Write these to survive the definite article: "האסימפטוטה האופקית" must
  // match as surely as "אסימפטוטה אופקית". A gate that misses the inflected form
  // silently scores a question lower and then blames it for restating an easier
  // one — the same trap as /משלים/ vs /המשלימה/ in the probability gate.
  ['vertical-asymptote', /אסימפטוט\S*\s+\S*אנכי|מאפסי המכנה/],
  ['horizontal-asymptote', /אסימפטוט\S*\s+\S*אופקי|כאשר \$?x\$? שואף|שואף לאינסוף/],
  // Every one of these must survive the definite article: "הנגזרת הפנימית",
  // "נקודת הקיצון", "טבלת הסימנים". Three separate mechanism regexes have now
  // been caught missing an inflected form and scoring a question low for it,
  // so the words are joined with \s+\S* rather than a literal space.
  ['quotient-rule', /כלל\s+\S*מנה|נגזרת\s+(?:של\s+)?\S*מנה|u'v ?- ?uv'/],
  ['chain-rule', /נגזרת\s+(?:של\s+)?\S*שורש|נגזרת\s+\S*פנימית|\\dfrac\{1\}\{2\\sqrt/],
  ['extremum', /נקוד\S*\s+\S*קיצון|מקסימום|מינימום|מאפסים את הנגזרת/],
  ['monotonicity', /עולה|יורדת|תחומי\s+\S*עלייה|תחומי\s+\S*ירידה|טבלת\s+\S*סימנים/],
  ['sign-table', /טבלת\s+\S*סימנים|סימן\s+\S*נגזרת|טבלה של סימנים/],
  // NOT "גרף הפונקציה": naming the graph is not drawing it, and every question
  // whose stem said "מצאו … של גרף הפונקציה" was collecting a sketch's 2.5
  // points without a sketch. Found by an author whose five new questions all
  // scored high for the wrong reason.
  ['sketch', /סקיצה|סרטט|שרטט/],
  ['integral', /אינטגרל|פונקציה קדומה|הקדומה|שטח הכלוא|\\int/],
  ['intersections', /נקודות החיתוך|חיתוך עם הציר|מציבים \$?y ?= ?0|f\(x\) ?= ?0/],
  // The last alternative read `\\bg\(` — a literal backslash then "bg", which no
  // content contains, so it never fired. `\b` would have been no better: it is a
  // boundary between \w and non-\w, and a Hebrew letter is not \w, so beside
  // Hebrew there is no boundary at all and /\bWORD\b/ matches NOTHING. The
  // Unicode lookaround is the form that works on both sides.
  ['transformation', /הזזה|שיקוף|מתיחה|הזזת גרף|(?<!\p{L})g\(x\) ?= ?f\(/u],
  ['tangent', /משיק|שיפוע המשיק|משוואת המשיק/],
  ['parameter', /פרמטר|עבור אילו ערכים|מצאו את הערך של \$?[a-z]\$?|תלוי ב\$?[a-z]\$?/],
  ['derivative-graph', /גרף הנגזרת|f\s*['׳]|הנגזרת השנייה|f''/],
  ['second-derivative', /נגזרת שנייה|נקודת פיתול|קמור|קעור/],
  // Telling a hole from an asymptote is its own move: both come from a zero of
  // the denominator, and only the numerator decides which one it is.
  ['hole', /חור בגרף|חור ב(?:ערך|נקודה)|נקודה חסרה|שני הצדדים מתאפסים/],
];

const mechanismsOf = (q: PracticeQuestion): string[] => {
  const text = `${q.question} ${(q.solution?.steps ?? []).join(' ')}`;
  return MECHANISMS.filter(([, re]) => re.test(text)).map(([n]) => n);
};

/** What the question asks the student to PRODUCE — the variety axis. Specific
 *  shapes are tested before the generic ones: a "justify" net tested early
 *  swallows every question that also says נמקו (the bug that hid a
 *  find-the-error question in the probability gate). */
function askShape(q: PracticeQuestion): string {
  const t = q.question;
  if (/סרטט|שרטט|סקיצה/.test(t)) return 'sketch';
  if (/הוכיחו|הוכח|הראו כי/.test(t)) return 'prove';
  if (/מצאו את הערך של \$?[a-z]|עבור אילו ערכים|מצאו את הפרמטר|כך ש.*יהיה|מצאו את \$?[a-z]\$?(?: ואת)?/.test(t)) return 'find-parameter';
  if (/נתונה?\s+(?:האסימפטוט|נקודת הקיצון|נקודת החיתוך|תחום ההגדרה)|ידוע (?:כי|ש)[^.]*מצא|מהי הפונקציה/.test(t)) return 'reverse';
  if (/שטח|אינטגרל|הקדומה/.test(t)) return 'area';
  if (/נמקו|הסבירו מדוע|קבעו (?:את סוגן|אם)|האם .*\?/.test(t)) return 'justify';
  if (/כמה |מספר ה|בין אילו ערכים|באיז[הו] /.test(t)) return 'locate';
  return 'compute';
}

/** Asks the bagrut does not make. Itay, 2026-09-06, on a "כמה טעויות יש כאן?"
 *  item: "יש שם שאלות שבדרך כלל בבגרות לא שואלים — הסגנון הזה של השאלות…
 *  תחליף לסגנון שיותר התלמיד צריך לפתור כמו שבאמת נדרש ממנו בבגרות." The
 *  variety rule below is what pushed authors here, so it now counts EXAM shapes
 *  (sketch / prove / find-parameter / reverse / area / justify / locate /
 *  compute) and these stems are refused outright. */
const OFF_STYLE: [string, RegExp][] = [
  ['count-the-errors', /כמה טעויות|מספר הטעויות|כמה שגיאות/],
  ['which-claim-is-true', /איזו (?:מן ה)?טענה נכונה|איזו מהטענות|מה נכון(?: על| לגבי)?\s*\?|איזו קביעה/],
  ['student-said-mcq', /(?:תלמיד|תלמידה) (?:כתב|כתבה|טען|טענה|חישב|חישבה)[^?]*\?/],
  ['what-if', /ומה אם|מה יקרה אם|אילו היה/],
  ['method-meta', /איזו שיטה|מה עדיף לעשות|כיצד כדאי/],
  ['compare-two-claims', /מה גדול יותר|איזו .* גדולה|כדאי|עדיף/],
];

const hasParameter = (q: PracticeQuestion) =>
  // "מצא את $a$" (singular, no "הערך של") is how half the shipped questions ask.
  /פרמטר|עבור אילו ערכים|מצא(?:ו)? את (?:הערך של )?\$?[a-z]\$?|נתון ש[^.]*\$?[abmk]\$?[^.]*מצא|תלוי ב/.test(q.question);

/** The inference runs BACKWARDS: a property is given and the function (or a
 *  coefficient inside it) is what the student must recover. */
const isReverse = (q: PracticeQuestion) =>
  /נתונה?\s+(?:האסימפטוט|נקודת הקיצון|נקודת החיתוך|תחום ההגדרה)|ידוע (?:כי|ש)[^.]*(?:אסימפטוט|קיצון|חיתוך)[^.]*מצאו|גרף הנגזרת[^.]*מה נכון|מהי הפונקציה/.test(
    q.question,
  );

function scoreOf(q: PracticeQuestion): number {
  const steps = (q.solution?.steps ?? []).length;
  const mech = mechanismsOf(q).length;
  const shape = askShape(q);
  return (
    steps +
    2.5 * mech +
    (hasParameter(q) ? 3 : 0) +
    (isReverse(q) ? 4 : 0) +
    (['justify', 'compare', 'find-the-error'].includes(shape) ? 2 : 0)
  );
}

/** The signature that makes "the challenge rung is the practice rung with
 *  different numbers" visible to a machine. */
const signatureOf = (q: PracticeQuestion) =>
  `${askShape(q)}|${mechanismsOf(q).sort().join(',')}${hasParameter(q) ? '|param' : ''}${isReverse(q) ? '|rev' : ''}`;

/** One line, one move — ported from the probability round after Itay said the
 *  solutions read as cramped on a phone. A line carrying two or more tall
 *  calculations wraps into a wall; a display block alone on its line is the fix. */
function crowdedLines(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('```') || t.startsWith('$$') || t.startsWith('|')) continue;
    const tall = (t.match(/\$[^$\n]+\$/g) ?? []).filter(
      (s) => (/\\dfrac|\\binom|\\frac|\\sqrt|\\int/.test(s) && /=|\\cdot|\+|-/.test(s)) || /\\cdot/.test(s) || s.length > 22,
    );
    if (tall.length >= 2) out.push(t.slice(0, 60));
  }
  return out;
}

/** The archived papers, scored with the SAME model: the hardest part of each
 *  question, because part ג is easy once א and ב are done. */
function examBar(): { bar: number; n: number } {
  const isRQ = (s: string) =>
    /\\d?frac\s*\{[^}]*\}\s*\{[^}]*x[^}]*\}/.test(s) || /\\sqrt\s*(\[[^\]]*\])?\s*\{[^}]*x/.test(s) || /\\sqrt\s*x/.test(s);
  const tops: number[] = [];
  for (const q of ALL_PAST_BAGRUYOT) {
    const whole = [q.context ?? '', ...(q.parts ?? []).map((p) => p.prompt ?? '')].join(' ');
    if (!isRQ(whole)) continue;
    const parts = (q.parts ?? []).map((p) =>
      scoreOf({
        id: `${q.id}/${p.label}`,
        difficulty: 'hard',
        kind: 'open',
        question: `${q.context ?? ''} ${p.prompt ?? ''}`,
        solution: { steps: p.solution?.steps ?? [], finalAnswer: p.solution?.final_answer ?? '' },
      } as unknown as PracticeQuestion),
    );
    if (parts.length) tops.push(Math.max(...parts));
  }
  return { bar: tops.reduce((a, b) => a + b, 0) / Math.max(1, tops.length), n: tops.length };
}

const BAR = examBar();

/** Round 3 — Itay, 2026-09-06: "עוד שאלות… שיהיו יותר ברמה וידרשו מהתלמיד יותר
 *  לחשוב ולחשב… שהמסלול יביא את התלמיד מוכן לפתור תרגילי בגרות ברמה, ולכן חשוב
 *  שתכין אותו שם בהדרגה." A question with an id `<prefix>3NN` must therefore
 *  score at least what its rung already averaged when round 3 opened; anything
 *  below that adds bulk, not level. Numbers measured, not chosen. */
const ROUND3_FLOOR: Record<string, { mid: number; hard: number }> = {
  'rq-domain': { mid: 10.9, hard: 19.1 },
  'rq-intersections': { mid: 11.5, hard: 19.7 },
  'rq-asymptotes': { mid: 13.1, hard: 21.0 },
  'rq-derivative': { mid: 15.8, hard: 26.5 },
  'rq-sketch': { mid: 16.6, hard: 27.5 },
  'rq-transformations': { mid: 16.8, hard: 21.9 },
  'rq-integral': { mid: 15.6, hard: 23.0 },
  'rq-bagrut-mixed': { mid: 18.7, hard: 26.8 },
};
/** …and enough of them that the rung actually thickens at the top. */
const ROUND3_MIN = { mid: 2, hard: 3 };

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

  // --- the gradient, over the rung the STUDENT sees (existing + extra)
  const all = (st.questions ?? []) as PracticeQuestion[];
  const rung = (d: string) => all.filter((q) => q.difficulty === d);
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const sc = { easy: mean(rung('easy').map(scoreOf)), mid: mean(rung('mid').map(scoreOf)), hard: mean(rung('hard').map(scoreOf)) };
  const mc = {
    easy: mean(rung('easy').map((q) => mechanismsOf(q).length)),
    mid: mean(rung('mid').map((q) => mechanismsOf(q).length)),
    hard: mean(rung('hard').map((q) => mechanismsOf(q).length)),
  };
  const STEP = 2.0;
  const MECH_STEP = 0.3;
  for (const [lo, hi] of [['easy', 'mid'], ['mid', 'hard']] as const) {
    if (sc[hi] < sc[lo] + STEP) err(stageId, 'rung-not-harder', `${hi} scores ${sc[hi].toFixed(1)} vs ${lo} ${sc[lo].toFixed(1)} — needs +${STEP}`);
    if (mc[hi] < mc[lo] + MECH_STEP) err(stageId, 'rung-no-new-mechanism', `${hi} invokes ${mc[hi].toFixed(1)} mechanisms vs ${lo} ${mc[lo].toFixed(1)}`);
  }

  // --- no hard question may restate an easier one
  const lowerSigs = new Map<string, string>();
  for (const q of [...rung('easy'), ...rung('mid')]) if (!lowerSigs.has(signatureOf(q))) lowerSigs.set(signatureOf(q), q.id);
  for (const q of rung('hard')) {
    const twin = lowerSigs.get(signatureOf(q));
    if (twin) err(q.id, 'hard-is-a-restatement', `same ask + same mechanisms as ${twin} (${signatureOf(q)})`);
  }

  // --- round 3: the new questions must raise the level, not pad it
  const floor = ROUND3_FLOOR[stageId];
  const round3 = extra.filter((q) => new RegExp(`^${cfg.prefix}3\\d\\d$`).test(q.id));
  if (floor) {
    for (const q of round3) {
      const d = q.difficulty as 'easy' | 'mid' | 'hard';
      if (d === 'easy') { err(q.id, 'round3-easy', 'round 3 adds mid and hard questions only'); continue; }
      const s = scoreOf(q);
      if (s < floor[d]) err(q.id, 'round3-below-the-rung', `scores ${s.toFixed(1)} against a ${d} rung already averaging ${floor[d]}`);
    }
    const n = (d: string) => round3.filter((q) => q.difficulty === d).length;
    if (round3.length && (n('mid') < ROUND3_MIN.mid || n('hard') < ROUND3_MIN.hard)) {
      err(stageId, 'round3-below-minimum', `${n('mid')} mid + ${n('hard')} hard — need ${ROUND3_MIN.mid} + ${ROUND3_MIN.hard}`);
    }
  }

  // --- variety and exam reach
  const shapes = new Set(all.map(askShape));
  if (shapes.size < cfg.shapes) err(stageId, 'too-few-ask-shapes', `${shapes.size} of ${cfg.shapes} — ${[...shapes].join(', ')}`);
  const top3 = mean(rung('hard').map(scoreOf).sort((a, b) => b - a).slice(0, 3));
  const reach = BAR.bar ? (top3 / BAR.bar) * 100 : 0;
  if (reach < 90) err(stageId, 'does-not-reach-the-exam', `hardest rung averages ${top3.toFixed(1)} vs the archive's ${BAR.bar.toFixed(1)} (${reach.toFixed(0)}%)`);

  if (process.argv.includes('--scores')) {
    console.log(`\n${stageId} — every question, scored:`);
    for (const d of ['easy', 'mid', 'hard'] as const) {
      for (const q of rung(d).sort((a, b) => scoreOf(a) - scoreOf(b))) {
        console.log(`   ${d.padEnd(4)} ${q.id.padEnd(18)} ${scoreOf(q).toFixed(1).padStart(5)}  ${signatureOf(q)}`);
      }
    }
  }

  const mine = findings.slice(before);
  const errors = mine.filter((f) => f.sev === 'error');
  console.log(
    `\n${stageId.padEnd(20)} extra ${String(extra.length).padStart(2)} (easy ${c('easy')} mid ${c('mid')} hard ${c('hard')} · mcq ${mcq} open ${extra.length - mcq}) ` +
      `→ ${(st.questions ?? []).length}q  ${sc.easy.toFixed(1)} → ${sc.mid.toFixed(1)} → ${sc.hard.toFixed(1)} · mech ${mc.easy.toFixed(1)}→${mc.mid.toFixed(1)}→${mc.hard.toFixed(1)} · shapes ${shapes.size} · exam-reach ${reach.toFixed(0)}% · ${errors.length} error(s), ${mine.length - errors.length} warning(s)`,
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
