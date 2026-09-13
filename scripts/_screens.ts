/**
 * _screens.ts — every question the tutor can have on screen, keyed by the id
 * the FAQ bank is keyed by, AS THE SCREEN PUBLISHES IT (bagrut parts and
 * /quiz questions reach the tutor through an adapter).
 *
 * One walk, shared by the offline tutor scripts. It used to be copied into
 * each of them, and the copies disagreed about which sources exist.
 */
import { getLesson, allLessonKeys } from '../content/lessons';
import { conceptBankEntries, getConceptQuestions, CONCEPT_LEVELS } from '../content/concept-quiz';
import { conceptAsQuestion, partAsQuestion } from '../lib/tutor-presence';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';

export type Screen = { question: PracticeQuestion; subTopic?: SubTopic; topic: string; subject: string };

export function allScreens(): Map<string, Screen> {
  const map = new Map<string, Screen>();
  for (const { subject, topic } of allLessonKeys()) {
    const L = getLesson(subject, topic);
    if (!L) continue;
    for (const st of L.subTopics ?? [])
      for (const q of st.questions ?? []) map.set(q.id, { question: q, subTopic: st, topic, subject });
    for (const q of L.questions ?? []) map.set(q.id, { question: q, topic, subject });
    for (const b of L.bagrutQuestions ?? [])
      for (const p of b.parts ?? []) {
        const q = partAsQuestion(p, { questionId: b.id });
        map.set(q.id, { question: q, topic, subject });
      }
    for (const e of conceptBankEntries()) {
      if (e.subject !== subject || e.topic !== topic) continue;
      for (const lvl of CONCEPT_LEVELS)
        for (const cq of getConceptQuestions(subject, topic, lvl)) {
          const q = conceptAsQuestion(cq);
          map.set(q.id, { question: q, topic, subject });
        }
    }
  }
  return map;
}
