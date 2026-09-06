/**
 * build-shape-model.ts — learn "what SHAPE of question is this?" from the bank.
 *
 *   npx tsx scripts/build-shape-model.ts            train, report, write
 *   npx tsx scripts/build-shape-model.ts --dry      report only
 *   npx tsx scripts/build-shape-model.ts --vocab N  keep N tokens (default 2500)
 *
 * FREE. Content plus arithmetic; no model call, no network.
 *
 * ============================================================
 * WHY THIS AND NOT MORE REGEX RULES
 * ============================================================
 * `lib/tutor-intent` classifies a message by hand-written anchored rules. It is
 * right to be strict — it decides whether to SERVE something — but as a reader
 * of "what did the student mean" it is thin, and the bank says so. Measured
 * over all 77,098 authored phrasings, each already labelled with its entry's
 * `kind` by the person who wrote it:
 *
 *     bank kind     classified by the rules     agrees with the label
 *     why-step              51%                        76%
 *     where-from            64%                        52%
 *     why-not               56%                        29%
 *     concept               42%                        35%
 *     check                 66%                        75%
 *     mistake               45%                        47%
 *     what-if               40%                        83%
 *
 * Half the phrasings match no rule at all, and `why-not` — "why isn't it X" —
 * is read as `why_this_step` more often than as itself. Gating the matcher on
 * that would suppress correct answers about as often as wrong ones. Hebrew has
 * more ways to ask "why not" than a list holds; this is the same lesson the
 * ask-classifier learned, one level up.
 *
 * But the labels exist. 77,098 phrasings, hand-written by people who knew which
 * of eight shapes each one was. That is a training set, and a multinomial Naive
 * Bayes over the SAME tokeniser the matcher uses is forty lines of arithmetic,
 * needs no model at runtime, and generalises to phrasings nobody enumerated —
 * which is the entire point.
 *
 * ============================================================
 * HELD OUT BY ENTRY, NEVER BY PHRASING
 * ============================================================
 * An entry's `alts` are deliberate near-duplicates of its `q`. Splitting on
 * phrasings puts a sentence's own paraphrase in the training set and reports an
 * accuracy that no student will ever see. The split here is on the ENTRY, so
 * every held-out phrasing belongs to an entry the model never read.
 */

import { writeFileSync } from 'node:fs';
import { faqBankKeys, loadFaqBank } from '../content/tutor-faq';
import { shapeFeatures } from '../lib/question-shape';

const DRY = process.argv.includes('--dry');
const VOCAB = Number(process.argv[process.argv.indexOf('--vocab') + 1]) || 2500;
const MINDF = Number(process.argv[process.argv.indexOf('--mindf') + 1]) || 15;

/** `other` is a catch-all with no shared shape — training on it only adds noise. */
const KINDS = ['why-step', 'where-from', 'why-not', 'what-if', 'concept', 'mistake', 'check'] as const;
type Kind = (typeof KINDS)[number];

type Row = { kind: Kind; toks: string[] };

/** Deterministic hold-out: every 7th entry, so a rerun reports the same number. */
const HELD = 7;

async function collect(): Promise<{ train: Row[]; test: Row[] }> {
  const train: Row[] = [];
  const test: Row[] = [];
  let seen = 0;
  for (const [subject, topic] of faqBankKeys()) {
    const bank = await loadFaqBank(subject, topic);
    if (!bank) continue;
    for (const list of Object.values(bank)) {
      for (const f of list) {
        if (!(KINDS as readonly string[]).includes(f.kind)) continue;
        const into = seen++ % HELD === 0 ? test : train;
        for (const phrasing of [f.q, ...f.alts]) {
          const toks = shapeFeatures(phrasing);
          if (toks.length) into.push({ kind: f.kind as Kind, toks });
        }
      }
    }
  }
  return { train, test };
}

/**
 * Multinomial Naive Bayes with add-1 smoothing, on token SETS.
 *
 * Sets and not counts: a student typing "למה למה למה" has asked once. The
 * matcher treats a phrasing as a set for the same reason.
 */
function train(rows: Row[], vocab: Set<string>) {
  const prior = new Map<Kind, number>();
  const count = new Map<Kind, Map<string, number>>();
  const totalPerKind = new Map<Kind, number>();
  for (const k of KINDS) { prior.set(k, 0); count.set(k, new Map()); totalPerKind.set(k, 0); }
  for (const r of rows) {
    prior.set(r.kind, prior.get(r.kind)! + 1);
    const c = count.get(r.kind)!;
    for (const t of new Set(r.toks)) {
      if (!vocab.has(t)) continue;
      c.set(t, (c.get(t) ?? 0) + 1);
      totalPerKind.set(r.kind, totalPerKind.get(r.kind)! + 1);
    }
  }
  const n = rows.length;
  const V = vocab.size;
  // logP(token | kind), and logP(kind).
  const weights = new Map<string, number[]>();
  for (const t of vocab) {
    weights.set(
      t,
      KINDS.map((k) => Math.log((count.get(k)!.get(t) ?? 0) + 1) - Math.log(totalPerKind.get(k)! + V)),
    );
  }
  const base = KINDS.map((k) => Math.log((prior.get(k)! + 1) / (n + KINDS.length)));
  // The floor a token contributes when it is in the vocabulary for some kinds
  // and unseen for this one — already covered by add-1 above.
  return { weights, base };
}

function classify(
  toks: string[],
  model: { weights: Map<string, number[]>; base: number[] },
): { kind: Kind; confidence: number } | null {
  const s = model.base.slice();
  let hits = 0;
  for (const t of new Set(toks)) {
    const w = model.weights.get(t);
    if (!w) continue;
    hits++;
    for (let i = 0; i < s.length; i++) s[i] += w[i];
  }
  // No vocabulary word at all — the model has read nothing and must say so.
  if (hits === 0) return null;
  // softmax, for a confidence that means something to a caller
  const max = Math.max(...s);
  const exp = s.map((x) => Math.exp(x - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  let bi = 0;
  for (let i = 1; i < s.length; i++) if (s[i] > s[bi]) bi = i;
  return { kind: KINDS[bi], confidence: exp[bi] / sum };
}

(async function main() {
  const { train: tr, test: te } = await collect();
  console.log(`\ntrain ${tr.length} phrasings · held out ${te.length} (whole entries, every ${HELD}th)`);

  // ---- vocabulary: frequent enough to estimate, discriminative enough to keep
  const df = new Map<string, number>();
  for (const r of tr) for (const t of new Set(r.toks)) df.set(t, (df.get(t) ?? 0) + 1);
  const frequent = [...df].filter(([, n]) => n >= MINDF).map(([t]) => t);
  // Rank by how unevenly the token is spread across kinds — a token that
  // appears equally everywhere separates nothing and only costs bytes.
  const perKind = new Map<string, number[]>();
  for (const r of tr) {
    const ki = KINDS.indexOf(r.kind);
    for (const t of new Set(r.toks)) {
      if (!perKind.has(t)) perKind.set(t, KINDS.map(() => 0));
      perKind.get(t)![ki]++;
    }
  }
  const spread = (t: string) => {
    const v = perKind.get(t)!;
    const tot = v.reduce((a, b) => a + b, 0);
    // information gain against a uniform expectation, scaled by frequency
    let g = 0;
    for (const x of v) if (x) g += (x / tot) * Math.log((x / tot) * KINDS.length);
    return g * Math.log(1 + tot);
  };
  const vocab = new Set(frequent.sort((a, b) => spread(b) - spread(a)).slice(0, VOCAB));
  console.log(`vocabulary ${vocab.size} of ${df.size} tokens seen (kept those with df ≥ ${MINDF}, ranked by information gain)`);

  const model = train(tr, vocab);

  // ---- accuracy on entries the model never read
  let n = 0, right = 0, silent = 0;
  const conf = new Map<Kind, Map<Kind, number>>();
  for (const k of KINDS) conf.set(k, new Map());
  for (const r of te) {
    n++;
    const got = classify(r.toks, model);
    if (!got) { silent++; continue; }
    if (got.kind === r.kind) right++;
    else conf.get(r.kind)!.set(got.kind, (conf.get(r.kind)!.get(got.kind) ?? 0) + 1);
  }
  console.log(`\nheld-out accuracy: ${right}/${n} = ${((right / n) * 100).toFixed(1)}%  (silent on ${silent})`);
  console.log('\nper shape:');
  for (const k of KINDS) {
    const rows = te.filter((r) => r.kind === k);
    if (!rows.length) continue;
    let ok = 0;
    for (const r of rows) if (classify(r.toks, model)?.kind === k) ok++;
    const worst = [...conf.get(k)!].sort((a, b) => b[1] - a[1])[0];
    console.log(
      `  ${k.padEnd(12)} ${String(rows.length).padStart(5)}  ${`${((ok / rows.length) * 100).toFixed(0)}%`.padStart(5)}   confused with: ${worst ? `${worst[0]} ×${worst[1]}` : '—'}`,
    );
  }

  if (DRY) return;

  // ---- emit. Weights are quantised to 3 decimals: the ranking is what
  // matters and full doubles triple the file for no behaviour.
  const lines = [...model.weights]
    .map(([t, w]) => `  ${JSON.stringify(t)}:[${w.map((x) => x.toFixed(3)).join(',')}]`)
    .join(',\n');
  const out = `// GENERATED by scripts/build-shape-model.ts — do not edit by hand.
// Naive Bayes over ${tr.length} authored phrasings, ${vocab.size} tokens, ${KINDS.length} shapes.
// Held-out accuracy ${((right / n) * 100).toFixed(1)}% on entries the model never read.
// Re-run the builder after editing any FAQ bank.

export const SHAPES = ${JSON.stringify(KINDS)} as const;

/** logP(kind) for each shape, in SHAPES order. */
export const SHAPE_BASE: number[] = [${model.base.map((x) => x.toFixed(3)).join(',')}];

/** token -> logP(token | kind) for each shape, in SHAPES order. */
export const SHAPE_WEIGHTS: Record<string, number[]> = {
${lines}
};
`;
  writeFileSync('lib/generated/question-shape.ts', out, 'utf8');
  console.log(`\nwrote lib/generated/question-shape.ts (${(out.length / 1024).toFixed(0)} KB)`);
})();
