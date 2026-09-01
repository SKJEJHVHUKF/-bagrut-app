/**
 * teacher-pay.ts — hours and salary for the private teachers.
 *
 * Pure calendar + arithmetic, zero imports: everything here is unit-tested by
 * scripts/test-teacher-pay.ts, which is the only check standing between a
 * calendar bug and a wrong salary.
 *
 * ============================================================
 * THE MODEL
 * ============================================================
 * Hours are NOT logged per lesson. The owner sets a standing weekly figure per
 * teacher (`weeklyHours`) and an hourly rate; the hours accrue by themselves,
 * week after week. When a week really was different, the owner writes ONE
 * override row for that week (public.teacher_week_hours) — so a normal month
 * stores nothing at all, and a correction is a single row.
 *
 * Nothing is ever stored as a computed total. Every number on the dashboard is
 * derived on read, which is what makes a corrected rate or a corrected week
 * take effect immediately and retroactively.
 *
 * ============================================================
 * THE WEEK, AND WHY DST CANNOT BREAK IT
 * ============================================================
 * A week is Sunday→Saturday in Asia/Jerusalem — the Israeli working week.
 *
 * Israel shifts its clock twice a year, and the naive way to find "the Sunday
 * of this week" (subtract days from a Date) silently lands an hour off across
 * that boundary, which on a Sunday 00:xx moves the whole week. So the clock is
 * used for exactly ONE thing — asking "what is today's date in Israel?" — and
 * every step after that is calendar arithmetic on that YYYY-MM-DD string,
 * carried out in UTC where days are always exactly 24 hours. A civil date has
 * no offset to get wrong.
 *
 * ============================================================
 * WHICH MONTH A WEEK BELONGS TO
 * ============================================================
 * A week is attributed, whole, to the month holding most of its days — the
 * month of its Thursday, the rule ISO-8601 uses for week-years. So a month
 * holds 4 or 5 whole weeks and no week is ever split or double-counted. The
 * dashboard prints the week list next to the total precisely so this rule is
 * visible rather than magic — the teacher can add the rows up himself.
 */

/** ms in a day. Safe to multiply with because all arithmetic below is UTC. */
const DAY = 86_400_000;

const ISRAEL_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jerusalem',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Today's civil date in Israel, as YYYY-MM-DD. The only clock-dependent step. */
export function israelDay(when: Date): string {
  return ISRAEL_DAY.format(when);
}

/** Calendar arithmetic on a YYYY-MM-DD string. UTC — no DST, no offsets. */
export function addDays(day: string, delta: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + delta * DAY).toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday, for a civil date. Timezone-independent. */
function weekdayOf(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

/** The Sunday of the week containing `day` (a YYYY-MM-DD civil date). */
export function weekStartOf(day: string): string {
  return addDays(day, -weekdayOf(day));
}

/**
 * Every week that belongs to `month` ('YYYY-MM'), as its starting Sunday.
 *
 * A week belongs to the month holding MOST of its days — which is the month of
 * its Thursday, the same rule ISO-8601 uses to decide a week's year. So a week
 * is never split and never counted twice, and each month gets 4 or 5 of them.
 *
 * ⚠️ The obvious rule — "the month of the week's Sunday" — was tried first and
 * is wrong in a way that only shows up at a month boundary. On Tue 2026-09-01
 * the week in progress starts Sun 2026-08-30, so September held no started
 * week at all: the dashboard said "this week: 10h, ₪900" and "this month so
 * far: ₪0" at the same time, and the money for the week being worked sat in a
 * month that had already been paid.
 */
export function weekStartsInMonth(month: string): string[] {
  // Thursday is day 4 of a Sunday-start week.
  const monthOfWeek = (weekStart: string) => addDays(weekStart, 4).slice(0, 7);

  let ws = weekStartOf(`${month}-01`);
  const out: string[] = [];
  while (monthOfWeek(ws) <= month) {
    if (monthOfWeek(ws) === month) out.push(ws);
    ws = addDays(ws, 7);
  }
  return out;
}

/** A week whose hours differ from the standing figure. */
export type HourOverride = {
  /** Sunday, YYYY-MM-DD. */
  weekStart: string;
  hours: number;
  note?: string | null;
};

export type WeekRow = {
  weekStart: string;
  hours: number;
  /** The owner corrected this week by hand. */
  edited: boolean;
  note?: string | null;
  /** Included in the month total. False for a week that has not started yet. */
  counted: boolean;
};

export type PaySummary = {
  rate: number;
  weeklyHours: number;
  /** The week in progress. */
  week: { weekStart: string; hours: number; pay: number; edited: boolean };
  /** The current month, up to and including the week in progress. */
  month: { month: string; hours: number; pay: number; weeks: WeekRow[] };
};

/** ₪, to the agora. */
function money(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildPay(opts: {
  now: Date;
  rate: number;
  weeklyHours: number;
  /** YYYY-MM-DD the role was granted; weeks before it never accrue. */
  since: string | null;
  overrides: HourOverride[];
}): PaySummary {
  const { now, rate, weeklyHours, since, overrides } = opts;

  const today = israelDay(now);
  const thisWeek = weekStartOf(today);
  const month = today.slice(0, 7);
  // The first week that may accrue. A part-week at hire time counts whole —
  // the owner can correct it with one override, which is the same knob every
  // other unusual week uses.
  const firstWeek = since ? weekStartOf(since) : null;

  const byWeek = new Map(overrides.map((o) => [o.weekStart, o]));

  const rowFor = (weekStart: string): WeekRow => {
    const override = byWeek.get(weekStart);
    const edited = override !== undefined;
    return {
      weekStart,
      hours: Math.max(0, edited ? override.hours : weeklyHours),
      edited,
      note: override?.note ?? null,
      // A week that has not begun is shown but not paid: the month total means
      // "so far", never a projection.
      counted: weekStart <= thisWeek,
    };
  };

  const weeks = weekStartsInMonth(month)
    .filter((ws) => !firstWeek || ws >= firstWeek)
    .map(rowFor);

  const monthHours = weeks.reduce((sum, w) => sum + (w.counted ? w.hours : 0), 0);

  // The current week may sit outside the list — a hire mid-month, or the week
  // that straddles two months — so it is built on its own rather than found.
  const current = !firstWeek || thisWeek >= firstWeek ? rowFor(thisWeek) : null;

  return {
    rate,
    weeklyHours,
    week: {
      weekStart: thisWeek,
      hours: current?.hours ?? 0,
      pay: money((current?.hours ?? 0) * rate),
      edited: current?.edited ?? false,
    },
    month: {
      month,
      hours: money(monthHours),
      pay: money(monthHours * rate),
      weeks,
    },
  };
}
