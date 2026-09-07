/**
 * _seq-check.ts — the gate for the סדרות practice ladder.
 *
 *   npx tsx scripts/_seq-check.ts ar-general-term    (one stage)
 *   npx tsx scripts/_seq-check.ts all                (all ten)
 *   npx tsx scripts/_seq-check.ts all --scores       (every question, scored)
 *
 * Ported from scripts/_rq-extra-check.ts, which was itself ported from the
 * probability gate. Same three jobs, this topic's vocabulary:
 *
 *   1. The RUNGS must climb. A difficulty score is derived from the authored
 *      content (steps + mechanisms + a hidden parameter + a backwards
 *      inference + a justification), and each rung must beat the one below it
 *      on BOTH the score and the least-gameable part of it, the mechanism
 *      count. A hard question may not share its (ask, mechanisms, parameter)
 *      signature with an easier one.
 *   2. The TOP must reach the exam. The archived שאלון questions on sequences
 *      are scored with the same model; a stage's hardest rung is compared with
 *      the hardest part of a real question.
 *   3. Every solution must be READABLE and COMPLETE: it names the formula it
 *      applies, it never announces a result without the move that produced it,
 *      no line carries two calculations, and the question asks the way a
 *      bagrut asks.
 */
import { getLesson } from '../content/lessons';
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';

const TOPIC = 'סדרות';

const STAGES = [
  'ar-general-term', 'ar-recursion-sums', 'ar-positions-sums', 'ar-practice',
  'ge-general-term', 'ge-proof-sum', 'ge-infinite', 'ge-practice',
  'sequences-applications', 'induction',
] as const;

type Sev = 'error' | 'warn';
const findings: { sev: Sev; where: string; rule: string; detail: string }[] = [];
const err = (where: string, rule: string, detail = '') => findings.push({ sev: 'error', where, rule, detail });
const warn = (where: string, rule: string, detail = '') => findings.push({ sev: 'warn', where, rule, detail });

// ---------------------------------------------------------------------------
// Difficulty model
// ---------------------------------------------------------------------------

/** Named moves a sequences question can require. Written to survive the
 *  definite article — "הנוסחה לאיבר הכללי" must match as surely as the bare
 *  form (six detectors in the functions gate were caught missing it). */
const MECHANISMS: [string, RegExp][] = [
  ['arithmetic-term', /איבר\s+\S*כללי[^.]*חשבונית|a_?n ?= ?a_?1 ?\+|הפרש\s+\S*סדרה|\bd\b ?=/],
  ['geometric-term', /סדרה\s+\S*הנדסית|מנת\s+\S*סדרה|a_?n ?= ?a_?1\s*\\?cdot|q\s*\^|\bq\b ?=/],
  ['sum', /סכום\s+\S*איברים|S_?n|סכום\s+\S*ראשונים|נוסחת\s+\S*סכום/],
  ['infinite-sum', /סכום\s+\S*אינסופי|טור\s+\S*מתכנס|\|q\| ?< ?1|מתכנס/],
  ['recursion', /נוסחת\s+\S*נסיגה|רקורסי|a_?\{?n\+1\}?|כל איבר.*הקודם/],
  ['system', /שתי משוואות|מערכת\s+\S*משוואות|מציבים במשוואה השנייה|נציב.*ונקבל מערכת/],
  ['parameter', /פרמטר|עבור אילו ערכים|מצא(?:ו)? את (?:הערך של )?\$?[a-z]\$?|תלוי ב/],
  ['position', /המקום\s+\S*איבר|באיזה מקום|האיבר ה-?\$?n|מספר האיבר/],
  ['induction', /אינדוקציה|הנחת\s+\S*אינדוקציה|צעד\s+\S*אינדוקציה|בסיס\s+\S*אינדוקציה/],
  ['word-problem', /שכר|חיסכון|אוכלוסי|ריבית|מדרגות|שורות|כיסאות|צמיחה|ייצור/],
  ['proof', /הוכיח|הוכחה|הראו כי|מש״ל|צריך להוכיח/],
  ['inequality', /אי[- ]שוויון|גדול מ|קטן מ|לראשונה|מתי יעבור/],
  ['three-terms', /שלושה איברים|שלושת האיברים|יוצרים סדרה/],
];

const mechanismsOf = (q: PracticeQuestion): string[] => {
  const text = `${q.question} ${(q.solution?.steps ?? []).join(' ')}`;
  return MECHANISMS.filter(([, re]) => re.test(text)).map(([n]) => n);
};

/** What the question asks the student to PRODUCE — specific shapes first, so a
 *  wide net ("prove", "justify") cannot swallow a narrower one. */
function askShape(q: PracticeQuestion): string {
  const t = q.question ?? '';
  if (/הוכיח|הוכח|הראו כי|הראה כי/.test(t)) return 'prove';
  // Named quantities count too: a question asking for the annual interest rate
  // or for the common difference IS a find-parameter, even with no single
  // letter in the stem.
  if (/מצא(?:ו)? את (?:הערך של )?\$?[a-z]\$?|עבור אילו ערכים|מצא(?:ו)? את הפרמטר|מצא(?:ו)? את (?:שיעור|ההפרש|המנה|האיבר הראשון)/.test(t)) return 'find-parameter';
  if (/באיזה מקום|מהו המקום|כמה איברים|לראשונה|מתי/.test(t)) return 'locate';
  // A SERIES sum, not the money sense — "סכום של 5000 ש״ח" was counting as an
  // ask shape and hiding that a whole stage asks only one thing.
  if (/סכום\s+\S*(?:איברים|הסדרה|הטור|ראשונים|כל)/.test(t) || /S_?n|סכום אינסופי/.test(t)) return 'sum';
  if (/נמק|הסבירו מדוע|האם .*\?/.test(t)) return 'justify';
  if (/נתונ\S*\s+(?:הסכום|האיבר|היחס)[^.]*מצא|ידוע (?:כי|ש)[^.]*מצא/.test(t)) return 'reverse';
  return 'compute';
}

const hasParameter = (q: PracticeQuestion) =>
  /פרמטר|עבור אילו ערכים|מצא(?:ו)? את (?:הערך של )?\$?[a-z]\$?(?!_)|תלוי ב/.test(q.question ?? '');

/** The inference runs BACKWARDS: a later property is given, an earlier one asked. */
const isReverse = (q: PracticeQuestion) =>
  /נתון (?:כי )?(?:הסכום|האיבר ה|היחס|ההפרש)[^.]*(?:מצא|חשב)|ידוע (?:כי|ש)[^.]*(?:מצא|חשב)|מהי הסדרה/.test(q.question ?? '');

function scoreOf(q: PracticeQuestion): number {
  const steps = (q.solution?.steps ?? []).length;
  const mech = mechanismsOf(q).length;
  const shape = askShape(q);
  return (
    steps +
    2.5 * mech +
    (hasParameter(q) ? 3 : 0) +
    (isReverse(q) ? 4 : 0) +
    (['prove', 'justify'].includes(shape) ? 2 : 0)
  );
}

const signatureOf = (q: PracticeQuestion) =>
  `${askShape(q)}|${mechanismsOf(q).sort().join(',')}${hasParameter(q) ? '|param' : ''}${isReverse(q) ? '|rev' : ''}`;

// ---------------------------------------------------------------------------
// Readability rules — the three complaints the owner has made on every topic
// ---------------------------------------------------------------------------

const tall = (line: string) =>
  (line.match(/\$[^$\n]+\$/g) ?? []).filter(
    (s) => (/\\dfrac|\\frac|\\sqrt|\\sum/.test(s) && /=|\\cdot|\+|-/.test(s)) || /\\cdot/.test(s) || s.length > 22,
  ).length;

const CLAIMS = [/הסכום הוא|ההפרש הוא|המנה היא|a_?n ?=|S_?n ?=/, /ומכאן \$?[a-z]\$? ?=|מקבלים ש?\$?[a-z]\$? ?=/];
const SHOWS = /מציבים|מחלקים|כופלים|מחסרים|מחברים|מעלים|מצמצמים|פותחים|מעבירים|לפי הנוסחה|לפי הכלל|פותרים|מכנסים|מפרקים/;

const OFF_STYLE: [string, RegExp][] = [
  ['count-the-errors', /כמה טעויות|מספר הטעויות|כמה שגיאות/],
  ['which-claim-is-true', /איזו (?:מן ה)?טענה נכונה|איזו מהטענות|מה נכון(?: על| לגבי)?\s*\?|איזו קביעה/],
  ['student-said-mcq', /(?:תלמיד|תלמידה) (?:כתב|כתבה|טען|טענה|חישב|חישבה)[^?]*\?/],
  ['what-if', /ומה אם|מה יקרה אם|אילו היה/],
  ['compare-two-claims', /מה גדול יותר|איזו .* גדולה|כדאי|עדיף/],
];

function checkQuestion(q: PracticeQuestion) {
  const w = q.id;
  const steps = q.solution?.steps ?? [];
  const text = steps.join('\n');

  if (!steps.length) return err(w, 'no-solution');
  if (!/\*\*הכלל:\*\*/.test(steps[0] ?? '')) warn(w, 'no-rule-line', 'the first step should name the criterion');
  if (!/\*\*הנוסחה:\*\*/.test(text)) err(w, 'no-formula-line', 'name the rule the solution applies, in general form, before substituting');
  else if (!/\*\*ההצבה:\*\*/.test(text)) warn(w, 'formula-without-substitution', '**הנוסחה:** with no **ההצבה:** after it');

  for (const s of steps) {
    if (/^\*\*(?:הנוסחה|ההצבה|הכלל):\*\*/.test(s.trim())) continue;
    const plain = s.replace(/\$\$[\s\S]*?\$\$/g, ' ');
    if (CLAIMS.some((re) => re.test(plain)) && !SHOWS.test(plain)) {
      err(w, 'leap', `announces a result without the move: "${s.replace(/\s+/g, ' ').slice(0, 60)}…"`);
      break;
    }
  }
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('```') || t.startsWith('$$') || t.startsWith('|')) continue;
    if (tall(t) >= 2) { err(w, 'crowded-line', `two calculations on one line: "${t.slice(0, 55)}…"`); break; }
  }

  const stem = q.question ?? '';
  const parts = [...stem.matchAll(/(?:^|\s)([אבגדה])\.\s/g)].map((m) => m[1]);
  if (parts.length >= 2 && stem.split('\n').length < parts.length) err(w, 'parts-on-one-line', `${parts.join(', ')} run together`);
  for (const [i, lab] of (q.answerLabels ?? []).entries()) {
    if (lab.replace(/\$[^$]*\$/g, '').length > 28) err(w, 'long-answer-label', `answerLabels[${i}] is a sentence`);
  }
  const off = OFF_STYLE.find(([, re]) => re.test(stem));
  if (off) err(w, 'off-style-ask', `${off[0]} — ask for the mathematical object instead`);
}

// ---------------------------------------------------------------------------
// The exam bar: the archived questions on sequences, same model
// ---------------------------------------------------------------------------

function examBar(): number {
  const tops: number[] = [];
  for (const q of ALL_PAST_BAGRUYOT) {
    if (!/סדרות/.test(q.topic ?? '')) continue;
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
  return tops.length ? tops.reduce((a, b) => a + b, 0) / tops.length : 0;
}
const BAR = examBar();

// ---------------------------------------------------------------------------

const L = getLesson('math5', TOPIC);
if (!L) throw new Error('no lesson');

function checkStage(stageId: string): boolean {
  const st = (L!.subTopics ?? []).find((s) => s.id === stageId) as SubTopic | undefined;
  const before = findings.length;
  if (!st) { err(stageId, 'stage-not-found'); return false; }
  const all = (st.questions ?? []) as PracticeQuestion[];
  for (const q of all) checkQuestion(q);

  const rung = (d: string) => all.filter((q) => q.difficulty === d);
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const sc = { easy: mean(rung('easy').map(scoreOf)), mid: mean(rung('mid').map(scoreOf)), hard: mean(rung('hard').map(scoreOf)) };
  const mc = {
    easy: mean(rung('easy').map((q) => mechanismsOf(q).length)),
    mid: mean(rung('mid').map((q) => mechanismsOf(q).length)),
    hard: mean(rung('hard').map((q) => mechanismsOf(q).length)),
  };
  for (const [lo, hi] of [['easy', 'mid'], ['mid', 'hard']] as const) {
    if (sc[hi] < sc[lo] + 2.0) err(stageId, 'rung-not-harder', `${hi} ${sc[hi].toFixed(1)} vs ${lo} ${sc[lo].toFixed(1)} — needs +2.0`);
    if (mc[hi] < mc[lo] + 0.3) err(stageId, 'rung-no-new-mechanism', `${hi} ${mc[hi].toFixed(1)} vs ${lo} ${mc[lo].toFixed(1)}`);
  }
  const lower = new Map<string, string>();
  for (const q of [...rung('easy'), ...rung('mid')]) if (!lower.has(signatureOf(q))) lower.set(signatureOf(q), q.id);
  for (const q of rung('hard')) {
    const twin = lower.get(signatureOf(q));
    if (twin) err(q.id, 'hard-is-a-restatement', `same ask + mechanisms as ${twin} (${signatureOf(q)})`);
  }
  const shapes = new Set(all.map(askShape));
  if (shapes.size < 4) err(stageId, 'too-few-ask-shapes', `${shapes.size} — ${[...shapes].join(', ')}`);
  const top3 = mean(rung('hard').map(scoreOf).sort((a, b) => b - a).slice(0, 3));
  const reach = BAR ? (top3 / BAR) * 100 : 0;
  if (reach < 90) err(stageId, 'does-not-reach-the-exam', `${top3.toFixed(1)} vs the archive's ${BAR.toFixed(1)} (${reach.toFixed(0)}%)`);

  if (process.argv.includes('--scores')) {
    console.log(`\n${stageId} — every question, scored:`);
    for (const d of ['easy', 'mid', 'hard'] as const)
      for (const q of rung(d).sort((a, b) => scoreOf(a) - scoreOf(b)))
        console.log(`   ${d.padEnd(4)} ${q.id.padEnd(18)} ${scoreOf(q).toFixed(1).padStart(5)}  ${signatureOf(q)}`);
  }

  const mine = findings.slice(before);
  const errors = mine.filter((f) => f.sev === 'error');
  console.log(
    `\n${stageId.padEnd(24)} ${String(all.length).padStart(2)}q  ${sc.easy.toFixed(1)} → ${sc.mid.toFixed(1)} → ${sc.hard.toFixed(1)} · mech ${mc.easy.toFixed(1)}→${mc.mid.toFixed(1)}→${mc.hard.toFixed(1)} · shapes ${shapes.size} · exam-reach ${reach.toFixed(0)}% · ${errors.length} error(s), ${mine.length - errors.length} warning(s)`,
  );
  if (!process.argv.includes('--quiet')) for (const f of mine) console.log(`   ${f.sev === 'error' ? '✗' : '⚠'} ${f.where}  ${f.rule}${f.detail ? '  — ' + f.detail : ''}`);
  return errors.length === 0;
}

const arg = process.argv[2];
if (!arg || (arg !== 'all' && !STAGES.includes(arg as (typeof STAGES)[number]))) {
  console.error(`usage: npx tsx scripts/_seq-check.ts <${STAGES.join('|')}|all>`);
  process.exit(2);
}
console.log(`exam bar: the archived סדרות questions, hardest part of each, average ${BAR.toFixed(1)}`);
const ids = arg === 'all' ? [...STAGES] : [arg];
const ok = ids.map(checkStage).every(Boolean);
console.log(ok ? '\n✅ clean' : '\n❌ fix the errors above');
process.exit(ok ? 0 : 1);
