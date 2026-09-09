/**
 * verify-geo-ladder.ts — does גאומטריה's difficulty ladder actually climb?
 *
 *   npx tsx scripts/verify-geo-ladder.ts [--strict]
 *
 * Itay, 2026-09-07: "חשוב שהרמת קושי בשאלות תהיה הדרגתית — רמת חימום יהיה
 * יחסית פשוט וקל, ברמת ביסוס הרמה תעלה … וברמת אתגר השאלות יהיו באמת ברמה
 * קשה יותר."
 *
 * `difficulty` is a LABEL an author types. Nothing checked it, and on the two
 * topics where this model was applied first (הסתברות, פונקציות מנה ושורש) the
 * label was wrong often enough to invert whole rungs — a hard rung scoring
 * below its own mid rung, a mid rung invoking fewer theorems than its easy one.
 * This scores every question from its authored content and requires the rungs
 * to rise.
 *
 * WHAT IT DOES NOT DO: the prose rules (Hebrew-in-KaTeX, banned notation, the
 * `**הכלל:**` opening, author monologue, figure validity) all live in
 * verify-content / check-tichon-notation / verify-rule-lines, which already run
 * over this content in `npm run check`. Duplicating them here would mean two
 * copies drifting apart. This file owns the LADDER and nothing else.
 *
 * The weights are a stated simplification. The ORDERING is the claim, so the
 * gate requires both the composite score AND the least-gameable component
 * (distinct theorems invoked) to rise from rung to rung.
 */
import { getLesson } from '../content/lessons';
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';

const TOPIC = 'גיאומטריה אוקלידית';
const STRICT = process.argv.includes('--strict');
const FOCUS = process.argv[process.argv.indexOf('--stage') + 1] ?? '';

type Sev = 'error' | 'warn';
const findings: { sev: Sev; where: string; rule: string; detail: string }[] = [];
const err = (where: string, rule: string, detail = '') =>
  findings.push({ sev: 'error', where, rule, detail });
const warn = (where: string, rule: string, detail = '') =>
  findings.push({ sev: 'warn', where, rule, detail });

/**
 * The named theorems a geometry question can require, read from the question
 * AND its solution — a move often shows only in the working.
 *
 * 🔴 Every pattern must survive the definite article and Hebrew inflection.
 * `\b` is useless here: it is a boundary between \w and non-\w, and a Hebrew
 * letter is not \w, so beside Hebrew there is no boundary at all and /\bX\b/
 * matches nothing. Use `\s+\S*` between words instead of a literal space, so
 * "זווית היקפית" also matches "הזווית ההיקפית".
 */
export const MECHANISMS_FOR_TEST: [string, RegExp][] = [
  ['congruence', /חופפ|חפיפה|צ\.ז\.צ|ז\.צ\.ז|צ\.צ\.צ|צ\.צ\.ז/],
  // NOT a bare /דומים/. "כינוס איברים דומים" is collecting LIKE TERMS in
  // algebra, and it paid a warm-up angle question 2.5 difficulty points for
  // similar triangles it never mentions. Same bug as the /ריבוע/ one below.
  ['similarity', /(?<!איברים\s)דומים|דמיון|\\sim|ז\.ז(?![.א-ת])/],
  ['area-ratio', /יחס\s+\S*שטחים|k\^2|יחס הדמיון בריבוע/],
  ['same-height', /אותו גובה|יחס\s+\S*בסיסים|גובה משותף/],
  ['thales', /תאלס/],
  ['midline', /קטע\s+\S*אמצעים|קו\s+\S*אמצעים/],
  ['angle-bisector', /חוצה\s+\S*זווית|חוצי\s+\S*זוויות/],
  ['pythagoras', /פיתגורס/],
  ['altitude-hypotenuse', /הגובה ליתר|משפט הגובה|משפט הניצב|CH\^2/],
  ['isosceles', /שווה[- ]שוקיים|זוויות\s+\S*בסיס/],
  ['parallel-angles', /מתאימות|מתחלפות|חד[- ]צדדיות|קודקודיות|צמודות/],
  ['triangle-sum', /סכום\s+\S*זוויות\s+\S*משולש|180°\s*(?:במשולש)?/],
  ['median-hypotenuse', /תיכון ליתר/],
  ['medians-meet', /מפגש\s+\S*תיכונים|2\s*:\s*1/],
  // 🔴 NOT a bare /ריבוע/. In this topic "ריבוע" is far more often the SQUARE
  // OF A NUMBER than the shape — "ריבוע יחס הדמיון", "הגובה בריבוע", "סכום
  // הריבועים" — and a bare pattern paid 2.5 difficulty points to every question
  // that squared anything. It scored a two-similar-triangles warm-up as though
  // it also involved a quadrilateral. Same class of bug as the /גרף הפונקציה/
  // one in the functions gate: a word that names a thing is not the move.
  ['quadrilateral', /מקבילית|מלבן|מעוין|דלתון|טרפז|הריבוע\s+\$?[A-Z]|ריבוע\s+\$?[A-Z]{4}/],
  ['inscribed-angle', /זווית\s+\S*היקפית|זווית\s+\S*מרכזית|זוויות\s+\S*היקפיות/],
  ['diameter-right', /נשענת על\s+\S*קוטר|היקפית על קוטר/],
  ['cyclic-quad', /מרובע\s+\S*חסום|זוויות נגדיות/],
  ['tangent-radius', /משיק\S*\s+\S*(?:ניצב|מאונך)|מאונך לרדיוס|ניצב לרדיוס/],
  ['tangent-chord', /משיק[- ]מיתר|בין\s+\S*משיק\s+\S*מיתר/],
  ['two-tangents', /שני\s+\S*משיקים/],
  ['chord-perp', /אנך\s+\S*מהמרכז|האנך מהמרכז|חוצה את\s+\S*מיתר/],
  // "שני חותכים" alone is not this theorem: in Thales questions the same two
  // words mean two TRANSVERSALS crossing a set of parallels, which has nothing
  // to do with the power of a point. The external-point context is what makes
  // it the theorem, so the pattern demands it.
  ['power-of-point', /מיתרים\s+\S*(?:נחתכים|מצטלבים)|משיק\s+\S*וחותך|PT\^2|שני חותכים מנקודה/],
  // Naming a quantity ("שטח המשולש הקטן הוא 27") is not applying the area
  // formula. This wants the formula itself: base·height/2, the trapezoid's
  // (a+b)h/2, or a diagonal product.
  // `S = \dfrac…` was in this list and matched "חילוץ הנעלם: $S = \dfrac{675}{9}$",
  // a plain division. The two structural alternatives already catch the real
  // formula, so the loose one only inflated.
  ['area-formula', /\\dfrac\{[^}]*\\cdot[^}]*\}\{2\}|\\dfrac\{\([^)]*\+[^)]*\)[^}]*\}\{2\}|בסיס כפול גובה/],
  ['segment-arithmetic', /חיבור קטעים|חיסור קטעים|סכום שני הקטעים/],
];

const textOf = (q: PracticeQuestion) =>
  `${q.question} ${(q.solution?.steps ?? []).join(' ')} ${q.solution?.finalAnswer ?? ''}`;

/**
 * `diameter-right` SUBSUMES `inscribed-angle`: "זווית היקפית הנשענת על הקוטר"
 * is one theorem, and counting both paid it twice — enough on its own to lift a
 * warm-up above the rung above it.
 */
export const mechanismsOfText = (text: string): string[] => {
  const hit = MECHANISMS_FOR_TEST.filter(([, re]) => re.test(text)).map(([n]) => n);
  return hit.includes('diameter-right') ? hit.filter((m) => m !== 'inscribed-angle') : hit;
};

const mechanismsOf = (q: PracticeQuestion): string[] => mechanismsOfText(textOf(q));

/**
 * What the question asks the student to PRODUCE — the variety axis.
 * Ordered most-specific first: a "justify" net tested early swallows every
 * question that also says נמק.
 */
export function askShape(q: PracticeQuestion): string {
  const t = q.question;
  // 🔴 `justify` is tested BEFORE `prove`, and `prove` wants the IMPERATIVE.
  // /הוכח/ also matches the nouns "בהוכחה", "הוכחת חפיפה", "ההוכחה" — so every
  // question in eg-method that QUOTES a proof task and then asks for the
  // REASON ("מהו הנימוק הנכון?") was classified `prove`. The stage came out
  // with exactly one ask shape, which is the opposite of what it does.
  if (/מהו הנימוק|איזה נימוק|איזה משפט|מה הבעיה|איזה מהלך|נמק |הסבר מדוע|מה עליו לכתוב|נימוק \S*כשר/.test(t))
    return 'justify';
  if (/(?:^|[\s"״'(])הוכח(?=[\s.,:!?]|$)|הוכיחו|הראה כי|הראו כי|הסק כי|הסק ש/.test(t)) return 'prove';
  // `מצאו` (plural imperative) as well as `מצא` — the exam papers use the
  // plural throughout, and without it a ratio question written in the exam's
  // own voice fell through to `area` and then collided with a numeric
  // area question's signature.
  if (/יחס\s+\S*שטחים|מצא(?:ו)? את היחס|מהו היחס|היחס בין שטח/.test(t)) return 'find-ratio';
  if (/שטח/.test(t)) return 'area';
  if (/מצא את הזווית|מהי הזווית|\\angle[^$]*\$\?*\s*$|כמה מעלות|מצא את \$\\angle/.test(t)) return 'compute-angle';
  if (/מצא(?:ו)? את \$?[a-z]\$?|סמן ב-?\$?[a-z]|בטא באמצעות|עבור אילו ערכים/.test(t)) return 'find-parameter';
  if (/מצא את אורך|מהו אורך|מצא את \$[A-Z]{2}\$/.test(t)) return 'compute-length';
  return 'compute';
}

/**
 * Asks the bagrut does not make. Itay rejected this style on another topic
 * ("יש שם שאלות שבדרך כלל בבגרות לא שואלים"), and the variety rule below is
 * exactly what pushes an author toward them, so they are refused outright.
 *
 * `which-claim-is-true` is exempt in eg-method: naming the correct REASON for a
 * claim is that stage's entire subject, and the bagrut does demand it in the
 * טענה-ונימוק table.
 */
const OFF_STYLE: [string, RegExp, string[]?][] = [
  ['count-the-errors', /כמה טעויות|מספר הטעויות|כמה שגיאות/],
  ['which-claim-is-true', /איזו (?:מן ה)?טענה נכונה|איזו מהטענות|איזו קביעה/, ['eg-method']],
  ['what-if', /ומה אם|מה יקרה אם|אילו היה/],
  ['method-meta', /איזו שיטה|מה עדיף לעשות|כיצד כדאי/],
];

/** A quantity is named by a letter and recovered, rather than read off. */
const hasParameter = (q: PracticeQuestion) =>
  /סמן(?:ו)? (?:את [^ ]+ )?ב-?\$?[a-zx]\$?|בטא(?:ו)? באמצעות|נתון \$?[a-z]\$? |= x\b|\$x\+|עבור אילו ערכים/.test(
    q.question,
  );

/** The inference runs BACKWARDS: the theorem's CONCLUSION is given and one of
 *  its inputs is what the student must recover. */
const isReverse = (q: PracticeQuestion) =>
  /איזה ערך[^.]*יגרום|כדי ש[^.]*יתקיים|נתון ש[^.]*מצא את (?:רדיוס|הרדיוס)|ידוע (?:כי|ש)[^.]*(?:מקביל|חופפ|דומים)[^.]*מצא/.test(
    q.question,
  );

/**
 * The two demands the 571 papers make that a step-and-theorem count cannot see.
 *
 * Measured 2026-09-08 over the ten archived Euclidean questions (38 parts)
 * against our 52 hard questions:
 *
 *     הביעו באמצעות <symbol>   archive 29%   ours 2%
 *     יחס בין שטחים            archive  5%   ours 2%
 *     answer stays symbolic     archive  8%   ours 0%
 *
 * That is the whole of the owner's "רמת אתגר לא נראית מאתגרת". Our hard rung
 * proves things and then lands on a round number; the exam makes you carry a
 * symbol an earlier part introduced and express a later quantity through it.
 * Scoring it is what stops the next batch from drifting back.
 */
const EXPRESS_VIA_SYMBOL = /הביע|בטא(?:ו)? באמצעות|שווה ל-?\$m ?\\cdot|מצא(?:ו)? את \$m\$/;
const RATIO_OF_AREAS = /היחס בין שטח|יחס השטחים|יחס בין השטחים/;

export const isExamStyle = (q: PracticeQuestion) =>
  EXPRESS_VIA_SYMBOL.test(q.question) || RATIO_OF_AREAS.test(q.question);

function scoreOf(q: PracticeQuestion): number {
  const steps = (q.solution?.steps ?? []).length;
  const mech = mechanismsOf(q).length;
  const shape = askShape(q);
  const parts = (q.question.match(/\n[אבגד]\.\s/g) ?? []).length;
  return (
    steps +
    2.5 * mech +
    (hasParameter(q) ? 3 : 0) +
    (isReverse(q) ? 4 : 0) +
    (shape === 'prove' ? 3 : 0) +
    (['justify', 'find-ratio'].includes(shape) ? 2 : 0) +
    (EXPRESS_VIA_SYMBOL.test(q.question) ? 4 : 0) +
    (RATIO_OF_AREAS.test(q.question) ? 3 : 0) +
    2 * parts
  );
}

/** Makes "the challenge rung is the practice rung with different numbers"
 *  visible to a machine. */
const signatureOf = (q: PracticeQuestion) =>
  `${askShape(q)}|${mechanismsOf(q).sort().join(',')}` +
  `${hasParameter(q) ? '|param' : ''}${isReverse(q) ? '|rev' : ''}`;

/** The archived papers, scored with the SAME model: the HARDEST part of each
 *  question, because part ג is easy once א and ב are done and averaging every
 *  part flatters the ladder. */
function examBar(): { bar: number; n: number } {
  // 🔴 The first version of this filter matched 33 questions and 28 of them were
  // 582 ANALYTIC geometry and vectors — "מצאו את שיעורי הנקודה", "משוואת
  // המעגל", planes and position vectors. They mention משולש and מעגל, so they
  // passed, and they are much shorter to state than a Euclidean proof chain, so
  // they dragged the bar DOWN. Every stage then read as clearing 130–220% of an
  // exam it was never being compared to, while the owner looked at the actual
  // questions and said the אתגר rung was not hard. He was right and the number
  // was wrong. Only שאלון 571's Euclidean questions belong in this denominator.
  const ANALYTIC = /שיעורי|משוואת|ציר ה|\\vec|מישור|פרבול|ראשית הצירים|אליפס|היפרבול/;
  const isGeo = (s: string) =>
    /\\triangle|משולש|מרובע|מעגל|טרפז|מקבילית|מעוין/.test(s) &&
    !/גרף|נגזרת|אינטגרל|מרוכב|הסתברות/.test(s) &&
    !ANALYTIC.test(s);
  const tops: number[] = [];
  for (const q of ALL_PAST_BAGRUYOT) {
    const whole = [q.context ?? '', ...(q.parts ?? []).map((p) => p.prompt ?? '')].join(' ');
    if (!isGeo(whole)) continue;
    const scores = (q.parts ?? []).map((p) =>
      scoreOf({
        id: `${q.id}/${p.label}`,
        difficulty: 'hard',
        kind: 'open',
        question: `${q.context ?? ''} ${p.prompt ?? ''}`,
        solution: { steps: p.solution?.steps ?? [], finalAnswer: p.solution?.final_answer ?? '', explanation: '' },
      } as unknown as PracticeQuestion),
    );
    if (scores.length) tops.push(Math.max(...scores));
  }
  return { bar: tops.reduce((a, b) => a + b, 0) / Math.max(1, tops.length), n: tops.length };
}

const RUNGS = ['easy', 'mid', 'hard'] as const;
type Rung = (typeof RUNGS)[number];
const HEB: Record<Rung, string> = { easy: 'חימום', mid: 'ביסוס', hard: 'אתגר' };

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function main() {
  const lesson = getLesson('math5', TOPIC);
  const subs: SubTopic[] = lesson?.subTopics ?? [];
  const bar = examBar();

  console.log(`גאומטריה — סולם הקושי\n${'='.repeat(78)}`);
  console.log(`exam bar (hardest part of ${bar.n} archived geometry questions): ${bar.bar.toFixed(1)}\n`);
  console.log(
    'stage'.padEnd(18) + RUNGS.map((r) => `${HEB[r]} n/score/mech`.padEnd(20)).join('') + 'reach',
  );
  console.log('-'.repeat(78));

  for (const st of subs) {
    const qs = st.questions ?? [];
    const by = Object.fromEntries(
      RUNGS.map((r) => [r, qs.filter((q) => q.difficulty === r)]),
    ) as Record<Rung, PracticeQuestion[]>;

    const score = Object.fromEntries(RUNGS.map((r) => [r, mean(by[r].map(scoreOf))])) as Record<Rung, number>;
    const mech = Object.fromEntries(
      RUNGS.map((r) => [r, mean(by[r].map((q) => mechanismsOf(q).length))]),
    ) as Record<Rung, number>;

    console.log(
      st.id.padEnd(18) +
        RUNGS.map((r) => `${by[r].length}  ${score[r].toFixed(1)}  ${mech[r].toFixed(1)}`.padEnd(20)).join('') +
        `${((score.hard / bar.bar) * 100).toFixed(0)}%`,
    );

    // `--stage <id>` prints every question's score, which is what authoring
    // against the gradient actually needs: the rung average says a rung is
    // wrong, not which question made it wrong.
    if (FOCUS === st.id) {
      for (const r of RUNGS)
        for (const q of by[r]) {
          console.log(
            `    ${HEB[r].padEnd(6)} ${q.id.padEnd(20)} score ${scoreOf(q).toFixed(1).padStart(5)}` +
              `  steps ${String((q.solution?.steps ?? []).length).padStart(2)}` +
              `  ${askShape(q).padEnd(15)} ${mechanismsOf(q).join(',')}`,
          );
        }
    }

    // ── the gradient, over the rung the STUDENT sees ────────────────────────
    for (const [lo, hi] of [['easy', 'mid'] as const, ['mid', 'hard'] as const]) {
      if (!by[lo].length || !by[hi].length) continue;
      // EPS, because these are IEEE-754 doubles: 1.5 + 0.3 is 1.8000000000000003,
      // so a rung that measured exactly 1.8 against a 1.5 rung failed a "+0.3"
      // test it satisfies. The message printed 1.5 → 1.8, which reads like a
      // gate bug and is one.
      const EPS = 1e-9;
      if (score[hi] < score[lo] + 2.0 - EPS)
        err(st.id, `gradient ${HEB[lo]}→${HEB[hi]}`, `score ${score[lo].toFixed(1)} → ${score[hi].toFixed(1)} (needs +2.0)`);
      if (mech[hi] < mech[lo] + 0.3 - EPS)
        err(st.id, `mechanisms ${HEB[lo]}→${HEB[hi]}`, `${mech[lo].toFixed(2)} → ${mech[hi].toFixed(2)} (needs +0.3)`);
    }

    // ── an empty rung is a rung the student never climbs ────────────────────
    for (const r of RUNGS) if (!by[r].length) err(st.id, `empty rung ${HEB[r]}`);

    // ── every אתגר rung must reach the shape the exam ENDS on ───────────────
    // Not a score, a presence check: at least one hard question per stage has
    // to make the student carry a symbol or compare two areas, because that is
    // what 29% of the archive's parts do and what 2% of ours did.
    if (by.hard.length && !by.hard.some(isExamStyle))
      err(st.id, 'אתגר has no exam-style ending', 'no "הביעו באמצעות" / "יחס בין שטחים" question');

    // ── "the challenge rung is the practice rung with different numbers" ────
    const lower = new Map<string, string>();
    for (const r of ['easy', 'mid'] as const)
      for (const q of by[r]) lower.set(signatureOf(q), q.id);
    for (const q of by.hard) {
      const twin = lower.get(signatureOf(q));
      if (twin) warn(q.id, 'hard repeats a lower rung', `same signature as ${twin}: ${signatureOf(q)}`);
    }

    // ── variety, counting only shapes the archive actually uses ─────────────
    const shapes = new Set(qs.map(askShape));
    if (shapes.size < 4) warn(st.id, 'few ask shapes', `${shapes.size}: ${[...shapes].join(', ')}`);
    const computeShare = qs.filter((q) => askShape(q) === 'compute').length / Math.max(1, qs.length);
    if (computeShare > 0.7) warn(st.id, 'mostly compute', `${(computeShare * 100).toFixed(0)}%`);

    // ── a rung with no MCQ cannot diagnose a misconception ──────────────────
    // A misconception fires on a CHOSEN distractor (lib/patterns), so an
    // all-open rung is invisible to the diagnosis chain.
    for (const q of qs) {
      for (const [name, re, exempt] of OFF_STYLE) {
        if (exempt?.includes(st.id)) continue;
        // `which-claim-is-true` fires on OPEN questions only. An MCQ whose four
        // options are four real properties of a shape ("איזו תכונה מתקיימת בכל
        // דלתון") is exactly what an MCQ is FOR, and the first version of this
        // rule flagged one. The gimmick Itay rejected on another topic was an
        // open-question stem, not a property-recall item.
        if (name === 'which-claim-is-true' && q.kind === 'mcq') continue;
        if (re.test(q.question)) err(q.id, `off-style ask: ${name}`);
      }
    }
  }

  console.log('-'.repeat(78));
  const errs = findings.filter((f) => f.sev === 'error');
  const warns = findings.filter((f) => f.sev === 'warn');
  for (const f of [...errs, ...warns]) {
    console.log(`${f.sev === 'error' ? '✗' : '⚠'} ${f.where} — ${f.rule}${f.detail ? `: ${f.detail}` : ''}`);
  }
  console.log(`\n${errs.length} error(s), ${warns.length} warning(s).`);
  console.log('A pass means the rungs RISE on this model — not that any question is correct.');
  process.exit(errs.length || (STRICT && warns.length) ? 1 : 0);
}

if (process.argv[1]?.includes('verify-geo-ladder')) main();
