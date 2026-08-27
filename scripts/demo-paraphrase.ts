/**
 * demo-paraphrase.ts — the same question, asked eight different ways.
 *
 *   npx tsx scripts/demo-paraphrase.ts
 *
 * FREE. Answers the only question that matters about a pre-written bank: what
 * happens when the student does not use the words it was written with.
 */

import { getLesson } from '../content/lessons';
import { partAsQuestion, type TutorFocus } from '../lib/tutor-presence';
import { answerFromFaq } from '../lib/tutor-faq';
import { routeMessage } from '../lib/tutor-router';
import { answerLocally } from '../lib/tutor-local';
import { examMetaAnswer } from '../lib/tutor-exam-meta';

/** One IDEA per group, phrased the way eight different students would type it. */
const GROUPS: [string, string[]][] = [
  ['"why is the denominator that number"', [
    'למה 14 במכנה',
    'למה מחלקים ב-14',
    'מאיפה הגיע ה-14',
    'למה המכנה הוא 14',
    'מה זה ה-14 הזה',
    'למה 14 למטה',
    'לא הבנתי למה דווקא 14',
    'אני לא מבין מאיפה בא המספר 14',
  ]],
  ['"why is this a conditional probability"', [
    'למה זו הסתברות מותנית',
    'איך יודעים שזה מותנה',
    'מה עושה את זה מותנה',
    'למה זה בכלל תנאי',
    'איפה רואים שיש כאן תנאי',
    'מה המילה שמסמנת תנאי',
  ]],
  ['"I want a hint"', [
    'תן לי רמז',
    'אני תקוע',
    'אפשר עזרה',
    'לא מצליח להתחיל',
    'מאיפה מתחילים בכלל',
    'תן לי כיוון',
    'אין לי מושג מה לעשות',
  ]],
];

(async () => {
  const L = getLesson('math5', 'הסתברות');
  const b = L!.bagrutQuestions!.find((x) => x.id === 'prob-bag-001')!;
  const p = b.parts.find((x) => x.label === 'ב') ?? b.parts[0];
  const focus: TutorFocus = {
    where: 'שאלת בגרות · הסתברות · סעיף ב',
    topic: 'הסתברות',
    questionText: p.prompt,
    question: partAsQuestion(p, { questionId: b.id, difficulty: b.difficulty, hintsShown: 0 }),
  };

  console.log(`\n=== ${b.id}/${p.label} — the same idea, many phrasings ===\n`);
  let hit = 0;
  let total = 0;

  for (const [idea, phrasings] of GROUPS) {
    console.log(`${idea}`);
    for (const msg of phrasings) {
      total++;
      // The bubble's own order.
      const route = routeMessage(msg, focus, {});
      let where: string;
      if (route.kind === 'ack') where = '✅ ack';
      else if (route.kind === 'answer') where = '✅ graded in code';
      else if (examMetaAnswer(msg, focus.topic)) where = '✅ curriculum data';
      else {
        const probe = route.kind === 'ask' ? msg : msg;
        const local = answerLocally(probe, focus, []);
        if (local) where = `✅ authored: ${local.kind}`;
        else {
          const faq = await answerFromFaq(msg, focus);
          where = faq ? `✅ bank${faq.faqId ? ` (${faq.faqId})` : ''}` : '💸 model';
        }
      }
      if (where.startsWith('✅')) hit++;
      console.log(`   ${where.padEnd(34)} ${msg}`);
    }
    console.log();
  }
  console.log(`${'='.repeat(60)}\nanswered without a model: ${hit}/${total} (${Math.round((hit / total) * 100)}%)\n`);
})();
