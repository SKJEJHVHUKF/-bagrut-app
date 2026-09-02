/**
 * _fix-tf-maqaf.ts — literal-pair sweep for the maqaf-before-maths defect in the
 * trig-functions stages.
 *
 *   npx tsx scripts/_fix-tf-maqaf.ts [--apply]
 *
 * split/join, never String.replace: a replacement string ending in a maths
 * island ends in `$'`, which pastes the rest of the file in.
 * String.raw keeps the doubled backslashes matching the source exactly.
 */
import { readFileSync, writeFileSync } from 'fs';

const FILES = [
  'content/lessons/math5/trig-functions/tf-equations.ts',
  'content/lessons/math5/trig-functions/tf-domain.ts',
  'content/lessons/math5/trig-functions/tf-derivative.ts',
  'content/lessons/math5/trig-functions/tf-investigation.ts',
  'content/lessons/math5/trig-functions/tf-integral.ts',
  'content/lessons/math5/trig-functions/tf-bagrut.ts',
];

const PAIRS: Array<[string, string]> = [
  [String.raw`מתאפס ב-$0°$ וגם ב-$180°$`, String.raw`מתאפס בזוויות $0°$ וגם $180°$`],
  [String.raw`בחלוקה ב-$\\sin x$`, String.raw`בחלוקה בביטוי $\\sin x$`],
  [String.raw`חלוקה ב-$\\sin x$`, String.raw`חלוקה בביטוי $\\sin x$`],
  [String.raw`חלוקה ב-$\\cos x$`, String.raw`חלוקה בביטוי $\\cos x$`],
  [String.raw`האגפים ב-$\\sin x$`, String.raw`האגפים בביטוי $\\sin x$`],
  [String.raw`ש-$\\sin x \\ne 0$`, String.raw`שמתקיים $\\sin x \\ne 0$`],
  [String.raw`מתאימה ל-$\\sin x = -1$`, String.raw`מתאימה למשוואה $\\sin x = -1$`],
  [String.raw`מגיע ל-$1$`, String.raw`מגיע לערך $1$`],
  // --- tf-domain -------------------------------------------------------------
  [String.raw`מתאפס ב-$x = \\dfrac{\\pi}{2}$`, String.raw`מתאפס בזווית $x = \\dfrac{\\pi}{2}$`],
  [String.raw`מתאפס ב-$\\dfrac{\\pi}{2}$`, String.raw`מתאפס בזווית $\\dfrac{\\pi}{2}$`],
  [String.raw`אנכיות ב-$x = \\dfrac{\\pi}{6}$`, String.raw`אנכיות בזוויות $x = \\dfrac{\\pi}{6}$`],
  [String.raw`ו-$\\dfrac{\\pi}{2}$`, String.raw`וגם $\\dfrac{\\pi}{2}$`],
  [String.raw`פרט ל-$0$`, String.raw`פרט לערכים $0$`],
  [String.raw`שווה ל-$2\\sin x$`, String.raw`שווה לביטוי $2\\sin x$`],
  [String.raw`מצאנו ש-$u(x_0) = 0$`, String.raw`מצאנו כי $u(x_0) = 0$`],
  [String.raw`מתאפס ב-$x_0$`, String.raw`מתאפס בנקודה $x_0$`],
  [String.raw`שיעור ה-$y$`, String.raw`שיעור $y$`],
  [String.raw`זכור ש-$\\cos 0 = 1$`, String.raw`זכור כי $\\cos 0 = 1$`],
  // --- tf-derivative ---------------------------------------------------------
  [String.raw`נגזר ל-$\\dfrac{1}{\\cos^2 x}$`, String.raw`נגזר לביטוי $\\dfrac{1}{\\cos^2 x}$`],
  [String.raw`שווים יחד ל-$1$`, String.raw`שווים יחד לאחד`],
  [String.raw`הופך ל-$1 + \\cos x$`, String.raw`הופך לביטוי $1 + \\cos x$`],
  // --- tf-investigation ------------------------------------------------------
  [
    String.raw`מתאפסת ב-$\\dfrac{\\pi}{4}$ וגם ב-$\\dfrac{5\\pi}{4}$`,
    String.raw`מתאפסת בזוויות $\\dfrac{\\pi}{4}$ וגם $\\dfrac{5\\pi}{4}$`,
  ],
  [
    String.raw`מקסימום מקומי ב-$\\dfrac{2\\pi}{3}$ ומינימום מקומי ב-$\\dfrac{4\\pi}{3}$`,
    String.raw`מקסימום מקומי בזווית $\\dfrac{2\\pi}{3}$ ומינימום מקומי בזווית $\\dfrac{4\\pi}{3}$`,
  ],
  [String.raw`מקסימום מקומי ב-$\\dfrac{2\\pi}{3}$`, String.raw`מקסימום מקומי בזווית $\\dfrac{2\\pi}{3}$`],
  [String.raw`ומינימום מקומי ב-$\\dfrac{4\\pi}{3}$`, String.raw`ומינימום מקומי בזווית $\\dfrac{4\\pi}{3}$`],
  [String.raw`מ-$\\dfrac{5\\pi}{4}$ עד`, String.raw`מהזווית $\\dfrac{5\\pi}{4}$ עד`],
  // --- tf-integral -----------------------------------------------------------
  [String.raw`הופך אותה ל-$\\sin x$`, String.raw`הופך אותה לביטוי $\\sin x$`],
  [String.raw`ומ-$\\pi$ עד`, String.raw`ומהזווית $\\pi$ עד`],
  [String.raw`לחלוקה ב-$4$ ולא ב-$2$`, String.raw`לחלוקה בארבע ולא בשתיים`],
  [String.raw`$\\sin x$ ו-$\\cos x$`, String.raw`$\\sin x$ וגם $\\cos x$`],
  // --- tf-bagrut -------------------------------------------------------------
  [String.raw`, ו-$\\cos x = -\\dfrac12$ נותן`, String.raw`, ואילו $\\cos x = -\\dfrac12$ נותן`],
  [String.raw`$\\dfrac{\\sqrt3}{3}$ ו-$-\\dfrac{\\sqrt3}{3}$`, String.raw`$\\dfrac{\\sqrt3}{3}$ וגם $-\\dfrac{\\sqrt3}{3}$`],
];

const apply = process.argv.includes('--apply');
for (const file of FILES) {
  let src = readFileSync(file, 'utf8');
  const before = (src.match(/[א-ת]-\$/g) ?? []).length;
  // Longest needle first: a short pair that is the tail of a longer one would
  // consume it and leave the specific fix unmatched.
  for (const [from, to] of [...PAIRS].sort((a, b) => b[0].length - a[0].length)) {
    const n = src.split(from).length - 1;
    if (n === 0) console.log(`  (no match) ${from.slice(0, 40)}`);
    src = src.split(from).join(to);
  }
  const after = (src.match(/[א-ת]-\$/g) ?? []).length;
  console.log(`${file}: maqaf ${before} -> ${after}`);
  if (apply) writeFileSync(file, src, 'utf8');
}
console.log(apply ? 'written.' : 'dry run — nothing written.');

export {};
