// Engine for the floating scientific calculator on the study pages.
// Button presses build a mathjs expression string; this module renders that
// string for the display and evaluates it. mathjs is imported LAZILY — the
// trigger is mounted on every study page (via FormulaSheet) and most sessions
// never open the calculator, so the parser must not sit in first-load JS.

export type AngleMode = 'deg' | 'rad';

// Raw token → what the student sees. Applied in ONE pass over the string:
// a cascade of separate .replace() calls would rewrite `log10(` to `log(`
// and then that result to `ln(`, so every base-10 log would display as ln.
// A function replacer also sidesteps `$&`/`$1` being read out of the
// replacement text.
const PRETTY: Record<string, string> = {
  'log10(': 'log(',
  'log(': 'ln(', // mathjs `log` IS the natural log (same convention as lib/answer-check.ts)
  'asin(': 'sin⁻¹(',
  'acos(': 'cos⁻¹(',
  'atan(': 'tan⁻¹(',
  'sqrt(': '√(',
  'combinations(': 'nCr(',
  'permutations(': 'nPr(',
  pi: 'π',
  ans: 'Ans',
  '*': '×',
  '/': '÷',
};
const PRETTY_RE =
  /log10\(|log\(|asin\(|acos\(|atan\(|sqrt\(|combinations\(|permutations\(|pi|ans|\*|\//g;

/** The expression as the student should read it on the calculator display. */
export function display(expr: string): string {
  return expr.replace(PRETTY_RE, (t) => PRETTY[t]);
}

/** Keep a dragged panel fully on screen. Pure so it can be tested without a
 *  DOM: pass the panel size and the viewport size explicitly. When the panel
 *  is TALLER than the viewport (a short landscape phone) the max clamp goes
 *  below the min, so the min has to win — otherwise the panel is pushed off
 *  the top and its header, the only way to drag it back, is unreachable. */
export function clampToViewport(
  p: { x: number; y: number },
  size: { w: number; h: number },
  vp: { w: number; h: number },
  margin = 8,
): { x: number; y: number } {
  const axis = (v: number, s: number, limit: number) =>
    Math.max(margin, Math.min(v, Math.max(margin, limit - s - margin)));
  return { x: axis(p.x, size.w, vp.w), y: axis(p.y, size.h, vp.h) };
}

const RAD_PER_DEG = Math.PI / 180;

/** Degree-mode trig. Passed as evaluate() scope, which SHADOWS mathjs's own
 *  radian built-ins — verified in scripts/test-calculator.ts, because the
 *  whole degree mode is silently wrong if shadowing ever stops working. */
function degScope() {
  return {
    sin: (x: number) => Math.sin(x * RAD_PER_DEG),
    cos: (x: number) => Math.cos(x * RAD_PER_DEG),
    tan: (x: number) => Math.tan(x * RAD_PER_DEG),
    asin: (x: number) => Math.asin(x) / RAD_PER_DEG,
    acos: (x: number) => Math.acos(x) / RAD_PER_DEG,
    atan: (x: number) => Math.atan(x) / RAD_PER_DEG,
  };
}

/** Close the parentheses the student left open. Every real calculator does
 *  this on `=`, and typing `sin(30` and pressing equals is by far the most
 *  common way a bagrut student enters an angle. Counting characters is safe
 *  here: the keypad is the only input, so no string literal can contain one. */
function balance(expr: string): string {
  const depth = (expr.match(/\(/g) ?? []).length - (expr.match(/\)/g) ?? []).length;
  return depth > 0 ? expr + ')'.repeat(depth) : expr;
}

export type CalcResult =
  | { ok: true; text: string; value: unknown }
  | { ok: false };

let mathPromise: Promise<typeof import('mathjs')> | null = null;
const loadMath = () => (mathPromise ??= import('mathjs'));

/** Evaluate the raw expression. `null` = nothing to evaluate (empty display).
 *  `{ ok: false }` = the student typed something the parser rejects — the UI
 *  shows שגיאה rather than throwing. */
export async function evaluateExpr(
  expr: string,
  mode: AngleMode,
  ans: unknown,
): Promise<CalcResult | null> {
  if (!expr.trim()) return null;
  const math = await loadMath();
  try {
    const scope: Record<string, unknown> = { ans: ans ?? 0 };
    if (mode === 'deg') Object.assign(scope, degScope());
    let value: unknown = math.evaluate(balance(expr), scope);

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return { ok: false };
      // ponytail: snap float dust to zero the way every real calculator does
      // — in degrees sin(180) is 1.22e-16, and a student reading that on a
      // bagrut question has no idea what it means. Upgrade to a relative
      // epsilon if a legitimately tiny result ever has to survive.
      if (Math.abs(value) < 1e-12) value = 0;
    } else if (!math.isComplex(value) && !math.isBigNumber(value) && !math.isFraction(value)) {
      // The keypad cannot produce a unit/matrix/function, but evaluate() can
      // return one; formatting it would print something meaningless.
      return { ok: false };
    }

    return { ok: true, text: math.format(value, { precision: 12 }), value };
  } catch {
    return { ok: false };
  }
}
