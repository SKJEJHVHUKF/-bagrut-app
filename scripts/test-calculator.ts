// Self-check for lib/calculator.ts — the two parts of the floating calculator
// that fail SILENTLY (a wrong number still looks like a number):
//   1. degree mode, which works by shadowing mathjs's radian trig in the
//      evaluate() scope. If shadowing ever stops working, sin(30) becomes
//      -0.988 and every student's angle answer is wrong with no error.
//   2. the display mapping, which must run in one pass — a cascade would
//      rewrite log10( → log( → ln( and show base-10 logs as natural logs.
// Run: npx tsx scripts/test-calculator.ts
import { clampToViewport, display, evaluateExpr } from '../lib/calculator';

let fails = 0;
const ok = (name: string, cond: boolean) => {
  if (!cond) {
    fails++;
    console.error(`FAIL ${name}`);
  }
};

// --- display -------------------------------------------------------------
ok('ln vs log do not cascade', display('log(2)+log10(100)') === 'ln(2)+log(100)');
ok('inverse trig before trig', display('asin(0.5)+sin(30)') === 'sin⁻¹(0.5)+sin(30)');
ok('sqrt/pi/ans/operators', display('sqrt(pi)*ans/2') === '√(π)×Ans÷2');
ok('atan is not read as a·tan', display('atan(1)') === 'tan⁻¹(1)');
ok('empty stays empty', display('') === '');
ok('nCr / nPr', display('combinations(5,2)+permutations(5,2)') === 'nCr(5,2)+nPr(5,2)');

// --- clampToViewport (the drag) -----------------------------------------
const VP = { w: 1280, h: 720 };
const SZ = { w: 300, h: 470 };
const c = (x: number, y: number, vp = VP, sz = SZ) => clampToViewport({ x, y }, sz, vp);
ok('a position already inside is untouched', JSON.stringify(c(400, 100)) === '{"x":400,"y":100}');
ok('dragged off the right comes back', c(5000, 100).x === 1280 - 300 - 8);
ok('dragged off the bottom comes back', c(400, 5000).y === 720 - 470 - 8);
ok('dragged off the top-left comes back', JSON.stringify(c(-500, -500)) === '{"x":8,"y":8}');
// A panel taller than the viewport must stay pinned to the TOP: pushed off the
// top instead, its header — the only drag handle — becomes unreachable.
ok('taller than the viewport pins to the top', c(20, 300, { w: 360, h: 400 }).y === 8);
ok('wider than the viewport pins to the left', c(300, 20, { w: 260, h: 900 }).x === 8);

async function run() {
  const val = async (expr: string, mode: 'deg' | 'rad' = 'deg', ans: unknown = 0) => {
    const r = await evaluateExpr(expr, mode, ans);
    return r && r.ok ? r.text : r === null ? '<null>' : '<err>';
  };

  // --- degrees (the whole point of a bagrut calculator) --------------------
  ok('sin(30°) = 0.5', (await val('sin(30)')) === '0.5');
  ok('cos(60°) = 0.5', (await val('cos(60)')) === '0.5');
  ok('tan(45°) = 1', (await val('tan(45)')) === '1');
  ok('sin(180°) snaps to 0, not 1.2e-16', (await val('sin(180)')) === '0');
  ok('asin(0.5) = 30°', (await val('asin(0.5)')) === '30');
  ok('atan(1) = 45°', (await val('atan(1)')) === '45');
  ok('nested trig stays in degrees', (await val('sin(90)+cos(0)')) === '2');

  // --- radians ------------------------------------------------------------
  ok('RAD sin(pi/2) = 1', (await val('sin(pi/2)', 'rad')) === '1');
  ok('RAD sin(30) is NOT 0.5', (await val('sin(30)', 'rad')) !== '0.5');

  // --- the rest of the keypad --------------------------------------------
  ok('ln(e) = 1', (await val('log(e)')) === '1');
  ok('log10(1000) = 3', (await val('log10(1000)')) === '3');
  ok('sqrt(9) = 3', (await val('sqrt(9)')) === '3');
  ok('2^10 = 1024', (await val('2^10')) === '1024');
  ok('x² key: 7^2 = 49', (await val('7^2')) === '49');
  ok('5! = 120', (await val('5!')) === '120');
  ok('nCr(5,2) = 10', (await val('combinations(5,2)')) === '10');
  ok('nPr(5,2) = 20', (await val('permutations(5,2)')) === '20');
  ok('nCr auto-closes too', (await val('combinations(6,3')) === '20');
  ok('float noise is formatted away', (await val('0.1+0.2')) === '0.3');
  ok('sqrt(-1) = i (5-unit students meet complex numbers)', (await val('sqrt(-1)')) === 'i');
  ok('Ans carries the last result', (await val('ans*2', 'deg', 21)) === '42');

  // --- failure modes must not throw --------------------------------------
  ok('half-typed expression → error', (await val('2+')) === '<err>');
  ok('open paren auto-closes on = (sin(30 → 0.5)', (await val('sin(30')) === '0.5');
  ok('auto-close handles nesting', (await val('sqrt(sin(30')) !== '<err>');
  ok('auto-close never invents an opener', (await val(')(')) === '<err>');
  ok('empty function call → error', (await val('sin()')) === '<err>');
  ok('empty display → null, not an error', (await val('')) === '<null>');
  ok('1/0 → error, never Infinity on the display', (await val('1/0')) === '<err>');

  if (fails) process.exit(1);
  console.log('test-calculator: all checks passed');
}
void run();
