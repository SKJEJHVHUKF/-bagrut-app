/**
 * test-seq-ladder-detectors.ts — positive AND negative controls for every
 * detector in verify-seq-ladder.ts.
 *
 *   npx tsx scripts/test-seq-ladder-detectors.ts
 *
 * Why this file exists. Across four earlier ports of this gate (הסתברות,
 * פונקציות מנה ושורש, גאומטריה, טריגונומטריה) roughly twenty detector bugs were
 * found, and NOT ONE of them was found by the gate: every one was found by an
 * author reading the mechanism list printed beside its own question. The gate
 * stays green in all of them — it reports a wrong number and then blames a
 * question for "repeating an easier rung".
 *
 * The recurring shape of the bug is a common Hebrew word whose everyday sense
 * differs from its technical sense (ריבוע = a quadrilateral / the square of a
 * number; דומים = similar triangles / like terms; הוכחה as a noun). So the rule
 * here is: **every pattern gets a positive case AND a negative case.** A
 * negative alone passes a regex that matches nothing; a positive alone passes a
 * regex that matches everything.
 *
 * The positive cases are lifted VERBATIM from the six archived שאלון 571
 * questions wherever one exists. The archive is the corpus the ladder is meant
 * to reach, so it is also the cheapest counter-example set — a detector that
 * cannot see the exam's own wording is broken no matter how well it scores our
 * own content.
 */
import {
  EXPRESS_IN_TERMS_OF,
  askShape,
  hasParameterForTest,
  mechanismsOfText,
  offStyleOf,
} from './verify-seq-ladder';
import type { PracticeQuestion } from '../content/lessons/types';

let pass = 0;
const fails: string[] = [];
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) === JSON.stringify(want)) pass++;
  else fails.push(`${label}\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`);
};

const hasMech = (text: string, m: string) => mechanismsOfText(text).includes(m);
const shapeOf = (question: string) => askShape({ question } as PracticeQuestion);

// ===========================================================================
// derived-sequence — the exam's opening move in 5 of the 6 archived papers
// ===========================================================================
// Every positive here is the literal definition line from a real שאלון.
for (const [src, def] of [
  ['b2024s571a-q2', 'הסדרה $B$ מוגדרת לכל $n$ טבעי באופן הזה: $\\;b_n=a_n\\cdot a_{n+2}$.'],
  ['b2025s571a-q2', 'סדרה אין-סופית חדשה $B$, שאיבריה מקיימים $\\;b_n = \\dfrac{1}{a_n\\cdot a_{n+1}}\\;$'],
  ['b2025s571b-q2', '$c_n$ היא סדרה אין-סופית המקיימת $\\;c_n=2b_n-a_n\\;$ לכל $n$ טבעי'],
  ['b2026s571a-q2', '$\\;c_n$ היא סדרה אין-סופית שאיבריה מקיימים $\\;c_n = a_n \\cdot b_n\\;$'],
  ['b2026s571b-q2', '$b_n$ היא סדרה אין-סופית שאיבריה מקיימים $\\;b_n = a_n + a_{n+1} + a_{n+2}\\;$'],
  ['b2026s571b-q2', '$c_n$ היא סדרה שאיבריה מקיימים $\\;c_n = \\dfrac{b_n}{4\\,a_n}\\;$ לכל $n$ טבעי'],
  ['b2024s571a-q2', 'סדרה הנדסית נוספת $C$, המוגדרת לכל $n$ טבעי באופן הזה: $\\;c_n=\\dfrac{a_n}{b_n}$'],
] as const)
  check(`derived-sequence fires on the archive's own definition (${src})`, hasMech(def, 'derived-sequence'), true);

// 🔴 The negatives are the whole point. A sequence defined from ITSELF is a
// recursion, not a derivation, and the plain explicit formula is neither — if
// either scored as a derived sequence, every routine question in the topic
// would collect 2.5 free points and the coverage count would report the move
// as trained when nothing trains it.
for (const [why, text] of [
  ['the explicit general term', 'לפי הנוסחה $a_n = a_1 \\cdot q^{n-1}$ מציבים ומקבלים'],
  ['an arithmetic general term', 'הנוסחה היא $a_n = a_1 + (n-1)d$'],
  ['a plain recursion rule', 'נתון כלל הנסיגה $a_{n+1} = a_n + 3$ וגם $a_1 = 5$'],
  ['a sum formula', 'מציבים בנוסחה $S_n = 3n^2 + 2n$ ומחשבים'],
  ['a geometric recursion', 'כל איבר שווה לקודמו כפול $q$, כלומר $a_{n+1} = a_n \\cdot q$'],
  // 🔴 THE discriminating case, and the one the first version of this test
  // missed. Mutating the left-hand class from `[bc]` to `[abc]` left all 48
  // assertions green, which means nothing here was actually pinning the rule
  // the comment claims. `$a_n = a_{n-1} + d$` is the backwards-facing spelling
  // of a recursion rule — the very subject of ar-recursion-sums and
  // ge-proof-sum — and it is the ONE string that separates the two classes.
  // Without it the detector could silently widen and report the exam's opening
  // move as trained by content that never touches it.
  ['a backwards-written arithmetic recursion', 'כלל הנסיגה הוא $a_n = a_{n-1} + d$ לכל $n > 1$'],
  ['a backwards-written geometric recursion', 'מתקיים $a_n = a_{n-1} \\cdot q$ לכל $n > 1$'],
] as const)
  check(`derived-sequence does NOT fire on ${why}`, hasMech(text, 'derived-sequence'), false);

// ===========================================================================
// express-via-parameter — the archive's dominant verb is הביעו, which appeared
// ZERO times in our content while `באמצעות` appeared nine
// ===========================================================================
for (const t of [
  'הוכיחו כי הסדרה $B$ היא סדרה הנדסית, והביעו את מנתה באמצעות $q$.',
  'הוכיחו כי הסדרה $c_n$ היא הנדסית, והביעו את מנתה באמצעות $q$.',
  'הראו כי הסדרה $I$ מתכנסת, ומצאו את המנה $q$ של הסדרה $II$ (באמצעות $r$).',
  'הוכיחו כי הסדרה $c_n$ היא הנדסית, והביעו באמצעות $q$ את מנתה.',
  'בטאו את סכום הסדרה באמצעות $a_1$.',
  'מצאו בעבור אילו ערכים של $k$ הסדרה $C$ עולה. נמקו את תשובתכם.',
])
  check(`express-via-parameter fires on "${t.slice(0, 34)}…"`, hasMech(t, 'express-via-parameter'), true);

// The verb-agnosticism is the point: an identical ask must not score +0 or
// +2.5 on which synonym the author happened to reach for. That exact defect
// made an author reorder the symbols in fourteen questions on the trig port.
check(
  'הביעו and בטאו score identically',
  hasMech('הביעו את מנתה באמצעות $q$', 'express-via-parameter') ===
    hasMech('בטאו את מנתה באמצעות $q$', 'express-via-parameter'),
  true,
);
for (const [why, t] of [
  ['a method named with באמצעות but no maths island', 'פותרים את המערכת באמצעות הצבה של המשוואה הראשונה'],
  ['a plain numeric answer', 'מצאו את סכום $20$ האיברים הראשונים בסדרה'],
] as const)
  check(`express-via-parameter does NOT fire on ${why}`, hasMech(t, 'express-via-parameter'), false);

// 🔴 Cross-gate contradiction check. On the trigonometry port one gate paid
// three points for `סמן ב-$a$` while check-rtl-maqaf FAILED THE BUILD on that
// exact string in that same directory, so an author who wrote what the score
// rewarded got a red build. Every phrasing this detector rewards is run through
// the maqaf rule here.
const MAQAF_VIOLATION = /[֐-ת]-(?=\$|\d)/;
for (const t of [
  'הביעו את מנתה באמצעות $q$.',
  'בטאו את $a_1$ באמצעות $S$.',
  'מצאו בעבור אילו ערכים של $k$ הסדרה עולה.',
])
  check(`a phrase express-via-parameter rewards also passes check-rtl-maqaf: "${t}"`, MAQAF_VIOLATION.test(t), false);

// ===========================================================================
// monotonicity / sign-analysis — the DECISION, never the description
// ===========================================================================
// The archive states the direction as a GIVEN in almost every stem, and that
// given appears in most of ge-infinite's questions. If the description scored,
// the mechanism count would rise uniformly across every rung of that stage —
// which does not go red, it goes UNIFORM, and a uniform detector is a blind one.
for (const [why, t] of [
  ['a decreasing sequence stated as a given', '$a_n$ היא סדרה הנדסית אין-סופית **יורדת** שכל איבריה **חיוביים**, ומנתה היא $q$.'],
  ['an increasing sequence stated as a given', '$a_n$ היא סדרה הנדסית אין-סופית **עולה** שמנתה $q$.'],
] as const)
  check(`monotonicity does NOT fire on ${why}`, hasMech(t, 'monotonicity'), false);

for (const t of [
  'האם הסדרה $c_n$ עולה או יורדת? נמקו את תשובתכם.',
  'הסדרה $A$ לא עולה ולא יורדת.',
  'קבעו אם הסדרה $B$ היא סדרה עולה. נמקו.',
  'מכיוון ש-$q > 1$ וגם $a_1 > 0$, מכאן שהסדרה עולה.',
])
  check(`monotonicity fires on the decision: "${t.slice(0, 34)}…"`, hasMech(t, 'monotonicity'), true);

check(
  'sign-analysis fires on the archive ask',
  hasMech('קבעו אם כל איברי הסדרה $a_n$ הם חיוביים או שליליים. נמקו את קביעתכם.', 'sign-analysis'),
  true,
);
check(
  'sign-analysis does NOT fire on a bare positive number',
  hasMech('סכום הסדרה הוא $12$, שהוא מספר חיובי גדול', 'sign-analysis'),
  false,
);

// ===========================================================================
// sum-ratio — how the archive hides q
// ===========================================================================
for (const t of [
  'נתון כי סכום אינסוף איברי $II$ גדול פי $\\tfrac{4}{3}$ מסכום אינסוף איברי $I$.',
  'נתון כי סכום הסדרה $b_n$ גדול פי $1.96$ מסכום הסדרה $a_n$.',
  'נתון: $\\;S_C = 12\\cdot S_B$. מצאו את הערך של $k$.',
  'סכום האיברים במקומות הזוגיים גדול ב-$4$ מסכום האיברים במקומות האי-זוגיים.',
])
  check(`sum-ratio fires on "${t.slice(0, 34)}…"`, hasMech(t, 'sum-ratio'), true);

// ===========================================================================
// askShape — the noun/imperative bug that reported one shape for a stage that
// makes several
// ===========================================================================
check(
  'prove fires on the archive imperative',
  shapeOf('הוכיחו כי הסדרה $B$ היא סדרה הנדסית, והביעו את מנתה באמצעות $q$.'),
  'prove',
);
check('prove fires on הראו כי', shapeOf('הראו כי הסדרה $I$ מתכנסת.'), 'prove');
// 🔴 The bug: /הוכח/ matches the NOUNS הוכחה · ההוכחה · בהוכחה · הוכחת, so a
// question that QUOTES a proof and asks for the REASON was classified `prove`.
// That is how a geometry stage reported ONE ask shape while making several.
check(
  'a question ABOUT a proof is justify, not prove',
  shapeOf('לפניכם ההוכחה שהסדרה הנדסית. מהו הנימוק לצעד השני? נמקו את תשובתכם.'),
  'justify',
);
check(
  'the claim triple is justify',
  shapeOf('לפניכם שלוש טענות, I–III. קבעו בעבור כל טענה אם היא נכונה או לא נכונה. נמקו את קביעותיכם.'),
  'justify',
);
// A standalone "express it in terms of q" used to fall through every net to
// `compute` — both the wrong label and, since `compute` is what the variety
// rule warns about, a push away from writing the exam's second commonest ask.
check('a standalone express ask is not compute', shapeOf('הביעו את מנת הסדרה $b_n$ באמצעות $q$.'), 'express');

// ===========================================================================
// off-style — refuse the quiz gimmick, never the exam's own ask
// ===========================================================================
// 🔴 Verbatim from שאלון 571 קיץ 2026 מועד ב. The ban currently misses this only
// by luck (the exam writes "איזו מן הטענות", the pattern wants "איזו מהטענות"),
// so without the exemption an author reaching for the near-identical wording
// would be refused for writing what the exam writes.
check(
  "the archive's own claim-triple is allowed",
  offStyleOf('לפניכם שלוש טענות I–III. קבעו איזו מן הטענות נכונה, ונמקו את קביעתכם.'),
  null,
);
check(
  'the same stem WITHOUT a demand for a reason is still refused',
  offStyleOf('איזו טענה נכונה?'),
  'which-claim-is-true',
);
check('the quiz gimmick stays refused', offStyleOf('כמה טעויות יש בפתרון שלפניכם?'), 'count-the-errors');
check(
  'a student-said MCQ stays refused',
  offStyleOf('תלמיד טען שהסדרה הנדסית. האם הוא צודק?'),
  'student-said-mcq',
);

// ===========================================================================
// hasParameter — reads the single shared regex, never a private copy
// ===========================================================================
check('hasParameter and EXPRESS_IN_TERMS_OF agree', hasParameterForTest('הביעו את מנתה באמצעות $q$'), EXPRESS_IN_TERMS_OF.test('הביעו את מנתה באמצעות $q$'));
check('a bare a_1 is not a parameter', hasParameterForTest('מצאו את $a_1$'), false);
check('a named letter is a parameter', hasParameterForTest('מצאו את הערך של $q$'), true);

// ===========================================================================
console.log(`${pass} assertion(s) passed, ${fails.length} failed.`);
for (const f of fails) console.log(`  ✗ ${f}`);
if (fails.length) process.exit(1);
console.log('A pass means each detector sees what it claims to see AND ignores what it claims to ignore.');
