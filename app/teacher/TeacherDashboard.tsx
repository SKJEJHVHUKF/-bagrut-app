'use client';

// TeacherDashboard — "מצב הכיתה": what a teacher sees about his own students,
// plus his hours and pay. Server side: /api/teacher/overview.
//
// WHO THIS SCREEN IS FOR, AND WHAT THAT CHANGED (2026-09-08 rewrite).
// Veteran maths teachers. They have taught for decades with a textbook, a
// blackboard and a pile of notebooks, and they have no patience budget for
// learning a product. The previous version of this board was built for someone
// who enjoys data: three stat tiles, per-topic accuracy tables, fortnightly
// deltas, twenty recent mistakes, ten distinct font sizes down to 10px. All of
// it true, none of it a decision.
//
// So the board now answers exactly two questions per student, in this order:
//   1. Does he need me?      → one coloured light with the reason IN WORDS
//   2. What do I do about it? → one button that does it
// Everything else is still here, one `<details>` deeper, for the teacher who
// wants it. Nothing was deleted from the payload — it was demoted.
//
// Everything is derived from answers the student already gave
// (learning_state.results) and from the weekly figure the owner set. No model
// is called, here or in the route — the teacher system costs nothing to look at.
//
// ⚠️ THE ONE LIE THIS SCREEN COULD TELL. A student who never signed in has no
// synced answer log, and "0 questions" would read as "he did nothing all week"
// — straight into a lesson with a student who may have worked hard on another
// device. He gets a GREY light and a sentence, never a red one and never a
// zero. The rule lives in lib/teacher-status and is covered by
// `npm run verify:teacher-status`.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MathUpLogo from '@/components/MathUpLogo';
import { MathText } from '@/components/practice/MathText';
import { PageHeader } from '@/components/PageHeader';
import {
  ArrowLeft,
  Check,
  Eye,
  LogOut,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import {
  studentStatus,
  LIGHT_ORDER,
  RUNG,
  type Light,
  type Target,
  type StudentStatus,
} from '@/lib/teacher-status';

type Assignment = {
  id: string;
  title: string;
  topic: string;
  subTopicId: string | null;
  targetCount: number;
  dueDate: string | null;
  createdAt: string;
  answered: number;
  correct: number;
  complete: boolean;
};

type TopicRow = { topic: string; answered: number; correct: number; hints: number; accuracy: number };

/** A weak topic, plus the one sub-topic inside it that is weakest. */
type StuckRow = TopicRow & {
  worstSubTopic: {
    subTopicId: string;
    title: string;
    answered: number;
    correct: number;
    accuracy: number;
  } | null;
};

type WrongRow = {
  topic: string;
  ts: number | null;
  hintUsed: boolean;
  difficulty: string | null;
  diagnosis: string | null;
  note: string | null;
};

type TopicOption = {
  key: string;
  label: string;
  subs: { id: string; title: string }[];
};

type StuckRung = {
  topic: string;
  subId: string;
  title: string;
  kind: string;
  attempts: number;
};

type Student = {
  id: string;
  /** Display name only — the API deliberately sends no email. */
  name: string;
  syncedAt: string | null;
  lastAnswerAt: number | null;
  /** First attempts only — replays are activity, not measurement. */
  answered: number;
  correct: number;
  accuracy: number;
  selfReported: number;
  difficulty: { easy: number; mid: number; hard: number };
  report: {
    earlyDays: boolean;
    weaknesses: {
      kind: string;
      topic: string;
      subTopicId: string;
      title: string;
      detail: string;
      band: string;
      chronic: boolean;
    }[];
    totalAnswered: number;
    patterns: {
      label: string;
      detail: string;
      fix: string;
      hits: number;
      share: number;
      spread: number;
      topics: string[];
    }[];
    movement: { topic: string; delta: number; recentAttempts: number; priorAttempts: number }[];
  };
  bagrut: { answered: number; correct: number };
  bagrutDate: string | null;
  daysToBagrut: number | null;
  targetGrade: number | null;
  /** Distinct days he practised in the last 30. */
  activeDays: number;
  totalDays: number;
  topics: TopicRow[];
  stuck: StuckRow[];
  stuckRungs: StuckRung[];
  recentWrong: WrongRow[];
  assignments: Assignment[];
};

type WeekRow = {
  weekStart: string;
  hours: number;
  edited: boolean;
  note: string | null;
  counted: boolean;
};

type Pay = {
  rate: number;
  weeklyHours: number;
  week: { weekStart: string; hours: number; pay: number; edited: boolean };
  month: { month: string; hours: number; pay: number; weeks: WeekRow[] };
};

/** The shape of a wrong answer, as lib/answer-check read it. */
const DIAGNOSIS: Record<string, string> = {
  'sign-flip': 'טעות סימן',
  conjugate: 'צמוד במקום המספר עצמו',
  'partial-set': 'מצא רק חלק מהפתרונות',
  'extra-root': 'שורש שתחום ההגדרה פוסל',
  swapped: 'הערכים הנכונים בתיבות הפוכות',
  'known-mistake': 'טעות אופיינית מוכרת',
};

// ₪ via Intl, not a hand-built `₪${n}` string. The manual form renders the
// symbol jammed against the digits and, in an RTL line, on the wrong side of
// them — "₪0" came out looking like a typo. Intl emits the Hebrew convention
// (900 ₪) with the bidi marks that keep it there.
const ILS = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const shekel = (n: number) => ILS.format(n);
const pct = (n: number) => `${Math.round(n * 100)}%`;

function dayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
  });
}

function timeAgo(when: string | number | null): string {
  if (when === null) return 'אף פעם';
  const ms = Date.now() - (typeof when === 'number' ? when : Date.parse(when));
  if (!Number.isFinite(ms)) return '—';
  const days = Math.floor(ms / 86400000);
  if (days > 30) return `לפני ${Math.floor(days / 30)} חודשים`;
  if (days > 0) return `לפני ${days} ימים`;
  const hours = Math.floor(ms / 3600000);
  if (hours > 0) return `לפני ${hours} שעות`;
  return 'ממש עכשיו';
}

/** Colour is never the only carrier — every one of these is rendered next to
 *  the word for it (lib/teacher-status `label`). These are the AA-contrast
 *  pairs on the ivory canvas; the dot is the strong tone, the text the darkest. */
const LIGHT_STYLE: Record<Light, { card: string; dot: string; word: string }> = {
  red: { card: 'border-red-300 bg-red-50', dot: 'bg-red-600', word: 'text-red-900' },
  yellow: { card: 'border-amber-300 bg-amber-50', dot: 'bg-amber-500', word: 'text-amber-900' },
  green: { card: 'border-emerald-300 bg-emerald-50', dot: 'bg-emerald-600', word: 'text-emerald-900' },
  none: { card: 'border-slate-300 bg-slate-50', dot: 'bg-slate-400', word: 'text-slate-800' },
};

/** Big, obvious, and labelled with a word. 48px min height — these are pressed
 *  by people who are not looking for a 32px icon. */
const BTN =
  'inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl text-base font-bold transition-colors disabled:opacity-50';
const BTN_PRIMARY = `${BTN} bg-violet-700 hover:bg-violet-800 text-white`;
const BTN_PLAIN = `${BTN} bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-800`;

export default function TeacherDashboard({
  name,
  rate,
  weeklyHours,
  topics,
  viewingAs,
}: {
  name: string;
  rate: number;
  weeklyHours: number;
  topics: TopicOption[];
  /** Set when the OWNER is looking at this teacher's board — see app/teacher/page. */
  viewingAs: string | null;
}) {
  // Every call carries the same `?as=`, so the board and the actions on it are
  // always about the same teacher.
  const query = viewingAs ? `?as=${encodeURIComponent(viewingAs)}` : '';
  const [students, setStudents] = useState<Student[] | null>(null);
  const [pay, setPay] = useState<Pay | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`/api/teacher/overview${query}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'שגיאה בטעינה');
      setStudents(json.students ?? []);
      setPay(json.pay ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בטעינה');
      setStudents([]);
    }
  }, [query]);

  useEffect(() => {
    // The rule does not analyse `await` boundaries: an async function called from
    // an effect is flagged even when every setState in it happens after the first
    // await. Nothing here setStates synchronously, so there is no cascading
    // render to fix. Same reasoning and same suppression as AdminDashboard.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const topicLabel = useCallback(
    (key: string) => topics.find((t) => t.key === key)?.label ?? key,
    [topics]
  );

  // The roster IS the worklist, so it is ordered by who needs the teacher —
  // not by who happened to answer a question most recently.
  const rows = useMemo(() => {
    if (!students) return null;
    return students
      .map((s) => ({ student: s, status: studentStatus(s, topicLabel) }))
      .sort((a, b) => LIGHT_ORDER[a.status.light] - LIGHT_ORDER[b.status.light]);
  }, [students, topicLabel]);

  const counts = useMemo(() => {
    const c: Record<Light, number> = { red: 0, yellow: 0, green: 0, none: 0 };
    for (const r of rows ?? []) c[r.status.light]++;
    return c;
  }, [rows]);

  const termsMissing = rate <= 0 || weeklyHours <= 0;

  return (
    <div
      className="min-h-screen bg-[#FDFDFB] text-slate-900"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      <nav className="sticky top-0 z-50 bg-white border-b-2 border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <MathUpLogo size="md" />
            <div>
              <div className="text-lg font-black font-display text-slate-900">MathUp</div>
              <div className="text-sm text-slate-700 -mt-0.5">מצב הכיתה</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {/* The learner's chrome is hidden on staff screens, and the sign-out
                button lived inside it — without this, the only way off this
                screen is to leave the staff area first. */}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border-2 border-slate-300 bg-white hover:bg-red-50 hover:border-red-400 text-slate-800 hover:text-red-800 text-base font-bold transition-colors"
              >
                <LogOut aria-hidden="true" className="w-4 h-4" />
                <span>התנתקות</span>
              </button>
            </form>
            <Link
              href="/"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-base font-bold transition-colors"
            >
              <span>לאפליקציה</span>
              <ArrowLeft aria-hidden="true" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 text-base">
        <PageHeader
          title="מצב הכיתה"
          description={`${name} — מי צריך אותך עכשיו, ומה לתת לו.`}
          actions={
            <button
              onClick={() => void load()}
              className={BTN_PLAIN}
            >
              <RefreshCw aria-hidden="true" className={`w-4 h-4 ${students === null ? 'animate-spin' : ''}`} />
              <span>רענון</span>
            </button>
          }
        />

        {viewingAs && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-violet-300 bg-violet-50 px-4 py-3 text-base font-bold text-violet-900">
            <Eye aria-hidden="true" className="w-5 h-5" />
            <span className="flex-1">אתה צופה בלוח של {name} כמנהל המערכת.</span>
            <Link href="/admin/teachers" className={BTN_PLAIN}>
              חזרה לניהול
            </Link>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-3 text-base font-bold text-red-800"
          >
            {error}
          </div>
        )}

        {termsMissing && (
          <div className="mb-5 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-base font-bold text-amber-900">
            תנאי השכר שלך עדיין לא הוגדרו במערכת. עד שיוגדרו, השעות והשכר יוצגו כאפס.
          </div>
        )}

        {/* One sentence instead of three stat tiles. A teacher opening this on
            Sunday morning wants to know how many students need him today. */}
        {rows && rows.length > 0 && (
          <p className="mb-5 text-lg text-slate-800">
            <b className="font-black">{rows.length} תלמידים.</b>{' '}
            {counts.red > 0 ? (
              <>
                <b className="font-black text-red-800">{counts.red} דורשים טיפול</b>
                {counts.yellow > 0 && `, ${counts.yellow} צריכים חיזוק`}.
              </>
            ) : counts.yellow > 0 ? (
              <>{counts.yellow} צריכים חיזוק, אף אחד לא במצב דחוף.</>
            ) : (
              <>כולם בשליטה.</>
            )}
          </p>
        )}

        {students === null && (
          <div className="text-lg text-slate-700 py-10 text-center">טוען…</div>
        )}

        {rows?.length === 0 && (
          <div className="rounded-2xl border-2 border-slate-300 bg-white px-4 py-10 text-center text-lg text-slate-700">
            עדיין לא שויכו אליך תלמידים. איתי משייך אותם בלוח הבקרה.
          </div>
        )}

        <div className="space-y-3">
          {rows?.map(({ student, status }) => (
            <StudentRow
              key={student.id}
              student={student}
              status={status}
              topics={topics}
              query={query}
              open={openId === student.id}
              onToggle={() => setOpenId(openId === student.id ? '' : student.id)}
              onChanged={load}
            />
          ))}
        </div>

        {pay && <PaySection pay={pay} />}
      </main>
    </div>
  );
}

// ============================================================
// One student, as a row: the light, the sentence, the button.
// ============================================================

function StudentRow({
  student,
  status,
  topics,
  query,
  open,
  onToggle,
  onChanged,
}: {
  student: Student;
  status: StudentStatus;
  topics: TopicOption[];
  query: string;
  open: boolean;
  onToggle: () => void;
  onChanged: () => Promise<void>;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState('');
  const [sendError, setSendError] = useState('');
  const style = LIGHT_STYLE[status.light];
  const openTasks = student.assignments.filter((a) => !a.complete).length;

  // THE one click. Everything it needs was already computed: the target comes
  // from the same rule that produced the sentence above the button, so the
  // teacher gives practice in exactly the thing the board just told him about.
  // No dialog, no form, no second screen — and it is undone by the delete
  // button on the task itself.
  async function sendPractice(target: Target) {
    setSending(true);
    setSendError('');
    try {
      const res = await fetch(`/api/teacher/assignments${query}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          title: `תרגול ממוקד: ${target.title}`,
          topic: target.topic,
          subTopicId: target.subTopicId || undefined,
          targetCount: 5,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'לא הצלחנו לשלוח');
      setSent(`נשלחו 5 שאלות בנושא ${target.title}. הן מחכות לו במסך התוכנית שלו.`);
      await onChanged();
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'לא הצלחנו לשלוח');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className={`rounded-2xl border-2 ${style.card}`}>
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span aria-hidden="true" className={`w-4 h-4 rounded-full shrink-0 ${style.dot}`} />
          <h2 className="text-xl font-black text-slate-900">{student.name}</h2>
          {/* The word, not just the colour. */}
          <span className={`text-base font-black ${style.word}`}>{status.label}</span>
          {openTasks > 0 && (
            <span className="text-base text-slate-700">· {openTasks} שיעורי בית פתוחים</span>
          )}
        </div>

        {/* The whole point of the screen. */}
        <p className="mt-2 text-lg leading-relaxed text-slate-900">{status.headline}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {status.target && (
            <button onClick={() => void sendPractice(status.target as Target)} disabled={sending} className={BTN_PRIMARY}>
              {sending ? 'שולח…' : 'שלח תרגול ממוקד'}
            </button>
          )}
          <button onClick={onToggle} aria-expanded={open} className={BTN_PLAIN}>
            {open ? 'סגירה' : 'פרטים ושיעורי בית'}
          </button>
        </div>

        {sent && (
          <p role="status" className="mt-3 flex items-start gap-2 text-base font-bold text-emerald-800">
            <Check aria-hidden="true" className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{sent}</span>
          </p>
        )}
        {sendError && (
          <p role="alert" className="mt-3 text-base font-bold text-red-800">
            {sendError}
          </p>
        )}
      </div>

      {open && (
        <div className="border-t-2 border-white/70 bg-white/70 px-5 py-5 space-y-6">
          <StudentDetail student={student} topics={topics} query={query} onChanged={onChanged} />
        </div>
      )}
    </section>
  );
}

// ============================================================
// One student, opened.
// ============================================================

function StudentDetail({
  student,
  topics,
  query,
  onChanged,
}: {
  student: Student;
  topics: TopicOption[];
  /** `?as=` when the owner is acting on a teacher's board; '' otherwise. */
  query: string;
  onChanged: () => Promise<void>;
}) {
  const label = (key: string) => topics.find((t) => t.key === key)?.label ?? key;

  if (student.syncedAt === null) {
    return (
      <>
        <p className="text-lg leading-relaxed text-amber-900 bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3">
          אין נתוני תרגול לתלמיד הזה: הוא עדיין לא נכנס לאפליקציה עם החשבון ששויך אליו. זה לא אומר
          שהוא לא תרגל — זה אומר שאין מה למדוד.
        </p>
        <Homework student={student} topics={topics} query={query} onChanged={onChanged} />
      </>
    );
  }

  return (
    <>
      {(student.daysToBagrut !== null || student.bagrut.answered > 0) && (
        <p className="text-lg text-violet-900 bg-violet-50 border-2 border-violet-200 rounded-xl px-4 py-3">
          {student.daysToBagrut !== null && (
            <b className="font-black">
              {student.daysToBagrut > 0
                ? `הבגרות בעוד ${student.daysToBagrut} ימים`
                : student.daysToBagrut === 0
                  ? 'הבגרות היום'
                  : 'הבגרות כבר עברה'}
            </b>
          )}
          {student.targetGrade !== null && <> · יעד: {student.targetGrade}</>}
          {' · '}
          {student.bagrut.answered === 0
            ? 'עוד לא פתר שאלות בגרות'
            : `שאלות בגרות: ${student.bagrut.correct} נכונות מתוך ${student.bagrut.answered}`}
        </p>
      )}

      {/* WHAT IS BROKEN, IN WORDS SOMEBODY WROTE — the only thing on the board
          that answers "what", rather than "where". */}
      {(student.report.weaknesses.length > 0 || student.report.patterns.length > 0) && (
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-1">
            מה {student.name} לא מבין
          </h3>
          {/* The authored explanations are written TO the student, in the second
              person. Rather than conjugate them into third person — which
              Hebrew does not survive as a string transform — they are labelled
              as what they are. The teacher then also knows what the app has
              already told him. */}
          <p className="text-base text-slate-700 mb-3">
            הניסוחים כאן הם הטקסט ש{student.name} עצמו רואה באפליקציה.
          </p>

          <div className="space-y-3">
            {student.report.weaknesses.map((w) => (
              <div
                key={`${w.topic}-${w.subTopicId}-${w.title}`}
                className="rounded-xl border-2 border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  {w.kind === 'misconception' && (
                    <span className="text-sm font-black bg-violet-700 text-white rounded-full px-3 py-0.5">
                      טעות מזוהה
                    </span>
                  )}
                  {w.chronic && (
                    <span className="text-sm font-black bg-red-700 text-white rounded-full px-3 py-0.5">
                      חזרה אחרי תיקון
                    </span>
                  )}
                  <span className="text-lg font-black text-slate-900">{w.title}</span>
                  <span className="text-base text-slate-700">{label(w.topic)}</span>
                </div>
                <div className="text-base text-slate-800 mt-1.5 leading-relaxed">
                  <MathText inline>{w.detail}</MathText>
                </div>
              </div>
            ))}

            {student.report.patterns.map((p) => (
              <div key={p.label} className="rounded-xl border-2 border-violet-200 bg-violet-50 px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-black bg-violet-700 text-white rounded-full px-3 py-0.5">
                    חוזר על עצמו
                  </span>
                  <span className="text-lg font-black text-violet-950">{p.label}</span>
                  <span className="text-base text-violet-900">
                    {p.hits} פעמים
                    {p.spread > 1 ? ` · ב-${p.spread} תתי-נושאים` : ''}
                  </span>
                </div>
                <div className="text-base text-slate-800 mt-1.5 leading-relaxed">
                  <MathText inline>{p.detail}</MathText>
                </div>
                <div className="text-base text-emerald-900 mt-2 leading-relaxed">
                  <b>מה עוצר את זה: </b>
                  <MathText inline>{p.fix}</MathText>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* A rung he keeps coming back to and keeps not passing. */}
      {student.stuckRungs.length > 0 && (
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-2">שלבים שניסה ולא עבר</h3>
          <ul className="space-y-2">
            {student.stuckRungs.map((r) => (
              <li
                key={`${r.topic}-${r.subId}-${r.kind}`}
                className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-2.5 text-base text-slate-900"
              >
                <b className="font-black">{r.title}</b> ברמת {RUNG[r.kind] ?? r.kind} — {r.attempts}{' '}
                ניסיונות
              </li>
            ))}
          </ul>
        </div>
      )}

      <Homework student={student} topics={topics} query={query} onChanged={onChanged} />

      {/* Everything the old board showed by default. Native <details>: no
          state, no library, and it stays closed until a teacher asks for it. */}
      <details className="rounded-xl border-2 border-slate-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-base font-bold text-slate-800 min-h-[48px] flex items-center">
          עוד נתונים על {student.name}
        </summary>
        <div className="px-4 pb-4 space-y-5 border-t border-slate-200 pt-4">
          <p className="text-base text-slate-800 leading-relaxed">
            תרגל ב-<b>{student.activeDays}</b> ימים מתוך 30 האחרונים
            {student.totalDays > student.activeDays && ` (${student.totalDays} ימים בסך הכל)`}
            {' · '}
            {student.answered} שאלות ראשונות
            {student.difficulty.hard > 0 && `, מתוכן ${student.difficulty.hard} ברמת אתגר`}
            {student.selfReported > 0 && (
              <> · <b className="text-amber-800">{student.selfReported} מהן הוא בדק בעצמו</b></>
            )}
            . חזרות על שאלה שכבר נענתה אינן נספרות באחוזים — כמו במסך של התלמיד.
          </p>

          {student.stuck.length > 0 && (
            <div>
              <h4 className="text-base font-black text-slate-900 mb-2">נושאים חלשים</h4>
              <ul className="space-y-1.5">
                {student.stuck.map((t) => (
                  <li key={t.topic} className="text-base text-slate-800">
                    <b>{label(t.topic)}</b> — {t.answered - t.correct} טעויות מתוך {t.answered} (
                    {pct(t.accuracy)})
                    {t.worstSubTopic && (
                      <> · הכי חלש בתוכו: {t.worstSubTopic.title} ({pct(t.worstSubTopic.accuracy)})</>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {student.topics.length > 0 && (
            <div>
              <h4 className="text-base font-black text-slate-900 mb-2">לפי נושא</h4>
              <ul className="space-y-1">
                {student.topics.map((t) => (
                  <li key={t.topic} className="flex items-center gap-3 text-base text-slate-800">
                    <span className="flex-1 truncate">{label(t.topic)}</span>
                    <span className="text-slate-700">
                      {t.correct}/{t.answered}
                    </span>
                    <span
                      className={`font-bold w-12 text-left ${
                        t.accuracy < 0.6 ? 'text-red-700' : 'text-emerald-800'
                      }`}
                    >
                      {pct(t.accuracy)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {student.report.movement.length > 0 && (
            <div>
              <h4 className="text-base font-black text-slate-900 mb-2">מה זז בשבועיים האחרונים</h4>
              <ul className="space-y-1">
                {student.report.movement.map((m) => (
                  <li key={m.topic} className="text-base text-slate-800">
                    {label(m.topic)} — {m.delta > 0 ? 'השתפר ב-' : 'ירד ב-'}
                    {Math.abs(Math.round(m.delta * 100))}% ({m.priorAttempts}→{m.recentAttempts}{' '}
                    שאלות)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {student.recentWrong.length > 0 && (
            <div>
              <h4 className="text-base font-black text-slate-900 mb-2">הטעויות האחרונות</h4>
              <ul className="space-y-1">
                {student.recentWrong.slice(0, 5).map((w, i) => (
                  <li key={`${w.ts}-${i}`} className="text-base text-slate-800">
                    <b>{label(w.topic)}</b>
                    {w.diagnosis === 'known-mistake' && w.note
                      ? ` — ${w.note}`
                      : w.diagnosis
                        ? ` — ${DIAGNOSIS[w.diagnosis] ?? w.diagnosis}`
                        : ''}
                    {w.hintUsed ? ' · טעה גם אחרי רמז' : ''} · {timeAgo(w.ts)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </>
  );
}

// ============================================================
// שיעורי בית — the list, and the manual form under it.
// ============================================================

function Homework({
  student,
  topics,
  query,
  onChanged,
}: {
  student: Student;
  topics: TopicOption[];
  query: string;
  onChanged: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState(topics[0]?.key ?? '');
  const [subTopicId, setSubTopicId] = useState('');
  const [targetCount, setTargetCount] = useState(5);
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const label = (key: string) => topics.find((t) => t.key === key)?.label ?? key;
  const subs = topics.find((t) => t.key === topic)?.subs ?? [];

  async function addAssignment(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const res = await fetch(`/api/teacher/assignments${query}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          title,
          topic,
          subTopicId: subTopicId || undefined,
          targetCount,
          dueDate: dueDate || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'שגיאה');
      setTitle('');
      setDueDate('');
      setSubTopicId('');
      setShowForm(false);
      await onChanged();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  }

  async function removeAssignment(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/teacher/assignments${query}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  const field = 'w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base min-h-[48px]';

  return (
    <div>
      <h3 className="text-lg font-black text-slate-900 mb-2">שיעורי בית</h3>

      <ul className="space-y-2 mb-3">
        {student.assignments.length === 0 && (
          <li className="text-base text-slate-700">עוד לא נתת לו שיעורי בית.</li>
        )}
        {student.assignments.map((a) => (
          <li
            key={a.id}
            className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 border-2 ${
              a.complete ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-300'
            }`}
          >
            <div className="flex-1 min-w-[180px]">
              <div className="text-base font-black text-slate-900">{a.title}</div>
              <div className="text-base text-slate-700">
                {label(a.topic)}
                {a.subTopicId
                  ? ` · ${
                      topics.find((t) => t.key === a.topic)?.subs.find((st) => st.id === a.subTopicId)
                        ?.title ?? a.subTopicId
                    }`
                  : ''}
                {a.dueDate ? ` · עד ${dayLabel(a.dueDate)}` : ''}
              </div>
            </div>
            <div className="text-base font-black text-slate-900">
              {a.complete ? 'סיים' : `פתר ${a.answered} מתוך ${a.targetCount}`}
              <span className="font-normal text-slate-700"> · {a.correct} נכון</span>
            </div>
            <button
              onClick={() => void removeAssignment(a.id)}
              disabled={busy}
              className="min-h-[44px] px-4 rounded-xl border-2 border-slate-300 bg-white text-base font-bold text-slate-800 hover:bg-red-50 hover:border-red-400 hover:text-red-800 transition-colors disabled:opacity-50"
            >
              מחיקה
            </button>
          </li>
        ))}
      </ul>

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className={BTN_PLAIN}>
          הוספת שיעורי בית
        </button>
      ) : (
        <form onSubmit={addAssignment} className="space-y-3 rounded-xl border-2 border-slate-300 bg-white p-4">
          <div>
            <label htmlFor={`t-${student.id}`} className="block text-base font-bold text-slate-900 mb-1">
              מה לתרגל
            </label>
            <input
              id={`t-${student.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: חקירת פונקציה, שאלות 1-5"
              required
              maxLength={120}
              className={field}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`tp-${student.id}`} className="block text-base font-bold text-slate-900 mb-1">
                נושא
              </label>
              <select
                id={`tp-${student.id}`}
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setSubTopicId('');
                }}
                className={field}
              >
                {topics.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {subs.length > 0 && (
              <div>
                <label htmlFor={`st-${student.id}`} className="block text-base font-bold text-slate-900 mb-1">
                  תת-נושא (לא חובה)
                </label>
                <select
                  id={`st-${student.id}`}
                  value={subTopicId}
                  onChange={(e) => setSubTopicId(e.target.value)}
                  className={field}
                >
                  <option value="">כל הנושא</option>
                  {subs.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor={`c-${student.id}`} className="block text-base font-bold text-slate-900 mb-1">
                כמה שאלות
              </label>
              <input
                id={`c-${student.id}`}
                type="number"
                min={1}
                max={100}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className={field}
              />
            </div>

            <div>
              <label htmlFor={`d-${student.id}`} className="block text-base font-bold text-slate-900 mb-1">
                עד מתי (לא חובה)
              </label>
              <input
                id={`d-${student.id}`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={field}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy || !topic} className={BTN_PRIMARY}>
              {busy ? 'שולח…' : 'שליחה לתלמיד'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className={BTN_PLAIN}>
              ביטול
            </button>
          </div>

          {formError && (
            <p role="alert" className="text-base font-bold text-red-800">
              {formError}
            </p>
          )}
          <p className="text-base text-slate-700 leading-relaxed">
            שיעורי הבית יופיעו רק אצל התלמיד הזה, במסך התוכנית שלו. ההתקדמות נספרת מהשאלות שהוא באמת
            פותר בנושא מרגע ששלחת.
          </p>
        </form>
      )}
    </div>
  );
}

// ============================================================
// שעות ושכר — the teacher's own money. Collapsed, never deleted.
// ============================================================

function PaySection({ pay }: { pay: Pay }) {
  return (
    <details className="mt-6 rounded-2xl border-2 border-slate-300 bg-white">
      <summary className="cursor-pointer px-5 py-4 min-h-[56px] flex items-center gap-3 text-lg font-black text-slate-900">
        <Wallet aria-hidden="true" className="w-5 h-5 text-violet-700" />
        <span>
          השעות והשכר שלי — השבוע {pay.week.hours} שעות, {shekel(pay.week.pay)}
        </span>
      </summary>

      <div className="px-5 pb-5 border-t border-slate-200 pt-4">
        <p className="text-lg text-slate-900 mb-3">
          החודש ({pay.month.month}): <b className="font-black">{pay.month.hours} שעות</b>,{' '}
          <b className="font-black">{shekel(pay.month.pay)}</b> — לפי {pay.weeklyHours} שעות שבועיות
          ו-{shekel(pay.rate)} לשעה.
        </p>

        <ul className="space-y-1.5">
          {pay.month.weeks.map((w) => (
            <li
              key={w.weekStart}
              className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-2.5 text-base ${
                w.counted ? 'bg-slate-50 text-slate-900' : 'bg-white text-slate-600'
              }`}
            >
              <span className="font-bold">שבוע {dayLabel(w.weekStart)}</span>
              <span className="flex-1">
                {!w.counted && 'עוד לא התחיל'}
                {w.counted && w.edited && (
                  <span className="text-amber-800 font-bold">
                    עודכן ידנית{w.note ? ` — ${w.note}` : ''}
                  </span>
                )}
              </span>
              <span className="font-bold">{w.hours} שעות</span>
              <span className="font-black text-violet-800 w-24 text-left">
                {w.counted ? shekel(w.hours * pay.rate) : '—'}
              </span>
            </li>
          ))}
        </ul>

        <p className="text-base text-slate-700 pt-3 leading-relaxed">
          שבוע נספר לחודש שבו נופלים רוב ימיו, כך שאף שבוע לא נחתך ולא נספר פעמיים. שבוע שעוד לא
          התחיל לא נכלל בסכום. תיקון של שעות בשבוע מסוים נעשה על ידי איתי.
        </p>
      </div>
    </details>
  );
}
