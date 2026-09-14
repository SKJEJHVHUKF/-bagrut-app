/**
 * _prob-extra-check.ts — the per-stage gate for the EXTRA הסתברות questions.
 *
 *   npx tsx scripts/_prob-extra-check.ts pr-basics     (one stage)
 *   npx tsx scripts/_prob-extra-check.ts all           (all six)
 *   npx tsx scripts/_prob-extra-check.ts all --baseline (grade the shipped
 *                                                        content alone, to show
 *                                                        what this round fixed)
 *
 * WHY A DEDICATED GATE. Two of the owner's requirements have no gate anywhere in
 * the repo, and one of them was already being broken in shipped content:
 *
 *   1. "ככל שעולים רמה כך גם השאלות עצמן קשות ומאתגרות יותר באמת" — measured on
 *      2026-09-06, pr-basics' hard rung averaged FEWER solution steps than its
 *      mid rung (4.0 vs 4.7), and both of its hard questions were the same
 *      mechanism as the mid question above them ("at least one" via the
 *      complement) with different numbers. pr-tables' hard rung invoked fewer
 *      named rules than its easy rung. Nothing failed, because nothing looked.
 *   2. "שהשאלות יהיו מגוונות" — a rung of six questions that all read
 *      "חשב את ההסתברות ש…" is six of the same question.
 *
 * WHAT IT MEASURES. Difficulty is scored from the authored content by proxies
 * that cannot be satisfied by relabelling: how many DISTINCT mechanisms a
 * question invokes, whether it runs the inference BACKWARDS (Bayes-shaped),
 * whether it hides a parameter the student must recover, whether it demands a
 * justification, and how many lines the solution takes. The weights are a
 * deliberate simplification — the ordering they induce is the claim, not the
 * numbers themselves — so the gate requires BOTH the composite score and the
 * least-gameable component (distinct mechanisms) to rise from rung to rung.
 *
 * THE RULE THAT CATCHES THE ACTUAL DEFECT: no hard question may share its
 * (mechanism-set, ask-shape) signature with an easy or mid question in the same
 * stage. That is precisely "the challenge rung is the practice rung with
 * different numbers", stated so a machine can see it.
 *
 * What it still cannot do: judge whether a question is INTERESTING, or whether
 * its answer is right. scripts/_prob-extra-checks/<stage>.ts re-derives the
 * numbers; a human reads for interest.
 */
import { getSubTopic, getLesson } from '../content/lessons';
import { PROB_EXTRA, PROB_EXTRA_BAGRUT } from '../content/lessons/math5/prob-extra';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';
import { checkAnswer, checkAnswerParts, matchKnownMistake } from '../lib/answer-check';
import { leaksAnswer } from '../lib/help-ladder';
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';
import { checkProbTreeFences, checkProbTables, hasProbTree, hasTable, pickedTotal, numeric } from '../lib/prob-figure';
import { renderFocusContext, partAsQuestion, partQuestionText } from '../lib/tutor-presence';
import { stripFigureFences } from '../lib/geo-figure';
import type { StaticBagrutQuestion } from '../content/lessons/types';
import katex from 'katex';

const TOPIC = 'הסתברות';
const BASELINE = process.argv.includes('--baseline');
/** Figure rules error on SHIPPED questions too (the figures round), not only on extras. */
const STRICT_FIGURES = process.argv.includes('--strict-figures');

/**
 * ROUND 2 (2026-09-06, owner): "עוד שאלות לרמות ביסוס, אתגר ובגרות — שבאמת יהיו
 * בעלייה הדרגתית … ולא משהו קליל". A round-2 question (id …-2NN) must score at
 * least what its rung ALREADY averaged when round 1 closed — the numbers below
 * are that snapshot. Adding a question under its rung's mean is adding
 * something light, however it is labelled.
 */
const ROUND2_FLOOR: Record<string, { mid: number; hard: number }> = {
  'pr-basics': { mid: 11.4, hard: 18.3 },
  'pr-tree': { mid: 12.4, hard: 18.5 },
  'pr-tables': { mid: 13.9, hard: 19.6 },
  'pr-bernoulli': { mid: 14.8, hard: 18.2 },
  'pr-conditional': { mid: 12.7, hard: 15.6 },
  'pr-practice': { mid: 14.9, hard: 19.2 },
};
const ROUND2_MIN = { mid: 4, hard: 4 };

/**
 * ROUND 3 (2026-09-14, owner): "בכל רמה שבתוך כל תת נושא … חימום ביסוס אתגר
 * ובגרות … לפחות 20 תרגילים", with the rise between them kept gradual: "ברמת
 * חימום … קלות … ביסוס יעלה הרמה ועוד יותר … אתגר וברמת בגרות הרבה יותר".
 *
 * The numbers are each rung's average when round 3 opened (`all --dump` on
 * origin/main fbad91a). A round-3 question (…-3NN) is held to a BAND, not only a
 * floor: a floor alone pushes warm-ups up (a mean-based floor sits above the
 * rung's median), and a mid question scoring like the hard rung is a mislabelled
 * hard question, which flattens the step the student is promised.
 *   easy  < the mid average          — a warm-up, not a ביסוס question
 *   mid   ≥ the easy average + 2      — and < the hard average
 *   hard  ≥ the hard average          — "ולא משהו קליל"
 */
const ROUND3_SNAPSHOT: Record<string, { easy: number; mid: number; hard: number }> = {
  'pr-basics': { easy: 6.1, mid: 12.8, hard: 19.9 },
  'pr-tree': { easy: 7.8, mid: 14.5, hard: 20.9 },
  'pr-tables': { easy: 9.7, mid: 16.2, hard: 21.9 },
  'pr-bernoulli': { easy: 9.6, mid: 15.7, hard: 19.1 },
  'pr-conditional': { easy: 8.0, mid: 14.3, hard: 18.3 },
  'pr-practice': { easy: 11.1, mid: 16.7, hard: 22.3 },
};
/** Authored questions per rung, and bagrut questions per stage. */
const RUNG_MIN = 20;
const BAGRUT_MIN = 20;
/** A round-3 bagrut question must sit ABOVE the exam, not at it: its hardest
 *  part above the archive's hardest-part average by 15%, and its AVERAGE part at
 *  least the archive's HARDEST-part average (the archive's average part is ~12). */
const R3_BAGRUT_HARDEST = 1.15;
const R3_BAGRUT_MEAN = 1.0;
/** `1.5 + 0.3 === 1.8000000000000003`: a threshold met exactly must pass. */
const EPS = 1e-6;
const DUMP = process.argv.includes('--dump');
const isR3 = (id: string) => /-3\d\d$/.test(id);
const isR3Bagrut = (id: string) => /^prob-bag-x-[a-z]{3}-(?:0[2-9]|[1-9]\d)$/.test(id);
/**
 * Stems the archive never uses. Itay on the מנה ושורש round, 2026-09-06: "יש שם
 * שאלות שבדרך כלל בבגרות לא שואלים" — the variety rule had made a quiz gimmick
 * the cheapest new ask shape. Refused outright for round 3 rather than scored.
 */
const OFF_EXAM_STEM = /כמה טעויות|איזו (?:מן |מבין )?(?:הטענות|טענה)|ומה אם|אילו היה|לו היה|תלמיד (?:כתב|טען|חישב)|תלמידה (?:כתבה|טענה|חישבה)|מה הטעות|היכן השגיאה|מצאו את הטעות/;

/** Stage → id prefix, minimum EXTRA questions per rung, and minimum distinct
 *  ask-shapes the stage's whole rung set must show. */
const STAGES: Record<string, { prefix: string; min: { easy: number; mid: number; hard: number }; shapes: number }> = {
  'pr-basics': { prefix: 'pr-x-bas-', min: { easy: 4, mid: 4, hard: 4 }, shapes: 4 },
  'pr-tree': { prefix: 'pr-x-tre-', min: { easy: 4, mid: 4, hard: 4 }, shapes: 4 },
  'pr-tables': { prefix: 'pr-x-tab-', min: { easy: 3, mid: 3, hard: 4 }, shapes: 4 },
  'pr-bernoulli': { prefix: 'pr-x-ber-', min: { easy: 4, mid: 4, hard: 4 }, shapes: 4 },
  'pr-conditional': { prefix: 'pr-x-cnd-', min: { easy: 4, mid: 4, hard: 3 }, shapes: 4 },
  'pr-practice': { prefix: 'pr-x-prc-', min: { easy: 4, mid: 4, hard: 4 }, shapes: 5 },
};

// ---------------------------------------------------------------------------
// Difficulty model
// ---------------------------------------------------------------------------

/** The named mechanisms a probability question can invoke. Detected from the
 *  question AND its solution, because the mechanism often only shows in the
 *  working ("נשתמש במשלים"). */
const MECHANISMS: [string, RegExp][] = [
  // משלימ covers the inflected forms (המשלימה, המשלימות) — non-final mem.
  ['complement', /משלימ|משלים|לא קורה|אף פעם לא|1 ?- ?P|אחד פחות/],
  ['conditional', /מותנ|בהינתן|בידיעה ש|ידוע ש.*מה ההסתברות/],
  ['independence', /בלתי[- ]תלוי|תלויים זה בזה|אינם תלויים/],
  ['binomial', /ברנולי|בינומ|ניסויים חוזרים|\\binom|nCr|בדיוק \$?\d+ (?:פעמים|הצלחות)/],
  ['tree', /עץ|ענף|מסלול/],
  ['table', /טבלה|תא|שוליים|דו[- ]ממדית/],
  ['expectation', /תוחלת/],
  ['combinatorics', /צירופ|עצרת|כמה דרכים|סידור/],
  ['no-replacement', /בלי החזרה|ללא החזרה|אינו מוחזר|לא מחזירים/],
  ['at-least', /לפחות|לכל היותר/],
  // 🔴 "או" needs an explicit Hebrew-letter boundary. JS `\b` is defined against
  // [A-Za-z0-9_], so it NEVER matches beside a Hebrew letter — a bare /או/ fires
  // inside מאותו, אותו, ראובן. Caught 2026-09-06 when the gate credited a
  // question reading "שני כדורים מאותו צבע" with a union mechanism it does not
  // have. Same class as the dead \b table in lib/tutor-local's Hebrew cues.
  ['union', /(?:^|[^א-ת])או(?:[^א-ת]|$)|איחוד/],
  ['total-probability', /הסתברות שלמה|נוסחת ההסתברות השלמה|מפצלים למקרים/],
];

const mechanisms = (q: PracticeQuestion): string[] => {
  const text = `${q.question} ${(q.solution?.steps ?? []).join(' ')}`;
  return MECHANISMS.filter(([, re]) => re.test(text)).map(([n]) => n);
};

/** What the question ASKS the student to produce — the variety axis. */
function askShape(q: PracticeQuestion): string {
  const t = q.question;
  // SPECIFIC SHAPES FIRST. "justify" is the widest net here — a find-the-error or
  // compare question almost always also says נמקו or asks האם…? — so testing it
  // early swallows the shape the question really has, and askShape feeds both the
  // variety count and the restatement signature. Measured: one question
  // (pr-x-tab-207) was reading as justify while auditing a student's claim.
  // /הוכח/ also matches the noun הוכחה, hence the lookahead.
  if (/תלמיד (?:כתב|טען|חישב)|מה הטעות|היכן השגיאה|כמה טעויות/.test(t)) return 'find-the-error';
  if (/מה גדול יותר|איזו .* גדולה|כדאי|עדיף|השווה/.test(t)) return 'compare';
  if (/ומה אם|אילו היה|לו היה/.test(t)) return 'what-if';
  if (/כמה .*(?:כדורים|תלמידים|פריטים|ניסויים|פעמים|צריך)|מצא את מספר|מהו מספר/.test(t)) return 'count';
  if (/מצא את [^.]*\b[a-zA-Z]\b|מהו הערך של|נתון ש.*מצא את|כמה .* יש בכד/.test(t)) return 'find-parameter';
  if (/הוכח(?!ה)|נמק|הסבר מדוע|האם .*\?|נכון או לא נכון/.test(t)) return 'justify';
  return 'compute';
}

/**
 * Runs the inference BACKWARDS: something later is known, and the question asks
 * about its source.
 *
 * 🔴 The second half used to accept bare nouns — המכונה, הקופסה, הכד, הראשון —
 * so any ordinary urn question containing "ידוע ש" collected the +4 Bayes bonus
 * without performing a Bayes step. Caught 2026-09-06 by the pr-bernoulli
 * verifier, which found two questions ("פריטים שיצאו מהמכונה", "תפוחים
 * מהקופסה") carrying 8 unearned composite points between them, and which
 * reported the corrected, LOWER stage number rather than keeping the flattering
 * one. It now needs a directional phrase — "from which", "came from", "was
 * drawn from" — which is the thing that actually makes an inference reverse.
 */
const isReverse = (q: PracticeQuestion) =>
  /בהינתן ש|ידוע ש/.test(q.question) &&
  /מאיזו|מאיזה|(?:הגיע|הגיעה|הגיעו|נבחר|נבחרה|נשלף|נשלפה|נלקח|נלקחה|יוצר|יוצרה|הוצא|הוצאה)\s+מ/.test(q.question);

/**
 * An unknown the student must recover before anything can be computed.
 *
 * The ratio forms matter as much as a literal `x`: the exam states its unknowns
 * as "ההסתברות ש… גדולה פי $2$ מן ההסתברות ש…", and a question can hide one
 * without ever naming a letter in the prompt. Measured 2026-09-06: without the
 * ratio forms, prob-ptb-003 ("מספר שוחי החתירה גדול פי $2$ ממספר שוחי הגב")
 * scored as a plain table read and was flagged as a restatement of an easy
 * question — the detector was wrong, not the content.
 */
const hasParameter = (q: PracticeQuestion) =>
  askShape(q) === 'find-parameter' ||
  /\bx\b|\bp\b|נעלם|פרמטר/.test(q.question) ||
  /גדול פי|קטן פי|גדולה פי|קטנה פי|פי \$?\d+ מ/.test(q.question);

/**
 * Composite difficulty. Weights are a deliberate simplification: the ORDERING
 * is the claim, not the number. Kept small and legible on purpose.
 * ponytail: hand-tuned weights; replace with a fit if we ever have real
 * per-question timing data from students.
 */
function difficulty(q: PracticeQuestion) {
  const m = mechanisms(q);
  const steps = q.solution?.steps?.length ?? 0;
  const shape = askShape(q);
  return {
    score:
      steps * 1 +
      m.length * 2.5 +
      (hasParameter(q) ? 3 : 0) +
      (isReverse(q) ? 4 : 0) +
      (shape === 'justify' || shape === 'compare' ? 2 : 0) +
      (shape === 'find-the-error' ? 2 : 0),
    mechanisms: m,
    steps,
    shape,
  };
}

/** Two questions are "the same question with different numbers" when they ask
 *  the same thing with the same machinery — and neither hides an unknown the
 *  other does not. A question that makes the student recover a value before it
 *  can be computed is a different question, whatever else it shares. */
const signature = (q: PracticeQuestion) =>
  `${askShape(q)}|${mechanisms(q).slice().sort().join(',')}${hasParameter(q) ? '|param' : ''}`;

// ---------------------------------------------------------------------------
// House rules (same family as scripts/_rq-extra-check.ts)
// ---------------------------------------------------------------------------
const HEB = /[֐-׿]/;
const RULE = '**הכלל:**';
const BANNED: { re: RegExp; why: string }[] = [
  { re: /\\{1,2}forall|∀/, why: 'כתוב "לכל" במילים' },
  { re: /\\{1,2}exists|∃/, why: 'כתוב "קיים" במילים' },
  { re: /\\{1,2}(?:wedge|land)|∧/, why: 'כתוב "וגם"' },
  { re: /\\{1,2}(?:vee|lor)|∨/, why: 'כתוב "או"' },
  { re: /\\{1,2}(?:iff|Leftrightarrow)|⟺|⇔/, why: 'כתוב "אם ורק אם"' },
  { re: /\\{1,2}emptyset|\\{1,2}varnothing|∅/, why: 'כתוב "אין"' },
  { re: /\\{1,2}mathbb|[ℝℂℤℕℚ]/, why: 'סימון קבוצות אינו בתוכנית' },
  { re: /\\{1,2}blacksquare|■|∎/, why: 'כתוב מש״ל' },
  { re: /\\{1,2}therefore|∴/, why: 'כתוב "לכן"' },
  { re: /°/, why: 'אין מעלות בנושא הזה' },
];
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const EMOJI_OK = new Set(['✓', '✗', '→', '⇒']);
const MONOLOGUE = [/נבדוק שוב/, /בניסוח המקורי|יש טעות בשאלה/, /לא יוצא יפה|ערך יפה/, /נסה ערכים/, /בעצם:/];
const BARE_MATH = /(?<![\\A-Za-z])(dfrac|frac|sqrt|cdot|binom|approx|times|le|ge|ne|mid|cap|cup|bar)(?![A-Za-z])/;

const mathSpans = (s: string) => {
  const out: string[] = [];
  const t = s.replace(/\\+\$/g, '¤');
  t.replace(/\$\$([\s\S]*?)\$\$/g, (_m, g: string) => (out.push(g), ' '))
    .replace(/\$([^$\n]+?)\$/g, (_m, g: string) => (out.push(g), ' '));
  return out;
};
const dollars = (s: string) => (s.replace(/\\+\$/g, '¤').match(/\$/g) ?? []).length;
const norm = (s: string) => s.replace(/\\dfrac/g, '\\frac').replace(/\s+/g, '').toLowerCase();

type Sev = 'error' | 'warn';
const findings: { sev: Sev; where: string; rule: string; detail: string }[] = [];
const err = (where: string, rule: string, detail = '') => findings.push({ sev: 'error', where, rule, detail });
const warn = (where: string, rule: string, detail = '') => findings.push({ sev: 'warn', where, rule, detail });

function checkText(where: string, value: string) {
  if (!value.trim()) return err(where, 'empty-string');
  if (dollars(value) % 2 !== 0) err(where, 'unbalanced-dollars', value.slice(0, 70));
  for (const span of mathSpans(value)) {
    if (HEB.test(span)) err(where, 'hebrew-in-math', span);
    const bare = span.match(BARE_MATH);
    if (bare) err(where, 'lost-backslash', `bare "${bare[1]}"`);
    // It has to PARSE: nothing else in the content chain renders a lesson island
    // through KaTeX, so a `\dfrac{3}{` or an unknown macro ships as red text.
    try {
      katex.renderToString(span, { throwOnError: true, strict: false });
    } catch (e) {
      err(where, 'katex-parse', `${span.slice(0, 50)}: ${(e as Error).message.slice(0, 90)}`);
    }
  }
  if (/[א-ת]-\$/.test(value)) err(where, 'maqaf-glued-to-math', value.match(/.{0,12}[א-ת]-\$.{0,10}/)?.[0] ?? '');
  if (/[א-ת]-\d/.test(value)) err(where, 'maqaf-glued-to-digit', value.match(/.{0,12}[א-ת]-\d.{0,10}/)?.[0] ?? '');
  if (/\$\s*—|—\s*\$/.test(value)) err(where, 'dash-touching-math');
  for (const { re, why } of BANNED) { const m = value.match(re); if (m) err(where, 'banned-notation', `"${m[0]}" — ${why}`); }
  for (const ch of value) if (EMOJI.test(ch) && !EMOJI_OK.has(ch)) { err(where, 'decorative-emoji', ch); break; }
  for (const re of MONOLOGUE) { const m = value.match(re); if (m) err(where, 'author-monologue', `"${m[0]}"`); }
}

/**
 * The tutor model reads a question and its solution through renderFocusContext,
 * capped in lib/tutor-presence. A question that does not fit is cut silently and
 * the model re-solves it from scratch; scripts/test-tutor-context-fit.ts fails
 * the build on it. Checked here with the same renderer and the same test, where
 * the author can still shorten the item.
 */
function checkContextFit(where: string, questionText: string, question: PracticeQuestion) {
  const brief = renderFocusContext({ where: 'gate', questionText, question } as never);
  if (!brief.includes(`q: ${questionText}`)) err(where, 'context-cut-question', `${questionText.length} chars; the tutor would not see the whole question`);
  const steps = question.solution?.steps ?? [];
  const cut = steps.findIndex((s, i) => !brief.includes(`${i + 1}. ${stripFigureFences(s)}`));
  if (cut >= 0) err(where, 'context-cut-solution', `steps from ${cut} on never reach the tutor; shorten the solution`);
}

/** Which of the topic's four tools a solution actually uses. A figure counts,
 *  not a word: "טבלה" in prose is not a table the student sees. */
function toolsOf(text: string, mech: string[]) {
  return {
    table: hasTable(text),
    tree: hasProbTree(text),
    binomial: mech.includes('binomial'),
    conditional: mech.includes('conditional'),
  };
}
type Tools = ReturnType<typeof toolsOf>;
const questionTools = (q: PracticeQuestion): Tools => toolsOf((q.solution?.steps ?? []).join('\n'), mechanisms(q));
const bagrutTools = (b: StaticBagrutQuestion): Tools => {
  const steps = b.parts.flatMap((p) => p.solution?.steps ?? []).join('\n');
  const pseudo = { question: `${b.context} ${b.parts.map((p) => p.prompt).join(' ')}`, solution: { steps: [steps] } } as PracticeQuestion;
  return toolsOf(steps, mechanisms(pseudo));
};

/**
 * THE OWNER'S MIX (2026-09-14): "ברמת תרגול מסכם הכל יחד … הרוב שם זה הסתברות
 * עץ כמעט בלי טבלה". A summary stage that is mostly trees trains one tool. Per
 * rung, each tool must appear in at least `min` questions, and no tool may carry
 * more than `maxShare` of the rung. pr-conditional teaches the conditional in all
 * three models (its own summary: "בטבלה, בעץ ובברנולי"), so it gets a lighter mix.
 */
const MIX: Record<string, { practice: Partial<Record<keyof Tools, number>>; bagrut: Partial<Record<keyof Tools, number>>; maxShare: number }> = {
  'pr-practice': { practice: { table: 5, tree: 5, binomial: 4, conditional: 4 }, bagrut: { table: 7, tree: 7, binomial: 8, conditional: 10 }, maxShare: 0.5 },
  'pr-conditional': { practice: { table: 4, tree: 4, binomial: 3 }, bagrut: { table: 5, tree: 5, binomial: 4 }, maxShare: 0.6 },
};

/** Every numeral except the ones every probability question shares. */
function numbersOf(text: string): Set<string> {
  const out = new Set<string>();
  for (const m of text.replace(/\\[a-zA-Z]+/g, ' ').matchAll(/\d+(?:\.\d+)?/g)) {
    const n = String(Number(m[0]));
    if (!['0', '1', '2', '100'].includes(n)) out.add(n);
  }
  return out;
}
const answersOf = (specs: (unknown | undefined)[]): Set<string> => {
  const out = new Set<string>();
  for (const s of specs) {
    const spec = s as { kind?: string; value?: string; values?: string[] } | undefined;
    for (const v of spec?.kind === 'value' ? [spec.value] : spec?.kind === 'set' ? (spec.values ?? []) : []) {
      const n = numeric(v);
      if (n !== null) out.add(n.toFixed(6));
    }
  }
  return out;
};

/**
 * "Parallel authors clone what they cannot see" (round 2: three of six stages
 * shipped a practice question with the same ask, numbers and answer as a part of
 * their OWN bagrut question, every signature gate green). A round-3 item is a
 * clone of another item in its stage — a practice question, a bagrut question,
 * or a lesson step's example/drill — when it keeps most of the other's
 * distinctive numbers AND lands on one of its answers (or keeps five numbers).
 */
type Statement = { id: string; nums: Set<string>; answers: Set<string>; lesson: boolean };
function cloneOf(me: Statement, pool: Statement[]): string | null {
  if (me.nums.size < 3) return null;
  for (const o of pool) {
    if (o.id === me.id || o.nums.size < 3) continue;
    let shared = 0;
    for (const n of me.nums) if (o.nums.has(n)) shared++;
    if (shared < 3 || shared / Math.min(me.nums.size, o.nums.size) < 0.75) continue;
    const sameAnswer = [...me.answers].some((a) => o.answers.has(a));
    // Calibrated on the shipped stages (CLONE_PROBE=1): shared numbers alone
    // over-fire, because probability tables reuse round totals — pr-x-tab-105
    // and -106 share 30/60/90/120/150 and are different questions. A kept answer
    // is what makes it the same question; without one, nearly every number must go.
    if (sameAnswer || (shared >= 6 && shared / Math.min(me.nums.size, o.nums.size) >= 0.9)) {
      return `${o.id} (${shared} shared numbers${sameAnswer ? ' and an answer' : ''})`;
    }
  }
  return null;
}

function checkQuestion(q: PracticeQuestion, prefix: string) {
  const w = q.id || '(no id)';
  if (!new RegExp(`^${prefix}[123]\\d\\d$`).test(q.id)) err(w, 'bad-id', `expected ${prefix}1NN / 2NN / 3NN (rounds 1–3)`);
  checkText(`${w}.question`, q.question ?? '');
  if (isR3(q.id)) {
    const stem = q.question.match(OFF_EXAM_STEM);
    if (stem) err(w, 'off-exam-stem', `"${stem[0]}" — the archive never asks this way; ask what a 571 part asks`);
    checkContextFit(w, q.question, q);
  }
  if (!q.hint?.trim()) err(w, 'missing-hint'); else checkText(`${w}.hint`, q.hint);
  (q.answers ?? []).forEach((a, i) => checkText(`${w}.answers[${i}]`, a));
  (q.distractorNotes ?? []).forEach((n, i) => { if (n) checkText(`${w}.distractorNotes[${i}]`, n); });
  (q.wrongAnswers ?? []).forEach((x, i) => checkText(`${w}.wrongAnswers[${i}].note`, x.note));
  const sol = q.solution;
  if (!sol) return err(w, 'missing-solution');
  (sol.steps ?? []).forEach((s, i) => checkText(`${w}.steps[${i}]`, s));
  checkText(`${w}.finalAnswer`, sol.finalAnswer ?? '');
  if (!sol.explanation?.trim()) warn(w, 'missing-explanation'); else checkText(`${w}.explanation`, sol.explanation);

  const steps = sol.steps ?? [];
  if (steps.length < 4) err(w, 'too-few-steps', `${steps.length} (need ≥4)`);
  if (!steps[0]?.startsWith(RULE)) err(w, 'no-rule-line');
  if (steps[0] && leaksAnswer(steps[0], sol.finalAnswer ?? '')) err(w, 'rule-line-leaks-answer');
  if (q.hint && leaksAnswer(q.hint, sol.finalAnswer ?? '')) err(w, 'hint-leaks-answer');
  if (q.hint && steps[0] && norm(steps[0]).includes(norm(q.hint))) err(w, 'rule-line-restates-hint');

  // The owner's answer-notation rule: name the event in plain text, never a bare number.
  const fa = sol.finalAnswer ?? '';
  if (/^\s*\$?[\d.,/\\]+\$?\s*$/.test(fa)) err(w, 'bare-number-answer', `"${fa}" — name the event: P(תיאור) $= ערך$`);
  if (/\$P\(\$/.test(fa)) err(w, 'split-island-P', 'the $P($…$)$ pattern renders broken in RTL');

  if (q.kind === 'mcq') {
    const ans = q.answers ?? [];
    if (ans.length !== 4) err(w, 'mcq-needs-4-options', String(ans.length));
    if (q.correct !== 0) err(w, 'mcq-correct-must-be-index-0', `correct=${q.correct}`);
    const seen = new Set<string>();
    ans.forEach((a, i) => { const n = norm(a); if (seen.has(n)) err(w, 'duplicate-option', `answers[${i}]`); seen.add(n); });
    const notes = q.distractorNotes ?? [];
    if (notes.length !== ans.length) err(w, 'distractorNotes-length', `${notes.length} vs ${ans.length}`);
    else notes.forEach((n, i) => {
      if (i === q.correct) { if (n) err(w, 'note-on-correct-option'); }
      else if (!n || n.trim().length < 20) err(w, 'thin-distractor-note', `[${i}]`);
    });
  } else {
    if (q.answers?.length || q.correct !== undefined) err(w, 'mcq-fields-on-open');
    const spec = q.expected as { kind: string; value?: string; values?: string[] } | undefined;
    if (!spec) err(w, 'missing-expected');
    else if (spec.kind === 'value' || spec.kind === 'set') {
      const input = spec.kind === 'value' ? (spec.value ?? '') : (spec.values ?? []).join(' , ');
      const res = q.answerLabels?.length
        ? checkAnswerParts(spec.values ?? [], q.expected as never)
        : checkAnswer(input, q.expected as never);
      if (res.verdict !== 'correct') err(w, 'expected-does-not-grade', `verdict=${res.verdict}`);
      if (!q.wrongAnswers?.length) err(w, 'missing-wrongAnswers');
      for (const x of q.wrongAnswers ?? []) {
        const asInput = q.answerLabels?.length ? x.value.split(',').map((s) => s.trim()) : x.value;
        if (!matchKnownMistake(asInput, [x])) err(w, 'wrongAnswer-unparseable', x.value);
        else {
          const v = Array.isArray(asInput) ? checkAnswerParts(asInput, q.expected as never).verdict : checkAnswer(asInput, q.expected as never).verdict;
          if (v === 'correct') err(w, 'wrongAnswer-equals-correct', x.value);
        }
        if (x.note.trim().length < 25) err(w, 'thin-wrongAnswer-note', x.value);
      }
    }
  }
}

/**
 * FIGURES (2026-09-06, owner): "איפה שצריך ציורים של העץ או הטבלה אז יהיה אותם".
 * A solution that builds a tree must draw it (```probtree, rendered by
 * components/practice/ProbTree); one that fills a table must draw it (a
 * markdown table, the answer cell ringed with ((…))). And a drawn figure must
 * agree with itself and with the answer — lib/prob-figure checks that.
 * Applies to every question on the rung, shipped ones included; a shipped
 * question without its figure is a warning until --strict-figures.
 */
/** "עץ" as a coin face (יצא עץ, לפחות עץ אחד, עץ או פלי) is not a tree. */
function saysTree(text: string): boolean {
  const t = text.replace(/(?:יצא|יצאו|יוצא|לפחות|בדיוק|פעמיים|פעם|פעמים)\s*עץ(?:\s*אחד)?|עץ\s*(?:אחד|או\s*פלי)|פלי\s*או\s*עץ/g, '');
  return /עץ/.test(t);
}

/** One line, one move. Itay on a phone, 2026-09-06: "שום דבר לא יהיה דחוס והכל
 *  יהיה מובן." A line carrying two or more TALL calculations — fractions,
 *  binomials, products — wraps into a wall on a 375px screen. A label plus one
 *  calculation is fine, and a display block alone on its line IS the fix. */
function crowdedLines(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    // Skip a markdown TABLE row (starts with a pipe), not any line containing a
    // pipe: `P(אישה \mid מהבית)` and `P(A | B)` carry one mid-line, and skipping
    // those hid the longest chains in the topic — conditional probability is
    // where the crowding lives.
    if (!t || t.startsWith('```') || t.startsWith('$$') || t.startsWith('|')) continue;
    // A calculation, not a value: naming two fractions in one sentence
    // ("$\dfrac{3}{10}$ ולא $\dfrac12$") reads fine; multiplying them does not.
    const tall = (t.match(/\$[^$\n]+\$/g) ?? []).filter(
      (s) => (/\\dfrac|\\binom|\\frac/.test(s) && /=|\\cdot|\+|-/.test(s)) || /\\cdot/.test(s) || s.length > 22,
    );
    if (tall.length >= 2) out.push(t.slice(0, 60));
  }
  return out;
}

function checkFigures(q: PracticeQuestion, stageId: string, shipped: boolean) {
  const text = (q.solution?.steps ?? []).join('\n');
  const sev: Sev = shipped && !STRICT_FIGURES ? 'warn' : 'error';
  const push = (rule: string, detail: string) => findings.push({ sev, where: q.id, rule, detail });
  // An ERROR on shipped questions too, unlike the figure rules: the whole topic
  // was swept clean on 2026-09-06, so there is no backlog to grandfather, and a
  // warning would let the crowding creep back one line at a time.
  for (const line of crowdedLines(text)) {
    findings.push({ sev: 'error', where: q.id, rule: 'crowded-line', detail: `two calculations on one line — give each its own line (\\n\\n): "${line}…"` });
  }
  if (stageId !== 'pr-basics' && saysTree(text) && !hasProbTree(text)) {
    push('tree-without-figure', 'the solution builds a tree — draw it with a ```probtree fence in the step that builds it');
  }
  if (/טבלה/.test(text) && !hasTable(text)) {
    push('table-without-figure', 'the solution fills a table — draw it as a markdown table and ring the answer cell with ((…))');
  }
  for (const e of checkProbTreeFences(text)) err(q.id, 'probtree-inconsistent', e);
  for (const e of checkProbTables(text)) err(q.id, 'table-inconsistent', e);
  const picked = pickedTotal(text);
  const spec = q.expected as { kind: string; value?: string } | undefined;
  if (picked !== null && spec?.kind === 'value') {
    const v = numeric(spec.value);
    // A WARNING, not an error: in a conditional the ✓ paths are the DENOMINATOR
    // (prob-px-003 picks 0.5 = P(walked), answer 0.05/0.5), and in a complement
    // they are the event being subtracted (prob-sub-basics-005 picks 0.08,
    // answer 0.92). Both are correct drawings. Only a plain "sum the ✓ paths"
    // question should match, so the author reads this line and decides.
    if (v !== null && Math.abs(v - picked) > 1e-3 && Math.abs(1 - picked - v) > 1e-3) {
      warn(q.id, 'tree-picks-not-the-answer', `the ✓ leaves sum to ${picked.toFixed(4)}, expected is ${spec.value} — fine for a conditional's denominator, otherwise check the picks`);
    }
  }
}

/**
 * BAGRUT RUNG (2026-09-06, owner): more multi-part questions, exam-shaped. A
 * real שאלון 571 question has 4–5 parts, opens on a recovered parameter or
 * turns backwards with "ידוע ש…", and its hardest part sits at the exam bar.
 */
function checkBagrut(stageId: string, prefix: string) {
  const abbr = prefix.replace('pr-x-', '').replace(/-$/, '');
  const mine = PROB_EXTRA_BAGRUT.filter((b) => b.subTopicId === stageId);
  if (!mine.length) { err(stageId, 'bagrut-below-minimum', 'no EXTRA_BAGRUT question for this stage'); return; }
  const rungSize = (getLesson('math5', TOPIC)?.bagrutQuestions ?? []).filter((b) => b.subTopicId === stageId).length;
  if (rungSize < BAGRUT_MIN) err(stageId, 'bagrut-rung-below-20', `${rungSize} bagrut questions on the 🎓 rung < ${BAGRUT_MIN}`);
  const LABELS = ['א', 'ב', 'ג', 'ד', 'ה'];
  for (const b of mine) {
    const w = b.id;
    if (!new RegExp(`^prob-bag-x-${abbr}-\\d{2}$`).test(w)) err(w, 'bad-bagrut-id', `expected prob-bag-x-${abbr}-NN`);
    if (!b.context?.trim()) err(w, 'bagrut-no-context'); else checkText(`${w}.context`, b.context);
    if (isR3Bagrut(w)) {
      for (const [field, s] of [['context', b.context], ...b.parts.map((p) => [`${p.label}.prompt`, p.prompt])] as [string, string][]) {
        const stem = (s ?? '').match(OFF_EXAM_STEM);
        if (stem) err(`${w}.${field}`, 'off-exam-stem', `"${stem[0]}" — the archive never asks this way`);
      }
      for (const p of b.parts) checkContextFit(`${w}/${p.label}`, partQuestionText(b.context, p), partAsQuestion(p, { questionId: w }));
    }
    const parts = b.parts ?? [];
    if (parts.length < 4 || parts.length > 5) err(w, 'bagrut-parts-count', `${parts.length} (a real 571 question has 4–5)`);
    const scores: number[] = [];
    let anyParam = false, anyReverse = false;
    parts.forEach((p, i) => {
      const pw = `${w}/${p.label}`;
      if (p.label !== LABELS[i]) err(pw, 'bagrut-part-label', `expected ${LABELS[i]}`);
      checkText(`${pw}.prompt`, p.prompt ?? '');
      if ((p.hints ?? []).length !== 3) err(pw, 'bagrut-hints-count', `${(p.hints ?? []).length} (exactly 3, gentle → almost-the-answer)`);
      (p.hints ?? []).forEach((h, j) => checkText(`${pw}.hints[${j}]`, h));
      const steps = p.solution?.steps ?? [];
      steps.forEach((s, j) => checkText(`${pw}.steps[${j}]`, s));
      if (steps.length < 3) err(pw, 'bagrut-too-few-steps', `${steps.length}`);
      if (steps.length > 12) warn(pw, 'long-part', `${steps.length} steps`);
      if (!steps[0]?.startsWith(RULE)) err(pw, 'no-rule-line');
      const fa = p.solution?.final_answer ?? '';
      checkText(`${pw}.final_answer`, fa);
      if (steps[0] && leaksAnswer(steps[0], fa)) err(pw, 'rule-line-leaks-answer');
      for (const h of p.hints ?? []) if (leaksAnswer(h, fa)) err(pw, 'hint-leaks-answer');
      if (/^\s*\$?[\d.,/\\]+\$?\s*$/.test(fa)) err(pw, 'bare-number-answer', 'name the event: P(תיאור) $= ערך$');
      if (/\$P\(\$/.test(fa)) err(pw, 'split-island-P');
      const spec = p.expected as { kind: string; value?: string; values?: string[] } | undefined;
      if (!spec) err(pw, 'missing-expected');
      else if (spec.kind === 'value' || spec.kind === 'set') {
        const input = spec.kind === 'value' ? (spec.value ?? '') : (spec.values ?? []).join(' , ');
        const res = p.answerLabels?.length ? checkAnswerParts(spec.values ?? [], p.expected as never) : checkAnswer(input, p.expected as never);
        if (res.verdict !== 'correct') err(pw, 'expected-does-not-grade', `verdict=${res.verdict}`);
        if (p.answerLabels && spec.kind === 'set' && p.answerLabels.length !== (spec.values ?? []).length) err(pw, 'answerLabels-length');
      }
      const text = steps.join('\n');
      if (saysTree(text) && !hasProbTree(text)) err(pw, 'tree-without-figure', 'draw the tree with a ```probtree fence');
      if (/טבלה/.test(text) && !hasTable(text)) err(pw, 'table-without-figure', 'draw the table as a markdown table');
      for (const e of checkProbTreeFences(text)) err(pw, 'probtree-inconsistent', e);
      for (const e of checkProbTables(text)) err(pw, 'table-inconsistent', e);
      const pseudo = { id: pw, difficulty: 'hard', kind: 'open', question: `${b.context} ${p.prompt}`, solution: { steps, finalAnswer: '', explanation: '' } } as PracticeQuestion;
      scores.push(difficulty(pseudo).score);
      if (hasParameter({ question: p.prompt } as PracticeQuestion) || askShape({ question: p.prompt } as PracticeQuestion) === 'find-parameter') anyParam = true;
      if (isReverse({ question: p.prompt } as PracticeQuestion)) anyReverse = true;
    });
    const max = scores.length ? Math.max(...scores) : 0;
    const mean = scores.length ? scores.reduce((a, c) => a + c, 0) / scores.length : 0;
    if (max < BAR.score * 0.9) err(w, 'bagrut-below-exam-bar', `hardest part ${max.toFixed(1)} vs the real 571 bar ${BAR.score.toFixed(1)}`);
    if (isR3Bagrut(w)) {
      if (max < BAR.score * R3_BAGRUT_HARDEST - EPS) err(w, 'round3-bagrut-hardest-below', `hardest part ${max.toFixed(2)} < ${(BAR.score * R3_BAGRUT_HARDEST).toFixed(2)} (the exam's hardest-part average × ${R3_BAGRUT_HARDEST}); "ברמת בגרות הרבה יותר"`);
      if (mean < BAR.score * R3_BAGRUT_MEAN - EPS) err(w, 'round3-bagrut-mean-below', `average part ${mean.toFixed(2)} < ${(BAR.score * R3_BAGRUT_MEAN).toFixed(2)} (the exam's hardest-part average)`);
    }
    if (!anyParam && !anyReverse) err(w, 'bagrut-no-parameter-or-reverse', 'a real 571 question opens on "מצאו את P/x" or turns backwards with "ידוע ש…"');
    console.log(`   🎓 ${w}: ${parts.length} parts · part scores ${scores.map((s) => s.toFixed(0)).join('/')} · mean ${mean.toFixed(1)} · hardest ${max.toFixed(1)} = ${((max / (BAR.score || 1)) * 100).toFixed(0)}% of the exam bar`);
  }
}

// ---------------------------------------------------------------------------
function checkStage(stageId: string): boolean {
  const cfg = STAGES[stageId];
  const st = getSubTopic('math5', TOPIC, stageId) as SubTopic | undefined;
  const before = findings.length;
  if (!st) { err(stageId, 'stage-not-found'); return false; }

  const extra = PROB_EXTRA[stageId] ?? [];
  const extraIds = new Set(extra.map((q) => q.id));
  const existing = (st.questions ?? []).filter((q) => !extraIds.has(q.id));
  const all = BASELINE ? existing : (st.questions ?? []);

  if (!BASELINE) {
    for (const q of extra) if (!(st.questions ?? []).some((x) => x.id === q.id)) err(q.id, 'not-reaching-ladder');
    for (const q of extra) checkQuestion(q, cfg.prefix);

    // ---- figures, on the whole rung the student sees ----
    for (const q of all) checkFigures(q, stageId, !extraIds.has(q.id));

    // ---- round 2: mid/hard only, and harder than the rung already was ----
    const round2 = extra.filter((q) => /-2\d\d$/.test(q.id));
    if (round2.length) {
      const floor = ROUND2_FLOOR[stageId];
      const older = extra.filter((q) => !/-2\d\d$/.test(q.id)).concat(existing);
      const lowerSigsR1 = new Map<string, string>();
      for (const q of older) if (q.difficulty !== 'hard') lowerSigsR1.set(signature(q), q.id);
      for (const q of round2) {
        if (q.difficulty === 'easy') { err(q.id, 'round2-easy', 'this round adds ביסוס/אתגר/בגרות only'); continue; }
        const s = difficulty(q).score;
        const f = floor[q.difficulty];
        if (s < f) err(q.id, 'round2-not-harder', `scores ${s.toFixed(1)}, but the ${q.difficulty} rung already averaged ${f} — "לא משהו קליל"`);
        if (q.difficulty === 'mid') {
          const twin = lowerSigsR1.get(signature(q));
          if (twin) err(q.id, 'round2-mid-restatement', `same ask + mechanisms as ${twin}`);
        }
      }
      for (const d of ['mid', 'hard'] as const) {
        const n = round2.filter((q) => q.difficulty === d).length;
        if (n < ROUND2_MIN[d]) err(stageId, 'round2-below-minimum', `${d}: ${n} < ${ROUND2_MIN[d]}`);
      }
    }

    // ---- round 3: a band per rung, 20 per rung, variety, clones, the mix ----
    const snap = ROUND3_SNAPSHOT[stageId];
    const r3 = extra.filter((q) => isR3(q.id));
    for (const q of r3) {
      const s = difficulty(q).score;
      if (q.difficulty === 'easy' && s >= snap.mid - 1 - EPS) err(q.id, 'round3-easy-too-hard', `scores ${s.toFixed(1)}; the ביסוס rung averages ${snap.mid}, so a warm-up stays under ${(snap.mid - 1).toFixed(1)}`);
      if (q.difficulty === 'mid' && s < snap.mid - 1.5 - EPS) err(q.id, 'round3-mid-too-light', `scores ${s.toFixed(1)}; need ≥ ${(snap.mid - 1.5).toFixed(1)} (the ביסוס average ${snap.mid} − 1.5)`);
      if (q.difficulty === 'mid' && s >= snap.hard - EPS) err(q.id, 'round3-mid-too-hard', `scores ${s.toFixed(1)}; the אתגר rung averages ${snap.hard}, so this is a hard question`);
      if (q.difficulty === 'hard' && s < snap.hard - EPS) err(q.id, 'round3-hard-too-light', `scores ${s.toFixed(1)}; the אתגר rung already averaged ${snap.hard}, "ולא משהו קליל"`);
    }
    for (const d of ['easy', 'mid', 'hard'] as const) {
      const n = (st.questions ?? []).filter((q) => q.difficulty === d).length;
      if (n < RUNG_MIN) err(stageId, 'rung-below-20', `${d}: ${n} authored questions < ${RUNG_MIN}`);
    }
    if (r3.length) {
      const shapes3 = new Set(r3.map(askShape));
      const compute3 = r3.filter((q) => askShape(q) === 'compute').length / r3.length;
      if (shapes3.size < 3) err(stageId, 'round3-too-few-shapes', `${shapes3.size} ask shapes among the new questions (${[...shapes3].join(', ')}), need 3`);
      if (compute3 > 0.75 + EPS) err(stageId, 'round3-mostly-compute', `${Math.round(compute3 * 100)}% of the new questions only ask "compute"`);
    }

    // clones, against everything the student meets in this stage
    const bagrutHere = (getLesson('math5', TOPIC)?.bagrutQuestions ?? []).filter((b) => b.subTopicId === stageId);
    const pool: Statement[] = [
      ...(st.questions ?? []).map((q) => ({ id: q.id, nums: numbersOf(q.question), answers: answersOf([q.expected]), lesson: false })),
      ...bagrutHere.map((b) => ({ id: b.id, nums: numbersOf(`${b.context} ${b.parts.map((p) => p.prompt).join(' ')}`), answers: answersOf(b.parts.map((p) => p.expected)), lesson: false })),
      ...(st.lesson ?? []).flatMap((step, i) => {
        const s = step as unknown as { example?: { problem?: string; answer?: string }; drill?: { question?: string; answers?: string[]; correct?: number; expected?: unknown; solution?: { finalAnswer?: string } } };
        const textAnswers = (t: string | undefined) => new Set([...numbersOf(t ?? '')].map((n) => Number(n).toFixed(6)));
        const out: Statement[] = [];
        if (s.example?.problem) out.push({ id: `${stageId} lesson step ${i + 1} example`, nums: numbersOf(s.example.problem), answers: textAnswers(s.example.answer), lesson: true });
        if (s.drill?.question) {
          const d = s.drill;
          const ans = d.answers && d.correct !== undefined ? textAnswers(d.answers[d.correct]) : new Set([...answersOf([d.expected]), ...textAnswers(d.solution?.finalAnswer)]);
          out.push({ id: `${stageId} lesson step ${i + 1} drill`, nums: numbersOf(d.question), answers: ans, lesson: true });
        }
        return out;
      }),
    ];
    // CLONE_PROBE=1 runs the detector over every item, to calibrate it on shipped content
    for (const me of pool.filter((s) => isR3(s.id) || isR3Bagrut(s.id) || (process.env.CLONE_PROBE && !s.lesson))) {
      const twin = cloneOf(me, pool);
      if (twin) err(me.id, 'round3-numeric-clone', `keeps the numbers of ${twin}; change the scenario's numbers`);
    }

    // the mix
    const mix = MIX[stageId];
    if (mix) {
      for (const d of ['easy', 'mid', 'hard'] as const) {
        const qs = (st.questions ?? []).filter((q) => q.difficulty === d);
        const tools = qs.map(questionTools);
        for (const [tool, min] of Object.entries(mix.practice) as [keyof Tools, number][]) {
          const n = tools.filter((t) => t[tool]).length;
          if (n < min) err(stageId, 'mix-below', `${d}: ${tool} in ${n} questions < ${min}`);
          if (qs.length && n / qs.length > mix.maxShare + EPS) err(stageId, 'mix-one-tool', `${d}: ${tool} in ${n}/${qs.length} questions (> ${Math.round(mix.maxShare * 100)}%)`);
        }
      }
      const btools = bagrutHere.map(bagrutTools);
      for (const [tool, min] of Object.entries(mix.bagrut) as [keyof Tools, number][]) {
        const n = btools.filter((t) => t[tool]).length;
        if (n < min) err(stageId, 'mix-below', `bagrut: ${tool} in ${n} questions < ${min}`);
      }
    }

    if (DUMP) {
      for (const q of all) {
        const d = difficulty(q);
        const t = questionTools(q);
        console.log(`   · ${q.id.padEnd(22)} ${q.difficulty.padEnd(4)} ${d.score.toFixed(1).padStart(5)}  steps ${String(d.steps).padStart(2)}  ${d.shape.padEnd(14)}${hasParameter(q) ? ' param' : ''}${isReverse(q) ? ' reverse' : ''}  [${d.mechanisms.join(',')}]  ${Object.entries(t).filter(([, v]) => v).map(([k]) => k).join('+')}`);
      }
    }

    // ---- the bagrut rung ----
    checkBagrut(stageId, cfg.prefix);

    for (const d of ['easy', 'mid', 'hard'] as const) {
      const n = extra.filter((q) => q.difficulty === d).length;
      if (n < cfg.min[d]) err(stageId, 'below-minimum', `${d}: ${n} < ${cfg.min[d]}`);
    }
    // no duplicate question text against the shipped baseline
    for (const q of extra) for (const ex of existing) {
      if (norm(q.question) === norm(ex.question)) err(q.id, 'duplicate-of-existing-question', ex.id);
    }
  }

  // ---- the escalation contract, over the rung the STUDENT sees ----
  const rung = (d: string) => all.filter((q) => q.difficulty === d);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const stat = (d: string) => {
    const qs = rung(d).map(difficulty);
    return { n: qs.length, score: avg(qs.map((x) => x.score)), mech: avg(qs.map((x) => x.mechanisms.length)), steps: avg(qs.map((x) => x.steps)) };
  };
  const e = stat('easy'), m = stat('mid'), h = stat('hard');

  const MIN_STEP_UP = 2.0;   // composite score must climb by at least this
  const MIN_MECH_UP = 0.3;   // and so must the average mechanism count
  if (m.score - e.score < MIN_STEP_UP) err(stageId, 'no-escalation', `mid is not harder than easy (${e.score.toFixed(1)} → ${m.score.toFixed(1)}, need +${MIN_STEP_UP})`);
  if (h.score - m.score < MIN_STEP_UP) err(stageId, 'no-escalation', `hard is not harder than mid (${m.score.toFixed(1)} → ${h.score.toFixed(1)}, need +${MIN_STEP_UP})`);
  if (m.mech - e.mech < MIN_MECH_UP) err(stageId, 'no-escalation-mechanisms', `easy ${e.mech.toFixed(2)} → mid ${m.mech.toFixed(2)}`);
  if (h.mech - m.mech < MIN_MECH_UP) err(stageId, 'no-escalation-mechanisms', `mid ${m.mech.toFixed(2)} → hard ${h.mech.toFixed(2)}`);

  // ---- the defect the owner actually reported: a hard question that is a mid
  //      question with different numbers ----
  const lowerSigs = new Map<string, string>();
  for (const q of [...rung('easy'), ...rung('mid')]) lowerSigs.set(signature(q), q.id);
  for (const q of rung('hard')) {
    const twin = lowerSigs.get(signature(q));
    if (twin) err(q.id, 'hard-is-a-restatement', `same ask + same mechanisms as ${twin} (${signature(q)})`);
  }

  // ---- variety ----
  const shapes = new Set(all.map(askShape));
  if (shapes.size < cfg.shapes) err(stageId, 'too-few-ask-shapes', `${shapes.size} distinct (${[...shapes].join(', ')}), need ${cfg.shapes}`);
  const computeShare = all.filter((q) => askShape(q) === 'compute').length / (all.length || 1);
  if (computeShare > 0.7) warn(stageId, 'mostly-compute', `${Math.round(computeShare * 100)}% of the stage asks "compute"`);

  // ---- does this stage's hard rung reach the exam? ----
  const bar = BAR.score;
  const reach = bar ? (h.score / bar) * 100 : 0;
  if (stageId === 'pr-practice' && h.n > 0 && h.score < bar * 0.85) {
    err(stageId, 'does-not-reach-the-exam',
      `hard rung averages ${h.score.toFixed(1)} against the real 571 parts' ${bar.toFixed(1)} ` +
      `(${reach.toFixed(0)}%) — the summary stage has to land a student on an actual bagrut part`);
  }

  const mine = findings.slice(before);
  const errors = mine.filter((f) => f.sev === 'error');
  console.log(
    `\n${stageId.padEnd(16)} ${BASELINE ? 'BASELINE' : `extra ${String(extra.length).padStart(2)}`} → ${String(all.length).padStart(2)}q  ` +
      `easy ${e.n}/${e.score.toFixed(1)} → mid ${m.n}/${m.score.toFixed(1)} → hard ${h.n}/${h.score.toFixed(1)}  ` +
      `· mech ${e.mech.toFixed(1)}→${m.mech.toFixed(1)}→${h.mech.toFixed(1)} · shapes ${shapes.size} ` +
      `· exam-reach ${reach.toFixed(0)}% · ${errors.length} error(s)`,
  );
  for (const f of mine) console.log(`   ${f.sev === 'error' ? '✗' : '⚠'} ${f.where}  ${f.rule}${f.detail ? '  — ' + f.detail : ''}`);
  return errors.length === 0;
}

/**
 * DOES THE LADDER REACH THE EXAM? The owner's goal for this track, in his words:
 * "שבסוף יצליח לגשת לשאלת בגרות אמיתית ולהצליח בה". So the last stage's hard
 * rung is measured against the real thing — the parts of the archived הסתברות
 * questions from שאלון 571, scored with the SAME difficulty model.
 *
 * It is a proxy, so it is reported for every stage and enforced only on
 * pr-practice, which is the stage that claims to be exam level.
 */
function bagrutBar(): { score: number; n: number; perPart: number } {
  const perQuestionMax: number[] = [];
  const everyPart: number[] = [];
  for (const q of ALL_PAST_BAGRUYOT) {
    if (!/הסתבר|קומבינטור/.test(q.topic ?? '')) continue;
    const scores = (q.parts ?? []).map((p) =>
      difficulty({
        id: `${q.id}/${p.label}`,
        difficulty: 'hard',
        kind: 'open',
        // the context carries the mechanisms, the prompt carries the ask
        question: `${q.context ?? ''} ${p.prompt ?? ''}`,
        solution: { steps: p.solution?.steps ?? [], finalAnswer: '', explanation: '' },
      } as PracticeQuestion).score,
    );
    if (!scores.length) continue;
    everyPart.push(...scores);
    perQuestionMax.push(Math.max(...scores));
  }
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  // THE BAR IS THE HARDEST PART OF EACH QUESTION, not the average part.
  // Part ג is easy once א and ב are done; what a student has to survive
  // unaided is the hardest single demand the question makes. Averaging every
  // part flatters the ladder by counting the scaffolded ones.
  return { score: avg(perQuestionMax), n: perQuestionMax.length, perPart: avg(everyPart) };
}

const arg = process.argv[2];
if (!arg || (arg !== 'all' && !STAGES[arg])) {
  console.error(`usage: npx tsx scripts/_prob-extra-check.ts <${Object.keys(STAGES).join('|')}|all> [--baseline]`);
  process.exit(2);
}
const BAR = bagrutBar();
console.log(
  `exam bar: ${BAR.n} real הסתברות questions from שאלון 571 — hardest part of each averages ` +
    `${BAR.score.toFixed(1)} (every part, including the scaffolded ones: ${BAR.perPart.toFixed(1)})`,
);
const ids = arg === 'all' ? Object.keys(STAGES) : [arg];
const ok = ids.map(checkStage).every(Boolean);
console.log(
  BASELINE
    ? '\n(baseline run — this grades the SHIPPED content, so failures here are the gap this round closes)'
    : ok
      ? '\n✅ clean — now run the numeric re-derivation (scripts/_prob-extra-checks/<stage>.ts)'
      : '\n❌ fix the errors above',
);
process.exit(BASELINE || ok ? 0 : 1);
