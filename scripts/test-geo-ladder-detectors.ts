/**
 * test-geo-ladder-detectors.ts — positive test for verify-geo-ladder's scoring.
 *
 *   npx tsx scripts/test-geo-ladder-detectors.ts
 *
 * A detector that silently MISSES a phrase scores real work low; one that
 * silently MATCHES an unrelated phrase scores it high. Both are invisible —
 * the gate stays green either way and just reports a wrong number, then blames
 * a question for "repeating an easier rung".
 *
 * Three of these cases are bugs that shipped in the first version of the gate
 * and were caught only by reading a per-question dump:
 *   - /ריבוע/ matched "ריבוע יחס הדמיון" (the square of a number) and paid a
 *     two-similar-triangles warm-up for an imaginary quadrilateral;
 *   - /שטח\s+\S*משולש/ matched "שטח המשולש הקטן הוא 27", which NAMES a
 *     quantity rather than applying the area formula;
 *   - `inscribed-angle` and `diameter-right` both fired on one sentence, so the
 *     single theorem "the angle on a diameter is 90°" was paid twice.
 *
 * Hebrew inflection is the other standing trap: a pattern written with a
 * literal space between two words misses the definite article, and `\b` never
 * matches beside a Hebrew letter at all.
 */
import { MECHANISMS_FOR_TEST, mechanismsOfText } from './verify-geo-ladder';

type Case = { text: string; want: string[]; not?: string[]; why: string };

const CASES: Case[] = [
  {
    why: 'the square of a ratio is not a quadrilateral',
    text: 'יחס השטחים שווה לריבוע יחס הדמיון, ולכן מרבעים את היחס.',
    want: ['area-ratio'],
    not: ['quadrilateral'],
  },
  {
    why: 'a squared length is not a quadrilateral either',
    text: 'הגובה בריבוע שווה למכפלת שני קטעי היתר.',
    want: [],
    not: ['quadrilateral'],
  },
  {
    why: 'a real quadrilateral still counts',
    text: 'המרובע $ABCD$ הוא מקבילית, ולכן אלכסוניה חוצים זה את זה.',
    want: ['quadrilateral'],
  },
  {
    why: 'naming an area is not applying the area formula',
    text: 'שטח המשולש הקטן הוא $27$ סמ"ר.',
    want: [],
    not: ['area-formula'],
  },
  {
    why: 'a plain division that happens to assign S is not the area formula',
    text: 'חילוץ הנעלם: $S = \\dfrac{675}{9} = 75$ סמ״ר.',
    want: [],
    not: ['area-formula'],
  },
  {
    why: 'the area formula itself does count',
    text: 'שטח המשולש: $S = \\dfrac{AC \\cdot BC}{2} = \\dfrac{15 \\cdot 20}{2} = 150$.',
    want: ['area-formula'],
  },
  {
    why: 'the diameter theorem is ONE theorem, not two',
    text: 'לכן $\\angle ACB = 90°$, זווית היקפית הנשענת על הקוטר $AB$.',
    want: ['diameter-right'],
    not: ['inscribed-angle'],
  },
  {
    why: 'an inscribed angle with no diameter still counts on its own',
    text: 'הזוויות ההיקפיות הנשענות על אותה קשת שוות זו לזו.',
    want: ['inscribed-angle'],
    not: ['diameter-right'],
  },
  {
    why: 'the definite article must not hide a mechanism (הזווית ההיקפית)',
    text: 'הזווית ההיקפית שווה למחצית הזווית המרכזית.',
    want: ['inscribed-angle'],
  },
  {
    why: 'inflected forms: הקטע האמצעים / קטע אמצעים',
    text: 'הקטע $MN$ הוא קטע אמצעים במשולש, ולכן הוא מקביל לצלע השלישית.',
    want: ['midline'],
  },
  {
    why: 'congruence abbreviations are mechanisms',
    text: 'לכן $\\triangle ABD \\cong \\triangle ACD$ לפי צ.ז.צ.',
    want: ['congruence'],
  },
  {
    why: 'the tangent-radius theorem, both phrasings',
    text: 'המשיק מאונך לרדיוס בנקודת ההשקה.',
    want: ['tangent-radius'],
  },
  {
    why: 'power of a point, chord form',
    text: 'במיתרים מצטלבים מתקיים $AE \\cdot EB = CE \\cdot ED$.',
    want: ['power-of-point'],
  },
];

let bad = 0;
for (const c of CASES) {
  const got = mechanismsOfText(c.text);
  for (const w of c.want)
    if (!got.includes(w)) {
      bad++;
      console.log(`✗ MISSED "${w}" — ${c.why}\n    got: [${got.join(', ')}]\n    in: ${c.text}`);
    }
  for (const n of c.not ?? [])
    if (got.includes(n)) {
      bad++;
      console.log(`✗ SPURIOUS "${n}" — ${c.why}\n    got: [${got.join(', ')}]\n    in: ${c.text}`);
    }
}

// Every mechanism must be reachable: a pattern that can never fire is a
// mechanism the gate silently does not count.
const named = new Set(CASES.flatMap((c) => mechanismsOfText(c.text)));
const unexercised = MECHANISMS_FOR_TEST.map(([n]) => n).filter((n) => !named.has(n));

console.log(
  `\n${CASES.length} cases · ${bad} detector problem(s) · ` +
    `${MECHANISMS_FOR_TEST.length - unexercised.length}/${MECHANISMS_FOR_TEST.length} mechanisms exercised`,
);
if (unexercised.length) console.log(`  (not yet covered by a case: ${unexercised.join(', ')})`);
process.exit(bad ? 1 : 0);
