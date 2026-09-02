'use client';

/**
 * /school/class/[id] — the class board.
 *
 * THE DESIGN CONSTRAINT, and everything here follows from it: a teacher opens
 * this in a ten-minute break, on a phone, between lessons. So the screen
 * answers three questions in a FIXED order and hands over conclusions rather
 * than a table:
 *
 *   1. מי דורש התייחסות — a list of four, not of thirty-one.
 *   2. מה ללמד שוב      — a topic the class is failing. This is the insight a
 *                          teacher gets from nowhere else today.
 *   3. מה שביקשתי       — did the focus land.
 *
 * The heatmap sits BELOW all three, not above them: it is for exploring, and a
 * grid of thirty-one rows is not what you read in ninety seconds.
 *
 * Every number here comes from lib/class-board, which is pure and tested. This
 * file renders; it does not decide. In particular it never turns a null into a
 * zero — "אין נתונים" and "0%" are different sentences about a child.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Users, Copy, Check, Target, AlertTriangle, Clock, Sparkles, Eye } from 'lucide-react';
import type { ClassBoard, AttentionRow, StudentRow } from '@/lib/class-board';
import { demoBoard, demoFocuses } from '@/lib/demo-board';
// ⚠️ VALUES from lib/rungs (which imports nothing), TYPES from lib/focus-target.
// A value import of RUNG_LABEL from focus-target would pull `@/content/lessons`
// — the whole authored corpus — into this page's browser bundle. Type imports
// are erased at compile time and cost nothing, so CatalogueTopic is safe here.
import { RUNG_LABEL, type Rung } from '@/lib/rungs';
import type { CatalogueTopic } from '@/lib/focus-target';

type FocusRow = {
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

type Payload = {
  class: {
    id: string;
    name: string;
    school: string | null;
    units: number | null;
    schoolYear: string;
    joinCode: string | null;
  };
  board: ClassBoard;
  focuses: FocusRow[];
  windowDays: number;
};

export default function ClassBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusFor, setFocusFor] = useState<{ studentId: string; name: string } | null | 'class'>(
    null
  );

  useEffect(() => {
    void params.then((p) => setId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/school/classes/${id}`);
      if (res.status === 403) {
        setError('אין לך גישה לכיתה הזו');
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
      setError(null);
    } catch {
      setError('לא הצלחנו לטעון את הלוח. נסה לרענן.');
    }
  }, [id]);

  useEffect(() => {
    // See the note in app/school/page.tsx: `load` is async, so its setState
    // calls land in a later microtask rather than synchronously in the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (error) {
    return (
      <main dir="rtl" className="mx-auto max-w-4xl px-4 py-10">
        <p role="status" className="rounded-lg bg-amber-50 px-4 py-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {error}
        </p>
        <Link href="/school" className="mt-4 inline-block text-violet-700 dark:text-violet-300">
          חזרה לכיתות
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main dir="rtl" className="mx-auto max-w-4xl px-4 py-10 text-slate-500">
        טוען…
      </main>
    );
  }

  return <Board data={data} classId={id} onReload={load} focusFor={focusFor} setFocusFor={setFocusFor} />;
}

function Board({
  data,
  classId,
  onReload,
  focusFor,
  setFocusFor,
}: {
  data: Payload;
  classId: string | null;
  onReload: () => void;
  focusFor: { studentId: string; name: string } | null | 'class';
  setFocusFor: (v: { studentId: string; name: string } | null | 'class') => void;
}) {
  // AN EMPTY CLASS SHOWS THE REAL BOARD ON SAMPLE DATA.
  //
  // A teacher's first visit is always to a class nobody has joined yet, and
  // "עוד אף תלמיד לא הצטרף" teaches him nothing about why he should hand this
  // to thirty students. The sample is INPUT to the same buildClassBoard that
  // will run on his own class, so what he sees here is what he will get —
  // it cannot drift, and it is labelled as an example in the banner below.
  const isDemo = data.board.studentCount === 0;
  const board = useMemo(() => (isDemo ? demoBoard() : data.board), [isDemo, data.board]);
  const focuses = useMemo(() => (isDemo ? demoFocuses() : data.focuses), [isDemo, data.focuses]);
  const id = classId;

  return (
    <main dir="rtl" className="mx-auto max-w-4xl px-4 py-6">
      <Header klass={data.class} board={data.board} />

      {isDemo && <DemoBanner joinCode={data.class.joinCode} />}

      {(
        <>
          <Zone
            n={1}
            title="דורש התייחסות"
            count={board.needsAttention.length}
            empty="אף אחד לא דורש התייחסות מיוחדת השבוע."
          >
            {board.needsAttention.map((row) => (
              <AttentionLine
                key={row.studentId}
                row={row}
                // No action on a sample student: the ids are invented, so the
                // API would reject them and the teacher would meet an error
                // instead of a demonstration.
                onFocus={
                  isDemo
                    ? null
                    : () => setFocusFor({ studentId: row.studentId, name: row.name })
                }
              />
            ))}
          </Zone>

          <Zone
            n={2}
            title="מה ללמד שוב"
            count={board.reteach.length}
            empty="אין נושא שהכיתה כולה נופלת בו."
          >
            {board.reteach.map((r) => (
              <div key={r.topic} className="flex flex-wrap items-center gap-3 py-2">
                <span className="min-w-24 font-semibold text-slate-900 dark:text-slate-50">
                  {r.topic}
                </span>
                <Bar value={r.mastery} tone="bad" />
                <span className="font-mono text-sm tabular-nums text-slate-900 dark:text-slate-50">
                  {Math.round(r.mastery * 100)}%
                </span>
                <span className="flex-1 text-sm text-slate-500 dark:text-slate-400">{r.reason}</span>
                {!isDemo && (
                  <button
                    type="button"
                    onClick={() => setFocusFor('class')}
                    className="rounded bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700 transition hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300"
                  >
                    מקד את הכיתה
                  </button>
                )}
              </div>
            ))}
          </Zone>

          <Zone n={3} title="מה שביקשתי" count={focuses.length} empty="עוד לא מיקדת אף אחד.">
            {focuses.map((f) => (
              <FocusLine key={f.id} focus={f} />
            ))}
          </Zone>

          <Heatmap board={board} windowDays={data.windowDays} />
        </>
      )}

      {focusFor !== null && id && !isDemo && (
        <FocusDialog
          classId={id}
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

/**
 * Says, in one line, that the numbers below are an example — and immediately
 * gives the one action that turns them real. A preview that does not say it is
 * a preview is a lie; a preview that only says so is a dead end.
 */
function DemoBanner({ joinCode }: { joinCode: string | null }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-900 dark:bg-violet-950/50">
      <Eye className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
      <p className="text-sm font-medium text-violet-900 dark:text-violet-200">
        זו תצוגת דוגמה — כך ייראה הלוח כשהתלמידים יתחילו לתרגל.
      </p>
      {joinCode && (
        <p className="text-sm text-violet-800 dark:text-violet-300">
          תן לכיתה את הקוד{' '}
          <span className="font-mono font-semibold tracking-widest">{joinCode}</span> והנתונים
          האמיתיים יחליפו אותה.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- header

function Header({ klass, board }: { klass: Payload['class']; board: ClassBoard }) {
  const [copied, setCopied] = useState(false);
  return (
    <header className="mb-6">
      <Link
        href="/school"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-violet-700 dark:text-slate-400"
      >
        <ArrowRight className="h-4 w-4" aria-hidden />
        הכיתות שלי
      </Link>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{klass.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {board.studentCount} תלמידים
            </span>
            <span>{board.activeThisWeek} פעילים השבוע</span>
            {/* Called out separately because it is an onboarding problem, not a
                learning one — and the two need different actions. */}
            {board.neverStarted > 0 && <span>{board.neverStarted} טרם התחילו</span>}
            {klass.units && <span>{klass.units} יח״ל</span>}
          </p>
        </div>
        {klass.joinCode && (
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(klass.joinCode!).then(
                () => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                },
                () => {}
              );
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 font-mono tracking-widest text-slate-800 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100"
            aria-label={copied ? 'הקוד הועתק' : `העתק את קוד ההצטרפות ${klass.joinCode}`}
          >
            {klass.joinCode}
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" aria-hidden />
            ) : (
              <Copy className="h-4 w-4 text-slate-400" aria-hidden />
            )}
          </button>
        )}
      </div>
    </header>
  );
}

// ---------------------------------------------------------------- zones

function Zone({
  n,
  title,
  count,
  empty,
  children,
}: {
  n: number;
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <h2 className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold tracking-widest text-slate-500 uppercase dark:border-slate-800 dark:text-slate-400">
        {n} · {title}
        {count > 0 && <span className="mr-2 font-mono text-slate-400">{count}</span>}
      </h2>
      <div className="divide-y divide-slate-100 px-4 dark:divide-slate-800">
        {count === 0 ? <p className="py-4 text-sm text-slate-500">{empty}</p> : children}
      </div>
    </section>
  );
}

const STATE_STYLE: Record<AttentionRow['state'], { label: string; cls: string; Icon: typeof Clock }> =
  {
    stuck: {
      label: 'תקוע',
      cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      Icon: AlertTriangle,
    },
    away: {
      label: 'לא נכנס',
      cls: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
      Icon: Clock,
    },
    'no-data': {
      label: 'אין נתונים',
      cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      Icon: Sparkles,
    },
  };

function AttentionLine({ row, onFocus }: { row: AttentionRow; onFocus: (() => void) | null }) {
  const s = STATE_STYLE[row.state];
  return (
    <div className="flex flex-wrap items-center gap-3 py-2.5">
      <span
        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${s.cls}`}
      >
        <s.Icon className="h-3 w-3" aria-hidden />
        {s.label}
      </span>
      <span className="min-w-20 font-semibold text-slate-900 dark:text-slate-50">{row.name}</span>
      <span className="flex-1 text-sm text-slate-600 dark:text-slate-400">{row.reason}</span>
      {onFocus && (
        <button
          type="button"
          onClick={onFocus}
          className="rounded bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700 transition hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300"
        >
          מקד
        </button>
      )}
    </div>
  );
}

function FocusLine({ focus }: { focus: FocusRow }) {
  const pct = focus.totalCount > 0 ? focus.done / focus.totalCount : 0;
  return (
    <div className="flex flex-wrap items-center gap-3 py-2.5">
      <span className="min-w-24 font-semibold text-slate-900 dark:text-slate-50">
        {focus.targetedCount === null ? 'כל הכיתה' : `${focus.targetedCount} תלמידים`}
      </span>
      <span className="flex-1 text-sm text-slate-600 dark:text-slate-400">
        {focus.label}
        {focus.targetCount && ` · ${focus.targetCount} תרגילים`}
        {focus.dueOn && ` · עד ${focus.dueOn}`}
      </span>
      <Bar value={pct} tone={pct >= 0.75 ? 'good' : 'neutral'} />
      <span className="font-mono text-sm tabular-nums text-slate-900 dark:text-slate-50">
        {focus.done}/{focus.totalCount}
      </span>
    </div>
  );
}

function Bar({ value, tone }: { value: number; tone: 'good' | 'bad' | 'neutral' }) {
  const cls =
    tone === 'bad' ? 'bg-rose-500' : tone === 'good' ? 'bg-emerald-500' : 'bg-violet-500';
  return (
    <span className="h-1.5 min-w-24 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <span
        className={`block h-full rounded-full ${cls}`}
        style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }}
      />
    </span>
  );
}

// ---------------------------------------------------------------- heatmap

/** Five bands, plus a separate look for "no data". The sixth is not a worse
 *  score — it is the absence of one, and it must never sit next to a failing
 *  cell looking equally alarming. */
function cellClass(m: number | null): string {
  if (m === null) return 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500';
  if (m >= 0.85) return 'bg-emerald-500 text-emerald-50';
  if (m >= 0.7) return 'bg-emerald-300 text-emerald-950';
  if (m >= 0.55) return 'bg-amber-200 text-amber-950';
  if (m >= 0.4) return 'bg-orange-300 text-orange-950';
  return 'bg-rose-400 text-rose-950';
}

function Heatmap({ board, windowDays }: { board: ClassBoard; windowDays: number }) {
  if (board.topics.length === 0) {
    return (
      <p className="mt-6 text-sm text-slate-500">
        אין עדיין תשובות ב-{windowDays} הימים האחרונים, אז אין מה למפות.
      </p>
    );
  }

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-xs font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400">
        המפה המלאה
      </h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky right-0 bg-white px-3 py-2 text-right font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                תלמיד
              </th>
              {board.topics.map((t) => (
                <th
                  key={t}
                  className="px-1.5 py-2 text-center font-medium text-slate-500 dark:text-slate-400"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {board.students.map((s) => (
              <HeatRow key={s.id} student={s} topics={board.topics} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        אפור = אין נתונים, לא אפס. הטווח: {windowDays} הימים האחרונים.
      </p>
    </section>
  );
}

function HeatRow({ student, topics }: { student: StudentRow; topics: string[] }) {
  return (
    <tr className="border-t border-slate-100 dark:border-slate-800">
      <td className="sticky right-0 bg-white px-3 py-1.5 whitespace-nowrap text-slate-900 dark:bg-slate-900 dark:text-slate-50">
        {student.name}
      </td>
      {topics.map((t) => {
        const row = student.topics.find((x) => x.topic === t);
        const m = row?.mastery ?? null;
        return (
          <td key={t} className="px-1 py-1">
            <span
              className={`block rounded py-1 text-center font-mono text-xs font-semibold tabular-nums ${cellClass(m)}`}
              title={
                m === null
                  ? `${student.name} · ${t}: אין נתונים`
                  : `${student.name} · ${t}: ${row!.correct}/${row!.measured}`
              }
            >
              {m === null ? '—' : Math.round(m * 100)}
            </span>
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
 * decision. The one text field is an optional note, and it is optional.
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <form
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label="מיקוד תלמידים"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900"
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-50">
          <Target className="h-5 w-5 text-violet-600" aria-hidden />
          מיקוד
        </h2>

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

        <fieldset className="mt-3">
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
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-700 disabled:opacity-40"
          >
            {busy ? 'שולח…' : picked.length ? `מקד ${picked.length} תלמידים` : 'מקד את כל הכיתה'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-700 dark:text-slate-300"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}

const selectCls =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}
