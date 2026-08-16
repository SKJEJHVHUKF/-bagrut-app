// Registry of topics authored in the new JSON "topic-schema" format.
//
// Each topic is a static JSON file imported at build time (zero runtime cost),
// cast to our authored TopicContent shape. JSON imports infer very narrow
// literal types, so we cast through `unknown`; the data is validated by hand
// against types.ts.

import type { TopicContent } from './types';
import polynomialRaw from './polynomial-function-investigation.json';

export const polynomialFunctionInvestigation =
  polynomialRaw as unknown as TopicContent;

/** All topics, keyed by topicId. */
export const TOPICS: Record<string, TopicContent> = {
  [polynomialFunctionInvestigation.topicId]: polynomialFunctionInvestigation,
};

export function getTopic(topicId: string): TopicContent | undefined {
  return TOPICS[topicId];
}

export function getAllTopics(): TopicContent[] {
  return Object.values(TOPICS);
}
