/**
 * question-shape.ts — WHAT SHAPE of question did the student ask?
 *
 * Seven shapes, and they are not invented here: they are the `kind` field the
 * FAQ bank has tagged on every one of its entries since it was authored.
 *
 *   why-step     "למה עושים את הצעד הזה"
 *   where-from   "מאיפה הגיע ה-70"
 *   why-not      "למה לא מחברים"           ← the one Itay's screenshots were
 *   what-if      "ומה אם היו שלוש יריות"
 *   concept      "מה זה מאורע משלים"
 *   mistake      "מה הטעות הנפוצה כאן"
 *   check        "איך יודעים שהתשובה נכונה"
 *
 * ============================================================
 * WHY A LEARNED MODEL AND NOT MORE RULES
 * ============================================================
 * `lib/tutor-intent` reads a message with hand-written anchored rules, and it
 * is right to: it decides whether to SERVE something, where a false positive is
 * a wrong answer. As a reader of intent it is thin, and the bank's own labels
 * say so — measured over all 77,098 authored phrasings, the rules were silent
 * on 34–60% of them and, on `why-not`, agreed with the author's label 29% of
 * the time. Hebrew has more ways to ask "why not" than a list holds. That is
 * the same lesson the ask-classifier learned, one level up.
 *
 * So the shape is LEARNED from those 77,098 labelled phrasings instead
 * (scripts/build-shape-model.ts, a multinomial Naive Bayes). No model call, no
 * network: the table is generated at build time and the classifier is a sum.
 *
 * ============================================================
 * ⚠️ THE FEATURES ARE NOT `tutor-faq`'s TOKENS, AND THAT IS THE WHOLE POINT
 * ============================================================
 * `tokens()` exists to match CONTENT, so it deliberately drops every function
 * word (`STOP`) and every maths island. Trained on those, this classifier
 * scored 57.8% — because the words it needs had all been thrown away. The
 * shape of a Hebrew question lives almost entirely in the words `tokens()`
 * discards:
 *
 *     למה **לא**        why-not, and without the לא it is why-step
 *     **אם** … **היה**  what-if
 *     **מאיפה**         where-from
 *     איך **יודעים ש**  check
 *
 * So the features here are the opposite instrument: every word kept, finals
 * folded, Hebrew prefixes offered as an extra form, plus ADJACENT PAIRS —
 * "למה לא" is one feature, and it is worth more than either word alone.
 */

import { SHAPES, SHAPE_BASE, SHAPE_WEIGHTS } from '@/lib/generated/question-shape';

export type QuestionShape = (typeof SHAPES)[number];

const FINALS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };
const fold = (w: string) => w.replace(/[ךםןףץ]/g, (c) => FINALS[c]);

/** The prefixes that glue onto a Hebrew word without a space. */
const PREFIXES = ['ה', 'ו', 'ב', 'ל', 'כ', 'מ', 'ש', 'וה', 'שה', 'מה', 'לה', 'כש'];

/**
 * The features one message contributes.
 *
 * Exported so scripts/build-shape-model.ts trains on EXACTLY what the runtime
 * classifies on. A trainer with its own copy of this function is a model that
 * scores well and behaves differently, and there is no way to notice.
 */
export function shapeFeatures(text: string): string[] {
  const clean = fold(text.toLowerCase())
    // A maths island is the SUBJECT, never the shape — "$0.7^3$" says nothing
    // about whether this is a why-not or a where-from. Replaced by a marker
    // rather than deleted, because *having* one is itself a weak signal.
    .replace(/\$[^$]*\$/g, ' ⟨math⟩ ')
    .replace(/\d+(?:[.,]\d+)?/g, ' ⟨num⟩ ')
    .replace(/[?!.,:;"'׳״()[\]{}«»\-–—/\\*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return [];
  const words = clean.split(' ').filter(Boolean);

  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    out.push(w);
    // The un-prefixed form as well, so "שמכפילים" reaches "מכפילים". Offered,
    // never substituted — the prefix itself carries shape ("כש…" is what-if).
    for (const p of PREFIXES) {
      if (w.startsWith(p) && w.length - p.length >= 2) { out.push(w.slice(p.length)); break; }
    }
    // Adjacent pairs. "למה לא" is the strongest why-not signal there is, and
    // as two unigrams it is invisible: both words appear in every shape.
    if (i + 1 < words.length) out.push(`${w}_${words[i + 1]}`);
  }
  // Where the question opens is most of its shape, so the first word and the
  // opening pair get their own features and cannot be diluted by a long tail.
  out.push(`^${words[0]}`);
  if (words.length > 1) out.push(`^${words[0]}_${words[1]}`);
  return out;
}

/**
 * The shape of this message, or null when the model has read nothing it knows.
 *
 * `confidence` is a softmax over the seven shapes: 1/7 is "no idea", and the
 * callers treat anything under ~0.4 as unusable. It is NOT a probability that
 * the answer is right — it is how sharply the wording points at one shape.
 */
export function classifyShape(message: string): { shape: QuestionShape; confidence: number } | null {
  const scores = SHAPE_BASE.slice();
  let hits = 0;
  for (const f of new Set(shapeFeatures(message))) {
    const w = SHAPE_WEIGHTS[f];
    if (!w) continue;
    hits++;
    for (let i = 0; i < scores.length; i++) scores[i] += w[i];
  }
  if (hits === 0) return null;
  const max = Math.max(...scores);
  const exp = scores.map((x) => Math.exp(x - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  let best = 0;
  for (let i = 1; i < scores.length; i++) if (scores[i] > scores[best]) best = i;
  return { shape: SHAPES[best], confidence: exp[best] / sum };
}
