// ============================================================
// tichon-notation.ts — the ONE list of symbols a תיכון student never sees.
// ============================================================
//
// These rules used to live inside scripts/check-tichon-notation.ts, which
// scans `content/` at build time. That covered every hand-authored lesson and
// nothing else — and the app's most-read maths is not authored, it is
// GENERATED per request by the scan solver and the tutor.
//
// The gap showed up in production on 2026-08-26: a scanned solution rendered
// "$x \in \mathbb{R}$" and "$x \in \mathbb{R} \setminus \{0\}$" on screen to a
// 5-unit student. `npm run check:notation` was green the whole time, because
// that text never existed in a file.
//
// So the list moves here, one copy, used by both:
//   · scripts/check-tichon-notation.ts   authored content, at build time
//   · findUniversityNotation()           model output, at request time
//
// NOT banned, deliberately: ⟹ / ⇐ / \Longrightarrow — the ordinary step
// arrows Israeli teachers write on the board. Ban them and half the solution
// chains lose their connector.

export type NotationRule = { pattern: RegExp; why: string };

export const TICHON_NOTATION_RULES: NotationRule[] = [
  { pattern: /\\{1,2}forall|∀/g, why: 'כתוב "לכל" במילים' },
  { pattern: /\\{1,2}exists|∃/g, why: 'כתוב "קיים" במילים' },
  { pattern: /\\{1,2}(?:wedge|land)|∧/g, why: 'כתוב "וגם"' },
  { pattern: /\\{1,2}(?:vee|lor)|∨/g, why: 'כתוב "או" (מחוץ למתמטיקה) או הפרד בפסיק' },
  { pattern: /\\{1,2}(?:neg|lnot)|¬/g, why: 'כתוב "לא"' },
  {
    pattern: /\\{1,2}(?:iff|Leftrightarrow|Longleftrightarrow)|⟺|⇔/g,
    why: 'כתוב "אם ורק אם" / "כלומר"; בתוך $$...$$ או latex: השתמש ב-\\Longrightarrow',
  },
  { pattern: /\\{1,2}emptyset|\\{1,2}varnothing|∅/g, why: 'כתוב "ריק" / "אין תוצאה משותפת"' },
  { pattern: /\\{1,2}mathbb\s*\{?\s*[RCZNQ]\s*\}?|[ℝℂℤℕℚ]/g, why: 'כתוב "כל $x$ ממשי" / "שלם" / "בתחום המרוכבים"' },
  { pattern: /\\{1,2}setminus|∖/g, why: 'כתוב "פרט ל-"' },
  { pattern: /\\{1,2}blacksquare|■|⬛|∎/g, why: 'כתוב **מש״ל**' },
  { pattern: /\\{1,2}(?:subseteq|supseteq)|⊆|⊇/g, why: 'סימון קבוצות אינו בתוכנית התיכון' },
  { pattern: /\\{1,2}therefore|∴/g, why: 'כתוב "לכן"' },
  // Proposition notation in induction proofs: P(1), P(k), P(n), P(k+1).
  // Probability P(A), P(X=k) and Bernoulli P(0)/P(1)/P(k) are legitimate, so
  // the build-time gate only fires this on lines about induction. At request
  // time there is no such line context, so it is excluded there — see below.
  {
    pattern: /\bP\((?:1|n|k|k\s*\+\s*1|n\s*\+\s*1)\)/g,
    why: 'באינדוקציה כתוב "הטענה עבור $n=1$" במקום $P(1)$',
  },
];

/**
 * Which forbidden symbols appear in a piece of GENERATED text.
 *
 * Excludes the `P(n)` rule: it is safe only with the surrounding-line check
 * the build-time script does, and probability solutions legitimately write
 * `P(k)`. Flagging those would make this warning noise, and a warning that
 * cries wolf is a warning nobody reads.
 */
export function findUniversityNotation(text: string): string[] {
  const hits: string[] = [];
  for (const { pattern } of TICHON_NOTATION_RULES.slice(0, -1)) {
    const found = text.match(new RegExp(pattern.source, 'g'));
    if (found) hits.push(...new Set(found));
  }
  return [...new Set(hits)];
}
