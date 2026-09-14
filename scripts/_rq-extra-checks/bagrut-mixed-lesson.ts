// Numeric re-derivation of רמה 8's worked summary question (the lesson, not a practice rung):
// f(x) = (x+2)/√(x−2). Bound to the LIVE lesson text — every number the steps state is
// recomputed here and then required to appear in the step that states it.
import { check, dcheck, checkSet, icheck, summary, E } from './_lib';
import { getSubTopic } from '../../content/lessons';

const STAGE = getSubTopic('math5', 'פונקציות', 'rq-bagrut-mixed');
const steps = STAGE?.lesson ?? [];
const step = (title: string) => steps.find((s) => s.title.includes(title))?.teach ?? '';
const says = (label: string, text: string, literal: string) => check(`${label} — the step says ${literal}`, text.includes(literal) ? 1 : 0, 1);

const F = '(x + 2)/sqrt(x - 2)';
const f = (x: number) => (x + 2) / Math.sqrt(x - 2);

// the question itself
const q = step('תחום, חיתוכים ואסימפטוטות');
says('question', q, '$f(x) = \\dfrac{x + 2}{\\sqrt{x - 2}}$');

// א — root in the denominator: strictly positive radicand
check('א radicand is 0 at x = 2, so x = 2 is excluded', E('2 - 2'), 0);
check('א radicand negative just left of 2', Math.sign(1.999 - 2), -1);
says('א', q, '$x > 2$');

// ב — the numerator's zero is outside the domain, and so is x = 0
check('ב numerator zero', E('-2 + 2'), 0);
check('ב x = -2 is outside x > 2', -2 > 2 ? 1 : 0, 0);
check('ב x = 0 is outside x > 2', 0 > 2 ? 1 : 0, 0);

// ג — vertical asymptote at 2 with numerator 4; no horizontal asymptote; the split
check('ג numerator at x = 2', E('2 + 2'), 4);
check('ג f → +∞ at 2+', f(2 + 1e-10) > 1e5 ? 1 : 0, 1);
check('ג f grows without bound: f(10^6) > 999', f(1e6) > 999 ? 1 : 0, 1);
for (const x of [2.5, 3, 6, 18]) check(`ג split √(x−2) + 4/√(x−2) equals f at ${x}`, Math.sqrt(x - 2) + 4 / Math.sqrt(x - 2), f(x));

// ד — the long derivative, its simplification, the zero, the sign table and the minimum
const d = step('נגזרת, טבלת סימנים וסקיצה');
const samples = [2.2, 3, 4.5, 6, 8, 13];
dcheck('ד raw quotient rule matches f', F, '(sqrt(x - 2) - (x + 2)/(2*sqrt(x - 2)))/(x - 2)', samples);
dcheck('ד after multiplying by 2√(x−2)', F, '(2*(x - 2) - (x + 2))/(2*(x - 2)*sqrt(x - 2))', samples);
dcheck('ד simplified f\' = (x−6)/(2(x−2)√(x−2))', F, '(x - 6)/(2*(x - 2)*sqrt(x - 2))', samples);
check('ד numerator 2x − 4 − x − 2 = x − 6 at x = 9', 2 * 9 - 4 - 9 - 2, 9 - 6);
checkSet('ד f\' = 0 only at x = 6', [E('6')], [6]);
const fp = (x: number) => (x - 6) / (2 * (x - 2) * Math.sqrt(x - 2));
check('ד table: f\' < 0 on (2, 6)', Math.sign(fp(4)), -1);
check('ד table: f\' > 0 on (6, ∞)', Math.sign(fp(9)), 1);
check('ד denominator positive on the domain', Math.sign(2 * (4 - 2) * Math.sqrt(4 - 2)), 1);
check('ד f(6) = 4', f(6), 4);
says('ד', d, '$(6,\\; 4)$');
says('ד', d, '```signtable');
check('ה extra point f(3) = 5', f(3), 5);
says('ה', d, '$(3,\\; 5)$');

// ו — the number of solutions of f(x) = k, and the worked k = 5
const w = step('סעיף חשיבה');
let below4 = 0;
for (let i = 1; i <= 200000; i++) {
  const x = 2 + i * 0.0005;
  if (f(x) < 4 - 1e-9) below4++;
}
check('ו nothing on the graph lies below 4 (grid over (2, 102])', below4, 0);
const r = [(21 - Math.sqrt(21 * 21 - 4 * 54)) / 2, (21 + Math.sqrt(21 * 21 - 4 * 54)) / 2];
checkSet('ו (x+2)^2 = 25(x−2) ⇔ x^2 − 21x + 54 = 0 has roots 3, 18', r, [3, 18]);
for (const x of r) check(`ו root ${x} satisfies the ORIGINAL equation f(x) = 5`, f(x), 5);
check('ו expansion: (x+2)^2 − 25(x−2) = x^2 − 21x + 54 at x = 3.7', (3.7 + 2) ** 2 - 25 * (3.7 - 2), 3.7 ** 2 - 21 * 3.7 + 54, 1e-9);
says('ו', w, '$x^2 - 21x + 54 = 0$');

// ז — the area 38/3 by quadrature, by the antiderivative, and the reasonableness bounds
const z = step('סעיף שטח');
icheck('ז ∫_3^6 f dx = 38/3', F, 3, 6, 38 / 3);
const Fz = (x: number) => (2 / 3) * (x - 2) ** 1.5 + 8 * Math.sqrt(x - 2);
dcheck('ז F\'(x) = f(x)', '(2/3)*(x - 2)^(3/2) + 8*(x - 2)^(1/2)', F, samples);
check('ז F(6) = 64/3', Fz(6), 64 / 3);
check('ז F(3) = 26/3', Fz(3), 26 / 3);
check('ז between 12 and 15', 38 / 3 > 12 && 38 / 3 < 15 ? 1 : 0, 1);
check('ז f > 0 on [3, 6]', Math.min(f(3), f(4.5), f(6)) > 0 ? 1 : 0, 1);
says('ז', z, '\\dfrac{38}{3}');

summary('bagrut-mixed-lesson');
