/**
 * preview-tutor-voice.ts — read what the tutor actually says, as a conversation.
 *
 *   npx tsx scripts/preview-tutor-voice.ts
 *   npx tsx scripts/preview-tutor-voice.ts "מספרים מרוכבים"
 *
 * The zero-API tutor answers from templates over authored content. Templates
 * are impossible to judge in the abstract: a line that reads fine in the source
 * can land as a fragment once the slots are filled, and the failure is not a
 * crash — it is a tutor who sounds like a database. The only way to see it is
 * to print the finished sentences.
 *
 * So this walks REAL questions from the bank through EVERY help state and
 * prints the exchange as a dialogue. It asserts nothing; the point is that a
 * human reads it. `npm run check` cannot tell you whether a sentence sounds
 * like a person.
 *
 * Costs nothing and calls nothing — the whole path under test is local.
 */

const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
};
(globalThis as unknown as { localStorage: unknown }).localStorage = (
  globalThis as unknown as { window: { localStorage: unknown } }
).window.localStorage;

import { getSubTopics, allLessonKeys } from '../content/lessons';
import { answerLocally, type LocalAnswerKind } from '../lib/tutor-local';
import { checkAnswer } from '../lib/answer-check';
import type { TutorFocus } from '../lib/tutor-presence';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';

const SUBJECT = 'math5';
const TOPIC = process.argv[2] || 'פונקציית ln';

const RULE = '─'.repeat(74);
const say = (who: 'תלמיד' | 'מורה', text: string | null) => {
  const body = text ?? '‹אין תשובה מקומית — ייפול ל-API›';
  const label = who === 'תלמיד' ? '🙋 תלמיד' : '👨‍🏫 מורה ';
  console.log(`${label} │ ${body.split('\n').join('\n          │ ')}`);
};

/** Walk one focus through a list of asks, carrying the escalation state. */
function converse(title: string, focus: TutorFocus, asks: string[]) {
  console.log(`\n${RULE}\n▌${title}\n${RULE}`);
  if (focus.questionText) console.log(`   השאלה: ${focus.questionText}`);
  if (focus.wrongAnswer) console.log(`   התלמיד ענה: ${focus.wrongAnswer}`);
  if (typeof focus.chosenIndex === 'number') {
    const note = focus.question?.distractorNotes?.[focus.chosenIndex];
    console.log(`   יש הערה למסיח? ${note && note.trim() ? 'כן' : 'לא'}`);
  }
  if (focus.answerDiagnosis) console.log(`   אבחון מכני: ${JSON.stringify(focus.answerDiagnosis)}`);
  console.log('');
  const served: LocalAnswerKind[] = [];
  for (const ask of asks) {
    say('תלמיד', ask);
    const a = answerLocally(ask, focus, served);
    if (a) served.push(a.kind);
    say('מורה', a ? a.text : null);
    console.log('');
  }
}

function main() {
  const subTopics = getSubTopics(SUBJECT, TOPIC);
  if (!subTopics.length) {
    console.error(`אין תתי-נושאים ל-"${TOPIC}". נושאים זמינים:`);
    for (const k of allLessonKeys()) if (k.subject === SUBJECT) console.error('  ·', k.topic);
    process.exit(1);
  }

  const pairs: { q: PracticeQuestion; st: SubTopic }[] = subTopics.flatMap((st) =>
    (st.questions ?? []).map((q) => ({ q, st })),
  );

  const mcqWithNote = pairs.find(
    (p) => p.q.kind === 'mcq' && (p.q.distractorNotes ?? []).some((n) => n && n.trim()),
  );
  const mcqNoNote = pairs.find(
    (p) =>
      p.q.kind === 'mcq' &&
      (p.q.answers ?? []).some((_, i) => i !== p.q.correct && !(p.q.distractorNotes ?? [])[i]?.trim()),
  );
  const openGradable = pairs.find(
    (p) => p.q.kind === 'open' && p.q.expected && p.q.expected.kind !== 'manual',
  );
  const openManual = pairs.find(
    (p) => p.q.kind === 'open' && (!p.q.expected || p.q.expected.kind === 'manual'),
  );

  console.log(`\n${'═'.repeat(74)}`);
  console.log(`  קול המורה הפרטי — ${TOPIC}   (אפס קריאות API)`);
  console.log('═'.repeat(74));

  // ---- A: MCQ, before answering ----
  if (mcqWithNote) {
    converse('A · שאלה אמריקאית, לפני מענה — התלמיד תקוע', {
      where: `תרגול · ${mcqWithNote.st.title}`,
      topic: TOPIC,
      questionText: mcqWithNote.q.question,
      question: mcqWithNote.q,
      subTopic: mcqWithNote.st,
    }, ['אני תקוע בשאלה הזאת', 'אני עדיין תקוע', 'מאיפה מתחילים?']);
  }

  // ---- B: MCQ wrong, note exists ----
  if (mcqWithNote) {
    const idx = (mcqWithNote.q.distractorNotes ?? []).findIndex((n) => n && n.trim());
    converse('B · שאלה אמריקאית, טעה — יש הערה למסיח שבחר', {
      where: `תרגול · ${mcqWithNote.st.title}`,
      topic: TOPIC,
      questionText: mcqWithNote.q.question,
      question: mcqWithNote.q,
      subTopic: mcqWithNote.st,
      chosenIndex: idx,
      wrongAnswer: mcqWithNote.q.answers?.[idx],
    }, ['למה התשובה שלי שגויה?', 'עדיין לא הבנתי', 'תראה לי את הפתרון המלא']);
  }

  // ---- C: MCQ wrong, NO note ----
  if (mcqNoNote) {
    const idx = (mcqNoNote.q.answers ?? []).findIndex(
      (_, i) => i !== mcqNoNote.q.correct && !(mcqNoNote.q.distractorNotes ?? [])[i]?.trim(),
    );
    converse('C · שאלה אמריקאית, טעה — אין הערה למסיח הזה', {
      where: `תרגול · ${mcqNoNote.st.title}`,
      topic: TOPIC,
      questionText: mcqNoNote.q.question,
      question: mcqNoNote.q,
      subTopic: mcqNoNote.st,
      chosenIndex: idx,
      wrongAnswer: mcqNoNote.q.answers?.[idx],
    }, ['למה התשובה שלי שגויה?', 'תן לי רמז']);
  }

  // ---- E: open question, machine-graded, with a real diagnosis ----
  if (openGradable && openGradable.q.expected) {
    const spec = openGradable.q.expected;
    // Build a wrong answer whose SHAPE is recognisable, the way a student's
    // would be — a sign flip, or one root of two.
    const wrong =
      spec.kind === 'set' && spec.values.length > 1
        ? spec.values[0]
        : spec.kind === 'value'
          ? `-(${spec.value})`
          : '';
    const res = wrong ? checkAnswer(wrong, spec) : null;
    converse('E · שאלה פתוחה שנבדקה מכנית — טעה בצורה מזוהה', {
      where: `תרגול · ${openGradable.st.title}`,
      topic: TOPIC,
      questionText: openGradable.q.question,
      question: openGradable.q,
      subTopic: openGradable.st,
      wrongAnswer: wrong,
      ...(res?.diagnosis ? { answerDiagnosis: res.diagnosis } : {}),
    }, ['למה התשובה שלי שגויה?', 'אני תקוע', 'תראה לי את הפתרון']);
  }

  // ---- F: open, self-reported wrong ----
  if (openManual) {
    converse('F · שאלה פתוחה / הוכחה — דיווח עצמי על טעות', {
      where: `תרגול · ${openManual.st.title}`,
      topic: TOPIC,
      questionText: openManual.q.question,
      question: openManual.q,
      subTopic: openManual.st,
      wrongAnswer: '(פתרתי על דף וטעיתי)',
    }, ['למה טעיתי?', 'מאיפה מתחילים?']);
  }

  // ---- H: no question on screen ----
  converse('H · אין שאלה על המסך (שיעור / מפת למידה)', {
    where: `שיעור · ${subTopics[0].title}`,
    topic: TOPIC,
    subTopic: subTopics[0],
    subTopicId: subTopics[0].id,
  }, ['איזו נוסחה צריך פה?', 'מה חשוב לזכור?', 'אני תקוע']);

  console.log(`\n${'═'.repeat(74)}`);
  console.log('  כל מקום שכתוב בו ‹אין תשובה מקומית› הוא קריאת API שאפשר לחסוך.');
  console.log('═'.repeat(74) + '\n');
}

main();
