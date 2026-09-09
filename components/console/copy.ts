/**
 * copy.ts — every word a teacher reads on the console, in one place.
 *
 * IMPORT-FREE at runtime (types only), so any client component can take a
 * string from here without dragging a module graph into the bundle.
 *
 * The rule this file enforces: the first screen speaks in WORDS. A status is
 * one word. A card line is one sentence with no number in it except a day
 * count. A topic is one of three words. The percentages exist — on the student
 * page, second and small — but the screen a teacher opens between lessons
 * never asks him to interpret one.
 *
 * Gendered forms are masculine throughout, per the owner's instruction for the
 * whole product; the board does not know a student's gender.
 */

import type { StudentRow, StudentState, TopicState } from '@/lib/class-board';

// ---- the three groups a class is sorted into --------------------------------
export const GROUP = {
  needs: 'צריכים אותך',
  fine: 'בסדר',
  fresh: 'לא התחילו',
} as const;

/** One word per student. */
export const STATE_WORD: Record<StudentState, string> = {
  stuck: 'תקוע',
  away: 'לא נכנס',
  'no-data': 'לא התחיל',
  active: 'בסדר',
};

/** One word per topic. */
export const TOPIC_WORD: Record<TopicState, string> = {
  strong: 'הכיתה שולטת',
  borderline: 'על הגבול',
  reteach: 'ללמד שוב',
};

// ---- buttons ----------------------------------------------------------------
export const BTN = {
  send: 'שלח תרגול',
  sendClass: 'שלח לכיתה תרגול',
  card: 'ההתקדמות שלו',
  report: 'דוח להורים',
  excel: 'אקסל',
  print: 'הדפסה',
  back: 'חזרה לכיתה',
  more: 'לכל הרשימה ←',
  again: 'שלח להם שוב',
  sendStuck: 'שלח לתקועים',
} as const;

// ---- empties and small sentences -------------------------------------------
export const EMPTY = {
  needs: 'אף אחד לא צריך אותך השבוע.',
  search: 'לא מצאנו תלמיד בשם הזה.',
  topics: 'עוד אין מספיק תרגול כדי לומר משהו על נושא.',
  sent: 'עוד לא נשלח לו תרגול.',
  class: 'הכיתה ריקה עדיין. שלח לתלמידים את קוד ההצטרפות.',
} as const;

export const NO_DATA = 'אין נתונים';
export const NO_DATA_STUDENT =
  'התלמיד הצטרף לכיתה אבל עוד לא פתר שאלה. אין כאן אפס — פשוט אין עדיין מה למדוד.';
export const STUDENT_NOT_FOUND = 'לא מצאנו את התלמיד הזה בכיתה.';

export const SECTION = {
  topics: 'נושאים',
  mistakes: 'איפה הוא נופל',
  activity: 'פעילות · 14 הימים האחרונים',
  sent: 'מה נשלח לו',
  dialog: 'שליחת תרגול',
} as const;

/** "עוד אין מספיק תרגול כדי לומר משהו על סדרות, הסתברות." */
/**
 * Why a topic has no word yet.
 *
 * ⚠️ THE OLD WORDING BLAMED THE STUDENTS FOR A THRESHOLD. "עוד אין מספיק
 * תרגול" reads as "nobody practised", and a teacher whose class HAS practised
 * concludes the system is not tracking — which is exactly what one told us
 * while looking at a screen that had 102 of his answers from that same day.
 *
 * The real reason is `RETEACH_MIN_STUDENTS`: a class VERDICT needs several
 * students before it means anything, so one student's bad week cannot condemn
 * a topic for thirty. In a class that small the sentence has to say so, and
 * point at where the per-student truth actually lives.
 */
/** The card's button. Named, because "כרטיס" told a teacher what the thing IS
 *  and not what pressing it does — and on a board of thirty cards, the name is
 *  what tells him which student he is about to open. */
export function progressLabel(name: string): string {
  return `ההתקדמות של ${name}`;
}

export function thinTopics(topics: string[], studentCount?: number, minStudents = 5): string {
  const list = topics.join(', ');
  if (typeof studentCount === 'number' && studentCount < minStudents) {
    return `כדי לקבוע מצב של נושא לכיתה צריך ${minStudents} תלמידים עם נתונים, ובכיתה הזאת יש ${studentCount}. הנתונים של כל תלמיד קיימים ומתעדכנים — הם בכרטיס שלו.`;
  }
  return `עוד אין מספיק תרגול כדי לומר משהו על ${list}.`;
}

/** "תקועים: שיר מ. · רן כ." */
export function stuckUnder(names: string[]): string {
  return `תקועים: ${names.join(' · ')}`;
}

/**
 * "לא סגרו: מאיה פ. · תמר א. ועוד 3"
 *
 * The names, not the count. "3 מתוך 8 סגרו" tells a teacher a task is
 * unfinished and then makes her open eight cards to find out who. Six names is
 * about what fits on one line on a phone; past that the number is honest and
 * the full list is one tap away on the student page.
 */
export function notDoneUnder(names: string[], cap = 6): string {
  const shown = names.slice(0, cap).join(' · ');
  const rest = names.length - cap;
  return `לא סגרו: ${shown}${rest > 0 ? ` ועוד ${rest}` : ''}`;
}

// ---- time, in a teacher's words --------------------------------------------

/** "היום / אתמול / שלשום / לפני 3 ימים / לפני שבוע / לפני 3 שבועות".
 *  "לפני 1 ימים" is the tell of a screen nobody read out loud. */
export function agoLabel(days: number | null): string {
  if (days === null) return '—';
  if (days <= 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days === 2) return 'שלשום';
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 14) return 'לפני שבוע';
  return `לפני ${Math.floor(days / 7)} שבועות`;
}

/** "2026-09-10" → "יום ה׳, 10.9". An ISO date inside a Hebrew sentence wraps
 *  and reads as a serial number. */
export function hebDate(iso: string | null): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(`${iso}T12:00:00Z`);
  const day = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת'][d.getUTCDay()];
  return `יום ${day}, ${Number(m[3])}.${Number(m[2])}`;
}

// ---- the one line under a name ----------------------------------------------

/**
 * The single sentence a card carries. No percentage, ever.
 *
 * Derived from the StudentRow here rather than taken from
 * board.needsAttention[].reason, because that string carries a percentage
 * ("סדרות — 42% ב-9 תרגילים") and is capped at five students. This is the
 * whole class, in words.
 */
export function cardLine(s: StudentRow): string {
  switch (s.state) {
    case 'stuck': {
      const t = s.stuck.map((x) => x.topic);
      if (t.length === 1) return `נתקע ב${t[0]}`;
      if (t.length === 2) return `נתקע ב${t[0]} וב${t[1]}`;
      return `נתקע ב${t[0]} ובעוד נושאים`;
    }
    case 'away': {
      const n = s.daysSinceActive ?? 0;
      if (n < 14) return `לא נכנס ${n} ימים`;
      if (n < 21) return 'לא נכנס שבועיים';
      return `לא נכנס ${Math.floor(n / 7)} שבועות`;
    }
    case 'active':
      return `תרגל ${agoLabel(s.daysSinceActive)}`;
    case 'no-data':
    default:
      return 'הצטרף לכיתה, עוד לא פתר כלום';
  }
}
