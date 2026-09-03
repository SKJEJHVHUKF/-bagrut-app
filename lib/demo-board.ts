/**
 * demo-board.ts — what the board looks like with a real class on it.
 *
 * WHY THIS EXISTS
 * A teacher's first visit is to an EMPTY class: he has just opened it and
 * nobody has joined. "עוד אף תלמיד לא הצטרף" is honest and teaches him nothing,
 * so he closes the tab — and the one thing he needed to see, the reason to hand
 * this to thirty students, is exactly the thing he cannot see until he already
 * has. That is a chicken-and-egg problem that costs the pilot.
 *
 * ⚠️ THE SAMPLE IS INPUT, NOT OUTPUT. This file fabricates a roster and an
 * answer log and hands them to the REAL `buildClassBoard`. Every number, every
 * threshold, every Hebrew sentence on the demo screen is produced by the same
 * function that will run on his actual students — so the preview cannot drift
 * from the product, and improving the board improves the demo for free.
 *
 * A hand-written mock of the OUTPUT would have been less code and a lie: it
 * would keep showing whatever was true on the day it was written.
 *
 * The screen that renders this must say it is an example. See the banner in
 * components/console/Overview.
 */

import { buildClassBoard, type BoardAttempt, type ClassBoard } from '@/lib/class-board';

const DAY = 24 * 60 * 60 * 1000;

/**
 * A class that has been running for a few weeks: most of it is fine, a couple
 * of students need the teacher, and one topic has gone wrong for everybody.
 *
 * The shape is chosen to show every state the board can report — including the
 * two that are easiest to get wrong, and that a teacher must be able to tell
 * apart at a glance:
 *   מאיה  joined and never started  → "אין נתונים", NOT 0%
 *   יובל  worked, then stopped      → "לא נכנס", and his mastery is untouched
 */
const STUDENTS: {
  name: string;
  /** [topic, measured attempts, of which correct, days ago] */
  work: [string, number, number, number][];
}[] = [
  {
    name: 'נועה ב.',
    work: [
      ['טריגונומטריה', 12, 11, 1],
      ['פונקציות', 9, 7, 2],
      ['סדרות', 6, 2, 1],
      ['הסתברות', 8, 7, 4],
    ],
  },
  {
    name: 'יובל ד.',
    // Every answer is nine days old — the whole point of this student.
    work: [
      ['טריגונומטריה', 7, 4, 9],
      ['פונקציות', 5, 3, 10],
      ['סדרות', 4, 2, 9],
    ],
  },
  {
    name: 'אמיר ל.',
    work: [
      ['טריגונומטריה', 10, 8, 1],
      ['פונקציות', 11, 10, 1],
      ['סדרות', 8, 3, 2],
      ['הסתברות', 6, 6, 3],
    ],
  },
  {
    name: 'שיר מ.',
    work: [
      ['טריגונומטריה', 8, 3, 2],
      ['סדרות', 9, 1, 1],
      ['פונקציות', 5, 2, 3],
    ],
  },
  {
    name: 'רן כ.',
    work: [
      ['טריגונומטריה', 11, 2, 1],
      ['סדרות', 5, 2, 2],
      ['הסתברות', 7, 5, 5],
    ],
  },
  {
    name: 'דניאל ש.',
    work: [
      ['פונקציות', 8, 7, 1],
      ['סדרות', 7, 4, 2],
      ['הסתברות', 9, 8, 2],
      ['טריגונומטריה', 6, 5, 4],
    ],
  },
  {
    name: 'תמר א.',
    work: [
      ['פונקציות', 7, 6, 3],
      ['סדרות', 6, 3, 3],
      ['טריגונומטריה', 5, 4, 6],
    ],
  },
  // Joined, never opened a question. No `work` at all — the row that proves
  // "אין נתונים" is a different sentence from "0%".
  { name: 'מאיה פ.', work: [] },
];

/**
 * Build the demo board.
 *
 * `now` is passed through rather than read here so the day arithmetic lines up
 * with the rest of the screen, and so this is testable.
 */
/**
 * Named mistakes, so the student card demonstrates the thing that actually
 * distinguishes this product: not "he got 42%", but WHERE he goes wrong. These
 * mirror the shapes lib/answer-check reports.
 */
const DIAGNOSES: Record<string, { kind: string; note: string }[]> = {
  סדרות: [
    { kind: 'off-by-one', note: 'השתמש ב-n במקום n−1 בנוסחת האיבר הכללי' },
    { kind: 'wrong-formula', note: 'הציב בנוסחת סדרה הנדסית במקום חשבונית' },
    { kind: 'sign-flip', note: 'הפך את סימן ההפרש d' },
  ],
  טריגונומטריה: [
    { kind: 'identity', note: 'פתח sin(2α) כ-2sinα במקום 2sinαcosα' },
    { kind: 'domain', note: 'קיבל פתרון מחוץ לתחום שהשאלה הגדירה' },
    { kind: 'degrees-radians', note: 'חישב במעלות כשהשאלה בערכים רדיאניים' },
  ],
  פונקציות: [
    { kind: 'derivative', note: 'גזר את המכפלה כמכפלת הנגזרות' },
    { kind: 'domain', note: 'לא פסל את הערך שמאפס את המכנה' },
  ],
  הסתברות: [{ kind: 'independence', note: 'הכפיל הסתברויות של מאורעות תלויים' }],
};

export function demoBoard(now: number = Date.now()): ClassBoard {
  const roster = STUDENTS.map((s, i) => ({ id: `demo-${i}`, name: s.name }));

  const attempts: BoardAttempt[] = [];
  STUDENTS.forEach((s, i) => {
    for (const [topic, total, correct, daysAgo] of s.work) {
      const pool = DIAGNOSES[topic] ?? [];
      let wrongSeen = 0;
      for (let k = 0; k < total; k++) {
        const isCorrect = k < correct;
        // A named mistake on some of the wrong answers, not all: in the real
        // data lib/answer-check can only name the shapes it recognises, and a
        // demo where every error is neatly labelled would set an expectation
        // the product does not meet.
        const diag = !isCorrect && pool.length > 0 && wrongSeen % 3 !== 2
          ? pool[wrongSeen % pool.length]
          : null;
        if (!isCorrect) wrongSeen++;

        attempts.push({
          user_id: `demo-${i}`,
          topic,
          correct: isCorrect,
          is_repeat: false,
          hint_used: !isCorrect && k % 4 === 0,
          diagnosis: diag,
          // Spread across a few days around the anchor so "last active" is not
          // identical for every answer, while the anchor still decides whether
          // the student reads as away.
          created_at: new Date(now - (daysAgo * DAY + (k % 5) * 3600_000)).toISOString(),
        });
      }
    }
  });

  return buildClassBoard(roster, attempts, now);
}

/** Two focuses in flight, so zone 3 shows the loop closing rather than an
 *  empty box. Shaped like the rows the real API returns. */
export function demoFocuses(now: number = Date.now()) {
  const due = (days: number) => new Date(now + days * DAY).toISOString().slice(0, 10);
  return [
    {
      id: 'demo-focus-1',
      label: 'סדרות · סדרה חשבונית · ביסוס',
      topic: 'סדרות',
      subTopicId: null,
      rung: 'mid' as const,
      targetCount: 8,
      dueOn: due(4),
      note: null,
      targetedCount: null,
      studentIds: null,
      totalCount: 8,
      started: 6,
      done: 5,
    },
    {
      id: 'demo-focus-2',
      label: 'טריגונומטריה · חימום',
      topic: 'טריגונומטריה',
      subTopicId: null,
      rung: 'easy' as const,
      targetCount: 5,
      dueOn: due(1),
      note: 'רן, שיר — התחילו מכאן',
      targetedCount: 2,
      studentIds: ['demo-4', 'demo-3'],
      totalCount: 2,
      started: 2,
      done: 1,
    },
  ];
}
