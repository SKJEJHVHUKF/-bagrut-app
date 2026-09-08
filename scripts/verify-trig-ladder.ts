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
  ['area-sine', /\\tfrac12\s*\\cdot[^$]*\\sin|\\tfrac12\s*[a-z]{2}\\sin|\\dfrac\{1\}\{2\}[^$]*\\sin/],
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
  // 🔴 The parentheses are optional in real content. The first version listed
  // only `\sin(2x)` and `\sin(2\alpha)`, so `tf-eq-009` — "כמה פתרונות יש
  // למשוואה $\sin 2x = \sin x$" — was scored as if it involved no double angle
  // at all, which is the whole question. A detector that silently matches
  // nothing reports the content as flat.
  ['double-angle', /\\sin\s*\(?\s*2\s*[\\a-z]|2\\sin\\alpha\\cos\\alpha|2\\sin x\\cos x|זווית\s+\S*כפולה/],
  ['tan-definition', /\\tan\\alpha\s*=\s*\\dfrac\{\\sin|\\dfrac\{\\sin\\alpha\}\{\\cos\\alpha\}|הגדרת\s+\S*טנגנס/],
  // ── solving ──────────────────────────────────────────────────────────────
  ['two-solutions', /שני פתרונות|שתי זוויות אפשריות|הפתרון הקהה|דו-משמע|שתי תשובות/],
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
  ['radians', /רדיאנ|\\pi\s*\/\s*\d|\\dfrac\{\\pi\}/],
  ['periodicity', /מחזור|מחזורי|תקופה|\+\s*2\\pi k|360°k|180°k/],
  ['general-solution', /פתרון\s+\S*כללי|משפחת\s+\S*פתרונות|\+\s*2\\pi k|\+\s*360°k/],
  ['chain-rule', /כלל\s+\S*שרשרת|הפונקציה\s+\S*פנימית|הנגזרת הפנימית/],
  ['product-rule', /כלל\s+\S*מכפלה|נגזרת\s+\S*מכפלה/],
  ['quotient-rule', /כלל\s+\S*מנה|נגזרת\s+\S*מנה/],
  // The DERIVATIVE of a trig function, not the words "sin" and "cos" adjacent.
  ['trig-derivative', /\(\\sin[^)]*\)'|\(\\cos[^)]*\)'|נגזרת\s+\S*סינוס|נגזרת\s+\S*קוסינוס|f'\(x\)\s*=\s*[^=]*\\(?:sin|cos)/],
  ['extremum', /נקודת\s+\S*קיצון|מקסימום|מינימום|מאפסים את הנגזרת|נגזרת\s+\S*מתאפסת/],
  ['increase-decrease', /תחומי\s+\S*עלייה|תחומי\s+\S*ירידה|עולה בתחום|יורדת בתחום/],
  ['inflection', /נקודת\s+\S*פיתול|נגזרת שנייה/],
  ['domain', /תחום\s+\S*הגדרה|מוגדרת עבור|\\ne 0/],
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
const hasParameter = (q: PracticeQuestion) =>
  /סמן(?:ו)? (?:את [^ ]+ )?ב-?\$?[a-zx]\$?|בטא(?:ו)? באמצעות|עבור אילו ערכים|באמצעות \$?[a-z]\$?/.test(
    q.question,
  );

/** The inference runs BACKWARDS: the rule's CONCLUSION is given and one of its
 *  inputs is what the student must recover. */
const isReverse = (q: PracticeQuestion) =>
  /נתון(?:ה)? (?:ה)?שטח[^.]*(?:מצא|חשב)\s+\S*(?:זווית|צלע)|ידוע (?:כי|ש)[^.]*(?:מצא|חשב) את\s+\S*(?:הזווית|הצלע|הרדיוס)|כדי ש[^.]*יתקיים|איזה ערך[^.]*יגרום/.test(
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
        `${((score.hard / bar.bar) * 100).toFixed(0)}%`,
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
