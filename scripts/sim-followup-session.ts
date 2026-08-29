/**
 * sim-followup-session.ts — Itay's scenario, end to end, counting the calls.
 *
 *   npx tsx scripts/sim-followup-session.ts
 *
 * FREE. Runs the REAL router and the REAL local tutor over whole conversations
 * — not one message at a time, which is how every previous measurement missed
 * this. A student takes a free move and then keeps talking; the question is how
 * many of those follow-up turns still reach the model.
 *
 * The `--before` flag re-runs with the follow-up router switched off, so the
 * two numbers can be compared instead of asserted.
 */

import { routeMessage, canonicalFor, answerGradedLocally } from '../lib/tutor-router';
import { answerLocally } from '../lib/tutor-local';
import { expectationOf, nextStepAfter, type Pending } from '../lib/tutor-pending';

const BEFORE = process.argv.includes('--before');

const steps = [
  '**הכלל:** באיבר הכללי של סדרה חשבונית מציבים an = a1 + (n-1)d',
  'מציבים n=5 ומקבלים 3 + 4*4',
  'מחשבים ומקבלים 19',
];
const focus = {
  topic: 'סדרות',
  subTopicId: 'seq-arith',
  question: {
    id: 'sim-1',
    question: 'נתון a1=3 וההפרש d=4, כך שהסדרה נראית 3, 7, 11, … מצא את האיבר החמישי.',
    hint: 'האיבר החמישי מרוחק ארבעה הפרשים מהראשון.',
    expected: { kind: 'value', value: '19' },
    solution: {
      steps,
      explanation: 'כל איבר גדול מקודמו ב-d, ולכן החמישי גדול מהראשון בארבעה הפרשים.',
      finalAnswer: '19',
    },
  },
} as never;

/** Real conversations: the first message takes a free move, the rest continue it. */
const SESSIONS: string[][] = [
  ['רמז', 'עוד קצת', 'עדיין לא הבנתי', 'ניסיתי ולא יצא'],
  ['תן לי רמז', 'לא הבנתי', 'תסביר אחרת', 'למה דווקא ככה'],
  ['מה הנוסחה', 'לא הבנתי מה זה אומר', 'עוד', 'אז מה עושים עכשיו'],
  ['רמז', '16', 'אה', 'ניסיתי שוב ויצא לי 19'],
  ['למה טעיתי', 'עדיין תקוע', 'זה מסובך מדי', 'תן עוד רמז'],
];

let total = 0;
let local = 0;
const misses: string[] = [];

for (const session of SESSIONS) {
  let pending: Pending | null = null;
  let tutorSpoke = false;
  let lastAsk: string | null = null;
  const served: string[] = [];
  console.log(`\n--- ${session[0]} …`);

  for (const msg of session) {
    total++;
    const route = routeMessage(msg, focus, {
      lastAsk: lastAsk as never,
      served: served as never,
      pending,
      tutorSpoke: BEFORE ? false : tutorSpoke,
    });

    let reply: string | null = null;
    if (route.kind === 'ack') reply = route.text;
    else if (route.kind === 'answer') reply = answerGradedLocally(route, focus)?.text ?? null;
    else if (route.kind === 'ask') {
      lastAsk = route.ask;
      const a = answerLocally(canonicalFor(route.ask), focus, served as never);
      if (a) {
        served.push(a.kind);
        reply = a.text;
      }
    }

    if (reply) {
      local++;
      pending = expectationOf(reply, nextStepAfter(reply, steps));
      tutorSpoke = true;
      console.log(`  ✓ "${msg}"  →  ${reply.replace(/\s+/g, ' ').slice(0, 62)}…`);
    } else {
      pending = null;
      tutorSpoke = false;
      misses.push(msg);
      console.log(`  $ "${msg}"  →  THE MODEL`);
    }
  }
}

console.log(`\n${BEFORE ? 'WITHOUT' : 'WITH'} the follow-up router:`);
console.log(`  answered locally  ${local}/${total}  (${((local / total) * 100).toFixed(0)}%)`);
console.log(`  reached the model ${total - local}/${total}`);
if (misses.length) {
  console.log('\n  still paid for:');
  for (const m of [...new Set(misses)]) console.log(`    "${m}"`);
}
console.log();
