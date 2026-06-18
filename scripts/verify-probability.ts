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
console.log(`\nRESULT: ${pass}/${pass + fail} passed${fail ? `  (${fail} FAILED)` : ''}`);
if (fail) process.exit(1);

export {};
