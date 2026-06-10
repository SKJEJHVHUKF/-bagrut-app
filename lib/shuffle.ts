// Deterministic, seed-stable permutation of the indices [0, n).
//
// Why deterministic (not Math.random): MCQ option order must be IDENTICAL on
// the server render and the client hydration, or React throws a hydration
// mismatch. Seeding by the question id gives every question a fixed-but-varied
// order — so the correct answer isn't always in the same slot — while staying
// stable across re-renders (selecting an answer won't reshuffle the options).
//
// Authoring stays simple: write the correct answer first (correct: 0) for
// readability; the UI scatters it deterministically at render time.
export function seededOrder(n: number, seed: string): number[] {
  // FNV-1a hash of the seed → 32-bit state.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  // LCG driving a Fisher-Yates shuffle.
  const next = () => {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    return h / 0x100000000;
  };
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}
