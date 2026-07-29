/**
 * concept-quiz/math5/index.ts — the 5-unit (שאלון 571 + 572) concept banks.
 *
 * One file per topic, named to match content/lessons/math5/*.ts so a topic's
 * lesson and its concept bank sit under the same filename. Bulk authoring is
 * one agent per file, which only works because these are separate files.
 *
 * Topic keys must match `MATH5_CURRICULUM[].key` in content/bagrut-curriculum.ts
 * exactly — enforced by scripts/verify-concept.ts.
 */
import type { ConceptTopicBank } from '../types';

import { math5AlgebraConcepts } from './algebra';
import { math5SequencesConcepts } from './sequences';
import { math5ProbabilityConcepts } from './probability';
import { math5EuclideanGeometryConcepts } from './euclidean-geometry';
import { math5FunctionsConcepts } from './functions';
import { math5TrigonometryConcepts } from './trigonometry';
import { math5DerivativesConcepts } from './derivatives';
import { math5IntegralsConcepts } from './integrals';
import { math5ExpFunctionsConcepts } from './exp-functions';
import { math5GrowthDecayConcepts } from './growth-decay';
import { math5LnFunctionConcepts } from './ln-function';
import { math5AnalyticGeometryConcepts } from './analytic-geometry';
import { math5VectorsConcepts } from './vectors';
import { math5ComplexNumbersConcepts } from './complex-numbers';

/** Every math5 concept bank, keyed by topic name. */
export const CONCEPT_MATH5: Record<string, ConceptTopicBank> = {
  // ===== שאלון 571 =====
  [math5AlgebraConcepts.topic]: math5AlgebraConcepts,
  [math5SequencesConcepts.topic]: math5SequencesConcepts,
  [math5ProbabilityConcepts.topic]: math5ProbabilityConcepts,
  [math5EuclideanGeometryConcepts.topic]: math5EuclideanGeometryConcepts,
  [math5FunctionsConcepts.topic]: math5FunctionsConcepts,
  [math5TrigonometryConcepts.topic]: math5TrigonometryConcepts,
  [math5DerivativesConcepts.topic]: math5DerivativesConcepts,
  [math5IntegralsConcepts.topic]: math5IntegralsConcepts,
  // ===== שאלון 572 =====
  [math5ExpFunctionsConcepts.topic]: math5ExpFunctionsConcepts,
  [math5GrowthDecayConcepts.topic]: math5GrowthDecayConcepts,
  [math5LnFunctionConcepts.topic]: math5LnFunctionConcepts,
  [math5AnalyticGeometryConcepts.topic]: math5AnalyticGeometryConcepts,
  [math5VectorsConcepts.topic]: math5VectorsConcepts,
  [math5ComplexNumbersConcepts.topic]: math5ComplexNumbersConcepts,
};
