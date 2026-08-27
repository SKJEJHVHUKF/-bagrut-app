/**
 * verify-generator.ts — the CONTRACT gate for parameterised repair questions.
 *
 * ============================================================
 * WHY THIS EXISTS
 * ============================================================
 * Every other content gate in this repo reads FILES. A generated question is
 * not in a file: it exists only when a seed hits a template. So the same
 * failures the authored gates catch — Hebrew inside `$…$`, a swallowed
 * backslash, a missing rule line, the answer leaked into step 0 — are invisible
 * to `verify-rule-lines` and `check-tichon-notation` here, and would ship to a
 * student who is by definition already struggling.
 *
 * This gate closes that by MATERIALISING the templates: every template, every
 * difficulty it declares, SAMPLES seeds each, and then runs the authored rules
 * over the result. A template is a promise about infinitely many questions;
 * this is the sampling that makes the promise checkable.
 *
 * Four checks here have no authored equivalent, because they are failure modes
 * only parameterisation can produce:
 *
 *   · OPTION COLLISION. For some draws a distractor lands exactly on the
 *     correct answer. `build` is supposed to reject those; this proves it does.
 *   · REJECTION RATE. A template whose accept region is nearly empty silently
 *     stops supplying questions. Measured, with a floor.
 *   · VARIETY. Sixty seeds that produce four distinct questions is a bank with
 *     extra steps, not a generator — and the entire feature exists to stop
 *     re-serving the same item.
 *   · ROUND-TRIP. `generateById(q.id)` must rebuild the identical question.
 *     The answer log stores nothing but that id, so if this breaks, every
 *     historical generated attempt in the report becomes unreadable.
 *
 *   npx tsx scripts/verify-generator.ts
 */

import { checkAnswer, checkAnswerParts } from '../lib/answer-check';
import { getSubTopic } from '../content/lessons';
import { checkGeoFences } from '../lib/geo-figure';
import { leaksAnswer } from '../lib/help-ladder';
import { allTemplates, generate, generateById, getTemplate } from '../lib/generator';
import type { GeneratedQuestion } from '../lib/generator';
import { buildFixPath, buildSupply, MIN_STEPS, resolveFixQuestion } from '../lib/remediation';
import type { Weakness } from '../lib/remediation';

/** Seeds per (template, difficulty). High enough to hit the rare draws. */
const SAMPLES = 60;
/**
 * Below this acceptance rate a template is effectively out of supply.
 *
 * This was 0.5, and that was too lenient to be useful: `ag-circle-tangent`
 * failed to produce a question for 41% of seeds and the gate reported it as a
 * WARNING, so `buildSupply` was quietly getting less than it asked for at that
 * rung. A template that cannot answer half the time is broken, not borderline —
 * the honest floor is "almost always works", and a template below it should be
 * reparameterised so its constraints hold by construction.
 */
const MIN_ACCEPT_RATE = 0.9;
/** Distinct question texts required out of the accepted samples. */
const MIN_VARIETY = 0.4;

const RULE = '**הכלל:**';
const HEB = /[֐-׿]/;

/** Symbols the syllabus never uses — same list as check-tichon-notation. */
const BANNED = ['∀', '∃', '∧', '∨', '⟺', '∅', 'ℝ', 'ℂ', '■'];

/** LaTeX commands that must never appear bare — a bare one is a lost backslash. */
const MATH_WORDS = [
  'dfrac', 'frac', 'cdot', 'binom', 'sqrt', 'approx', 'cap', 'cup', 'mid',
  'ldots', 'text', 'times', 'Rightarrow', 'quad', 'le', 'ge', 'ne',
];

const errors: string[] = [];
const warnings: string[] = [];

function fail(where: string, msg: string) {
  errors.push(`${where}: ${msg}`);
}

/** The contents of every `$…$` / `$$…$$` island in a line. */
function mathSpans(line: string): string[] {
  const spans: string[] = [];
  const s = line.replace(/\\+\$/g, '¤');
  s.replace(/\$\$([^$]*)\$\$/g, (_m, g: string) => (spans.push(g), ' '));
  s.replace(/\$(?!\{)([^$\n]+?)\$/g, (_m, g: string) => (spans.push(g), ' '));
  return spans;
}

/** Every rule that applies to any student-visible string. */
function checkText(where: string, label: string, text: string) {
  if (!text) return;

  // Unbalanced `$` swallows the rest of the sentence on screen.
  const dollars = (text.replace(/\\\$/g, '').match(/\$/g) ?? []).length;
  if (dollars % 2 !== 0) fail(where, `${label}: מספר אי-זוגי של $ — "${text.slice(0, 90)}"`);

  for (const sym of BANNED) {
    if (text.includes(sym)) fail(where, `${label}: סימון שאינו תיכוני "${sym}"`);
  }

  for (const span of mathSpans(text)) {
    // KaTeX has no bidi: Hebrew inside a math island renders reversed.
    if (HEB.test(span)) fail(where, `${label}: עברית בתוך $…$ — "${span.slice(0, 60)}"`);
    for (const w of MATH_WORDS) {
      // A bare command word means the backslash was eaten somewhere.
      const bare = new RegExp(`(^|[^\\\\A-Za-z])${w}(?![A-Za-z])`);
      if (bare.test(span)) fail(where, `${label}: "${w}" בלי לוכסן — "${span.slice(0, 60)}"`);
    }
  }

  // A maqaf or em-dash straight before a math island reads as a minus in RTL.
  if (/[־—]\s*\$/.test(text)) {
    fail(where, `${label}: מקף לפני אי מתמטי נקרא כמינוס — "${text.slice(0, 90)}"`);
  }
}

/** Digits of a string, for the "does the final answer match the marked option" check. */
const digitsOf = (s: string) => (s.match(/\d/g) ?? []).join('');

function checkInstance(where: string, g: GeneratedQuestion) {
  const q = g.question;

  // Every ```geo fence, validated as a geometric MODEL by the real validator —
  // the same one `verify-content` runs over authored figures. A generated
  // figure computes its coordinates from the question's parameters, so this is
  // what proves the drawing and the numbers cannot drift apart: a label that
  // says 4 on a segment of length 5, a "parallel" pair that is not parallel, an
  // angle marked 50° that measures 47°, a point drawn off its own circle.
  for (const [label, text] of [
    ['question', q.question],
    ['solution', q.solution.steps.join('\n')],
  ] as const) {
    for (const e of checkGeoFences(text)) fail(where, `${label}: ${e}`);
  }

  checkText(where, 'question', q.question);
  for (const [i, s] of q.solution.steps.entries()) checkText(where, `step[${i}]`, s);
  checkText(where, 'finalAnswer', q.solution.finalAnswer);
  checkText(where, 'explanation', q.solution.explanation ?? '');
  if (q.hint) checkText(where, 'hint', q.hint);

  // --- the rule line -------------------------------------------------------
  const first = q.solution.steps[0] ?? '';
  if (!first.startsWith(RULE)) {
    fail(where, `הצעד הראשון אינו נפתח ב-${RULE} — "${first.slice(0, 70)}"`);
  }
  if (leaksAnswer(first, q.solution.finalAnswer)) {
    fail(where, 'התשובה הסופית דולפת לתוך הצעד הראשון — הרמה האמצעית בסולם העזרה מתה');
  }
  if (q.solution.steps.length < 2) fail(where, 'פתרון בן צעד אחד — אין מה להראות אחרי הכלל');

  // --- MCQ -----------------------------------------------------------------
  if (q.kind === 'mcq') {
    const answers = q.answers ?? [];
    if (answers.length !== 4) fail(where, `${answers.length} מסיחים במקום 4`);
    if (new Set(answers).size !== answers.length) fail(where, 'שתי אפשרויות זהות');
    if (q.correct === undefined || q.correct < 0 || q.correct >= answers.length) {
      fail(where, `correct=${q.correct} מחוץ לתחום`);
    }
    for (const [i, a] of answers.entries()) checkText(where, `answer[${i}]`, a);

    const notes = q.distractorNotes ?? [];
    if (notes.length !== answers.length) {
      fail(where, `distractorNotes באורך ${notes.length} מול ${answers.length} אפשרויות`);
    }
    for (const [i, n] of notes.entries()) {
      if (i === q.correct) {
        if (n) fail(where, 'לאפשרות הנכונה יש הסבר טעות');
      } else {
        if (!n) fail(where, `למסיח ${i} אין הסבר — "למה טעיתי?" יישאר ריק`);
        else checkText(where, `distractorNotes[${i}]`, n);
      }
    }

    // The marked option and the written final answer are computed from
    // separate expressions inside the template. If they disagree, one of them
    // is wrong — and an off-by-one in `correct` is otherwise invisible.
    const marked = digitsOf(answers[q.correct ?? 0] ?? '');
    const finalDigits = digitsOf(q.solution.finalAnswer);
    if (marked && !finalDigits.includes(marked)) {
      fail(
        where,
        `האפשרות המסומנת "${answers[q.correct ?? 0]}" אינה מופיעה בתשובה הסופית "${q.solution.finalAnswer}"`,
      );
    }
  }

  // --- open ----------------------------------------------------------------
  if (q.kind === 'open') {
    const tmpl = getTemplate(g.templateId);
    if (tmpl?.wrongAnswerTags && tmpl.wrongAnswerTags.length !== (q.wrongAnswers ?? []).length) {
      fail(
        where,
        `wrongAnswerTags באורך ${tmpl.wrongAnswerTags.length} מול ${(q.wrongAnswers ?? []).length} תשובות שגויות`,
      );
    }
    if (!q.expected) {
      fail(where, 'שאלה פתוחה בלי expected — אין בדיקה דטרמיניסטית');
    } else if (q.expected.kind !== 'manual') {
      // The spec must actually grade its own answer as correct. A typo in the
      // mathjs expression fails here rather than on a student.
      const res =
        q.answerLabels && q.expected.kind === 'set'
          ? checkAnswerParts(q.expected.values, q.expected)
          : checkAnswer(
              q.expected.kind === 'value' ? q.expected.value : q.expected.values.join(', '),
              q.expected,
            );
      if (res.verdict !== 'correct') {
        fail(where, `expected אינו מדרג את עצמו כנכון (${res.verdict})`);
      }
    }
    if (q.answerLabels) {
      if (q.expected?.kind !== 'set') {
        fail(where, 'answerLabels בלי expected מסוג set');
      } else if (q.answerLabels.length !== q.expected.values.length) {
        fail(where, `${q.answerLabels.length} תוויות מול ${q.expected.values.length} ערכים`);
      }
    }
    for (const w of q.wrongAnswers ?? []) {
      checkText(where, 'wrongAnswers.note', w.note);
      // A "predictable wrong answer" that grades as CORRECT would tell a
      // student who is right that they made a known mistake.
      if (q.expected && q.expected.kind !== 'manual') {
        const res = checkAnswer(w.value, q.expected);
        if (res.verdict === 'correct') {
          fail(where, `wrongAnswers מכיל את התשובה הנכונה "${w.value}"`);
        }
        if (res.verdict === 'unparseable') {
          fail(where, `wrongAnswers.value אינו ניתן לפענוח "${w.value}"`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------

let checked = 0;

for (const t of allTemplates()) {
  // The repair has to land somewhere real. A renamed sub-topic would make the
  // whole template unreachable, silently.
  if (!getSubTopic(t.subject, t.topic, t.subTopicId)) {
    fail(t.id, `subTopicId "${t.subTopicId}" לא קיים ב-content/lessons`);
    continue;
  }
  if (!t.difficulties.length) fail(t.id, 'אין רמות קושי');

  // The tag arrays are a POSITIONAL contract with the answer log: a stored
  // event keeps only `chosenIndex`, so reordering options without reordering
  // the tags silently relabels every historical answer on this template.
  if (t.distractorTags) {
    if (t.distractorTags.length !== 4) {
      fail(t.id, `distractorTags באורך ${t.distractorTags.length} במקום 4`);
    }
    if (t.distractorTags[0] !== null) {
      fail(t.id, 'distractorTags[0] אינו null — האפשרות הנכונה אינה טעות');
    }
    if (t.distractorTags.slice(1).some((x) => !x)) {
      fail(t.id, 'מסיח בלי תיוג — הקליק עליו לא ייספר בדוח הדפוסים');
    }
  }

  for (const difficulty of t.difficulties) {
    const where = `${t.id}/${difficulty}`;
    const accepted: GeneratedQuestion[] = [];
    let attempted = 0;

    for (let i = 0; i < SAMPLES; i++) {
      attempted += 1;
      // Widely spaced seeds — adjacent ones share a hash prefix and under-sample.
      const g = generate(t.id, difficulty, i * 7919 + 13);
      if (g) accepted.push(g);
    }

    if (!accepted.length) {
      fail(where, `אף לא מופע אחד מתוך ${SAMPLES} זרעים`);
      continue;
    }

    const rate = accepted.length / attempted;
    if (rate < MIN_ACCEPT_RATE) {
      fail(where, `שיעור קבלה ${(rate * 100).toFixed(0)}% — התבנית דוחה כמעט כל הגרלה`);
    }

    const texts = new Set(accepted.map((g) => g.question.question));
    if (texts.size / accepted.length < MIN_VARIETY) {
      fail(
        where,
        `רק ${texts.size} שאלות שונות מתוך ${accepted.length} — התבנית כמעט קבועה`,
      );
    }

    for (const g of accepted) {
      checked += 1;
      checkInstance(`${where}#${g.seed}`, g);

      // Round-trip: the id is the only thing the answer log keeps.
      const again = generateById(g.question.id);
      if (!again) {
        fail(`${where}#${g.seed}`, `generateById נכשל על "${g.question.id}"`);
      } else if (JSON.stringify(again.question) !== JSON.stringify(g.question)) {
        fail(`${where}#${g.seed}`, 'שחזור מהמזהה מחזיר שאלה אחרת — הדוח ההיסטורי יישבר');
      }
    }

    if (rate < 0.85) {
      warnings.push(`${where}: שיעור קבלה ${(rate * 100).toFixed(0)}%`);
    }
  }
}

// ---------------------------------------------------------------------------
// End-to-end: a template that never reaches a fix path is decoration.
//
// Everything above proves the templates produce good questions. This proves
// they REPLACE the bank — which is the actual product claim: the questions in
// a repair path are ones the learning path never showed the student. A regression
// in `buildSupply`'s tier order or in `resolveFixQuestion` would leave every
// check above green while quietly serving the old bank again.
// ---------------------------------------------------------------------------

const subTopicsWithTemplates = new Map<string, { subject: string; topic: string; id: string }>();
for (const t of allTemplates()) {
  subTopicsWithTemplates.set(`${t.subject}|${t.topic}|${t.subTopicId}`, {
    subject: t.subject,
    topic: t.topic,
    id: t.subTopicId,
  });
}

for (const { subject, topic, id } of subTopicsWithTemplates.values()) {
  const st = getSubTopic(subject, topic, id);
  if (!st) continue;
  const where = `path/${id}`;

  const w: Weakness = {
    id: `st:${id}`,
    kind: 'subtopic',
    subject,
    topic,
    subTopicId: id,
    title: st.title,
    detail: '',
    band: 'mid',
    confidence: 0.8,
    score: 1,
    hits: 3,
    opportunities: 5,
    lastTs: 0,
  };

  const path = buildFixPath(w, buildSupply(w, { seed: 20260827 }), 1000);
  if (!path) {
    fail(where, 'לא נבנה מסלול תיקון כלל');
    continue;
  }

  const generated = path.steps.filter((s) => s.origin === 'generated');
  if (generated.length < MIN_STEPS) {
    fail(
      where,
      `רק ${generated.length} מתוך ${path.steps.length} צעדים הם תרגילים חדשים — ` +
        'התלמיד מקבל בחזרה את מה שכבר ראה במסלול הלמידה',
    );
  }
  for (const s of path.steps) {
    if (!resolveFixQuestion(path, s)) fail(where, `הצעד "${s.questionId}" אינו ניתן לפתרון`);
  }
}

// ---------------------------------------------------------------------------

const templates = allTemplates();
console.log(
  `verify-generator: ${templates.length} תבניות, ${checked} מופעים נבדקו ` +
    `(${new Set(templates.map((t) => t.subTopicId)).size} תתי-נושא).`,
);

for (const w of warnings.slice(0, 10)) console.log(`  ⚠ ${w}`);

if (errors.length) {
  console.error(`\n❌ ${errors.length} כשלים:\n`);
  for (const e of errors.slice(0, 40)) console.error('  ' + e);
  if (errors.length > 40) console.error(`  … ועוד ${errors.length - 40}`);
  process.exit(1);
}

console.log('✅ כל התבניות עומדות בחוזה.');
