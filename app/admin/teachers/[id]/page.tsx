'use client';

// One teacher, one screen.
//
// Everything the owner can do to a teacher lives here, in three sections that
// are done in order and then rarely touched again: the terms, the students,
// and the hours. In the first version all three were inline forms inside a
// card inside a list on the accounts page, and it was impossible to tell which
// input belonged to what — or that saving one of them had happened at all.

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { ArrowRight, Check, Eye, Trash2, UserPlus, Wallet } from 'lucide-react';
import { addDays, israelDay, weekStartOf } from '@/lib/teacher-pay';
import { personLabel, shekel, useTeachers, type Teacher } from '../../useTeachers';

/** The last 8 Sundays, newest first — the weeks a correction can target. */
const recentWeeks = () => {
  const current = weekStartOf(israelDay(new Date()));
  return Array.from({ length: 8 }, (_, i) => addDays(current, -7 * i));
};

const weekLabel = (weekStart: string) =>
  `שבוע ${new Date(`${weekStart}T00:00:00Z`).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
  })}`;

export default function TeacherPage() {
  const params = useParams<{ id: string }>();
  const { teachers, candidates, error, busy, call } = useTeachers();

  const teacher = teachers?.find((t) => t.id === params.id) ?? null;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/teachers"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-violet-700"
      >
        <ArrowRight className="w-3.5 h-3.5" />
        לרשימת המורים
      </Link>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
        >
          {error}
        </div>
      )}

      {teachers === null && <p className="text-sm text-slate-500 py-8 text-center">טוען…</p>}

      {teachers !== null && !teacher && (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-600">
          המורה הזה לא נמצא. ייתכן שתפקיד המורה בוטל לו במסך החשבונות.
        </div>
      )}

      {teacher && (
        <>
          <PageHeader
            title={personLabel(teacher)}
            description={`${teacher.email}${teacher.since ? ` · מורה מאז ${teacher.since}` : ''}`}
            actions={
              // The owner pays these teachers; "what does his screen actually
              // show" has to be answerable without asking for his password.
              <Link
                href={`/teacher?as=${teacher.id}`}
                className="flex items-center gap-2 bg-white/70 hover:bg-white border border-slate-200 hover:border-violet-400 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>צפה בלוח שלו</span>
              </Link>
            }
          />
          <Terms teacher={teacher} busy={busy} call={call} />
          <Roster teacher={teacher} candidates={candidates} busy={busy} call={call} />
          <Hours teacher={teacher} busy={busy} call={call} />
        </>
      )}
    </div>
  );
}

type CallFn = (url: string, method: string, body: unknown) => Promise<void>;

// ---- 1. terms -------------------------------------------------------------

function Terms({ teacher, busy, call }: { teacher: Teacher; busy: boolean; call: CallFn }) {
  const [rate, setRate] = useState(String(teacher.hourlyRate));
  const [hours, setHours] = useState(String(teacher.weeklyHours));
  const [saved, setSaved] = useState(false);

  const dirty = Number(rate) !== teacher.hourlyRate || Number(hours) !== teacher.weeklyHours;

  async function save() {
    await call('/api/admin/users', 'PATCH', {
      id: teacher.id,
      hourlyRate: Number(rate),
      weeklyHours: Number(hours),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <section className="glass-card rounded-2xl p-5">
      <h2 className="text-sm font-black text-ink mb-1">תנאי העסקה</h2>
      <p className="text-[11px] text-slate-500 mb-4">
        נקבעים פעם אחת. מכאן השעות והשכר מצטברים לבד, בלי שאף אחד ידווח כלום.
      </p>

      <div className="flex flex-wrap gap-4 items-end">
        <label className="block">
          <span className="block text-[11px] font-black text-slate-500 mb-1">תעריף לשעה (₪)</span>
          <input
            type="number"
            min={0}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="block text-[11px] font-black text-slate-500 mb-1">שעות שבועיות</span>
          <input
            type="number"
            min={0}
            max={168}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>

        <button
          onClick={() => void save()}
          disabled={busy || !dirty}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-40"
        >
          שמירה
        </button>

        {saved && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
            <Check className="w-4 h-4" />
            נשמר
          </span>
        )}

        <div className="text-[11px] text-slate-500 mr-auto">
          שבוע רגיל: <b className="text-slate-700">{shekel(teacher.weeklyHours * teacher.hourlyRate)}</b>
          {' · '}חודש רגיל:{' '}
          <b className="text-slate-700">{shekel(teacher.weeklyHours * teacher.hourlyRate * 4)}</b>
        </div>
      </div>
    </section>
  );
}

// ---- 2. roster ------------------------------------------------------------

function Roster({
  teacher,
  candidates,
  busy,
  call,
}: {
  teacher: Teacher;
  candidates: { id: string; email: string; name: string; missing: boolean }[];
  busy: boolean;
  call: CallFn;
}) {
  const [pick, setPick] = useState('');
  const free = candidates.filter((c) => !teacher.students.some((s) => s.id === c.id));

  return (
    <section className="glass-card rounded-2xl p-5">
      <h2 className="text-sm font-black text-ink mb-1">התלמידים שלו ({teacher.students.length})</h2>
      <p className="text-[11px] text-slate-500 mb-4">
        רק התלמידים האלה יופיעו בלוח שלו, ורק להם הוא יכול לתת מטלות.
      </p>

      <div className="space-y-1.5 mb-4">
        {teacher.students.length === 0 && (
          <p className="text-sm text-slate-500">עוד לא שויכו תלמידים — הלוח שלו ריק.</p>
        )}
        {teacher.students.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/70 px-3 py-2"
          >
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-ink truncate">{personLabel(s)}</span>
              <span className="block text-[11px] text-slate-500 truncate">{s.email}</span>
            </span>
            <button
              onClick={() =>
                void call('/api/admin/teachers', 'DELETE', {
                  teacherId: teacher.id,
                  studentId: s.id,
                })
              }
              disabled={busy}
              aria-label={`הסרת ${personLabel(s)} מהמורה`}
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          aria-label="תלמיד להוספה"
          className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">בחר תלמיד…</option>
          {free.map((c) => (
            <option key={c.id} value={c.id}>
              {personLabel(c)}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            if (!pick) return;
            void call('/api/admin/teachers', 'POST', { teacherId: teacher.id, studentId: pick });
            setPick('');
          }}
          disabled={busy || !pick}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-40"
        >
          <UserPlus className="w-4 h-4" />
          שיוך
        </button>
      </div>
    </section>
  );
}

// ---- 3. hours and pay -----------------------------------------------------

function Hours({ teacher, busy, call }: { teacher: Teacher; busy: boolean; call: CallFn }) {
  const [week, setWeek] = useState(recentWeeks()[0]);
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');

  const { pay } = teacher;

  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Wallet aria-hidden="true" className="w-4 h-4 text-violet-600" />
        <h2 className="text-sm font-black text-ink">שעות ושכר</h2>
      </div>
      <p className="text-[11px] text-slate-500 mb-4">
        שבוע נספר לחודש שבו נופלים רוב ימיו. שבוע שעוד לא התחיל מוצג אך לא נספר.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-white/70 border border-slate-200 p-3">
          <div className="font-display text-xl font-black text-ink leading-none">
            {pay.week.hours} ש׳
          </div>
          <div className="text-xs font-bold text-violet-700 mt-1">{shekel(pay.week.pay)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">השבוע</div>
        </div>
        <div className="rounded-xl bg-white/70 border border-slate-200 p-3">
          <div className="font-display text-xl font-black text-ink leading-none">
            {pay.month.hours} ש׳
          </div>
          <div className="text-xs font-bold text-violet-700 mt-1">{shekel(pay.month.pay)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">החודש עד כה ({pay.month.month})</div>
        </div>
      </div>

      <div className="space-y-1 mb-4">
        {pay.month.weeks.map((w) => (
          <div
            key={w.weekStart}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
              w.counted ? 'bg-white/70' : 'bg-slate-50 text-slate-400'
            }`}
          >
            <span className="font-bold">{weekLabel(w.weekStart)}</span>
            <span className="flex-1 text-[11px]">
              {!w.counted && 'עוד לא התחיל'}
              {w.counted && w.edited && (
                <span className="text-amber-700 font-bold">
                  תוקן ידנית{w.note ? ` — ${w.note}` : ''}
                </span>
              )}
            </span>
            <span className="font-bold">{w.hours} ש׳</span>
            {w.edited && (
              <button
                onClick={() =>
                  void call('/api/admin/teachers', 'PATCH', {
                    teacherId: teacher.id,
                    weekStart: w.weekStart,
                    hours: null,
                  })
                }
                disabled={busy}
                className="text-[11px] font-bold text-slate-500 hover:text-red-600 disabled:opacity-40"
              >
                ביטול התיקון
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="text-[11px] font-black text-slate-500 mb-2">תיקון שבוע שהיה שונה</div>
        <div className="flex flex-wrap gap-2">
          <select
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            aria-label="שבוע"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {recentWeeks().map((w) => (
              <option key={w} value={w}>
                {weekLabel(w)}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            max={168}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="שעות בפועל"
            aria-label="שעות בפועל"
            className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="סיבה (לא חובה)"
            maxLength={200}
            className="flex-1 min-w-[160px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <button
            onClick={() => {
              if (hours === '') return;
              void call('/api/admin/teachers', 'PATCH', {
                teacherId: teacher.id,
                weekStart: week,
                hours: Number(hours),
                note,
              });
              setHours('');
              setNote('');
            }}
            disabled={busy || hours === ''}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-40"
          >
            תיקון
          </button>
        </div>
      </div>
    </section>
  );
}
