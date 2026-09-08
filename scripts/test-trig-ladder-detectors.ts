/**
 * test-trig-ladder-detectors.ts — a POSITIVE test for verify-trig-ladder's
 * regexes.
 *
 *   npx tsx scripts/test-trig-ladder-detectors.ts
 *
 * Why this file exists: on the three earlier ports of this gate, every scoring
 * bug was found by a human reading a dump, never by the gate. The failures were
 * always the same two shapes —
 *
 *   1. a pattern that matches a word NAMING a thing rather than the move
 *      (/ריבוע/ paid for squaring a number; /גרף הפונקציה/ paid for saying the
 *      word "graph"), and
 *   2. a pattern that silently matches NOTHING, because JS `\b` never forms a
 *      boundary beside a Hebrew letter, or because the definite article was not
 *      allowed for.
 *
 * A gate that quietly detects nothing reports a flat rung as content's fault.
 * So each detector below is pinned with text it MUST match and text it MUST
 * NOT — the must-nots are the real content of this file.
 */
import { askShape, mechanismsOfText } from './verify-trig-ladder';
import type { PracticeQuestion } from '../content/lessons/types';

let pass = 0;
const fails: string[] = [];

const hasMech = (name: string, text: string, want: boolean, why: string) => {
  const got = mechanismsOfText(text).includes(name);
  if (got === want) pass++;
  else
    fails.push(
      `${name}: expected ${want ? 'MATCH' : 'NO match'} — ${why}\n      text: ${text.slice(0, 110)}`,
    );
};

const shapeIs = (text: string, want: string, why: string) => {
  const got = askShape({ question: text } as PracticeQuestion);
  if (got === want) pass++;
  else fails.push(`askShape: expected ${want}, got ${got} — ${why}\n      text: ${text.slice(0, 110)}`);
};

// ── the plane theorems, through the definite article and inflection ────────
hasMech('sine-law', 'לפי משפט הסינוסים במשולש', true, 'definite article');
hasMech('sine-law', 'נשתמש במשפט סינוסים', true, 'no article');
hasMech('cosine-law', 'לפי משפט הקוסינוסים נקבל', true, 'definite article');
hasMech('cosine-law', 'הקוסינוס של הזווית שלילי', false, 'naming the function is not the theorem');

// ── the area formula must be the FORMULA, not the word "area" ─────────────
hasMech('area-sine', 'השטח הוא $S = \\tfrac12 \\cdot 12 \\cdot 9 \\cdot \\sin B$', true, 'the formula');
hasMech('area-sine', 'שטח המשולש הקטן הוא $27$ סמ״ר', false, 'naming a quantity is not applying the formula');
hasMech('area-sine', 'חשב את שטח המשולש', false, 'asking for area is not a mechanism');

// ── the two Pythagorases are different moves and must not collide ──────────
hasMech('pythagorean-identity', 'לפי זהות פיתגורס הטריגונומטרית', true, 'the identity');
hasMech('pythagorean-identity', '$\\cos^2\\alpha = 1 - \\sin^2\\alpha$', true, 'the transposed form');
hasMech('pythagoras', 'לפי משפט פיתגורס במשולש', true, 'the geometric theorem');
hasMech('pythagoras', 'לפי זהות פיתגורס הטריגונומטרית', false, 'the identity is NOT the geometric theorem');
hasMech('pythagorean-identity', 'לפי משפט פיתגורס: $OM^2 = OA^2 - AM^2$', false, 'and not the reverse');

// ── the identities ─────────────────────────────────────────────────────────
hasMech('supplementary', '$\\sin(180° - \\alpha) = \\sin\\alpha$', true, '180 family');
hasMech('complementary', '$\\sin(90° - \\alpha) = \\cos\\alpha$', true, '90 family');
hasMech('double-angle', '$\\sin(2\\alpha) = 2\\sin\\alpha\\cos\\alpha$', true, 'double angle');
// The parentheses are optional in real content, and the first version of the
// pattern required them — so tf-eq-009, whose entire subject is sin 2x = sin x,
// scored as involving no double angle at all.
hasMech('double-angle', 'כמה פתרונות יש למשוואה $\\sin 2x = \\sin x$?', true, 'no parentheses');
hasMech('double-angle', '$2\\sin x\\cos x - \\sin x = 0$', true, 'already opened');
hasMech('double-angle', 'הזווית $2\\alpha$ כלואה בין הצלעות', false, 'naming 2α is not opening it');
hasMech('asymptote', 'לפונקציה יש אסימפטוטה אנכית ב-', true, 'asymptote');

// ── solving ────────────────────────────────────────────────────────────────
hasMech('t-substitution', 'מציבים משתנה עזר $t = \\cos x$', true, 'substitution');
hasMech('range-filter', 'השורש $t_2 = -2$ נפסל', true, 'a candidate actually rejected');
hasMech('range-filter', 'פתור את המשוואה בתחום $0° \\le x \\le 180°$', false,
  'every equation question says "בתחום"; paying for it would pay them all equally');

// ── the circle theorems, and the double-payment bug from the geo port ──────
hasMech('inscribed-angle', 'הזווית ההיקפית $\\angle ACB$', true, 'definite article');
hasMech('inscribed-angle', 'זווית היקפית הנשענת על הקוטר היא ישרה', false,
  'diameter-right SUBSUMES it — one theorem must not be paid twice');
hasMech('diameter-right', 'זווית היקפית הנשענת על הקוטר היא ישרה', true, 'the specific theorem');

// ── the calculus half: these were 0.00 on every rung until the list grew ───
hasMech('trig-derivative', "$(\\sin x)' = \\cos x$", true, 'the derivative itself');
hasMech('trig-derivative', 'הפונקציה $f(x) = \\sin x$ מוגדרת לכל $x$', false, 'naming sin is not differentiating it');
hasMech('chain-rule', 'לפי כלל השרשרת, הנגזרת הפנימית היא', true, 'chain rule');
hasMech('extremum', 'מאפסים את הנגזרת ומקבלים נקודת קיצון', true, 'extremum');
hasMech('antiderivative', 'הפונקציה הקדומה היא $F(x) = -\\cos x + C$', true, 'antiderivative');
hasMech('radians', 'הזווית נתונה ברדיאנים', true, 'radians');
hasMech('periodicity', 'המחזור של הפונקציה הוא $2\\pi$', true, 'periodicity');

// ── ask shapes: justify must be tested BEFORE prove, prove needs the verb ──
shapeIs('הוכח כי המשולש שווה-שוקיים', 'prove', 'imperative הוכח');
shapeIs('מהו הנימוק הנכון בהוכחה של המשולש?', 'justify',
  'the NOUN בהוכחה must not be read as the imperative — this exact bug gave a whole geometry stage one ask shape');
shapeIs('הסבר מדוע מתקיים $\\cos A = -\\cos C$', 'justify', 'הסבר מדוע');
shapeIs('פתור את המשוואה $2\\cos^2 x - \\sin x - 1 = 0$ בתחום', 'solve-equation', 'equation');
shapeIs('מהם כל הפתרונות של המשוואה בתחום הנתון?', 'solve-equation', 'all solutions');
shapeIs('חשב את שטח המשולש', 'area', 'area');
shapeIs('מצא את הזווית $\\angle B$', 'compute-angle', 'angle');
shapeIs('חשב את אורך הצלע $BC$', 'compute-length', 'length');
shapeIs('בטא באמצעות $a$ את שטח המשולש', 'find-parameter',
  'find-parameter must beat area — expressing in terms of a parameter is the harder ask');
shapeIs('לאיזה ביטוי שווה $\\cos(90° - \\alpha) + \\sin(-\\alpha)$?', 'simplify', 'simplify');

console.log(`${pass} passed, ${fails.length} failed`);
for (const f of fails) console.log(`  ✗ ${f}`);
if (fails.length) process.exit(1);
console.log('✅ every detector matches what it must and refuses what it must not.');
