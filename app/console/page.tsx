'use client';

/**
 * /console — the teacher's classes, as a table.
 *
 * This is the console's home, and it is built like the systems a school
 * already runs on: a page header, a table with one row per class, and the
 * actions on the row. The first version was rounded cards that looked like the
 * student app, and the owner's verdict was that it felt cheap. Teachers are
 * not sixteen; a table they can read top to bottom beats a card they have to
 * admire.
 *
 * The student's half lives at /my-class, inside the app he already uses.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Check, Copy, MessageSquare, LayoutGrid, Printer, Download } from 'lucide-react';

type ClassRow = {
  id: string;
  name: string;
  school: string | null;
  units: number | null;
  schoolYear: string;
  joinCode: string | null;
  archived: boolean;
  studentCount: number;
};

export default function ConsoleHome() {
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/school/classes');
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setClasses(data.classes ?? []);
      setError(null);
    } catch {
      setError('לא הצלחנו לטעון את הכיתות. נסה לרענן.');
      setClasses([]);
    }
  }, []);

  useEffect(() => {
    // `load` is async, so its setState calls land in a later microtask.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <main className="px-6 py-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            הכיתות שלי
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            כל כיתה, מי בה, ואיך התלמידים מצטרפים אליה.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          <Plus className="h-4 w-4" aria-hidden />
          פתיחת כיתה
        </button>
      </div>

      {error && (
        <p
          role="status"
          className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          {error}
        </p>
      )}

      {classes === null ? (
        <p className="text-sm text-slate-500">טוען…</p>
      ) : classes.length === 0 && !error ? (
        <FirstClass onCreated={load} />
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 text-start font-medium">כיתה</th>
                <th className="px-4 py-2.5 text-start font-medium">רמה</th>
                <th className="px-4 py-2.5 text-start font-medium">שנה</th>
                <th className="px-4 py-2.5 text-center font-medium">תלמידים</th>
                <th className="px-4 py-2.5 text-start font-medium">קוד הצטרפות</th>
                <th className="px-4 py-2.5 text-end font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classes.map((c) => (
                <ClassLine key={c.id} klass={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <CreateClassDialog onClose={() => setCreating(false)} onCreated={load} />}
    </main>
  );
}

/**
 * The first visit, for a teacher who has never used software like this.
 *
 * Not a table and a button: the three things that will happen, in order, and
 * the only field she has to fill in right now. Everything technical — the
 * code, the message, the join — is generated for her the moment the class
 * exists, on the row that appears in place of this.
 */
function FirstClass({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [units, setUnits] = useState(5);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/school/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), units }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? 'לא הצלחנו לפתוח את הכיתה');
        return;
      }
      onCreated();
    } catch {
      setMessage('לא הצלחנו לפתוח את הכיתה. נסה שוב.');
    } finally {
      setBusy(false);
    }
  }

  const steps = [
    { n: 1, title: 'תן שם לכיתה', body: 'זה כל מה שצריך ממך עכשיו. חצי דקה.' },
    { n: 2, title: 'שלח לתלמידים את הקוד', body: 'תקבל קוד בן שש תווים והודעה מוכנה לוואטסאפ — לחיצה אחת מעתיקה אותה.' },
    { n: 3, title: 'חזור מחר', body: 'התלמידים מתרגלים כרגיל. הלוח יגיד לך במשפט אחד מי צריך אותך ומה ללמד שוב.' },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <ol className="flex flex-col gap-3 lg:col-span-3">
        {steps.map((s) => (
          <li
            key={s.n}
            className={`flex gap-4 rounded-md border px-5 py-4 ${
              s.n === 1
                ? 'border-slate-900 bg-white dark:border-slate-200 dark:bg-slate-900'
                : 'border-slate-200 bg-white/60 text-slate-500 dark:border-slate-800 dark:bg-slate-900/60'
            }`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-sm font-semibold ${
                s.n === 1
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              {s.n}
            </span>
            <div>
              <p className={`font-semibold ${s.n === 1 ? 'text-slate-900 dark:text-slate-50' : ''}`}>
                {s.title}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <form
        onSubmit={submit}
        className="rounded-md border border-slate-200 bg-white p-5 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900"
      >
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="first-class-name">
          איך קוראים לכיתה?
        </label>
        <input
          id="first-class-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="למשל: י׳3"
          maxLength={40}
          autoFocus
          className={`${inputCls} mt-1 py-2.5 text-base`}
        />
        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="first-class-units">
          כמה יחידות?
        </label>
        <select
          id="first-class-units"
          value={units}
          onChange={(e) => setUnits(Number(e.target.value))}
          className={`${inputCls} mt-1 py-2.5 text-base`}
        >
          <option value={5}>5 יחידות</option>
          <option value={4}>4 יחידות</option>
          <option value={3}>3 יחידות</option>
        </select>
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="mt-5 w-full rounded-md bg-slate-900 px-4 py-3 text-base font-medium text-white transition hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
        >
          {busy ? 'פותח…' : 'פתח את הכיתה'}
        </button>
        {message && (
          <p role="status" className="mt-2 text-sm text-rose-600 dark:text-rose-400">
            {message}
          </p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          אפשר לשנות הכל אחר כך ב״הגדרות״. שום דבר כאן לא סופי.
        </p>
      </form>
    </div>
  );
}

function ClassLine({ klass }: { klass: ClassRow }) {
  const [copied, setCopied] = useState<'code' | 'message' | null>(null);

  function copy(what: 'code' | 'message') {
    // Built at click time: `window` does not exist during the server render.
    const link = `${window.location.origin}/my-class`;
    const text =
      what === 'code'
        ? klass.joinCode!
        : `היי! אנחנו מתרגלים מתמטיקה ב-MathUp.\n\n1. נכנסים לקישור: ${link}\n2. מתחברים\n3. לוחצים על ״הכיתה שלי״ ומקלידים את הקוד: ${klass.joinCode}\n\nמשם רואים בדיוק מה לתרגל.`;
    void navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(what);
        setTimeout(() => setCopied(null), 2000);
      },
      () => {}
    );
  }

  return (
    <tr className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
      <td className="px-4 py-3">
        <Link
          href={`/console/class/${klass.id}`}
          className="font-semibold text-slate-900 underline-offset-4 hover:underline dark:text-slate-50"
        >
          {klass.name}
        </Link>
        {klass.school && (
          <span className="block text-xs text-slate-500 dark:text-slate-400">{klass.school}</span>
        )}
      </td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
        {klass.units ? `${klass.units} יח״ל` : '—'}
      </td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{klass.schoolYear}</td>
      <td className="px-4 py-3 text-center font-mono tabular-nums text-slate-900 dark:text-slate-50">
        {/* "0" here is honest — a headcount, not a score. */}
        {klass.studentCount}
      </td>
      <td className="px-4 py-3">
        {klass.joinCode ? (
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copy('code')}
              title="העתק את הקוד"
              className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-sm font-semibold tracking-widest text-slate-900 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              {klass.joinCode}
              {copied === 'code' ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              )}
            </button>
            {/* The button that actually gets a class in: a finished message
                for the class WhatsApp group, which is how anything reaches an
                Israeli classroom. */}
            <button
              type="button"
              onClick={() => copy('message')}
              title="העתק הודעה מוכנה לקבוצת הכיתה"
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              {copied === 'message' ? 'הועתק' : 'הודעה לכיתה'}
            </button>
          </span>
        ) : (
          <span className="text-slate-400">סגור להצטרפות</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center justify-end gap-1">
          <RowAction href={`/console/class/${klass.id}`} icon={LayoutGrid} label="לוח" primary />
          <RowAction href={`/console/class/${klass.id}/report`} icon={Printer} label="דוח" />
          <RowAction
            href={`/api/school/classes/${klass.id}/export`}
            icon={Download}
            label="אקסל"
            plain
          />
        </span>
      </td>
    </tr>
  );
}

function RowAction({
  href,
  icon: Icon,
  label,
  primary = false,
  plain = false,
}: {
  href: string;
  icon: typeof LayoutGrid;
  label: string;
  primary?: boolean;
  /** A download, not a page — a plain anchor so the browser saves the file. */
  plain?: boolean;
}) {
  const cls = `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
    primary
      ? 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900'
      : 'border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300'
  }`;
  const inner = (
    <>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </>
  );
  return plain ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

function CreateClassDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [units, setUnits] = useState(5);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/school/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), units }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? 'לא הצלחנו לפתוח את הכיתה');
        return;
      }
      onCreated();
      onClose();
    } catch {
      setMessage('לא הצלחנו לפתוח את הכיתה. נסה שוב.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      // Above the app header (z-[90]) and the mobile tab bar (z-[55]).
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <form
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label="פתיחת כיתה"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl dark:bg-slate-900"
      >
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">פתיחת כיתה</h2>
        <p className="mt-1 mb-4 text-sm text-slate-500 dark:text-slate-400">
          תקבל קוד בן שש תווים. התלמידים מזינים אותו פעם אחת באפליקציה — בלי אימיילים, בלי הזמנות.
        </p>

        <label className="block text-sm text-slate-600 dark:text-slate-400" htmlFor="class-name">
          שם הכיתה
        </label>
        <input
          id="class-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="י׳3"
          maxLength={40}
          autoFocus
          className={inputCls}
        />

        <label className="mt-3 block text-sm text-slate-600 dark:text-slate-400" htmlFor="class-units">
          רמה
        </label>
        <select
          id="class-units"
          value={units}
          onChange={(e) => setUnits(Number(e.target.value))}
          className={inputCls}
        >
          <option value={5}>5 יחידות</option>
          <option value={4}>4 יחידות</option>
          <option value={3}>3 יחידות</option>
        </select>

        {message && (
          <p role="status" className="mt-3 text-sm text-rose-600 dark:text-rose-400">
            {message}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="flex-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
          >
            {busy ? 'פותח…' : 'פתח כיתה'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50';
