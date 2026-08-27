/**
 * patterns/index.ts — the browser-facing API of the cross-topic mistake profile.
 *
 * Thin by design, same split as `lib/remediation` and `lib/cognition`: the
 * logic is pure and tested against a synthetic answer log with a fixed clock,
 * and this layer only knows how to read the store.
 */

import { getResults } from '@/lib/results';
import { taggedMisses } from './observe';
import { buildProfile, type ProfileResult } from './profile';

export * from './tags';
export { tagOf, taggedMisses, type TaggedMiss } from './observe';
export {
  buildProfile,
  topPattern,
  MIN_HITS,
  MIN_SPREAD,
  TREND_WINDOW_DAYS,
  type PatternFinding,
  type ProfileResult,
  type Trend,
} from './profile';

/** The student's recurring-mistake profile for one subject. */
export function getPatternProfile(subject: string, now: number = Date.now()): ProfileResult {
  return buildProfile(taggedMisses(getResults(subject)), now);
}
