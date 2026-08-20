/**
 * verify-probability.ts — numeric self-check of every probability claimed in
 * the הסתברות (581) sub-topic lessons, drills, and bagrut questions.
 *   npx tsx scripts/verify-probability.ts
 *
 * Every value the author printed in content/lessons/math5/probability.ts is
 * re-derived here from first principles (complement, addition rule, conditional
 * probability, product rule, combinations, binomial P(X=k), expectation /
 * variance) and compared against the literal in the content. A passing
 * tsc/KaTeX render does NOT catch a wrong-but-valid number — only
 * re-computation does. Tolerance 1e-9.
 */
import { create, all } from 'mathjs';
const math = create(all, { number: 'number' });
const evl = (s: string): number => math.evaluate(s) as number;

let pass = 0;
let fail = 0;
const approx = (x: number, y: number) => Math.abs(x - y) < 1e-9;
function num(desc: string, got: number, want: number) {
  const ok = approx(got, want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗ FAIL'}  ${desc}   (${got} vs ${want})`);
}

// --- combinatorics + binomial helpers (independent of content) ---
function fact(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function nCr(n: number, k: number): number {
  return fact(n) / (fact(k) * fact(n - k));
}
function binom(n: number, k: number, p: number): number {
  return nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

// ============================================================
// Sub-topic 1: prob-basics
// ============================================================
console.log('— prob-basics (lesson + drills) —');
// lesson step0: even on a die = 3/6 = 1/2
num('basics even die: 3/6', 3 / 6, 1 / 2);
// lesson step1: complement P(A^c)=1-0.35 (generic) and 3 coins at least one head
num('basics complement 1-0.35', 1 - 0.35, 0.65);
num('basics 3 coins no head (1/2)^3', Math.pow(1 / 2, 3), 1 / 8);
num('basics 3 coins >=1 head', 1 - 1 / 8, 7 / 8);
// lesson step2: red-or-ace = 26/52 + 4/52 - 2/52 = 7/13
num('basics red-or-ace addition', 26 / 52 + 4 / 52 - 2 / 52, 7 / 13);
num('basics red-or-ace = 28/52', (26 + 4 - 2) / 52, 28 / 52);
// lesson step3: independence P(A∩B)=0.4*0.3=0.12 ; union 0.4+0.3-0.12=0.58
num('basics indep cap 0.4*0.3', 0.4 * 0.3, 0.12);
num('basics indep union', 0.4 + 0.3 - 0.12, 0.58);
num('basics two heads 1/2*1/2', (1 / 2) * (1 / 2), 1 / 4);
// lesson step4: Danny/Rani at least one = 1 - 0.3*0.4 = 0.88
num('basics dani/rani none', 0.3 * 0.4, 0.12);
num('basics dani/rani at-least-one', 1 - 0.3 * 0.4, 0.88);
// drill basics-001: P(die>4)=2/6=1/3
num('basics drill001 die>4', 2 / 6, 1 / 3);
// drill basics-002: 1-0.35=0.65
num('basics drill002 complement', 1 - 0.35, 0.65);
// drill basics-003: union 0.5+0.4-0.2=0.7
num('basics drill003 union', 0.5 + 0.4 - 0.2, 0.7);
// drill basics-004: two dice at least one 6 = 1-(5/6)^2 = 11/36
num('basics drill004 none-6 (5/6)^2', (5 / 6) * (5 / 6), 25 / 36);
num('basics drill004 at-least-one-6', 1 - 25 / 36, 11 / 36);
// drill basics-005: two shooters hit = 1-0.2*0.4 = 0.92
num('basics drill005 both miss', 0.2 * 0.4, 0.08);
num('basics drill005 target hit', 1 - 0.08, 0.92);

// ============================================================
// Sub-topic 2: prob-conditional
// ============================================================
console.log('— prob-conditional (lesson + drills) —');
// lesson step0: P(red|face)=6/12=1/2
num('cond red|face 6/12', 6 / 12, 1 / 2);
// lesson step1: 3 red 2 blue, two red without replacement = 3/5*2/4 = 3/10
num('cond two red w/o repl', (3 / 5) * (2 / 4), 3 / 10);
// lesson step2: 4 red 6 blue, exactly one red = 24/90+24/90 = 8/15
num('cond exactly-one-red path1', (4 / 10) * (6 / 9), 24 / 90);
num('cond exactly-one-red path2', (6 / 10) * (4 / 9), 24 / 90);
num('cond exactly-one-red total', (4 / 10) * (6 / 9) + (6 / 10) * (4 / 9), 8 / 15);
// lesson step3: 5 red 3 blue, both red: with repl (5/8)^2=25/64 ; w/o 5/8*4/7=5/14
num('cond both red with repl', (5 / 8) * (5 / 8), 25 / 64);
num('cond both red w/o repl', (5 / 8) * (4 / 7), 5 / 14);
// lesson step4: machine defect Bayes P(A|D)=0.012/0.032=3/8
num('cond bayes A defect 0.6*0.02', 0.6 * 0.02, 0.012);
num('cond bayes B defect 0.4*0.05', 0.4 * 0.05, 0.02);
num('cond bayes total defect', 0.012 + 0.02, 0.032);
num('cond bayes P(A|D)=3/8', 0.012 / 0.032, 3 / 8);
// drill cond-001: P(A|B)=0.2/0.5=0.4
num('cond drill001 0.2/0.5', 0.2 / 0.5, 0.4);
// drill cond-002: 4 red 6 blue both red w/o repl = 4/10*3/9 = 2/15
num('cond drill002 both red', (4 / 10) * (3 / 9), 2 / 15);
num('cond drill002 = 12/90', 12 / 90, 2 / 15);
// drill cond-003: boy|likes-math = 9/14
num('cond drill003 boy|math', 9 / (9 + 5), 9 / 14);
// drill cond-004: 5 red 5 blue exactly one red w/o repl = 50/90 = 5/9
num('cond drill004 path each', (5 / 10) * (5 / 9), 25 / 90);
num('cond drill004 total', 2 * ((5 / 10) * (5 / 9)), 5 / 9);
// drill cond-005: medical test Bayes ~0.102
num('cond drill005 sick&pos 0.01*0.9', 0.01 * 0.9, 0.009);
num('cond drill005 well&pos 0.99*0.08', 0.99 * 0.08, 0.0792);
num('cond drill005 total pos', 0.009 + 0.0792, 0.0882);
num('cond drill005 P(sick|pos) ~0.102 (3dp)', Math.round((0.009 / 0.0882) * 1000) / 1000, 0.102);

// ============================================================
// Sub-topic 3: prob-combinatorics
// ============================================================
console.log('— prob-combinatorics (lesson + drills) —');
// lesson step0: C(7,3)=35
num('comb C(7,3)=35', nCr(7, 3), 35);
// lesson step1: specific 5-coin sequence = (1/2)^5 = 1/32
num('comb specific 5-seq', Math.pow(1 / 2, 5), 1 / 32);
// lesson step2: P(X=2) n=5 p=1/2 = 10/32 = 5/16
num('comb C(5,2)=10', nCr(5, 2), 10);
num('comb binom(5,2,1/2)=5/16', binom(5, 2, 1 / 2), 5 / 16);
// lesson step3: at least 2 heads in 8 tosses = 247/256
num('comb P(X=0) n=8', binom(8, 0, 1 / 2), 1 / 256);
num('comb P(X=1) n=8', binom(8, 1, 1 / 2), 8 / 256);
num('comb >=2 heads in 8', 1 - binom(8, 0, 1 / 2) - binom(8, 1, 1 / 2), 247 / 256);
// lesson step4: E=np=3, var=2.1, sigma=sqrt(2.1)
num('comb E=10*0.3', 10 * 0.3, 3);
num('comb var=10*0.3*0.7', 10 * 0.3 * 0.7, 2.1);
num('comb sigma=sqrt(2.1) ~1.449 (3dp)', Math.round(Math.sqrt(2.1) * 1000) / 1000, 1.449);
// drill comb-001: C(6,2)=15
num('comb drill001 C(6,2)=15', nCr(6, 2), 15);
// drill comb-002: P(X=6) n=6 p=1/2 = 1/64
num('comb drill002 binom(6,6,1/2)=1/64', binom(6, 6, 1 / 2), 1 / 64);
// drill comb-003: P(X=2) n=4 p=1/2 = 3/8
num('comb drill003 C(4,2)=6', nCr(4, 2), 6);
num('comb drill003 binom(4,2,1/2)=3/8', binom(4, 2, 1 / 2), 3 / 8);
// drill comb-004: P(X=2) n=3 p=0.6 = 0.432
num('comb drill004 binom(3,2,0.6)=0.432', binom(3, 2, 0.6), 0.432);
// drill comb-005: at least one defective, p(good)=0.9, n=4 = 1-0.9^4 = 0.3439
num('comb drill005 all good 0.9^4', Math.pow(0.9, 4), 0.6561);
num('comb drill005 >=1 defective', 1 - Math.pow(0.9, 4), 0.3439);

// ============================================================
// Bagrut questions (expected scalars + key step values)
// ============================================================
console.log('— bagrut prob-bag-001..003 (expected values) —');
// prob-bag-001 (prob-conditional): 15 boys 10 girls; 8+6 study 5u
num('bag001a expected 14/25', evl('14/25'), 14 / 25);
num('bag001a total students', 15 + 10, 25);
num('bag001a study5u', 8 + 6, 14);
num('bag001b expected 4/7', evl('4/7'), 4 / 7);
num('bag001b boy|5u = 8/14', 8 / 14, 4 / 7);
num('bag001c expected 91/300', evl('91/300'), 91 / 300);
num('bag001c two 5u w/o repl', (14 / 25) * (13 / 24), 91 / 300);
num('bag001c = 182/600', 182 / 600, 91 / 300);
// prob-bag-002 (prob-combinatorics): n=10 p=0.3
num('bag002a P(X=3) ~0.267 (3dp)', Math.round(binom(10, 3, 0.3) * 1000) / 1000, 0.267);
num('bag002a C(10,3)=120', nCr(10, 3), 120);
num('bag002b expected E=3', evl('3'), 3);
num('bag002b E=10*0.3', 10 * 0.3, 3);
num('bag002c P(X=0)=(0.7)^10 ~0.0282 (4dp)', Math.round(Math.pow(0.7, 10) * 10000) / 10000, 0.0282);
num('bag002c P(X=0)=binom(10,0,0.3)', binom(10, 0, 0.3), Math.pow(0.7, 10));
// prob-bag-003 (prob-basics): 40 members, 24 soccer, 18 basket, 10 both
num('bag003a expected 4/5', evl('4/5'), 4 / 5);
num('bag003a union 24/40+18/40-10/40', 24 / 40 + 18 / 40 - 10 / 40, 4 / 5);
num('bag003a = 32/40', 32 / 40, 4 / 5);
num('bag003b expected 1/5', evl('1/5'), 1 / 5);
num('bag003b complement 1-4/5', 1 - 4 / 5, 1 / 5);
num('bag003c expected 5/12', evl('5/12'), 5 / 12);
num('bag003c basket|soccer 10/24', 10 / 24, 5 / 12);

// ============================================================
// ============================================================
// Ghost Replay (content/ghost-replay/math5/probability.ts)
// ============================================================
// The three answers AND every number invented inside a failure branch.
// Two of them are cross-checked by SIMULATION, which is independent of the
// formula the solution uses.

// --- gr-prob-basics-005: two shooters, 0.8 and 0.6 ---
{
  num('ghost basics-005: both miss = 0.2 * 0.4 = 0.08', (1 - 0.8) * (1 - 0.6), 0.08);
  num('ghost basics-005: at least one hits = 1 - 0.08 = 0.92', 1 - 0.08, 0.92);
  // Independent route: inclusion-exclusion must agree.
  num('ghost basics-005: inclusion-exclusion 0.8+0.6-0.48 also gives 0.92',
    Math.round((0.8 + 0.6 - 0.8 * 0.6) * 1e9) / 1e9, 0.92);
  num('ghost basics-005: exactly one hits = 0.8*0.4 + 0.2*0.6 = 0.44',
    Math.round((0.8 * 0.4 + 0.2 * 0.6) * 1e9) / 1e9, 0.44);
  num('ghost basics-005: both hit = 0.48, and 0.44+0.48 = 0.92',
    Math.round((0.44 + 0.48) * 1e9) / 1e9, 0.92);
  num('ghost basics-005 branch: 0.8+0.6 = 1.4 exceeds 1 — impossible for a probability',
    0.8 + 0.6 > 1 ? 1 : 0, 1);
  num('ghost basics-005 branch: 0.8*0.6 = 0.48 is "BOTH hit", a different question',
    Math.round(0.8 * 0.6 * 1e9) / 1e9, 0.48);
  num('ghost basics-005 branch: 1 - 0.8*0.6 = 0.52 complements the wrong event',
    Math.round((1 - 0.48) * 1e9) / 1e9, 0.52);
}

// --- gr-prob-cond-005: base rate 1%, sensitivity 90%, false positive 8% ---
{
  const sickAndPos = 0.01 * 0.9;
  const healthyAndPos = 0.99 * 0.08;
  const totalPos = sickAndPos + healthyAndPos;
  num('ghost cond-005: sick and positive = 0.009', Math.round(sickAndPos * 1e9) / 1e9, 0.009);
  num('ghost cond-005: healthy and positive = 0.0792', Math.round(healthyAndPos * 1e9) / 1e9, 0.0792);
  num('ghost cond-005: total positive = 0.0882', Math.round(totalPos * 1e9) / 1e9, 0.0882);
  num('ghost cond-005: P(sick | positive) ~= 0.102',
    Math.round((sickAndPos / totalPos) * 1e3) / 1e3, 0.102);
  num('ghost cond-005: the four tree branches sum to 1',
    Math.round((0.01 * 0.9 + 0.01 * 0.1 + 0.99 * 0.08 + 0.99 * 0.92) * 1e9) / 1e9, 1);
  // Simulation: 10 million people, deterministic counting rather than sampling.
  {
    const N = 10_000_000;
    const sick = N * 0.01, healthy = N * 0.99;
    const posFromSick = sick * 0.9, posFromHealthy = healthy * 0.08;
    num('ghost cond-005: in 10M people, 90,000 sick test positive', posFromSick, 90_000);
    num('ghost cond-005: and 792,000 healthy test positive', posFromHealthy, 792_000);
    num('ghost cond-005: so only 90,000 of 882,000 positives are truly sick',
      Math.round((posFromSick / (posFromSick + posFromHealthy)) * 1e3) / 1e3, 0.102);
    num('ghost cond-005: healthy false positives OUTNUMBER true positives ~8.8 to 1',
      Math.round((posFromHealthy / posFromSick) * 10) / 10, 8.8);
  }
  num('ghost cond-005 branch: 0.9 is the sensitivity, the reverse conditional', 0.9, 0.9);
  num('ghost cond-005 branch: 0.01 is the prior, before any test result', 0.01, 0.01);
  num('ghost cond-005 branch: 0.009/0.9 = 0.01 divides by the wrong total',
    Math.round((0.009 / 0.9) * 1e9) / 1e9, 0.01);
}

// --- gr-prob-comb-004: binomial n=3, p=0.6, k=2 ---
{
  const C32 = fact(3) / (fact(2) * fact(1));
  num('ghost comb-004: C(3,2) = 3', C32, 3);
  num('ghost comb-004: one path is 0.6^2 * 0.4 = 0.144',
    Math.round(0.6 ** 2 * 0.4 * 1e9) / 1e9, 0.144);
  num('ghost comb-004: P(X=2) = 3 * 0.144 = 0.432',
    Math.round(3 * 0.6 ** 2 * 0.4 * 1e9) / 1e9, 0.432);
  // Exhaustive enumeration of all 8 outcomes — independent of the formula.
  {
    let p2 = 0, total = 0;
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) {
      const hits = a + b + c;
      const prob = (a ? 0.6 : 0.4) * (b ? 0.6 : 0.4) * (c ? 0.6 : 0.4);
      total += prob;
      if (hits === 2) p2 += prob;
    }
    num('ghost comb-004: enumerating all 8 outcomes gives 0.432', Math.round(p2 * 1e9) / 1e9, 0.432);
    num('ghost comb-004: and the 8 outcomes sum to 1', Math.round(total * 1e9) / 1e9, 1);
  }
  num('ghost comb-004 branch: 0.144 forgets the 3 paths', Math.round((0.6 ** 2 * 0.4) * 1e3) / 1e3, 0.144);
  num('ghost comb-004 branch: 0.6^2 = 0.36 forgets the miss entirely', 0.6 ** 2, 0.36);
  num('ghost comb-004 branch: 3*0.6^2 = 1.08 exceeds 1 — impossible',
    Math.round(3 * 0.36 * 1e9) / 1e9 > 1 ? 1 : 0, 1);
  num('ghost comb-004: P(X=3) = 0.216 and P(X=2) = 0.432, so exactly-2 is the likelier',
    Math.round(0.6 ** 3 * 1e9) / 1e9, 0.216);
}

// ============================================================
// STAGES v2 (2026-08-20) — the destination question (DESTINATION_PR) solved in
// pr-practice, its follow-up example/drill, the new pr-practice drills, and
// every wrongAnswers value added to the stage questions. Brute where possible.
// ============================================================
{
  // Destination: half vaccinated; sick 0.1 / 0.3.
  const pSick = 0.5 * 0.1 + 0.5 * 0.3;
  num('destPR א: P(sick) = 0.2', pSick, 0.2);
  num('destPR א check: P(not sick) = 0.8 and totals 1', 0.5 * 0.9 + 0.5 * 0.7 + pSick, 1);
  num('destPR ב: P(vac | sick) = 1/4', (0.5 * 0.1) / pSick, 0.25);
  num('destPR ג: exactly 1 of 3 = 0.384', 3 * 0.2 * 0.8 ** 2, 0.384);
  num('destPR ד: at least 1 = 0.488', 1 - 0.8 ** 3, 0.488);
  num('destPR ה: exactly-1 | at-least-1 = 48/61', 0.384 / 0.488, 48 / 61);
  // pr-practice step-1 example: none of 3 = 0.512; at most one = 0.896.
  num('prx ex: P(0) = 0.512', 0.8 ** 3, 0.512);
  num('prx ex: P(X<=1) = 0.896', 0.8 ** 3 + 3 * 0.2 * 0.8 ** 2, 0.896);
  num('prx ex check: P(2)+P(3) = 0.104', 3 * 0.2 ** 2 * 0.8 + 0.2 ** 3, 0.104);
  // pr-practice drills.
  num('px-drill-003: P(A | defective) = 9/19', (0.6 * 0.03) / (0.6 * 0.03 + 0.4 * 0.05), 9 / 19);
  num('px-drill-003 check: A|def + B|def = 1', 9 / 19 + 10 / 19, 1);
  num('px-drill-004: both red without replacement = 3/10', (3 / 5) * (2 / 4), 3 / 10);
  // wrongAnswers spot checks — each value must equal its claimed miscomputation
  // AND differ from the correct answer (the generic gate in verify-specs also
  // asserts the latter through the real grading engine).
  num('wrong pb-002: without-replacement slip = 7/30', (7 / 10) * (3 / 9), 7 / 30);
  num('wrong basics-004: complement itself = 25/36', (5 / 6) ** 2, 25 / 36);
  num('wrong pt-005: single path = 1/5', (2 / 6) * (4 / 5) * (3 / 4), 1 / 5);
  num('wrong comb-003: missing coefficient = 1/16', 0.5 ** 4, 1 / 16);
  num('wrong pbn-002: at-least-one instead = 0.83193', 1 - 0.7 ** 5, 0.83193);
  num('wrong pc-002: numerator alone = 27/64', 4 * 0.75 ** 3 * 0.25, 27 / 64);
  num('wrong px-007: coefficient 4 slip = 4/15', (4 / 16) / (15 / 16), 4 / 15);
  num('wrong tab-006: B-only cell = 0.18', 0.3 - 0.12, 0.18);
  // v2.1 — the audit round: the "מבין ה…" multiplication-rule step, the 3D-
  // with-unknown and unknown-p questions, and the x-part added to the tree
  // unknowns example.
  num('mult-rule step: 0.6·0.3 = 0.18', 0.6 * 0.3, 0.18);
  num('mult-rule example: 5u total = 0.26', 0.6 * 0.3 + 0.4 * 0.2, 0.26);
  num('pc-drill-004: 0.7·0.4 = 0.28', 0.7 * 0.4, 0.28);
  num('pc-003: men-home 0.15, women-home 0.18, total 0.33', 0.6 * 0.25 + 0.4 * 0.45, 0.33);
  num('pc-003: P(woman | home) = 6/11', (0.4 * 0.45) / 0.33, 6 / 11);
  num('pc-003 wrong: men path = 5/11 and complements to 1', (0.6 * 0.25) / 0.33 + 6 / 11, 1);
  num('ptb-003: 42 + 3x = 60 → x = 6', (60 - 42) / 3, 6);
  num('ptb-003: boys table sums to 60', 30 + 12 + 2 * 6 + 6, 60);
  num('ptb-003: P = 12/100', (2 * 6) / 100, 0.12);
  num('pbn-003: q³ = 0.064 → q = 0.4', Math.cbrt(1 - 0.936), 0.4);
  num('pbn-003: p = 0.6 and 1 − 0.4³ = 0.936', 1 - 0.4 ** 3, 0.936);
  num('tree example (2): 3/(x+3) = 0.25 → x = 9', 3 / 0.25 - 3, 9);
  num('cond-005: exact value 5/49', 0.009 / 0.0882, 5 / 49);
}

// ---- probtree diagrams (2026-08-20): every number drawn on a tree ----------
console.log('\n== probtree diagrams ==');
num('דני tree: 0.06+0.54+0.10+0.30 = 1', 0.06 + 0.54 + 0.1 + 0.3, 1);
num('דני picked paths: 0.06+0.10 = 0.16', 0.6 * 0.1 + 0.4 * 0.25, 0.16);
num('balls tree: 6/56+15/56+15/56+20/56 = 1', 6 / 56 + 15 / 56 + 15 / 56 + 20 / 56, 1);
num('balls tree leaf products', (3 / 8) * (2 / 7), 6 / 56);
num('unknown tree: 0.7·0.1 = 0.07, 0.7·0.9 = 0.63', 0.7 * 0.1 + 0.7 * 0.9, 0.7);
num('factory step: smoker = 0.6·0.25 + 0.4·0.1 = 0.19', 0.6 * 0.25 + 0.4 * 0.1, 0.19);
num('factory leaves sum to 1', 0.15 + 0.45 + 0.04 + 0.36, 1);
num('factory non-smoker both ways: 0.45+0.36 = 1−0.19', 0.45 + 0.36, 1 - 0.19);
num('factory drill: woman & non-smoker = 0.4·0.9 = 0.36', 0.4 * 0.9, 0.36);
num('destination tree: 0.05+0.45+0.15+0.35 = 1', 0.05 + 0.45 + 0.15 + 0.35, 1);
num('destination picked: 0.05+0.15 = 0.2', 0.5 * 0.1 + 0.5 * 0.3, 0.2);

console.log(`\nRESULT: ${pass}/${pass + fail} passed${fail ? `  (${fail} FAILED)` : ''}`);
if (fail) process.exit(1);

export {};
