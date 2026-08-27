/**
 * tutor-followup.ts — the second, third and fourth message about the same rung.
 *
 * ============================================================
 * WHAT THIS IS FOR
 * ============================================================
 * The student taps one of the offered moves — a hint, a formula, "why was I
 * wrong" — and gets it for free. Then they keep TALKING about it: "עוד קצת",
 * "לא הבנתי", "למה דווקא ככה", "עדיין תקוע". Every one of those was an
 * unrecognised message and therefore a paid call, on a conversation that had
 * already been answered locally.
 *
 * ============================================================
 * WHY BREADTH IS SAFE HERE AND NOWHERE ELSE
 * ============================================================
 * These patterns are far wider than anything in `tutor-intent`, and they are
 * only ever consulted when the PREVIOUS turn was answered locally. That
 * context is what makes them safe: "לא הבנתי" floating free is ambiguous, but
 * one message after the tutor explained something it can only mean "not that".
 * The reply is always another rung of the same ladder — the tutor's own
 * authored content about the exercise already on screen — so the worst case is
 * a rung the student did not want, not an answer about something else.
 *
 * ⚠️ The caller MUST NOT consult this when the previous turn was the model's.
 * There the conversation is unconstrained and the same words mean anything.
 */

/** What the student is doing with the thing the tutor just said. */
export type FollowUp =
  /** "עוד", "עוד רמז", "זה לא מספיק" — the same rung again, or the next one. */
  | 'more'
  /** "לא הבנתי", "עדיין תקוע", "לא הצלחתי" — the same, said as being stuck. */
  | 'stuck'
  /** "למה דווקא ככה", "למה זה עובד" — explain the thing you just said. */
  | 'why'
  /** "תסביר אחרת", "במילים פשוטות" — the same content, different words. */
  | 'restate'
  /** "ניסיתי ולא יצא", "יצא לי משהו אחר" — they did the work and it failed. */
  | 'tried';

const RULES: Array<[FollowUp, RegExp]> = [
  // ⚠️ 'tried' BEFORE 'stuck': "ניסיתי ולא הבנתי" is a student who did the work,
  // and answering it with the same rung again ignores that they already used it.
  ['tried', /(?:ניסיתי|עשיתי|הצבתי|חישבתי|פתרתי).{0,20}(?:ולא|אבל|ויצא|לא יצא)|יצא\s*(?:לי\s*)?(?:משהו\s*)?אחר|לא\s*יצא\s*(?:לי)?|קיבלתי\s*משהו\s*אחר/],

  ['stuck', /לא\s*(?:הבנתי|מבין|מבינה|ברור|מובן|תפסתי|קלטתי|הצלחתי|מצליח|מצליחה|יודע|יודעת\s*מה)|עדיין\s*(?:לא|תקוע)|תקוע|תקועה|נתקעתי|אבוד|מבולבל|מסובך|קשה\s*מדי|לא\s*עוזר/],

  // "איבר איבר" and "אחד אחד" are the same ask as "תסביר אחרת": go slower and
  // take it in pieces. From report:worklist, where it cost a model call.
  ['restate', /(?:תסביר|הסבר|תגיד).{0,12}(?:אחרת|שוב|יותר\s*פשוט|במילים)|יותר\s*פשוט|במילים\s*פשוטות|בפשטות|פשוט\s*יותר|לא\s*ברור\s*מה\s*זה|(איבר|צעד|שלב|אחד|שורה)\s+\1|לאט\s*לאט|בקצב\s*איטי/],

  ['why', /(?:^|[^א-ת])(?:למה|מדוע)(?:[^א-ת]|$)|בשביל\s*מה|מה\s*הקשר|למה\s*דווקא/],

  ['more', /(?:^|[^א-ת])(?:עוד|המשך|תמשיך|הלאה|ואז|נו|יותר|בהמשך)(?:[^א-ת]|$)|לא\s*מספיק|תן\s*עוד|אפשר\s*עוד|משהו\s*נוסף|רמז\s*נוסף|עוד\s*קצת/],
];

/**
 * Classify a message as a continuation of the tutor's last local answer.
 *
 * Returns null for anything that reads as a NEW question — a message naming a
 * subject, asking for a different artefact, or carrying its own maths. Those
 * belong to the normal routing, which is why this runs after it rather than
 * before.
 */
export function followUp(message: string): FollowUp | null {
  const m = message.trim();
  if (!m || m.length > 120) return null;
  for (const [kind, re] of RULES) if (re.test(m)) return kind;
  return null;
}

/**
 * How a follow-up maps onto the ladder that already exists.
 *
 * ⚠️ IT RETURNS AN `Ask`, NOT A RUNG. The first version invented its own
 * sequence — hint, first-step, key-points, formulas, full — which is a second
 * ladder next to the one `answerLocally` already climbs from `served`. Two
 * ladders disagree the first time either is edited. This one only decides
 * WHICH ask, and the escalation inside `help` stays where it was.
 *
 * `spentHelp` is the same predicate `routeMessage` uses for a bare "ואז?": the
 * help ladder is finished once a hint AND either a first step or the key points
 * have been handed out. After that the only rung left is the whole solution.
 */
export function ladderMove(
  kind: FollowUp,
  spent: readonly string[],
  lastAsk?: string | null,
): 'help' | 'full' | 'explain' | 'formulas' | 'key-points' | 'why-wrong' {
  if (kind === 'why' || kind === 'restate') return 'explain';

  const spentHelp =
    spent.includes('hint') && (spent.includes('first-step') || spent.includes('key-points'));
  if (spentHelp) return 'full';

  // A student who did the work and failed has earned more than one who has not
  // started, so 'tried' goes to the help ladder rather than back to whatever
  // they last asked for — which may well have been a formula they now have.
  if (kind === 'tried' || kind === 'stuck') return 'help';

  return (lastAsk as 'help' | undefined) ?? 'help';
}
