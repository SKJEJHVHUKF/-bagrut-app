/**
 * verify-seq-ladder.ts — the gate for the סדרות practice ladder.
 *
 *   npx tsx scripts/verify-seq-ladder.ts ar-general-term    (one stage)
 *   npx tsx scripts/verify-seq-ladder.ts all                (all ten)
 *   npx tsx scripts/verify-seq-ladder.ts all --scores       (every question, scored)
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

/** Questions a rung must hold before it is a rung and not a sample. */
const MIN_PER_RUNG = 6;

type Sev = 'error' | 'warn';
const findings: { sev: Sev; where: string; rule: string; detail: string }[] = [];
const err = (where: string, rule: string, detail = '') => findings.push({ sev: 'error', where, rule, detail });
const warn = (where: string, rule: string, detail = '') => findings.push({ sev: 'warn', where, rule, detail });

// ---------------------------------------------------------------------------
// Difficulty model
// ---------------------------------------------------------------------------

/** Named moves a sequences question can require. Written to survive the
 *  definite article — "הנוסחה לאיבר הכללי" must match as surely as the bare
 *  form (six detectors in the functions gate were caught missing it).
 *
 * 🔴 The first thirteen entries were written from priors about what a sequences
 * question contains. Running the SIX archived שאלון 571 questions through them
 * (30 parts, 2022–2026) showed what those priors missed: every part scored
 * `geometric-term` plus one or two others, and NOT ONE mechanism existed for
 * the move the exam actually opens with — building a NEW sequence out of a
 * given one and proving it is geometric. A gate that cannot see the exam's
 * main move scores an author who writes it BELOW an author who writes a
 * routine substitution, so it does not merely fail to reward the right work,
 * it steers away from it. The six entries under `EXAM MOVES` close that.
 * Same class as lessons_scope_bugs_report_success: correct about what it
 * looked at, wrong about WHAT.
 */

/** The canonical "express it in terms of …", and the single source of truth for
 *  it — `askShape`, `hasParameter` and the `express-via-parameter` mechanism all
 *  read THIS one regex. Three detectors carrying their own narrow copy is how
 *  the trigonometry gate ended up disagreeing with itself about one sentence.
 *  Declared above the mechanism table because that table references it while
 *  the module is still evaluating. */
export const EXPRESS_IN_TERMS_OF =
  /(?:הבע|הבעו|הביע|הביעו|בטא|בטאו)\s+(?:את\s+)?[^.]{0,60}באמצעות|באמצעות \$[^$]+\$|עבור אילו ערכים/;

export const MECHANISMS_FOR_TEST: [string, RegExp][] = [
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

  // ── EXAM MOVES ──────────────────────────────────────────────────────────
  // Read off the archive, not off priors. Counts below are over the whole
  // סדרות corpus (158 questions) at the moment these were added — every one of
  // them was ZERO, which is the measurement behind Itay's "השאלות התמקדו על
  // דבר אחד או 2".

  // The exam's opening move, in 5 of the 6 archived papers: a SECOND sequence
  // is defined out of the first ($b_n = a_n\cdot a_{n+2}$, $c_n = 2b_n - a_n$,
  // $b_n = a_n + a_{n+1} + a_{n+2}$) and the student proves it is geometric.
  // 🔴 NOT a bare /b_n/ — a letter is a name, not a move (the geometry port
  // paid 2.5 points to every question that squared a number because /ריבוע/
  // also means "square of"). This wants the DEFINITION: a second sequence's
  // term written in terms of the first one's.
  // 🔴 `[bc]` on the LEFT, never `[abc]`. With `a` allowed, the ordinary
  // recursion rule `$a_n = a_{n-1} + d$` — which is what ar-recursion-sums and
  // ge-proof-sum are ABOUT — reads as a second sequence built from a first, and
  // every recursion question in the topic collects 2.5 free points while the
  // coverage count reports the exam's opening move as trained by content that
  // never touches it. A derived sequence needs a NEW NAME on the left; that is
  // the whole idea. Pinned in both directions by test-seq-ladder-detectors.
  ['derived-sequence', /\b[bc]_?\{?n\}?\s*=\s*[^$]*\b[abc]_?\{?n(?:[+\-]\d)?\}?|סדרה\s+\S*חדשה[^.]{0,40}מאיברי|מוגדרת לכל \$?n\$? טבעי|שאיבריה מקיימים/],

  // "הביעו את מנתה באמצעות $q$" — the archive's dominant verb is **הביעו**,
  // which appears ZERO times in our content while `באמצעות` appears 9. Both
  // spellings of the imperative and both of the older `בטא` form, because an
  // identical ask scoring +0 or +2.5 on the author's choice of verb is the
  // gate steering the prose (that exact bug cost the trigonometry port a round).
  ['express-via-parameter', EXPRESS_IN_TERMS_OF],

  // The sub-series on the even / odd places, ratio $q^2$ — and the general
  // "every 5th place", ratio $q^5$.
  ['position-subseries', /מקומות\s+ה?זוגיים|מקומות\s+ה?אי[- ]זוגיים|מקומם מתחלק|תת[- ]סדרה/],

  // Two infinite sums, and their RATIO is the given: $S_C = 12\cdot S_B$,
  // "גדול פי $1.96$ מסכום". This is how the archive hides $q$.
  ['sum-ratio', /גדול פי|קטן פי|גדול ב-?\$?\d[^.]{0,20}מסכום|S_?\{?\w+\}?\s*=\s*[^$]*S_?\{?\w+\}?/],

  // 🔴 The DECISION, never the description. "סדרה הנדסית אינסופית יורדת" is a
  // GIVEN and appears in most of ge-infinite's stems; the move is being asked
  // to determine the direction and to say why.
  ['monotonicity', /עולה או יורדת|האם ה?סדרה\s+\S*(?:עולה|יורדת)|קבעו אם[^.]{0,40}(?:עולה|יורדת)|לא עולה ולא יורדת|ולכן ה?סדרה\s+\S*(?:עולה|יורדת)|מכאן ש?ה?סדרה\s+\S*(?:עולה|יורדת)/],

  // Likewise for the sign of the terms: the archive asks "קבעו אם כל איברי
  // הסדרה חיוביים או שליליים. נמקו".
  ['sign-analysis', /חיוביים או שליליים|שליליים או חיוביים|האם[^.]{0,40}(?:חיובי|שלילי)|סימן\s+\S*איברים|כל איבריה\s+\S*(?:חיוביים|שליליים)/],
];

/** Subsumption, so one idea is never paid twice: a `derived-sequence`
 *  definition such as $a_{n+1} = a_n\cdot q$ also trips `recursion`, but a
 *  sequence BUILT from another and a sequence defined FROM ITS OWN PREDECESSOR
 *  are the same idea seen twice only when both fire on the same text — and
 *  there the recursion IS how the derivation is written. Stated here so the
 *  next reader does not "fix" it: they are kept separate on purpose, because a
 *  recursion rule alone (ar-recursion-sums) has no second sequence in it. */
export const mechanismsOfText = (text: string): string[] =>
  MECHANISMS_FOR_TEST.filter(([, re]) => re.test(text)).map(([n]) => n);

const mechanismsOf = (q: PracticeQuestion): string[] =>
  mechanismsOfText(`${q.question} ${(q.solution?.steps ?? []).join(' ')}`);

/** What the question asks the student to PRODUCE — specific shapes first, so a
 *  wide net ("prove", "justify") cannot swallow a narrower one. */
export function askShape(q: PracticeQuestion): string {
  const t = q.question ?? '';
  // 🔴 The bare /הוכח/ matches the NOUNS הוכחה · ההוכחה · בהוכחה · הוכחת, so a
  // question that QUOTES a proof and asks for the reason was classified
  // `prove` — the same bug that made a whole geometry stage report one ask
  // shape when it makes several. Demand the imperative; the infinitive
  // (להוכיח) stays, because "עליכם להוכיח" really is a proof task.
  if (/הוכיח|(?:^|[\s"״'(])הוכח(?=[\s.,:!?]|$)|הראו כי|הראה כי|הסיקו כי/.test(t)) return 'prove';
  // "הביעו את מנתה באמצעות $q$" — the archive's second most common ask (it
  // appears in 4 of the 6 papers). With no shape of its own it fell through
  // every net to `compute`, which is both the wrong label and, since `compute`
  // is what the variety rule warns about, a push away from writing it at all.
  if (EXPRESS_IN_TERMS_OF.test(t)) return 'express';
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

export const hasParameterForTest = (text: string) => hasParameter({ question: text } as PracticeQuestion);
const hasParameter = (q: PracticeQuestion) =>
  EXPRESS_IN_TERMS_OF.test(q.question ?? '') ||
  /פרמטר|מצא(?:ו)? את (?:הערך של )?\$?[a-z]\$?(?!_)|תלוי ב/.test(q.question ?? '');

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
  // 🔴 One exemption, and it is the archive that grants it. "קבעו בעבור כל
  // טענה אם היא נכונה… נמקו את קביעותיכם" is a real שאלון 571 part — it appears
  // in three of the six archived papers. The `which-claim-is-true` ban was
  // written for the quiz gimmick Itay rejected on פונקציות, and it currently
  // misses the archive's phrasing only by luck (the exam writes "איזו מן
  // הטענות", the pattern wants "איזו מהטענות"). Left alone it would refuse the
  // exam's own ask the moment an author reached for the near-identical wording.
  // What separates the exam form from the gimmick is the demand for a REASON,
  // so that is what the exemption keys on — not the stem, which is the same.
  const justified = /נמק|הסבירו מדוע|הסבר מדוע/.test(stem);
  const off = OFF_STYLE.find(([name, re]) => re.test(stem) && !(name === 'which-claim-is-true' && justified));
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
  // A rung with three questions is a rung a student exhausts in one sitting,
  // and it is also the rung whose average one new question can swing by six
  // points. Six is the floor the geometry round settled on.
  for (const d of ['easy', 'mid', 'hard'] as const)
    if (rung(d).length < MIN_PER_RUNG)
      err(stageId, `thin rung ${d}`, `${rung(d).length} questions, needs ${MIN_PER_RUNG}`);

  const shapes = new Set(all.map(askShape));
  if (shapes.size < 4) err(stageId, 'too-few-ask-shapes', `${shapes.size} — ${[...shapes].join(', ')}`);
  // 90% of the archive's 30 parts are find-parameter, prove, justify or
  // express. Counting DISTINCT shapes alone let a stage satisfy the variety
  // rule with four shapes the exam never uses, which is how the functions port
  // ended up with 34 quiz gimmicks.
  const examShapes = EXAM_SHAPES.filter((s) => shapes.has(s));
  if (examShapes.length < 2)
    err(stageId, 'no bagrut-shaped ask', `has ${[...shapes].join(', ')} — needs 2 of ${EXAM_SHAPES.join('/')}`);
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

// ---------------------------------------------------------------------------
// Coverage — "שהשאלות לא יתמקדו על דבר אחד או 2 אלא שיגעו בכל הנקודות"
// ---------------------------------------------------------------------------

/**
 * Itay, 2026-09-10, on סדרות: **"חשוב מאוד שהשאלות לא יתמקדו על דבר אחד או 2
 * אלא שהם יגעו בכל הנקודות, שבסוף תלמידים יגיעו מוכנים לכל שאלת בגרות."**
 *
 * The gradient rules above say the rungs CLIMB. They say nothing about what
 * the rungs climb THROUGH, so a topic can pass every one of them while
 * drilling two moves a hundred times — which is exactly what the first
 * measurement found: 25 questions on "find $n$ from a sum", 27 on the
 * convergence condition, and **zero** on the move five of the six archived
 * papers open with.
 *
 * The demand numbers are how many questions must train each move across the
 * whole topic. They are set from how often the archive uses the move, not from
 * a uniform quota — the exam is the ruler.
 */
const EXAM_DEMAND: [string, number, number, string][] = [
  // move                   need  minStages  why
  ['derived-sequence',      12, 2, 'סדרה חדשה מתוך נתונה — 5 מתוך 6 השאלונים פותחים בזה'],
  ['express-via-parameter', 12, 2, '"הביעו את מנתה באמצעות $q$" — 4 מתוך 6'],
  ['proof',                 12, 2, '"הוכיחו כי הסדרה הנדסית/חשבונית"'],
  ['sum-ratio',              8, 2, '"סכום הסדרה גדול פי … מסכום הסדרה" — 5 מתוך 6'],
  ['monotonicity',           8, 2, '"האם הסדרה עולה או יורדת? נמקו"'],
  ['position-subseries',     8, 2, 'המקומות הזוגיים / האי-זוגיים / כל מקום חמישי'],
  ['sign-analysis',          6, 2, '"קבעו אם כל האיברים חיוביים או שליליים. נמקו"'],
  ['infinite-sum',           8, 2, 'התכנסות וסכום אינסופי'],
  // minStages 1: אינדוקציה IS one stage. The spread rule exists to catch a move
  // that a single stage hoards while the rest of the topic never meets it; a
  // move the syllabus itself confines to one stage is not that.
  ['induction',              6, 1, 'אינדוקציה מתמטית'],
  ['word-problem',           8, 2, 'בעיה מילולית — ריבית, חיסכון, אוכלוסייה'],
];

/** The three shapes that are 90% of the archive (find-parameter 12, prove 9,
 *  justify 6 of 30 parts). A stage that never asks them is not a ramp to the
 *  exam however well its own rungs climb. */
const EXAM_SHAPES = ['prove', 'find-parameter', 'justify', 'express'] as const;

function checkCoverage() {
  const all = (L!.subTopics ?? []).flatMap((s) => (s.questions ?? []) as PracticeQuestion[]);
  console.log(`\n${'='.repeat(96)}\nכיסוי מהלכי הבגרות — ${all.length} שאלות בסך הכול`);
  for (const [move, need, minStages, why] of EXAM_DEMAND) {
    const hits = all.filter((q) => mechanismsOf(q).includes(move));
    const stages = new Set(
      (L!.subTopics ?? [])
        .filter((s) => ((s.questions ?? []) as PracticeQuestion[]).some((q) => mechanismsOf(q).includes(move)))
        .map((s) => s.id),
    );
    const ok = hits.length >= need && stages.size >= minStages;
    console.log(
      `  ${ok ? '✓' : '✗'} ${move.padEnd(22)} ${String(hits.length).padStart(3)}/${String(need).padEnd(3)} · ${stages.size} שלבים  — ${why}`,
    );
    if (hits.length < need) err('coverage', `too few on "${move}"`, `${hits.length} of ${need} — ${why}`);
    else if (stages.size < minStages)
      err('coverage', `"${move}" lives in ${stages.size} stage(s), needs ${minStages}`, [...stages].join(','));
  }
}

/** Refuse a stem only for an ask the BAGRUT never makes — see the exemption
 *  note in `checkQuestion`. Exported so the detector test can pin both
 *  directions on real archive wording. */
export function offStyleOf(stem: string): string | null {
  const justified = /נמק|הסבירו מדוע|הסבר מדוע/.test(stem);
  const hit = OFF_STYLE.find(([name, re]) => re.test(stem) && !(name === 'which-claim-is-true' && justified));
  return hit ? hit[0] : null;
}

function main() {
  // Defaults to `all` so `npm run verify:seq-ladder` guards the whole topic. The
  // old form REQUIRED a stage id, which is how a gate ends up wired into nothing
  // and quietly guarding no surface at all.
  const arg = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'all';
  if (arg !== 'all' && !STAGES.includes(arg as (typeof STAGES)[number])) {
    console.error(`usage: npx tsx scripts/verify-seq-ladder.ts [<${STAGES.join('|')}>|all] [--scores]`);
    process.exit(2);
  }
  console.log(`exam bar: the archived סדרות questions, hardest part of each, average ${BAR.toFixed(1)}`);
  const ids = arg === 'all' ? [...STAGES] : [arg];
  const stagesOk = ids.map(checkStage).every(Boolean);
  if (arg === 'all') {
    checkCoverage();
    for (const f of findings.filter((f) => f.where === 'coverage'))
      console.log(`   ✗ ${f.where}  ${f.rule}${f.detail ? '  — ' + f.detail : ''}`);
  }
  const ok = stagesOk && findings.every((f) => f.sev !== 'error');
  console.log(ok ? '\n✅ clean' : '\n❌ fix the errors above');
  process.exit(ok ? 0 : 1);
}

// Guarded: the detector test imports this module for its regexes, and an
// unguarded runner would run the whole gate — and call process.exit — on import.
if (process.argv[1]?.includes('verify-seq-ladder')) main();
