'use client';

/**
 * ClassBoardView — the class board's rendering, with no data fetching in it.
 *
 * Split out from the page so the SAME view can be rendered from two places:
 * the real route, which fetches one teacher's class, and /console-demo, which
 * feeds it a sample and needs no account at all. A second copy of this markup
 * would drift within a week, and the demo would quietly stop being a preview of
 * the product.
 *
 * THE DESIGN CONSTRAINT, and everything here follows from it: a teacher opens
 * this in a ten-minute break, on a phone, between lessons. So the screen
 * answers three questions in a FIXED order and hands over conclusions rather
 * than a table:
 *
 *   מי צריך אותך  — a list of four, not of thirty-one.
 *   מה ללמד שוב   — a topic the class is failing. The insight a teacher gets
 *                    from nowhere else today.
 *   מה שביקשתי    — did the focus land.
 *
 * The heatmap sits BELOW all three: it is for exploring, and a grid of
 * thirty-one rows is not what anyone reads in ninety seconds.
 *
 * EVERY SECTION SAYS WHAT IT IS FOR. A dashboard that assumes the reader will
 * infer the point of a panel is a dashboard for the person who built it.
 *
 * Every number comes from lib/class-board, which is pure and tested. This file
 * renders; it does not decide. In particular it never turns a null into a zero
 * — "אין נתונים" and "0%" are different sentences about a child.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Copy,
  Check,
  Target,
  AlertTriangle,
  Clock,
  UserPlus,
  Eye,
  LifeBuoy,
  Repeat,
  ClipboardCheck,
  Grid3x3,
  Printer,
  Download,
} from 'lucide-react';
import type { ClassBoard, AttentionRow, StudentRow } from '@/lib/class-board';
import { demoBoard, demoFocuses } from '@/lib/demo-board';
import { masteryCell, MASTERY_LEGEND } from '@/lib/mastery-scale';
import { RUNG_LABEL, type Rung } from '@/lib/rungs';
import type { CatalogueTopic } from '@/lib/focus-target';
import StudentPanel from '@/components/school/StudentPanel';
import StudentsTable from '@/components/school/StudentsTable';

export type FocusRow = {
  id: string;
  label: string;
  topic: string;
  subTopicId: string | null;
  rung: Rung | null;
  targetCount: number | null;
  dueOn: string | null;
  note: string | null;
  targetedCount: number | null;
  totalCount: number;
  started: number;
  done: number;
};

export type Payload = {
  class: {
    id: string;
    name: string;
    school: string | null;
    units: number | null;
    schoolYear: string;
    joinCode: string | null;
    archived: boolean;
  };
  board: ClassBoard;
  focuses: FocusRow[];
  windowDays: number;
};

/** "2026-09-10" -> "יום ה׳, 10.9". An ISO date inside a Hebrew sentence wraps
 *  onto two lines and reads as a serial number; a teacher says "עד יום חמישי". */
function hebDate(iso: string | null): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(`${iso}T12:00:00Z`);
  const day = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת'][d.getUTCDay()];
  return `יום ${day}, ${Number(m[3])}.${Number(m[2])}`;
}

export default function ClassBoardView({
  data,
  classId,
  onReload,
}: {
  data: Payload;
  /** null in the sample view — there is no class to write focuses to. */
  classId: string | null;
  onReload: () => void;
}) {
  // AN EMPTY CLASS SHOWS THE REAL BOARD ON SAMPLE DATA. A teacher's first visit
  // is always to a class nobody has joined, and "עוד אף תלמיד לא הצטרף" gives
  // him no reason to hand this to thirty students. The sample is INPUT to the
  // same buildClassBoard that will run on his own class, so it cannot drift.
  const isDemo = data.board.studentCount === 0;
  const board = useMemo(() => (isDemo ? demoBoard() : data.board), [isDemo, data.board]);
  const focuses = useMemo(() => (isDemo ? demoFocuses() : data.focuses), [isDemo, data.focuses]);

  const [tab, setTab] = useState<'overview' | 'students'>('overview');
  const [openStudent, setOpenStudent] = useState<StudentRow | null>(null);
  const [focusFor, setFocusFor] = useState<{ studentId: string; name: string } | null | 'class'>(
    null
  );

  const openById = (studentId: string) =>
    setOpenStudent(board.students.find((s) => s.id === studentId) ?? null);

  return (
    <main dir="rtl" className="mx-auto max-w-5xl px-4 pb-16 pt-6">
      <Header klass={data.class} board={board} classId={isDemo ? null : classId} />

      {isDemo && <DemoBanner joinCode={data.class.joinCode} />}

      <Tabs value={tab} onChange={setTab} studentCount={board.studentCount} />

      {tab === 'students' ? (
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <StudentsTable
            students={board.students}
            onOpen={setOpenStudent}
            onFocus={
              isDemo ? null : (s) => setFocusFor({ studentId: s.id, name: s.name })
            }
          />
        </section>
      ) : (
      <div className="mt-5 flex flex-col gap-5">
        <Section
          icon={LifeBuoy}
          title="מי צריך אותך"
          blurb="תלמידים שמשהו אצלם דורש התערבות השבוע — תקועים, נעלמו, או שעדיין לא התחילו."
          count={board.needsAttention.length}
          empty="אף אחד לא דורש התייחסות מיוחדת השבוע."
        >
          {board.needsAttention.map((row) => (
            <AttentionLine
              key={row.studentId}
              row={row}
              onOpen={() => openById(row.studentId)}
              onFocus={
                isDemo ? null : () => setFocusFor({ studentId: row.studentId, name: row.name })
              }
            />
          ))}
        </Section>

        <Section
          icon={Repeat}
          title="מה ללמד שוב"
          blurb="נושאים שרוב הכיתה נופלת בהם. כשכל הכיתה נכשלת באותו מקום, זה שיעור — לא תלמיד."
          count={board.reteach.length}
          empty="אין נושא שהכיתה כולה נופלת בו."
        >
          {board.reteach.map((r) => (
            <div key={r.topic} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span className="w-28 shrink-0 font-semibold text-slate-900 dark:text-slate-50">
                {r.topic}
              </span>
              <Meter value={r.mastery} tone="bad" />
              <span className="w-12 shrink-0 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                {Math.round(r.mastery * 100)}%
              </span>
              <span className="min-w-0 flex-1 text-sm text-slate-500 dark:text-slate-400">
                {r.belowHalf} מתוך {r.measuredStudents} מתחת לחצי
              </span>
              {!isDemo && (
                <button
                  type="button"
                  onClick={() => setFocusFor('class')}
                  className="shrink-0 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700"
                >
                  מקד את הכיתה
                </button>
              )}
            </div>
          ))}
        </Section>

        <Section
          icon={ClipboardCheck}
          title="מה שביקשתי"
          blurb="המיקודים ששלחת, וכמה תלמידים באמת סגרו אותם."
          count={focuses.length}
          empty="עוד לא מיקדת אף אחד. אפשר להתחיל מ״מי צריך אותך״ למעלה."
        >
          {focuses.map((f) => (
            <FocusLine key={f.id} focus={f} />
          ))}
        </Section>

        <Heatmap board={board} windowDays={data.windowDays} onOpen={setOpenStudent} />
      </div>
      )}

      {openStudent && (
        <StudentPanel
          student={openStudent}
          reportHref={isDemo || !classId ? null : `/console/class/${classId}/report?student=${openStudent.id}`}
          onClose={() => setOpenStudent(null)}
          onFocus={
            isDemo
              ? null
              : () => {
                  setFocusFor({ studentId: openStudent.id, name: openStudent.name });
                  setOpenStudent(null);
                }
          }
        />
      )}

      {focusFor !== null && classId && !isDemo && (
        <FocusDialog
          classId={classId}
          students={board.students}
          preselect={focusFor === 'class' ? null : focusFor.studentId}
          onClose={() => setFocusFor(null)}
          onSaved={() => {
            setFocusFor(null);
            onReload();
          }}
        />
      )}
    </main>
  );
}

// ---------------------------------------------------------------- header

function Header({
  klass,
  board,
  classId,
}: {
  klass: Payload['class'];
  board: ClassBoard;
  /** null in the sample view: both exports hit a real class through the guard,
   *  and the demo has none. Offering a button that 403s is worse than not
   *  offering it. */
  classId: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const scored = board.students.map((s) => s.mastery).filter((m): m is number => m !== null);
  const avg = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null;

  return (
    <header>
      <Link
        href="/console"
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-violet-700 dark:text-slate-400 dark:hover:text-violet-300"
      >
        <ArrowRight className="h-4 w-4" aria-hidden />
        הכיתות שלי
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {klass.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {board.studentCount} תלמידים
            {klass.units ? ` · ${klass.units} יח״ל` : ''} · {klass.schoolYear}
          </p>
        </div>

        {klass.joinCode && (
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(klass.joinCode!).then(
                () => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                },
                () => {}
              );
            }}
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-start transition hover:border-violet-300 dark:border-slate-800 dark:bg-slate-900"
            aria-label={copied ? 'הקוד הועתק' : `העתק את קוד ההצטרפות ${klass.joinCode}`}
          >
            <span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                קוד הצטרפות
              </span>
              <span className="block font-mono text-lg font-semibold tracking-widest text-slate-900 dark:text-slate-50">
                {klass.joinCode}
              </span>
            </span>
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" aria-hidden />
            ) : (
              <Copy className="h-4 w-4 text-slate-400 transition group-hover:text-violet-600" aria-hidden />
            )}
          </button>
        )}
      </div>

      {classId && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/console/class/${classId}/report`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Printer className="h-4 w-4" aria-hidden />
            דוח מודפס להורים
          </Link>
          {/* A plain link, not a fetch: the route answers with
              Content-Disposition: attachment, so the browser saves the file and
              the page never has to hold a blob in memory. */}
          <a
            href={`/api/school/classes/${classId}/export`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Download className="h-4 w-4" aria-hidden />
            ייצוא לאקסל
          </a>
        </div>
      )}

      {/* Four scalars with no shared axis — stat tiles, never a chart. The
          alert tone is on the one that costs the teacher time. */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          value={String(board.needsAttention.length)}
          label="צריכים אותך"
          alert={board.needsAttention.length > 0}
        />
        <Stat value={`${board.activeThisWeek}/${board.studentCount}`} label="פעילים השבוע" />
        <Stat
          value={avg === null ? '—' : `${Math.round(avg * 100)}%`}
          label="שליטה ממוצעת"
          hint="ממוצע לפי תלמיד, בלי מי שלא התחיל"
        />
        <Stat value={String(board.neverStarted)} label="טרם התחילו" />
      </div>
    </header>
  );
}

function Stat({
  value,
  label,
  alert = false,
  hint,
}: {
  value: string;
  label: string;
  alert?: boolean;
  hint?: string;
}) {
  return (
    <div
      title={hint}
      className={`rounded-xl border px-4 py-3 ${
        alert
          ? 'border-rose-200 bg-rose-50 dark:border-rose-900/70 dark:bg-rose-950/40'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <div
        className={`font-mono text-2xl leading-none font-semibold tabular-nums ${
          alert ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-slate-50'
        }`}
      >
        {value}
      </div>
      <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

function DemoBanner({ joinCode }: { joinCode: string | null }) {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-900/70 dark:bg-violet-950/40">
      <Eye className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
      <p className="text-sm leading-relaxed text-violet-900 dark:text-violet-200">
        <strong className="font-semibold">זו תצוגת דוגמה.</strong> כך ייראה הלוח כשהתלמידים
        יתרגלו — אותם חישובים, נתונים לדוגמה.
        {joinCode && (
          <>
            {' '}
            תן לכיתה את הקוד{' '}
            <span className="font-mono font-semibold tracking-widest">{joinCode}</span> והמסך הזה
            יתמלא בנתונים אמיתיים.
          </>
        )}
      </p>
    </div>
  );
}

/**
 * Two modes, because a teacher has two jobs and they want opposite screens.
 *
 * סקירה answers "who needs me this week" in four lines — the 08:15,
 * between-lessons question, where a list of thirty-one is the wrong answer.
 * תלמידים is for sitting down with the whole class: a sortable table, which is
 * the thing a heatmap structurally cannot be and a stack of cards cannot be
 * scanned as.
 *
 * The board shipped with only the first, and the owner kept saying the tracking
 * was uncomfortable. He was describing the missing mode, not a broken one.
 */
function Tabs({
  value,
  onChange,
  studentCount,
}: {
  value: 'overview' | 'students';
  onChange: (v: 'overview' | 'students') => void;
  studentCount: number;
}) {
  const tabs: { id: 'overview' | 'students'; label: string; hint: string }[] = [
    { id: 'overview', label: 'סקירה', hint: 'מי צריך אותך עכשיו' },
    { id: 'students', label: `תלמידים · ${studentCount}`, hint: 'הרשימה המלאה, ממוינת' },
  ];
  return (
    <div className="mt-6 flex gap-2 border-b border-slate-200 dark:border-slate-800">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          title={t.hint}
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            value === t.id
              ? 'border-violet-600 text-violet-700 dark:text-violet-300'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- sections

function Section({
  icon: Icon,
  title,
  blurb,
  count,
  empty,
  children,
}: {
  icon: typeof LifeBuoy;
  title: string;
  blurb: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
            {title}
            {count > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {count}
              </span>
            )}
          </h2>
          {/* One line saying what the panel is FOR. Without it the reader has
              to reverse-engineer the intent from the rows. */}
          <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {blurb}
          </p>
        </div>
      </div>
      <div className="divide-y divide-slate-100 px-5 dark:divide-slate-800">
        {count === 0 ? (
          <p className="py-5 text-sm text-slate-400 dark:text-slate-500">{empty}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

const STATE_STYLE: Record<
  AttentionRow['state'],
  { label: string; cls: string; Icon: typeof Clock }
> = {
  stuck: {
    label: 'תקוע',
    cls: 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-200',
    Icon: AlertTriangle,
  },
  away: {
    label: 'לא נכנס',
    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200',
    Icon: Clock,
  },
  'no-data': {
    label: 'טרם התחיל',
    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    Icon: UserPlus,
  },
};

function AttentionLine({
  row,
  onOpen,
  onFocus,
}: {
  row: AttentionRow;
  onOpen: () => void;
  onFocus: (() => void) | null;
}) {
  const s = STATE_STYLE[row.state];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${s.cls}`}
      >
        <s.Icon className="h-3.5 w-3.5" aria-hidden />
        {s.label}
      </span>
      <button
        type="button"
        onClick={onOpen}
        className="w-24 shrink-0 rounded text-start font-semibold text-slate-900 underline-offset-4 transition hover:text-violet-700 hover:underline dark:text-slate-50 dark:hover:text-violet-300"
      >
        {row.name}
      </button>
      {/* max-w so a wide screen does not push the actions to the far edge with
          a hand-span of dead space in between — the reason and the button it
          justifies have to be readable as one thought. */}
      <span className="min-w-0 flex-1 text-sm text-slate-600 sm:max-w-md dark:text-slate-400">
        {row.reason}
      </span>
      <div className="flex shrink-0 items-center gap-2 sm:ms-auto">
        <button
          type="button"
          onClick={onOpen}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:text-slate-300"
        >
          לכרטיס
        </button>
        {onFocus && (
          <button
            type="button"
            onClick={onFocus}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700"
          >
            מקד
          </button>
        )}
      </div>
    </div>
  );
}

function FocusLine({ focus }: { focus: FocusRow }) {
  const pct = focus.totalCount > 0 ? focus.done / focus.totalCount : 0;
  const due = hebDate(focus.dueOn);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <span className="w-24 shrink-0 font-semibold text-slate-900 dark:text-slate-50">
        {focus.targetedCount === null ? 'כל הכיתה' : `${focus.targetedCount} תלמידים`}
      </span>
      <span className="min-w-0 flex-1 text-sm text-slate-600 dark:text-slate-400">
        {focus.label}
        {focus.targetCount ? ` · ${focus.targetCount} תרגילים` : ''}
        {due ? ` · עד ${due}` : ''}
      </span>
      <Meter value={pct} tone={pct >= 0.75 ? 'good' : 'neutral'} />
      <span className="w-12 shrink-0 text-end font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
        {focus.done}/{focus.totalCount}
      </span>
    </div>
  );
}

/** A thin track. 6px, rounded ends, recessive rail — the value is the mark, not
 *  the container. */
function Meter({ value, tone }: { value: number; tone: 'good' | 'bad' | 'neutral' }) {
  const cls =
    tone === 'bad'
      ? 'bg-orange-500 dark:bg-orange-600'
      : tone === 'good'
        ? 'bg-teal-600 dark:bg-teal-500'
        : 'bg-violet-500 dark:bg-violet-400';
  return (
    <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 sm:w-32">
      <span
        className={`block h-full rounded-full ${cls}`}
        style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }}
      />
    </span>
  );
}

// ---------------------------------------------------------------- heatmap

/** "No data" is not a sixth, worst colour — it is the absence of a score, and
 *  it must never sit beside a failing cell looking equally alarming. */
const NO_DATA_CELL =
  'border border-dashed border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600';

function Heatmap({
  board,
  windowDays,
  onOpen,
}: {
  board: ClassBoard;
  windowDays: number;
  onOpen: (s: StudentRow) => void;
}) {
  if (board.topics.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-800">
        אין עדיין תשובות ב-{windowDays} הימים האחרונים, אז אין מה למפות.
      </p>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Grid3x3 className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">כל התלמידים</h2>
          <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            אחוז השליטה של כל תלמיד בכל נושא. טור שכולו כתום הוא נושא ללמד מחדש; שורה שכולה
            כתומה היא תלמיד לשיחה. לחיצה פותחת את הכרטיס שלו.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto px-5 py-4">
        {/* w-full so the grid uses the width it is given: at 3px spacing and a
            fixed cell width it collapsed into the right half of the card and
            left a dead margin the size of the map itself. */}
        {/* Auto width and centred, NOT full width. Stretching four columns
            across the card turned every cell into a block — the thing that made
            the first version look like a prototype. Centring keeps the names
            beside their own row instead of a hand-span away from it. */}
        <table className="mx-auto border-separate border-spacing-[3px] text-sm">
          <thead>
            <tr>
              <th className="w-28 pe-3 text-start text-xs font-medium text-slate-400">תלמיד</th>
              {board.topics.map((t) => (
                <th
                  key={t}
                  className="px-1 pb-1 text-center text-xs font-medium whitespace-nowrap text-slate-500 dark:text-slate-400"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {board.students.map((s) => (
              <HeatRow key={s.id} student={s} topics={board.topics} onOpen={() => onOpen(s)} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          {MASTERY_LEGEND.map((b) => (
            <span key={b.label} className="flex items-center gap-1">
              <span className={`inline-block h-3 w-4 rounded ${b.cell}`} aria-hidden />
              <span className="tabular-nums">{b.label}</span>
            </span>
          ))}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-4 rounded ${NO_DATA_CELL}`} aria-hidden />
          אין נתונים — לא אפס
        </span>
        <span className="ms-auto">{windowDays} הימים האחרונים</span>
      </div>
    </section>
  );
}

function HeatRow({
  student,
  topics,
  onOpen,
}: {
  student: StudentRow;
  topics: string[];
  onOpen: () => void;
}) {
  return (
    <tr className="group">
      <td className="pe-3 whitespace-nowrap">
        <button
          type="button"
          onClick={onOpen}
          className="rounded text-sm font-medium text-slate-700 underline-offset-4 transition group-hover:text-violet-700 hover:underline dark:text-slate-300 dark:group-hover:text-violet-300"
        >
          {student.name}
        </button>
      </td>
      {topics.map((t) => {
        const row = student.topics.find((x) => x.topic === t);
        const m = row?.mastery ?? null;
        const band = m === null ? null : masteryCell(m);
        return (
          <td key={t}>
            <button
              type="button"
              onClick={onOpen}
              className={`block h-8 w-20 rounded-md text-center font-mono text-xs font-semibold tabular-nums transition hover:ring-2 hover:ring-violet-400 hover:ring-offset-1 dark:hover:ring-offset-slate-900 ${
                band ? band.cell : NO_DATA_CELL
              }`}
              title={
                m === null
                  ? `${student.name} · ${t}: אין נתונים`
                  : `${student.name} · ${t}: ${row!.correct} מתוך ${row!.measured} — ${band!.label}`
              }
            >
              {m === null ? '·' : Math.round(m * 100)}
            </button>
          </td>
        );
      })}
    </tr>
  );
}

// ---------------------------------------------------------------- focus dialog

/**
 * Four closed lists and a date. No free-text task, no question editor — the
 * teacher points at content that already exists, which is the whole product
 * decision. The one text field is an optional note.
 */
function FocusDialog({
  classId,
  students,
  preselect,
  onClose,
  onSaved,
}: {
  classId: string;
  students: StudentRow[];
  preselect: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [catalogue, setCatalogue] = useState<CatalogueTopic[] | null>(null);
  const [topic, setTopic] = useState('');
  const [subTopicId, setSubTopicId] = useState('');
  const [rung, setRung] = useState<string>('');
  const [targetCount, setTargetCount] = useState(5);
  const [dueOn, setDueOn] = useState('');
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState<string[]>(preselect ? [preselect] : []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/school/focus')
      .then((r) => r.json())
      .then((d) => setCatalogue(d.catalogue ?? []))
      .catch(() => setCatalogue([]));
  }, []);

  const entry = catalogue?.find((c) => c.topic === topic);
  const sub = entry?.subTopics.find((s) => s.id === subTopicId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/school/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          topic,
          subTopicId: subTopicId || undefined,
          rung: rung || undefined,
          targetCount,
          dueOn: dueOn || undefined,
          note: note.trim() || undefined,
          studentIds: picked,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? 'לא הצלחנו לשמור');
        return;
      }
      onSaved();
    } catch {
      setMessage('לא הצלחנו לשמור. נסה שוב.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      // Above the app header (z-[90]) and the mobile tab bar (z-[55]).
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
    >
      <form
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label="מיקוד תלמידים"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"
      >
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-50">
          <Target className="h-5 w-5 text-violet-600" aria-hidden />
          מיקוד
        </h2>
        <p className="mt-1 mb-4 text-sm text-slate-500 dark:text-slate-400">
          בחר מה שיתרגלו מתוך התוכן הקיים. הם יראו את זה כשלב מסומן במסלול שלהם.
        </p>

        <Field label="נושא">
          <select
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setSubTopicId('');
              setRung('');
            }}
            className={selectCls}
            required
          >
            <option value="">בחר נושא…</option>
            {(catalogue ?? []).map((c) => (
              <option key={c.topic} value={c.topic}>
                {c.topic}
              </option>
            ))}
          </select>
        </Field>

        {entry && entry.subTopics.length > 0 && (
          <Field label="תת-נושא (אופציונלי)">
            <select
              value={subTopicId}
              onChange={(e) => {
                setSubTopicId(e.target.value);
                setRung('');
              }}
              className={selectCls}
            >
              <option value="">כל הנושא</option>
              {entry.subTopics.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </Field>
        )}

        {sub && (
          <Field label="שלב (אופציונלי)">
            <select value={rung} onChange={(e) => setRung(e.target.value)} className={selectCls}>
              <option value="">כל הסולם</option>
              {/* Only the rungs this sub-topic really has — offering "אתגר"
                  where there are no hard questions sends a class at a blank
                  screen. */}
              {sub.rungs.map((r) => (
                <option key={r} value={r}>
                  {RUNG_LABEL[r]}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="כמה תרגילים">
            <input
              type="number"
              min={1}
              max={100}
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className={selectCls}
            />
          </Field>
          <Field label="עד מתי (אופציונלי)">
            <input
              type="date"
              value={dueOn}
              onChange={(e) => setDueOn(e.target.value)}
              className={selectCls}
            />
          </Field>
        </div>

        <Field label="הערה (אופציונלי)">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="שורה אחת לתלמיד"
            className={selectCls}
          />
        </Field>

        <fieldset className="mt-4">
          <legend className="text-sm text-slate-600 dark:text-slate-400">
            למי — בלי בחירה, זה הולך לכל הכיתה
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {students.map((s) => {
              const on = picked.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setPicked((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))
                  }
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    on
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </fieldset>

        {message && (
          <p role="status" className="mt-3 text-sm text-rose-600 dark:text-rose-400">
            {message}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            disabled={busy || !topic}
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-700 disabled:opacity-40"
          >
            {busy ? 'שולח…' : picked.length ? `מקד ${picked.length} תלמידים` : 'מקד את כל הכיתה'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}

const selectCls =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}
