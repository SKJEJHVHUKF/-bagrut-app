/**
 * verify-trig-ladder.ts — does טריגונומטריה's difficulty ladder actually climb?
 *
 *   npx tsx scripts/verify-trig-ladder.ts [--strict] [--stage <id>]
 *
 * Itay, 2026-09-08: "חשוב שהרמת קושי בשאלות תהיה הדרגתית — רמת חימום יהיה
 * יחסית פשוט וקל, ברמת ביסוס הרמה תעלה והשאלות יהיו קצת יותר קשות, וברמת
 * אתגר השאלות יהיו באמת ברמה קשה יותר."
 *
 * Fourth port of the model built for הסתברות, then פונקציות מנה ושורש, then
 * גאומטריה. On all three the LABEL was wrong often enough to invert whole
 * rungs, and nothing failed because nothing looked.
 *
 * WHAT IT DOES NOT DO: the prose rules (Hebrew-in-KaTeX, banned notation, the
 * `**הכלל:**` opening, figure validity) live in verify-content /
 * check-tichon-notation / verify-rule-lines, which already run over this
 * content in `npm run check`. This file owns the LADDER and nothing else.
 *
 * The weights are a stated simplification. The ORDERING is the claim, so the
 * gate requires both the composite score AND the least-gameable component
 * (distinct mechanisms invoked) to rise from rung to rung.
 */
import { getLesson } from '../content/lessons';
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';

const TOPIC = 'טריגונומטריה';
const STRICT = process.argv.includes('--strict');
const FOCUS = process.argv[process.argv.indexOf('--stage') + 1] ?? '';

type Sev = 'error' | 'warn';
const findings: { sev: Sev; where: string; rule: string; detail: string }[] = [];
const err = (where: string, rule: string, detail = '') =>
  findings.push({ sev: 'error', where, rule, detail });
const warn = (where: string, rule: string, detail = '') =>
  findings.push({ sev: 'warn', where, rule, detail });

/**
 * The named moves a trigonometry question can require, read from the question
 * AND its solution — a move often shows only in the working.
 *
 * 🔴 Every pattern must survive the definite article and Hebrew inflection.
 * `\b` is useless here: it is a boundary between \w and non-\w, and a Hebrew
 * letter is not \w, so beside Hebrew there is no boundary at all. Use
 * `\s+\S*` between words so "משפט הסינוסים" also matches "משפט סינוסים".
 *
 * 🔴 And a word that NAMES a thing is not the move. The geometry port paid 2.5
 * points to every question that squared a number because /ריבוע/ also means
 * "square of"; the functions port paid for the words "גרף הפונקציה". Each
 * pattern below wants the OPERATION, and the ones that could name instead of
 * do carry a note saying why the narrow form was chosen.
 */
export const MECHANISMS_FOR_TEST: [string, RegExp][] = [
  // ── the plane-trigonometry theorems ──────────────────────────────────────
  // 🔴 NOT `\S*` here. "משפט הקוסינוסים" is literally "משפט " + "הקו" +
  // "סינוסים", so a `\S*` wildcard let the COSINE law match the SINE law's
  // pattern: every cosine-law question was paid 5 points instead of 2.5 and
  // displayed a mechanism it never used. Found by an author reading the
  // mechanism list printed beside its own question, not by the gate. The
  // `\s+\S*` idiom is right for "זווית היקפית"/"הזווית ההיקפית", where the
  // wildcard spans a whole word — it is wrong when the two names differ by one
  // letter at the front. Allow the definite article and nothing else.
  ['sine-law', /(?:משפט|חוק)\s+ה?סינוסים/],
  ['cosine-law', /(?:משפט|חוק)\s+ה?קוסינוסים/],
  // NOT a bare /שטח/: "שטח המשולש הוא 48 סמ״ר" names a quantity. This wants the
  // formula — a half times two lengths times a sine.
  //
  // 🔴 All four spellings of the half. The first version listed `\tfrac12` and
  // `\dfrac{1}{2}` only, and this topic writes `\dfrac12` **115 times** — so the
  // area formula went undetected in most of the content that uses it, and
  // `trig-mix-002`, a pure area-formula question, scored 0 mechanisms. An
  // author noticed it only because it had to write the half in a foreign style
  // to be credited: the third time this gate shaped the prose instead of
  // measuring it.
  // The negative lookahead is the second half of the fix: widening the fraction
  // spellings made this over-match in the CALCULUS stages, where
  // `\dfrac{1}{2}\sin 2x` is the ANTIDERIVATIVE of cos 2x and has nothing to do
  // with a triangle's area. The area formula always has factors between the
  // half and the sine (the two sides); a primitive has none.
  // The `\s*` lives INSIDE the lookahead on purpose: written as `\s*(?!\\sin)`
  // the engine simply backtracks the whitespace to zero and the lookahead
  // passes, so `\dfrac12 \sin 2x` still matched. Pinned by a test.
  // `[^$=]`, not `[^$]`: the window used to run 60 characters through an entire
  // chain of equalities and find a `\sin^2` at the far end, crediting an
  // integral's power-reduction check with the triangle-area formula. The area
  // formula is ONE product — a half, two lengths, a sine — so an `=` in
  // between means we have left it.
  ['area-sine', /\\[dt]frac(?:12|\{1\}\{2\})(?!\s*\\sin)[^$=]{1,40}\\sin/],
  ['circumradius', /\\dfrac\{abc\}\{4R\}|2R\b|מעגל\s+\S*חוסם|רדיוס\s+\S*מעגל\s+\S*חוסם/],
  // ── the right triangle ───────────────────────────────────────────────────
  ['right-ratios', /הניצב שמול|הניצב שליד|מול חלקי יתר|ליד חלקי יתר|מול חלקי ליד/],
  ['pythagoras', /משפט\s+\S*פיתגורס/],
  // ── the identities ───────────────────────────────────────────────────────
  // Distinct from the geometric theorem above: this is sin²+cos²=1, and the two
  // never share a string ("זהות פיתגורס" vs "משפט פיתגורס").
  ['pythagorean-identity', /זהות\s+\S*פיתגורס|\\sin\^2[^+]{0,12}\+\s*\\cos\^2|\\cos\^2[^=]{0,12}=\s*1\s*-\s*\\sin\^2|\\sin\^2[^=]{0,12}=\s*1\s*-\s*\\cos\^2/],
  ['supplementary', /\\sin\(180|\\cos\(180|\\tan\(180|180°\s*-\s*\\alpha|משלימה לזווית שטוחה|180°\s*-\s*x_1/],
  ['complementary', /\\sin\(90|\\cos\(90|90°\s*-\s*\\alpha|משלימה לזווית ישרה/],
  // Two corrections, in opposite directions, both from authors reading the
  // mechanism list beside their own questions:
  //
  //  1. The first version required PARENTHESES (`\sin(2x)`), so tf-eq-009 —
  //     whose whole subject is $\sin 2x = \sin x$ — scored no double angle.
  //  2. Widening it to any `\sin 2…` then paid for NOTATION rather than the
  //     move: an equation that treats $2x$ as a single new variable never uses
  //     the identity, and three questions were credited for a formula they
  //     deliberately avoid.
  //
  // So: match the identity being APPLIED — the opened product, the cos²−sin²
  // form, or the Hebrew name. tf-eq-009 still scores, because its solution
  // writes `2\sin x\cos x - \sin x = 0`; a question that merely mentions 2x
  // does not.
  // …and a third correction: `2\sin[^$]{0,14}\cos` also matched the SUM
  // `2\sin x + \cos x`, which contains no double angle at all. An author
  // changed an integrand's coefficient from 2 to 3 purely to shed the unearned
  // credit — the ruler shaping the maths itself this time, not just the prose.
  // Forbidding an operator between the two factors keeps the PRODUCT and drops
  // the sum.
  ['double-angle', /2\\sin[^$+\-=]{0,14}\\cos|\\cos\^2[^$]{0,14}-\s*\\sin\^2|זווית\s+\S*כפולה/],
  ['tan-definition', /\\tan\\alpha\s*=\s*\\dfrac\{\\sin|\\dfrac\{\\sin\\alpha\}\{\\cos\\alpha\}|הגדרת\s+\S*טנגנס/],
  // ── solving ──────────────────────────────────────────────────────────────
  // OVER-match, reported independently by THREE authors. This mechanism means
  // the ambiguous SSA case — a sine value admitting an acute AND an obtuse
  // angle, one of which must then be rejected. "שני פתרונות" is merely a count
  // of roots, and it fired on every equation question that says how many
  // answers it has, paying 2.5 points for stating an outcome.
  ['two-solutions', /שתי זוויות אפשריות|שתי הזוויות האפשריות|הפתרון הקהה|המועמד הקהה|דו-משמע/],
  ['t-substitution', /משתנה עזר|t = \\sin|t = \\cos|הצבת\s+\S*משתנה/],
  ['quadratic', /נוסחת השורשים|משוואה ריבועית|at\^2/],
  ['factoring', /גורם משותף|פירוק לגורמים|מאופס בנפרד/],
  // A candidate REJECTED, not merely a range mentioned. "בתחום" alone appears in
  // every equation question's statement and would pay all of them equally.
  ['range-filter', /נפסל|מחוץ לתחום|אינו בתחום|נפסלת|לא בתחום/],
  ['inverse-trig', /\\sin\^\{-1\}|\\cos\^\{-1\}|\\tan\^\{-1\}/],
  // ── the circle theorems this topic leans on ──────────────────────────────
  ['inscribed-angle', /זווית\s+\S*היקפית|זווית\s+\S*מרכזית|זוויות\s+\S*היקפיות/],
  ['diameter-right', /נשענת על\s+\S*קוטר|היקפית על קוטר/],
  ['cyclic-quad', /מרובע\s+\S*חסום|זוויות נגדיות/],
  ['tangent-radius', /משיק\S*\s+\S*(?:ניצב|מאונך)|מאונך לרדיוס|ניצב לרדיוס/],
  ['chord-perp', /אנך\s+\S*מהמרכז|האנך מהמרכז|חוצה את\s+\S*מיתר/],
  // ── plain triangle facts ─────────────────────────────────────────────────
  ['triangle-sum', /סכום\s+\S*זוויות\s+\S*משולש/],
  ['isosceles', /שווה[- ]שוקיים|זוויות\s+\S*בסיס/],

  // ── 🔴 the OTHER half of this topic ──────────────────────────────────────
  // The first run of this gate scored tf-domain, tf-derivative, tf-integral,
  // tf-investigation, tf-bagrut and trig-calculus at 0.00 mechanisms on EVERY
  // rung — six of fifteen stages. That was not flat content: the list above is
  // plane-trigonometry only, so the gate was blind to the trigonometric
  // FUNCTIONS half of the topic and could see nothing to reward. Left as it
  // was it would have pushed an author to bolt a circle theorem onto a
  // derivative question to make a rung "climb". Same class as
  // lessons_scope_bugs_report_success: correct about what it looked at, wrong
  // about WHAT it looked at.
  // UNDER-match: `\dfrac{\pi}` matched, `\dfrac{2\pi}` and `\dfrac{3\pi}` did
  // not, so two questions written entirely in radians scored zero for it.
  // Widened twice. `\dfrac{\pi}` matched but `\dfrac{2\pi}` did not; then
  // `\dfrac{\pi k}` — the standard way to write a solution FAMILY — still did
  // not, because the brace had to close right after `\pi`. A stage answering
  // only in general families would have scored zero for radians.
  ['radians', /רדיאנ|\\pi\s*\/\s*\d|\\[dt]frac\{[^{}]*\\pi[^{}]*\}|\\pi\b/],
  ['periodicity', /מחזור|מחזורי|תקופה|\+\s*2\\pi k|360°k|180°k/],
  ['general-solution', /פתרון\s+\S*כללי|משפחת\s+\S*פתרונות|\+\s*2\\pi k|\+\s*360°k/],
  // UNDER-match: "מכפילים בנגזרת הפנימית" is this stage's own house phrasing
  // (32 uses) and the pattern demanded the definite article on BOTH words (18
  // uses). Two pure chain-rule questions scored 0 mechanisms, and an author had
  // to write a synonym the sub-topic's own teach text does not use.
  ['chain-rule', /כלל\s+\S*שרשרת|ה?פונקציה\s+ה?פנימית|ה?נגזרת\s+ה?פנימית/],
  ['product-rule', /כלל\s+\S*מכפלה|נגזרת\s+\S*מכפלה/],
  ['quotient-rule', /כלל\s+\S*מנה|נגזרת\s+\S*מנה/],
  // The DERIVATIVE of a trig function, not the words "sin" and "cos" adjacent.
  ['trig-derivative', /\(\\sin[^)]*\)'|\(\\cos[^)]*\)'|נגזרת\s+\S*סינוס|נגזרת\s+\S*קוסינוס|f'\(x\)\s*=\s*[^=]*\\(?:sin|cos)/],
  // OVER-match: the bare words "מקסימום"/"מינימום" name an OUTCOME, and this
  // mechanism means the calculus move that finds it. It credited an equation
  // question whose solution merely mentions the maximum of the cosine, and an
  // author renamed a concept mid-question ("הקצה התחתון של תחום הערכים") purely
  // to avoid collecting the false credit — the gate shaping prose again.
  ['extremum', /נקודת\s+\S*קיצון|נקודות\s+\S*קיצון|נקודת\s+\S*מקסימום|נקודת\s+\S*מינימום|מאפסים את הנגזרת|נגזרת\s+\S*מתאפסת|הנגזרת מתאפסת/],
  ['increase-decrease', /תחומי\s+\S*עלייה|תחומי\s+\S*ירידה|עולה בתחום|יורדת בתחום/],
  ['inflection', /נקודת\s+\S*פיתול|נגזרת שנייה/],
  // OVER-match: a bare `\ne 0` is ANY non-vanishing claim. It paid the domain
  // mechanism to a step arguing that since one factor is non-zero the OTHER must
  // vanish — nothing to do with a domain of definition.
  ['domain', /תחום\s+\S*הגדרה|תחומי\s+\S*הגדרה|מוגדרת עבור|אינה מוגדרת/],
  // Missing entirely at first, so every asymptote question in tf-domain scored
  // 0 mechanisms and the stage read as flat content rather than a blind gate.
  ['asymptote', /אסימפטוט/],
  ['antiderivative', /פונקציה\s+\S*קדומה|אינטגרל לא מסוים|\+\s*C\b/],
  ['definite-integral', /אינטגרל מסוים|\\int_|גבולות\s+\S*אינטגרציה/],
  ['area-under-curve', /השטח\s+\S*הכלוא|שטח\s+\S*מתחת\s+\S*גרף|השטח בין\s+\S*גרפים/],
  ['amplitude-shift', /משרעת|אמפליטודה|הזזה\s+\S*אנכית|הזזה\s+\S*אופקית/],
];

const textOf = (q: PracticeQuestion) =>
  `${q.question} ${(q.solution?.steps ?? []).join(' ')} ${q.solution?.finalAnswer ?? ''}`;

/**
 * Subsumption, so one idea is never paid twice:
 *  · `diameter-right` SUBSUMES `inscribed-angle` — "זווית היקפית הנשענת על
 *    הקוטר" is one theorem (the exact bug that lifted a geometry warm-up above
 *    the rung above it).
 *  · `quadratic` SUBSUMES `t-substitution`'s partner only when both fire on the
 *    same sentence? No — they are genuinely two moves (rewrite, then solve), so
 *    both count. Stated here so the next reader does not "fix" it.
 */
export const mechanismsOfText = (text: string): string[] => {
  const hit = MECHANISMS_FOR_TEST.filter(([, re]) => re.test(text)).map(([n]) => n);
  return hit.includes('diameter-right') ? hit.filter((m) => m !== 'inscribed-angle') : hit;
};

const mechanismsOf = (q: PracticeQuestion): string[] => mechanismsOfText(textOf(q));

/**
 * What the question asks the student to PRODUCE — the variety axis.
 * Ordered most-specific first: a `justify` net tested late is swallowed by
 * `prove`, and /הוכח/ matches the NOUNS הוכחה / בהוכחה, so `prove` demands the
 * imperative and is tested after `justify`.
 */
export function askShape(q: PracticeQuestion): string {
  const t = q.question;
  if (/מהו הנימוק|איזה נימוק|איזה משפט|נמק |נמקו |הסבר מדוע|הסבירו מדוע|מדוע מתקיים/.test(t)) return 'justify';
  if (/(?:^|[\s"״'(])הוכח(?=[\s.,:!?]|$)|הוכיחו|הראה כי|הראו כי|הסק כי/.test(t)) return 'prove';
  if (/פתור את המשוואה|פתרו את המשוואה|מהם כל הפתרונות|מצא את כל הפתרונות/.test(t)) return 'solve-equation';
  if (/פשט את|פשטו את|לאיזה ביטוי שווה|הבע את/.test(t)) return 'simplify';
  // 🔴 BEFORE `area` / `compute-*`. Caught by test-trig-ladder-detectors: with
  // `area` first, "בטא באמצעות $a$ את שטח המשולש" — recover a quantity as an
  // EXPRESSION, the harder ask and the one the archive opens with — was
  // classified as a plain area computation, losing its +2 and blurring its
  // signature against every ordinary area question in the stage. Same family as
  // the `prove`-before-`justify` bug in the geometry port.
  if (/מצא(?:ו)? את \$?[a-z]\$?|סמן ב-?\$?[a-z]|בטא באמצעות|בטאו באמצעות|עבור אילו ערכים/.test(t))
    return 'find-parameter';
  if (/שטח/.test(t)) return 'area';
  if (/מצא את הזווית|מהי הזווית|כמה מעלות|מצא את \$\\angle|מהי \$\\angle/.test(t)) return 'compute-angle';
  if (/מצא את אורך|מהו אורך|חשב את אורך|מצא את \$[A-Z]{2}\$/.test(t)) return 'compute-length';
  return 'compute';
}

/**
 * Asks the bagrut does not make. Itay rejected this style on פונקציות
 * ("יש שם שאלות שבדרך כלל בבגרות לא שואלים") and the variety rule below is
 * exactly what pushes an author toward them, so they are refused outright.
 */
const OFF_STYLE: [string, RegExp, string[]?][] = [
  ['count-the-errors', /כמה טעויות|מספר הטעויות|כמה שגיאות/],
  ['which-claim-is-true', /איזו (?:מן ה)?טענה נכונה|איזו מהטענות|איזו קביעה/],
  ['what-if', /ומה אם|מה יקרה אם|אילו היה/],
  ['method-meta', /איזו שיטה|מה עדיף לעשות|כיצד כדאי/],
];

/** A quantity is named by a letter and recovered, rather than read off. */
// 🔴 This detector used to match `סמן ב-$a$` — a maqaf glued to a maths island,
// which `check-rtl-maqaf.ts` FAILS THE BUILD on for this very directory. One
// gate paid three points for the exact string another gate rejects, so an author
// reaching for the natural phrasing got a red build for doing what the score
// rewarded. Found by an author who sidestepped it and said so.
//
// The alternatives below are all forms `check-rtl-maqaf` accepts — it recommends
// the `באות $a$` rephrasing itself. Pinned by a test that runs every phrase this
// detector rewards through the maqaf rule.
export const hasParameterForTest = (text: string) => hasParameter({ question: text } as PracticeQuestion);
const hasParameter = (q: PracticeQuestion) =>
  /סמן(?:ו)? (?:את [^.]{0,24})?באות \$?[a-z]\$?|בטא(?:ו)? באמצעות|עבור אילו ערכים|באמצעות \$?[a-z]\$?/.test(
    q.question,
  );

/** The inference runs BACKWARDS: the rule's CONCLUSION is given and one of its
 *  inputs is what the student must recover. */
// 🔴 `[^.]{0,14}`, NOT `\S*`. A `\S*` cannot cross a space, so "חשב את הצלע"
// scored the +4 while "חשב את אורך הצלע" and "מצא את גודל הזווית" — the natural
// Hebrew for the identical backwards inference — scored 0. That is not merely a
// missed point: an author reported writing a question in stilted Hebrew to be
// scored honestly, which is the gate corrupting the content it exists to
// protect. Same root cause as the sine/cosine collision above, opposite
// symptom: there `\S*` matched too much, here it matches too little.
export const isReverse = (q: PracticeQuestion) =>
  // The noun list also carries the CALCULUS unknowns. Without them a question
  // giving an area and asking for the limit of integration — a textbook
  // backwards inference — earned nothing, so every "recover the bound" question
  // in tf-integral was under-scored.
  /נתון(?:ה)? (?:ה)?שטח[^.]{0,40}(?:מצא|חשב)[^.]{0,20}(?:זווית|צלע|גבול|חסם|פרמטר|ערך)|ידוע (?:כי|ש)[^.]{0,60}(?:מצא|חשב) את[^.]{0,20}(?:הזווית|הצלע|הרדיוס|הגבול|החסם|הפרמטר)|כדי ש[^.]*יתקיים|איזה ערך[^.]*יגרום/.test(
    q.question,
  );

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
    (['justify', 'find-parameter'].includes(shape) ? 2 : 0) +
    2 * parts
  );
}

/**
 * 🔴 REACH must compare like with like, and it did not.
 *
 * `examBar()` deliberately takes the HARDEST PART of an archived question,
 * because part ג is easy once א and ב are done and averaging every part
 * flatters the ladder. But `scoreOf` measures an authored question WHOLE — it
 * sums the steps and mechanisms of every part and adds 2 per part. So a
 * genuine four-part exam question scored ~3× a bar built from single parts,
 * and `tf-bagrut` reported 152% reach for a structural reason rather than a
 * mathematical one. Nothing was padded; the two sides were simply different
 * units. Reported by the author who wrote that four-part question.
 *
 * The gradient comparisons are unaffected — those are authored-against-authored
 * under one rule — so this normalisation is applied to REACH only. Dividing by
 * the part count yields the AVERAGE part against a bar built from the HARDEST
 * part, which understates rather than flatters. That is the right direction to
 * err in a number quoted to the owner.
 */
const reachScore = (q: PracticeQuestion): number => {
  const parts = (q.question.match(/\n[אבגד]\.\s/g) ?? []).length;
  return parts >= 2 ? scoreOf(q) / parts : scoreOf(q);
};

/** Makes "the challenge rung is the practice rung with different numbers"
 *  visible to a machine. */
const signatureOf = (q: PracticeQuestion) =>
  `${askShape(q)}|${mechanismsOf(q).sort().join(',')}` +
  `${hasParameter(q) ? '|param' : ''}${isReverse(q) ? '|rev' : ''}`;

/** The archived papers, scored with the SAME model: the HARDEST part of each
 *  question, because part ג is easy once א and ב are done and averaging every
 *  part flatters the ladder. */
function examBar(): { bar: number; n: number } {
  const isTrig = (s: string) =>
    /\\sin|\\cos|\\tan|סינוס|קוסינוס|טנגנס|משפט הסינוסים|משפט הקוסינוסים/.test(s) &&
    !/נגזרת|אינטגרל|וקטור|מרוכב|התפלגות/.test(s);
  const tops: number[] = [];
  for (const q of ALL_PAST_BAGRUYOT) {
    const whole = [q.context ?? '', ...(q.parts ?? []).map((p) => p.prompt ?? '')].join(' ');
    if (!isTrig(whole)) continue;
    const scores = (q.parts ?? []).map((p) =>
      scoreOf({
        id: `${q.id}/${p.label}`,
        difficulty: 'hard',
        kind: 'open',
        question: `${q.context ?? ''} ${p.prompt ?? ''}`,
        solution: {
          steps: p.solution?.steps ?? [],
          finalAnswer: p.solution?.final_answer ?? '',
          explanation: '',
        },
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

  console.log(`טריגונומטריה — סולם הקושי\n${'='.repeat(84)}`);
  console.log(`exam bar (hardest part of ${bar.n} archived trig questions): ${bar.bar.toFixed(1)}\n`);
  console.log(
    'stage'.padEnd(26) + RUNGS.map((r) => `${HEB[r]} n/score/mech`.padEnd(20)).join('') + 'reach',
  );
  console.log('-'.repeat(84));

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
      st.id.padEnd(26) +
        RUNGS.map((r) => `${by[r].length}  ${score[r].toFixed(1)}  ${mech[r].toFixed(1)}`.padEnd(20)).join('') +
        `${((mean(by.hard.map(reachScore)) / bar.bar) * 100).toFixed(0)}%`,
    );

    // `--stage <id>` prints every question's score. A rung average says a rung
    // is wrong, never WHICH question made it wrong, and on the geometry port
    // four scoring bugs were found only by reading this dump.
    if (FOCUS === st.id || FOCUS === 'all') {
      for (const r of RUNGS)
        for (const q of by[r]) {
          console.log(
            `    ${HEB[r].padEnd(6)} ${q.id.padEnd(22)} score ${scoreOf(q).toFixed(1).padStart(5)}` +
              `  steps ${String((q.solution?.steps ?? []).length).padStart(2)}` +
              `  ${askShape(q).padEnd(15)} ${mechanismsOf(q).join(',')}`,
          );
        }
    }

    // ── the gradient, over the rung the STUDENT sees ────────────────────────
    for (const [lo, hi] of [['easy', 'mid'] as const, ['mid', 'hard'] as const]) {
      if (!by[lo].length || !by[hi].length) continue;
      // EPS, because these are IEEE-754 doubles: 1.5 + 0.3 is 1.8000000000000003.
      const EPS = 1e-9;
      if (score[hi] < score[lo] + 2.0 - EPS)
        err(st.id, `gradient ${HEB[lo]}→${HEB[hi]}`, `score ${score[lo].toFixed(1)} → ${score[hi].toFixed(1)} (needs +2.0)`);
      if (mech[hi] < mech[lo] + 0.3 - EPS)
        err(st.id, `mechanisms ${HEB[lo]}→${HEB[hi]}`, `${mech[lo].toFixed(2)} → ${mech[hi].toFixed(2)} (needs +0.3)`);
    }

    // ── an empty rung is a rung the student never climbs ────────────────────
    for (const r of RUNGS) if (!by[r].length) err(st.id, `empty rung ${HEB[r]}`);

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
    if (qs.length && shapes.size < 4) warn(st.id, 'few ask shapes', `${shapes.size}: ${[...shapes].join(', ')}`);
    const computeShare = qs.filter((q) => askShape(q) === 'compute').length / Math.max(1, qs.length);
    if (qs.length && computeShare > 0.7) warn(st.id, 'mostly compute', `${(computeShare * 100).toFixed(0)}%`);

    for (const q of qs) {
      for (const [name, re, exempt] of OFF_STYLE) {
        if (exempt?.includes(st.id)) continue;
        // An MCQ whose four options are four real properties is what an MCQ is
        // FOR; the gimmick Itay rejected was an open-question stem.
        if (name === 'which-claim-is-true' && q.kind === 'mcq') continue;
        if (re.test(q.question)) err(q.id, `off-style ask: ${name}`);
      }
    }
  }

  console.log('-'.repeat(84));
  const errs = findings.filter((f) => f.sev === 'error');
  const warns = findings.filter((f) => f.sev === 'warn');
  for (const f of [...errs, ...warns]) {
    console.log(`${f.sev === 'error' ? '✗' : '⚠'} ${f.where} — ${f.rule}${f.detail ? `: ${f.detail}` : ''}`);
  }
  console.log(`\n${errs.length} error(s), ${warns.length} warning(s).`);
  console.log('A pass means the rungs RISE on this model — not that any question is correct.');
  process.exit(errs.length || (STRICT && warns.length) ? 1 : 0);
}

if (process.argv[1]?.includes('verify-trig-ladder')) main();
