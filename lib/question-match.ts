// ============================================================
// question-match.ts — normalize + fingerprint + fuzzy-compare Hebrew
// math question text, so a scanned/transcribed question can be matched
// against the pre-solved library (and the shared solution cache).
// ============================================================
//
// The whole point: two phrasings of the "same" question — the stored
// bagrut text and a photo the OCR transcribed — rarely match byte-for-byte
// (spacing, niqqud, $ delimiters, a stray section label). We normalize
// hard, then compare two ways:
//   - EXACT: FNV-1a hash of the normalized string (identical → same hash).
//   - FUZZY: Jaccard overlap of the normalized token sets (≥ threshold).
//
// Pure, dependency-free, runs in <1ms over the ~800-item corpus.

/** FNV-1a 32-bit → 8-char hex. Same family the rate-limiter uses. */
export function fingerprint(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    // multiply by the FNV prime (32-bit) with Math.imul to stay exact
    h = Math.imul(h, 0x01000193);
  }
  // >>> 0 → unsigned; pad to 8 hex chars
  return (h >>> 0).toString(16).padStart(8, '0');
}

// Hebrew niqqud + cantillation marks — visual only, drop for matching.
const NIQQUD = /[֑-ׇ]/g;

/**
 * Normalize a Hebrew+LaTeX math question to a comparable canonical form:
 *  - strip $…$ / $$…$$ delimiters (keep the math text between them)
 *  - drop niqqud
 *  - lowercase Latin (topic/LaTeX commands)
 *  - drop leading section labels ("א.", "ב)", "1.") that OCR/format add
 *  - collapse every run of non-meaningful punctuation/space to one space
 *  - keep Hebrew letters, digits, Latin letters, and the math operators
 *    that carry signal (+ - = / ^ _ \ ( ) . , < >)
 */
export function normalizeQuestionText(input: string): string {
  let s = input;
  s = s.replace(/\$\$?/g, ' '); // math delimiters
  s = s.replace(NIQQUD, '');
  s = s.toLowerCase();
  // Strip standalone section labels: a Hebrew letter or digit group followed
  // by . or ) at a word boundary (e.g. "א.", "ב1)", "3."). Only when short.
  s = s.replace(/(^|\s)[א-ת]{1,2}\d?[.)]/g, ' ');
  s = s.replace(/(^|\s)\d{1,2}[.)]/g, ' ');
  // Keep meaningful chars; everything else → space.
  s = s.replace(/[^א-ת0-9a-z+\-=/^_\\().,<>]+/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/** Token set of a normalized string — words + short math atoms. */
export function tokenSet(normalized: string): Set<string> {
  const raw = normalized.split(/[\s.,()]+/).filter((t) => t.length > 0);
  return new Set(raw);
}

/** Jaccard similarity of two token sets: |∩| / |∪| ∈ [0,1]. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}
