/**
 * patterns/observe.ts — turning one recorded answer into a labelled mistake.
 *
 * PURE. Events in, tags out, no storage and no clock. Every input field this
 * reads is written automatically by the question runner; nothing here depends
 * on the student classifying their own error, and nothing here costs an API
 * call. That is the requirement the whole module is built around.
 *
 * Two independent sources, in priority order:
 *
 *   1 · A GENERATED question. `questionId` carries the template and seed, the
 *       template declares what each option means, and `chosenIndex` is the
 *       ORIGINAL option index. So the label is exact — the author wrote it.
 *
 *   2 · ANY open question with a machine-checked answer. `answerDiagnosis` is
 *       the shape `lib/answer-check` read out of the wrong value: a sign flip,
 *       roots the domain should have rejected, right values in swapped boxes.
 *       This works in all 14 topics today, with no content work at all, which
 *       is what stops the report from being a report about two topics.
 *
 * A correct answer produces no tag, and neither does a wrong answer we cannot
 * label. The alternative — guessing a category from the topic, or falling back
 * to the error notebook's 'אחר' — would fill the report with claims the
 * evidence does not support, and a study app that tells a student their problem
 * is "אחר" has said nothing while sounding certain.
 */

import type { AnswerDiagnosis } from '@/lib/answer-check';
import { generateById, getTemplate, isGeneratedId, parseGeneratedId } from '@/lib/generator';
import type { ResultEvent } from '@/lib/results';
import type { ErrorTag } from './tags';

/**
 * Shape-based diagnoses that `lib/answer-check` derives on its own, mapped into
 * the cross-topic vocabulary.
 *
 * `conjugate` maps to `sign-slip` deliberately: flipping the sign of the
 * imaginary part IS a sign error, and giving it a tag of its own would create a
 * מרוכבים-only label — which by this module's own rule is not a pattern.
 *
 * `known-mistake` is absent on purpose. Its note is authored per QUESTION, so
 * it has no cross-topic meaning by itself; it is resolved separately below,
 * against the template that wrote it.
 */
const DIAGNOSIS_TAG: Partial<Record<AnswerDiagnosis['kind'], ErrorTag>> = {
  'sign-flip': 'sign-slip',
  conjugate: 'sign-slip',
  'partial-set': 'partial-answer',
  'extra-root': 'condition-ignored',
  swapped: 'values-swapped',
};

/**
 * Which mistake a click on a generated MCQ represents.
 *
 * Returns null when the id is not generated, when the template has been
 * removed, or when the template never declared tags — all of which are "we do
 * not know", never "no mistake".
 */
function tagFromChoice(event: ResultEvent): ErrorTag | null {
  if (!event.questionId || !isGeneratedId(event.questionId)) return null;
  if (event.chosenIndex === undefined) return null;
  const parsed = parseGeneratedId(event.questionId);
  if (!parsed) return null;
  const tags = getTemplate(parsed.templateId)?.distractorTags;
  return tags?.[event.chosenIndex] ?? null;
}

/**
 * Which mistake an authored predictable wrong answer represents.
 *
 * `AnswerDiagnosis` carries the note but not the index, so the question is
 * rebuilt from its id and the note is matched back to its position. Rebuilding
 * is free and exact — that is what the seed in the id is for — and it avoids
 * widening the `AnswerDiagnosis` type for one consumer.
 */
function tagFromKnownMistake(event: ResultEvent, note: string): ErrorTag | null {
  if (!event.questionId || !isGeneratedId(event.questionId)) return null;
  const parsed = parseGeneratedId(event.questionId);
  if (!parsed) return null;
  const tags = getTemplate(parsed.templateId)?.wrongAnswerTags;
  if (!tags) return null;
  const wrongAnswers = generateById(event.questionId)?.question.wrongAnswers;
  if (!wrongAnswers) return null;
  const idx = wrongAnswers.findIndex((w) => w.note === note);
  return idx >= 0 ? (tags[idx] ?? null) : null;
}

/**
 * The mistake this answer represents, or null when it cannot be labelled.
 *
 * Only ONE tag per event. A wrong answer is one act; splitting it across two
 * labels would let a single miss vote twice and make the ranking a function of
 * how richly a template happens to be annotated.
 */
export function tagOf(event: ResultEvent): ErrorTag | null {
  if (event.correct) return null;

  const fromChoice = tagFromChoice(event);
  if (fromChoice) return fromChoice;

  const d = event.answerDiagnosis;
  if (!d) return null;
  if (d.kind === 'known-mistake') return tagFromKnownMistake(event, d.note);
  return DIAGNOSIS_TAG[d.kind] ?? null;
}

/** One labelled miss, with the context the report groups by. */
export type TaggedMiss = {
  tag: ErrorTag;
  topic: string;
  subTopicId?: string;
  ts: number;
  /** True when the miss happened inside a repair session rather than in practice. */
  inRepair: boolean;
};

/**
 * Misses inside a repair session are KEPT, not dropped: they are the only
 * evidence that can show whether a repair is working, which is the question the
 * report exists to answer. But they are marked, because a repair path
 * deliberately serves the thing the student is weakest at, and counting those
 * misses alongside ordinary practice would make every repaired weakness look
 * like it is getting worse.
 */
export function taggedMisses(events: readonly ResultEvent[]): TaggedMiss[] {
  const out: TaggedMiss[] = [];
  for (const e of events) {
    // A replay is re-answering a question whose solution is already known. It
    // is practice, not measurement — the same rule lib/results applies to
    // accuracy, applied here so a re-done question cannot inflate a pattern.
    if (e.repeat) continue;
    const tag = tagOf(e);
    if (!tag) continue;
    out.push({
      tag,
      topic: e.topic,
      subTopicId: e.subTopicId,
      ts: e.ts,
      inRepair: e.source === 'fix',
    });
  }
  return out;
}
