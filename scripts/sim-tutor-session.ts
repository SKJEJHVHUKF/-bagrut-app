/**
 * sim-tutor-session.ts — walk a whole conversation and mark every turn that
 * would cost a model call.
 *
 *   npx tsx scripts/sim-tutor-session.ts
 *
 * FREE. Calls nothing; it drives the same functions the bubble drives.
 *
 * WHY: the four opening chips are answered locally, which looks like a solved
 * problem — but a student does not stop at one chip. They click one and then
 * keep talking, and the follow-ups are where the tutor quietly starts paying
 * for every turn. A per-message test cannot see that, because the thing that
 * changes is CONVERSATION STATE: `servedRef` grows, the help ladder empties,
 * and the same words that were free on turn 1 fall through on turn 4.
 */

import { getLesson } from '../content/lessons';
import { answerLocally, type LocalAnswerKind } from '../lib/tutor-local';
import { routeMessage } from '../lib/tutor-router';
import { partAsQuestion, focusPrompts, type TutorFocus } from '../lib/tutor-presence';
import { answerFromFaq } from '../lib/tutor-faq';
import { examMetaAnswer } from '../lib/tutor-exam-meta';

const TOPIC = process.argv[2] ?? 'הסתברות';

/** What a student actually types after clicking a chip. Grouped so the report
 *  says WHICH kind of follow-up is unhandled, not just how many. */
const FOLLOW_UPS: [string, string[]][] = [
  ['ask for more of the same', ['עוד רמז', 'אפשר עוד רמז', 'עוד קצת', 'תן לי עוד כיוון']],
  ['did not understand the answer', ['לא הבנתי', 'עדיין לא הבנתי', 'לא הבנתי את זה', 'אפשר יותר פשוט']],
  ['push to continue', ['ואז?', 'ואז מה', 'ומה עכשיו', 'המשך', 'נו', 'אוקיי ומה הלאה']],
  ['ask about what was just said', ['למה?', 'למה זה ככה', 'מה זאת אומרת', 'תסביר את זה']],
  ['acknowledge', ['הבנתי', 'תודה', 'אוקיי', 'סבבה']],
  ['give up / want the answer', ['אני מוותר', 'פשוט תגיד לי', 'תראה לי כבר', 'מה התשובה']],
  // ===== the student keeps digging into THIS question =====
  // Everything above is conversational glue. What follows is the real content
  // of a tutoring session, and it is where "answered from what is written"
  // either holds up or turns into a bill. Grouped by what would have to exist
  // for the answer to be free.
  ['about a step in this solution', [
    'למה מכפילים ולא מחברים', 'מאיפה הגיע המספר הזה', 'למה חילקת בזה',
    'למה הצעד השני ככה', 'מה עשית בשורה 2',
  ]],
  ['the concept behind this question', [
    'מה זה בלי החזרה', 'מה זה מאורעות תלויים', 'מה ההבדל בין וגם לאו',
    'מתי משתמשים בעץ ומתי בטבלה', 'איך יודעים אם המאורעות בלתי תלויים',
    'מה זה בעצם הסתברות מותנית',
  ]],
  ['a wrong idea the student has', [
    'חשבתי שצריך לחבר', 'למה לא סוכמים הכל', 'אני תמיד מתבלבל בזה',
    'מה הטעות הנפוצה כאן',
  ]],
  ['what if the question changed', [
    'ומה אם היו שלושה מאורעות', 'ואם זה היה עם החזרה', 'ומה אם שואלים על לפחות אחד',
  ]],
  ['checking and remembering', [
    'איך אני בודק שזה נכון', 'איך אני זוכר את זה', 'יש דרך קצרה יותר',
  ]],
  ['exam meta', [
    'זה יבוא בבגרות', 'כמה נקודות זה שווה', 'זה תמיד ככה בשאלות האלה',
  ]],
];

(async () => {
  const L = getLesson('math5', TOPIC);
  const b = L?.bagrutQuestions?.[0];
  const p = b?.parts?.[0];
  if (!b || !p) { console.error(`no bagrut question in ${TOPIC}`); process.exit(1); }

  const q = partAsQuestion(p, { questionId: b.id, difficulty: b.difficulty, hintsShown: 0 });
  const st = b.subTopicId ? (L!.subTopics ?? []).find((s) => s.id === b.subTopicId) : undefined;
  const focus: TutorFocus = {
    where: `שאלת בגרות · ${TOPIC} · סעיף ${p.label}`,
    topic: TOPIC, questionText: p.prompt, question: q,
    ...(st ? { subTopic: st } : {}),
  };

  const served: LocalAnswerKind[] = [];
  let lastAsk: ReturnType<typeof routeMessage> extends never ? never : null | 'help' | 'why-wrong' | 'full' | 'formulas' | 'key-points' | 'explain' = null;
  let free = 0;
  let paid = 0;
  const paidBy = new Map<string, string[]>();

  const turn = async (msg: string, label: string) => {
    // Same order as components/tutor/TutorBubble.tsx.
    const route = routeMessage(msg, focus, { lastAsk, served });
    if (route.kind === 'answer') { free++; return 'answer (mathjs)'; }
    if (route.kind === 'ack') { free++; return 'ack (fixed)'; }
    // An `ask` route may have RESOLVED a continuation to a different wording —
    // "ואז?" becomes the previous ask — so the local tutor is asked with a
    // canonical phrase for that ask, exactly as the bubble does.
    const CANONICAL: Record<string, string> = {
      help: 'תן לי רמז', 'why-wrong': 'למה התשובה שלי שגויה?', full: 'תראה לי את הפתרון',
      formulas: 'באיזו נוסחה משתמשים כאן?', 'key-points': 'מה חשוב לזכור?', explain: 'תסביר לי את השאלה הזאת מההתחלה',
    };
    const probe = route.kind === 'ask' ? (CANONICAL[route.ask] ?? msg) : msg;
    const meta = examMetaAnswer(msg, focus.topic);
    if (meta) { free++; return 'exam-meta (data)'; }
    const local = answerLocally(probe, focus, served);
    if (local) {
      if (!served.includes(local.kind)) served.push(local.kind);
      if (route.kind === 'ask') lastAsk = route.ask;
      free++;
      return `local:${local.kind}${local.fallback ? ' (fallback)' : ''}`;
    }
    const faq = await answerFromFaq(msg, focus);
    if (faq) { free++; return `faq:${faq.source}`; }
    paid++;
    paidBy.set(label, [...(paidBy.get(label) ?? []), msg]);
    return '💸 API';
  };

  console.log(`\n=== a session on ${TOPIC} · ${b.id}/${p.label} ===\n`);
  console.log('the four opening chips:');
  for (const chip of focusPrompts(focus)) {
    console.log(`  ${(await turn(chip, 'chip')).padEnd(26)} ${chip}`);
  }

  console.log(`\nserved so far: [${served.join(', ')}]\n`);
  console.log('then the student keeps talking:');
  for (const [label, msgs] of FOLLOW_UPS) {
    console.log(`\n  — ${label} —`);
    for (const m of msgs) console.log(`  ${(await turn(m, label)).padEnd(26)} ${m}`);
  }

  const total = free + paid;
  console.log(`\n${'='.repeat(58)}`);
  console.log(`free ${free}/${total} (${Math.round((free / total) * 100)}%)  ·  paid ${paid}/${total}`);
  if (paid) {
    console.log(`\nwhat still costs a call:`);
    for (const [label, msgs] of paidBy) console.log(`  ${label.padEnd(30)} ${msgs.join(' · ')}`);
  }
  console.log();
})();
