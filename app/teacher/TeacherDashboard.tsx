'use client';

// TeacherDashboard — what a paid private teacher sees about HIS OWN students,
// plus his hours and pay. Server side: /api/teacher/overview.
//
// Everything on this screen is derived from answers the student already gave
// (learning_state.results) and from the weekly figure the owner set. No model
// is called, here or in the route — the teacher system costs nothing to look at.
//
// ⚠️ THE ONE LIE THIS SCREEN COULD TELL. A student who never signed in has no
// synced answer log, and "0 questions" would read as "he did nothing all week"
// — straight into a lesson with a student who may have worked hard on another
// device. So a student with `syncedAt: null` is rendered as "לא סונכרן מעולם"
// and never as a zero, and every row carries when it last synced.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import MathUpLogo from '@/components/MathUpLogo';
import { PageHeader } from '@/components/PageHeader';
import {
  ArrowLeft,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  Eye,
  LogOut,
  Plus,
  RefreshCw,
  TriangleAlert,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';

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
  /** The rungs inside it — a task can name one instead of the whole topic. */
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
  /** Real past-paper questions, kept apart from drills on purpose. */
  bagrut: { answered: number; correct: number };
  bagrutDate: string | null;
  daysToBagrut: number | null;
  targetGrade: number | null;
  /** Distinct days he practised in the last 30. */
  activeDays: number;
  totalDays: number;
  topics: TopicRow[];
  stuck: TopicRow[];
  stuckRungs: StuckRung[];
  recentWrong: WrongRow[];
  assignments: Assignment[];
};

/** The ladder rungs, in the student's words. */
const RUNG: Record<string, string> = {
  learn: 'לימוד',
  easy: 'תרגול קל',
  mid: 'תרגול',
  hard: 'אתגר',
  ghost: 'חשיבה',
  bagrut: 'בגרות',
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
  const [showWeeks, setShowWeeks] = useState(false);

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

  const termsMissing = rate <= 0 || weeklyHours <= 0;

  return (
    <div
      className="min-h-screen text-slate-900 relative overflow-x-hidden"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/30 blur-[120px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
      </div>

      {/* Always visible, not `md:hidden` as it was: the app's own desktop header
          used to cover this screen, and it is now correctly hidden on staff
          pages — which left a teacher on a laptop with no logo, no way back to
          the app, and no sign-out at all. */}
      <nav className="sticky top-0 z-50 glass-card border-x-0 border-t-0 rounded-none">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <MathUpLogo size="md" />
            <div>
              <div className="text-base font-black font-display text-slate-800">MathUp</div>
              <div className="text-[10px] text-slate-600 -mt-0.5">לוח המורה</div>
            </div>
          </Link>
        <div className="flex items-center gap-2">
          {/* The learner's chrome is hidden on staff screens, and the sign-out
              button lived inside it — without this, the only way off this
              screen is to leave the staff area first. */}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 bg-slate-900/[0.03] hover:bg-red-500/10 border border-slate-900/10 hover:border-red-500/30 text-slate-600 hover:text-red-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>התנתקות</span>
            </button>
          </form>
          <Link
            href="/"
            className="group flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          >
            <span>לאפליקציה</span>
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <PageHeader
          title="לוח המורה"
          description={`${name} — התלמידים שלך, איפה כל אחד נתקע, והשעות והשכר שלך.`}
          actions={
            <button
              onClick={() => void load()}
              className="flex items-center gap-2 bg-white/70 hover:bg-white border border-slate-200 hover:border-violet-400 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${students === null ? 'animate-spin' : ''}`} />
              <span>רענון</span>
            </button>
          }
        />

        {viewingAs && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-300 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-900">
            <Eye aria-hidden="true" className="w-4 h-4" />
            <span className="flex-1">אתה צופה בלוח של {name} כמנהל המערכת.</span>
            <Link
              href="/admin/teachers"
              className="bg-white border border-violet-300 px-3 py-1.5 rounded-xl text-xs"
            >
              חזרה לניהול
            </Link>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
          >
            {error}
          </div>
        )}

        {termsMissing && (
          <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            תנאי השכר שלך עדיין לא הוגדרו במערכת. עד שיוגדרו, השעות והשכר יוצגו כאפס.
          </div>
        )}

        {/* ---- the three numbers ---- */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Users, label: 'התלמידים שלי', value: students === null ? '…' : students.length },
            {
              icon: CalendarClock,
              label: 'השבוע',
              value: pay ? `${pay.week.hours} ש׳` : '…',
              sub: pay ? shekel(pay.week.pay) : '',
            },
            {
              icon: Wallet,
              label: `החודש עד כה (${pay?.month.month ?? ''})`,
              value: pay ? `${pay.month.hours} ש׳` : '…',
              sub: pay ? shekel(pay.month.pay) : '',
            },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="glass-card rounded-2xl p-4">
              <Icon aria-hidden="true" className="w-4 h-4 text-violet-600 mb-2" />
              <div className="font-display text-2xl font-black text-ink leading-none">{value}</div>
              {sub ? <div className="text-xs font-bold text-violet-700 mt-1">{sub}</div> : null}
              <div className="text-[11px] text-slate-600 mt-1 leading-tight">{label}</div>
            </div>
          ))}
        </div>

        {/* ---- students ---- */}
        <section className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users aria-hidden="true" className="w-4 h-4 text-violet-600" />
            <h2 className="text-sm font-black text-ink">התלמידים שלי</h2>
          </div>

          {students === null && <div className="text-sm text-slate-500 py-6 text-center">טוען…</div>}

          {students?.length === 0 && (
            <div className="text-sm text-slate-600 py-6 text-center">
              עדיין לא שויכו אליך תלמידים. איתי משייך אותם בלוח הבקרה.
            </div>
          )}

          <div className="space-y-2">
            {students?.map((s) => {
              const open = openId === s.id;
              const neverSynced = s.syncedAt === null;
              return (
                <div key={s.id} className="rounded-2xl border border-slate-200 bg-white/60">
                  <button
                    onClick={() => setOpenId(open ? '' : s.id)}
                    aria-expanded={open}
                    className="w-full flex items-center gap-3 px-4 py-3 text-right"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm text-ink truncate">
                        {s.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {neverSynced ? (
                          <span className="text-amber-700 font-bold">
                            לא סונכרן מעולם — לא נכנס לאפליקציה עם החשבון
                          </span>
                        ) : (
                          <>סונכרן {timeAgo(s.syncedAt)} · תרגל {timeAgo(s.lastAnswerAt)}</>
                        )}
                      </div>
                    </div>

                    {!neverSynced && (
                      <div className="text-center shrink-0 w-16">
                        <div
                          className={`font-display text-lg font-black leading-none ${
                            s.activeDays === 0 ? 'text-red-600' : 'text-ink'
                          }`}
                        >
                          {s.activeDays}
                        </div>
                        <div className="text-[10px] text-slate-500">ימים ב-30</div>
                      </div>
                    )}
                    {!neverSynced && (
                      <div className="text-center shrink-0 w-14">
                        <div className="font-display text-lg font-black text-ink leading-none">
                          {s.answered}
                        </div>
                        <div className="text-[10px] text-slate-500">שאלות</div>
                      </div>
                    )}
                    {!neverSynced && s.answered > 0 && (
                      <div className="text-center shrink-0 w-12">
                        <div
                          className={`font-display text-lg font-black leading-none ${
                            s.accuracy < 0.6 ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {pct(s.accuracy)}
                        </div>
                        <div className="text-[10px] text-slate-500">נכון</div>
                      </div>
                    )}
                    {s.assignments.some((a) => !a.complete) && (
                      <span className="shrink-0 text-[10px] font-black bg-violet-100 text-violet-700 rounded-full px-2 py-1">
                        {s.assignments.filter((a) => !a.complete).length} מטלות
                      </span>
                    )}
                    <ChevronDown
                      aria-hidden="true"
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {open && (
                    <div className="border-t border-slate-200 px-4 py-4 space-y-4">
                      <StudentDetail student={s} topics={topics} query={query} onChanged={load} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ---- the pay, week by week ---- */}
        {pay && (
          <section className="glass-card rounded-2xl p-4">
            <button
              onClick={() => setShowWeeks(!showWeeks)}
              aria-expanded={showWeeks}
              className="w-full flex items-center gap-2 text-right"
            >
              <Wallet aria-hidden="true" className="w-4 h-4 text-violet-600" />
              <h2 className="text-sm font-black text-ink flex-1">
                שעות ושכר — {pay.weeklyHours} שעות שבועיות, {shekel(pay.rate)} לשעה
              </h2>
              <ChevronDown
                aria-hidden="true"
                className={`w-4 h-4 text-slate-400 transition-transform ${showWeeks ? 'rotate-180' : ''}`}
              />
            </button>

            {showWeeks && (
              <div className="mt-3 space-y-1">
                {pay.month.weeks.map((w) => (
                  <div
                    key={w.weekStart}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                      w.counted ? 'bg-white/70' : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    <span className="font-bold">שבוע {dayLabel(w.weekStart)}</span>
                    <span className="flex-1 text-[11px]">
                      {!w.counted && 'עוד לא התחיל'}
                      {w.counted && w.edited && (
                        <span className="text-amber-700 font-bold">
                          עודכן ידנית{w.note ? ` — ${w.note}` : ''}
                        </span>
                      )}
                    </span>
                    <span className="font-bold">{w.hours} ש׳</span>
                    <span className="font-black text-violet-700 w-20 text-left">
                      {w.counted ? shekel(w.hours * pay.rate) : '—'}
                    </span>
                  </div>
                ))}
                <p className="text-[11px] text-slate-500 pt-2 leading-relaxed">
                  שבוע נספר לחודש שבו נופלים רוב ימיו, כך שאף שבוע לא נחתך ולא נספר פעמיים. שבוע שעוד
                  לא התחיל לא נכלל בסכום. תיקון של שעות בשבוע מסוים נעשה על ידי איתי.
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
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
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState(topics[0]?.key ?? '');
  const [subTopicId, setSubTopicId] = useState('');
  const [targetCount, setTargetCount] = useState(5);
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

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

  const label = (key: string) => topics.find((t) => t.key === key)?.label ?? key;

  return (
    <>
      {student.syncedAt === null ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          אין נתוני תרגול לתלמיד הזה: הוא עדיין לא נכנס לאפליקציה עם החשבון ששויך אליו. זה לא אומר
          שהוא לא תרגל — זה אומר שאין מה למדוד.
        </p>
      ) : (
        <>
          {(student.daysToBagrut !== null || student.bagrut.answered > 0) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2 text-sm">
              {student.daysToBagrut !== null && (
                <span className="font-bold text-violet-900">
                  {student.daysToBagrut > 0
                    ? `בגרות בעוד ${student.daysToBagrut} ימים`
                    : student.daysToBagrut === 0
                      ? 'הבגרות היום'
                      : 'תאריך הבגרות עבר'}
                </span>
              )}
              {student.targetGrade !== null && (
                <span className="text-[11px] text-violet-800">יעד: {student.targetGrade}</span>
              )}
              <span
                className={`text-[11px] font-bold ${
                  student.bagrut.answered === 0 ? 'text-red-700' : 'text-violet-800'
                }`}
              >
                {student.bagrut.answered === 0
                  ? 'עוד לא פתר שאלת בגרות אחת'
                  : `שאלות בגרות: ${student.bagrut.correct}/${student.bagrut.answered} (${pct(
                      student.bagrut.correct / student.bagrut.answered
                    )})`}
              </span>
            </div>
          )}

          {/* One line of context before any percentage: how the work was
              spread, and how much of the score he graded himself. An accuracy
              with no volume behind it is not a measurement. */}
          <p className="text-[11px] text-slate-500 bg-white/70 rounded-xl px-3 py-2">
            תרגל ב-<b className="text-slate-700">{student.activeDays}</b> ימים מתוך 30 האחרונים
            {student.totalDays > student.activeDays && ` (${student.totalDays} ימים בסך הכל)`}
            {' · '}
            {student.answered} שאלות ראשונות
            {student.difficulty.hard > 0 && `, מתוכן ${student.difficulty.hard} ברמת אתגר`}
            {student.selfReported > 0 && (
              <>
                {' · '}
                <span className="text-amber-700 font-bold">
                  {student.selfReported} מהן הוא בדק בעצמו
                </span>
              </>
            )}
            . חזרות על שאלה שכבר נענתה אינן נספרות באחוזים — כמו במסך של התלמיד.
          </p>

          {/* The ladder — the sentence that decides what to open with. */}
          {student.stuckRungs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TriangleAlert aria-hidden="true" className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black text-ink">שלבים שהוא ניסה ולא עבר</h3>
              </div>
              <div className="space-y-1">
                {student.stuckRungs.map((r) => (
                  <div
                    key={`${r.topic}-${r.subId}-${r.kind}`}
                    className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-sm"
                  >
                    <span className="font-bold flex-1 truncate">
                      {r.title}
                      <span className="text-slate-500 font-normal"> · {RUNG[r.kind] ?? r.kind}</span>
                    </span>
                    <span className="text-[11px] font-black text-amber-800 shrink-0">
                      {r.attempts} ניסיונות
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* where he is stuck */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TriangleAlert aria-hidden="true" className="w-4 h-4 text-red-500" />
              <h3 className="text-xs font-black text-ink">נושאים חלשים</h3>
            </div>
            {student.stuck.length === 0 ? (
              <p className="text-xs text-slate-500">
                אין נושא שבו הוא מתחת ל-60% על פני 3 שאלות או יותר.
              </p>
            ) : (
              <div className="space-y-1">
                {student.stuck.map((t) => (
                  <div
                    key={t.topic}
                    className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm"
                  >
                    <span className="font-bold flex-1">{label(t.topic)}</span>
                    <span className="text-[11px] text-slate-600">
                      {t.answered - t.correct} טעויות מתוך {t.answered}
                      {t.hints > 0 ? ` · ${t.hints} רמזים` : ''}
                    </span>
                    <span className="font-black text-red-600">{pct(t.accuracy)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* every topic */}
          {student.topics.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-ink mb-2">לפי נושא</h3>
              <div className="space-y-1">
                {student.topics.map((t) => (
                  <div
                    key={t.topic}
                    className="flex items-center gap-3 bg-white/70 rounded-xl px-3 py-1.5 text-sm"
                  >
                    <span className="flex-1 truncate">{label(t.topic)}</span>
                    <span className="text-[11px] text-slate-500">
                      {t.correct}/{t.answered}
                    </span>
                    <span
                      className={`font-bold w-10 text-left ${
                        t.accuracy < 0.6 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {pct(t.accuracy)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* the last mistakes, with their shape */}
          {student.recentWrong.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-ink mb-2">הטעויות האחרונות</h3>
              <div className="space-y-1">
                {student.recentWrong.map((w, i) => (
                  <div
                    key={`${w.ts}-${i}`}
                    className="flex items-start gap-2 bg-white/70 rounded-xl px-3 py-1.5 text-[12px]"
                  >
                    <span className="font-bold shrink-0">{label(w.topic)}</span>
                    <span className="flex-1 text-slate-600">
                      {w.diagnosis === 'known-mistake' && w.note
                        ? w.note
                        : w.diagnosis
                          ? DIAGNOSIS[w.diagnosis] ?? w.diagnosis
                          : ''}
                      {w.hintUsed ? ' · טעה גם אחרי רמז' : ''}
                    </span>
                    <span className="text-slate-400 shrink-0">{timeAgo(w.ts)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* assignments */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList aria-hidden="true" className="w-4 h-4 text-violet-600" />
          <h3 className="text-xs font-black text-ink">מטלות שנתת</h3>
        </div>

        <div className="space-y-1 mb-3">
          {student.assignments.length === 0 && (
            <p className="text-xs text-slate-500">עוד לא נתת לו מטלה.</p>
          )}
          {student.assignments.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm border ${
                a.complete
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-white/70 border-slate-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{a.title}</div>
                <div className="text-[11px] text-slate-500">
                  {label(a.topic)}
                  {a.subTopicId
                    ? ` · ${
                        topics
                          .find((t) => t.key === a.topic)
                          ?.subs.find((st) => st.id === a.subTopicId)?.title ?? a.subTopicId
                      }`
                    : ''}
                  {a.dueDate ? ` · עד ${dayLabel(a.dueDate)}` : ''}
                </div>
              </div>
              <div className="text-center shrink-0">
                <div
                  className={`font-black text-sm ${a.complete ? 'text-emerald-600' : 'text-slate-700'}`}
                >
                  {a.answered}/{a.targetCount}
                </div>
                <div className="text-[10px] text-slate-500">{a.correct} נכון</div>
              </div>
              <button
                onClick={() => void removeAssignment(a.id)}
                disabled={busy}
                aria-label={`מחיקת המטלה ${a.title}`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={addAssignment} className="flex flex-wrap gap-2 items-center">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="מה לתרגל — למשל: חקירת פונקציה, שאלות 1-5"
            required
            maxLength={120}
            className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <select
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              // A sub-topic from the previous topic would silently freeze the
              // counter at 0, since progress is matched on both.
              setSubTopicId('');
            }}
            aria-label="נושא"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {topics.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
          {(topics.find((t) => t.key === topic)?.subs.length ?? 0) > 0 && (
            <select
              value={subTopicId}
              onChange={(e) => setSubTopicId(e.target.value)}
              aria-label="תת-נושא"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">כל הנושא</option>
              {topics
                .find((t) => t.key === topic)
                ?.subs.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.title}
                  </option>
                ))}
            </select>
          )}
          <input
            type="number"
            min={1}
            max={100}
            value={targetCount}
            onChange={(e) => setTargetCount(Number(e.target.value))}
            aria-label="כמה שאלות"
            className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="תאריך יעד"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy || !topic}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            <span>מטלה</span>
          </button>
        </form>
        {formError && (
          <p role="alert" className="text-xs font-bold text-red-600 mt-2">
            {formError}
          </p>
        )}
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          המטלה תופיע רק אצל התלמיד הזה, במסך התוכנית שלו. ההתקדמות נספרת מהשאלות שהוא באמת פותר
          בנושא מרגע שנתת אותה.
        </p>
      </div>
    </>
  );
}
