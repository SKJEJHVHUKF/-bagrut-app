/**
 * teacher-status — the one sentence and the one colour a teacher sees per student.
 *
 * WHY THIS IS A MODULE AND NOT A `?:` IN THE DASHBOARD. The teachers this
 * board is for are veteran maths teachers who have never used a product like
 * it. They do not read a percentage and derive a lesson plan from it; they
 * read a sentence and act. So the screen shows ONE sentence per student, and
 * choosing which sentence is the whole design — it is branchy, it decides what
 * a teacher does on Tuesday, and it therefore gets a test (verify:teacher-status).
 *
 * Nothing here calls a model or a database. Every field it reads is already in
 * /api/teacher/overview's payload, which is Postgres plus arithmetic.
 *
 * ⚠️ THE INVARIANT THIS FILE EXISTS TO PROTECT: **a student with no data is
 * never red.** `syncedAt === null` means he never opened the app with the
 * account — his answer log is absent, not empty. Zero questions from an absent
 * log and zero questions from a lazy fortnight are the same number and opposite
 * facts. Painting that red sends a teacher into a lesson to confront a student
 * about work he may well have done on another device. It gets its own grey
 * light, `none`, and says so in words.
 */

/** Grey is not a failure state — see the header. */
export type Light = 'none' | 'red' | 'yellow' | 'green';

/** The ladder rungs, in the words the student sees on his own screen. */
export const RUNG: Record<string, string> = {
  learn: 'לימוד',
  easy: 'תרגול קל',
  mid: 'תרגול',
  hard: 'אתגר',
  ghost: 'חשיבה',
  bagrut: 'בגרות',
};

/** Below 60% is the same threshold /api/teacher/overview uses to build `stuck`.
 *  Keeping one number means the light and the list under it cannot disagree. */
const WEAK_ACCURACY = 0.6;
/** Between the two: not failing, not solid. */
const SHAKY_ACCURACY = 0.8;
/** Under this many first attempts, an accuracy is noise, not a measurement. */
const MIN_MEASURED = 5;
/** A fortnight without a single question is worth saying out loud. */
const IDLE_DAYS = 14;

const DAY = 86400000;

/** Where a one-click task should be aimed. `null` = nothing specific to aim at. */
export type Target = {
  topic: string;
  subTopicId: string | null;
  /** Human title, used verbatim as the task's own title. */
  title: string;
};

/** The subset of /api/teacher/overview's student that the light is derived from.
 *  Structural on purpose: the check script builds one by hand. */
export type StatusInput = {
  name: string;
  syncedAt: string | null;
  lastAnswerAt: number | null;
  answered: number;
  correct: number;
  accuracy: number;
  activeDays: number;
  stuck: {
    topic: string;
    answered: number;
    correct: number;
    accuracy: number;
    worstSubTopic: { subTopicId: string; title: string } | null;
  }[];
  stuckRungs: { topic: string; subId: string; title: string; kind: string; attempts: number }[];
  report: {
    weaknesses: {
      kind: string;
      topic: string;
      subTopicId: string;
      title: string;
      chronic: boolean;
    }[];
  };
  assignments: { dueDate: string | null; complete: boolean }[];
};

export type StudentStatus = {
  light: Light;
  /** The colour in words. Colour is never the only carrier — WCAG 1.4.1. */
  label: string;
  /** What to tell the teacher, as a sentence about this student by name. */
  headline: string;
  /** What the one-click button aims at, or null when there is nothing to aim at. */
  target: Target | null;
};

const LABEL: Record<Light, string> = {
  none: 'עדיין לא התחיל',
  red: 'דורש טיפול',
  yellow: 'צריך חיזוק',
  green: 'בשליטה',
};

/**
 * The sentence, the colour and the target for one student.
 *
 * `topicLabel` is injected rather than imported: the display names live in
 * content/bagrut-curriculum, and pulling that in here would drag the content
 * tree into anything that imports this file — including the client bundle.
 *
 * The rules are evaluated in the order they are written, and the FIRST match
 * wins, because that order is the priority order a teacher would use himself:
 * a named misconception beats a bad percentage, and a bad percentage beats
 * "hasn't logged in lately".
 */
export function studentStatus(
  s: StatusInput,
  topicLabel: (key: string) => string,
  now: number = Date.now()
): StudentStatus {
  const of = (light: Light, headline: string, target: Target | null = null): StudentStatus => ({
    light,
    label: LABEL[light],
    headline,
    target,
  });

  // ---- grey: there is nothing to measure, and that is not a failure --------
  if (s.syncedAt === null) {
    return of(
      'none',
      `${s.name} עדיין לא נכנס לאפליקציה עם החשבון שלו. אין נתוני תרגול — וזה לא אומר שהוא לא תרגל.`
    );
  }

  // ---- red ----------------------------------------------------------------

  // A mistake he already repaired once and fell back into. The strongest thing
  // the board knows, and the only one that says "this will not fix itself".
  const chronic = s.report.weaknesses.find((w) => w.chronic);
  if (chronic) {
    return of(
      'red',
      `${s.name} חזר לטעות שכבר תוקנה: ${chronic.title}`,
      weaknessTarget(chronic)
    );
  }

  // A NAMED mistake — authored Hebrew from the cognition maps, not a
  // percentage. This is the sentence a lesson gets built around.
  const misconception = s.report.weaknesses.find((w) => w.kind === 'misconception');
  if (misconception) {
    return of('red', `${s.name} ${misconception.title}`, weaknessTarget(misconception));
  }

  // A weak topic, aimed at the weakest rung inside it when the API found one.
  const weakest = s.stuck[0];
  if (weakest) {
    const sub = weakest.worstSubTopic;
    return of(
      'red',
      sub
        ? `${s.name} מתקשה בנושא ${sub.title}`
        : `${s.name} מתקשה בנושא ${topicLabel(weakest.topic)} — ${weakest.answered - weakest.correct} טעויות מתוך ${weakest.answered}`,
      {
        topic: weakest.topic,
        subTopicId: sub?.subTopicId ?? null,
        title: sub?.title ?? topicLabel(weakest.topic),
      }
    );
  }

  // A rung he played three times or more and still has not cleared. No
  // percentage says this: he keeps coming back to it and keeps not passing.
  const rung = s.stuckRungs[0];
  if (rung) {
    return of(
      'red',
      `${s.name} ניסה ${rung.title} ברמת ${RUNG[rung.kind] ?? rung.kind} ${rung.attempts} פעמים ולא עבר`,
      { topic: rung.topic, subTopicId: rung.subId, title: rung.title }
    );
  }

  // Stopped altogether. A month with the app open and nothing answered is a
  // red the accuracy columns cannot show, because there is no accuracy.
  if (s.activeDays === 0) {
    return of('red', `${s.name} לא תרגל אף יום ב-30 הימים האחרונים`);
  }

  if (s.answered >= MIN_MEASURED && s.accuracy < WEAK_ACCURACY) {
    return of(
      'red',
      `${s.name} ענה נכון על ${s.correct} שאלות מתוך ${s.answered} — פחות מ-60%`,
      firstTarget(s)
    );
  }

  // ---- yellow -------------------------------------------------------------

  // A weakness that is real but not a named misconception.
  const weakness = s.report.weaknesses[0];
  if (weakness) {
    return of('yellow', `${s.name} מתקשה בנושא ${weakness.title}`, weaknessTarget(weakness));
  }

  const overdue = s.assignments.filter(
    (a) => !a.complete && a.dueDate !== null && Date.parse(`${a.dueDate}T23:59:59+03:00`) < now
  ).length;
  if (overdue > 0) {
    return of(
      'yellow',
      overdue === 1
        ? `${s.name} לא סיים שיעורי בית שתאריך ההגשה שלהם עבר`
        : `${s.name} לא סיים ${overdue} שיעורי בית שתאריך ההגשה שלהם עבר`,
      firstTarget(s)
    );
  }

  if (s.answered === 0) {
    return of('yellow', `${s.name} נכנס לאפליקציה אבל עוד לא ענה על שאלות`);
  }

  const idleDays =
    s.lastAnswerAt === null ? null : Math.floor((now - s.lastAnswerAt) / DAY);
  if (idleDays !== null && idleDays >= IDLE_DAYS) {
    return of('yellow', `${s.name} לא תרגל ${idleDays} ימים`);
  }

  // Too little to judge — said plainly rather than dressed up as a percentage.
  if (s.answered < MIN_MEASURED) {
    return of(
      'yellow',
      `${s.name} ענה על ${s.answered} שאלות בלבד — מעט מדי כדי לדעת איפה הוא עומד`
    );
  }

  if (s.accuracy < SHAKY_ACCURACY) {
    return of(
      'yellow',
      `${s.name} ענה נכון על ${s.correct} שאלות מתוך ${s.answered} — יציב, אבל לא בשליטה מלאה`,
      firstTarget(s)
    );
  }

  // ---- green --------------------------------------------------------------
  return of('green', `${s.name} שולט בחומר — ${s.correct} תשובות נכונות מתוך ${s.answered}`);
}

function weaknessTarget(w: {
  topic: string;
  subTopicId: string;
  title: string;
}): Target {
  return { topic: w.topic, subTopicId: w.subTopicId || null, title: w.title };
}

/** Something to aim a task at when the headline itself did not name one. */
function firstTarget(s: StatusInput): Target | null {
  const w = s.report.weaknesses[0];
  if (w) return weaknessTarget(w);
  const t = s.stuck[0];
  if (!t) return null;
  return {
    topic: t.topic,
    subTopicId: t.worstSubTopic?.subTopicId ?? null,
    title: t.worstSubTopic?.title ?? t.topic,
  };
}

/** Red first: the roster is a worklist, so the students who need the teacher
 *  are at the top of it and the ones who are fine are at the bottom. Grey sits
 *  above green because "never started" is something to act on, just not by
 *  giving him more practice. */
export const LIGHT_ORDER: Record<Light, number> = { red: 0, yellow: 1, none: 2, green: 3 };
