'use client';

/**
 * /school — the way in, for both sides.
 *
 * A teacher sees his classes and opens new ones. A student types the code his
 * teacher read out. One screen rather than two because at the moment someone
 * arrives here we do not know which they are, and asking ("are you a teacher?")
 * is a question the page can answer by itself: a teacher has classes, a student
 * has a code.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Plus, LogIn, Copy, Check, School } from 'lucide-react';
import StudentFocus from '@/components/StudentFocus';

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

export default function SchoolPage() {
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/school/classes');
      if (res.status === 403) {
        setError('צריך להתחבר כדי לראות כיתות');
        setClasses([]);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setClasses(data.classes ?? []);
      setError(null);
    } catch {
      // Says what to do, not what failed.
      setError('לא הצלחנו לטעון את הכיתות. נסה לרענן.');
      setClasses([]);
    }
  }, []);

  useEffect(() => {
    // The rule is right about cascading renders and wrong about this shape:
    // `load` is async, so every setState it reaches happens in a later
    // microtask, after the fetch — not synchronously inside the effect body.
    // Fetching server state on mount is precisely the "subscribe to an external
    // system" case the rule's own documentation carves out.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <main dir="rtl" className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-center gap-3">
        <School className="h-7 w-7 text-violet-600" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">הכיתות שלי</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            מעקב אחרי כל תלמיד וכל הכיתה, במקום אחד
          </p>
        </div>
      </header>

      {error && (
        <p
          role="status"
          className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          {error}
        </p>
      )}

      {/* The student's half of the loop, and deliberately ABOVE the class list:
          a student who came here to see what his teacher asked for should not
          have to scroll past a "פתיחת כיתה" form to find it. Renders nothing at
          all when there is no focus aimed at this user. */}
      <StudentFocus />

      {classes === null ? (
        <p className="text-sm text-slate-500">טוען…</p>
      ) : (
        <>
          {classes.length > 0 && (
            <ul className="mb-8 flex flex-col gap-3">
              {classes.map((c) => (
                <li key={c.id}>
                  <ClassCard klass={c} />
                </li>
              ))}
            </ul>
          )}

          {classes.length === 0 && !error && (
            <p className="mb-8 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
              עוד אין לך כיתות. פתח כיתה, או הצטרף לאחת עם קוד.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <CreateClass onCreated={load} />
            <JoinClass onJoined={load} />
          </div>
        </>
      )}
    </main>
  );
}

function ClassCard({ klass }: { klass: ClassRow }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/school/class/${klass.id}`} className="min-w-0 flex-1 group">
          <h2 className="truncate text-lg font-semibold text-slate-900 group-hover:text-violet-700 dark:text-slate-50">
            {klass.name}
          </h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {/* "אין עדיין תלמידים" and "0 תלמידים" read differently to a
                  person, and only one of them is an instruction. */}
              {klass.studentCount === 0 ? 'אין עדיין תלמידים' : `${klass.studentCount} תלמידים`}
            </span>
            {klass.school && <span>{klass.school}</span>}
            {klass.units && <span>{klass.units} יח״ל</span>}
            <span>{klass.schoolYear}</span>
          </p>
        </Link>

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
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 font-mono text-base tracking-widest text-slate-800 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
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
    </div>
  );
}

function CreateClass({ onCreated }: { onCreated: () => void }) {
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
      setName('');
      onCreated();
    } catch {
      setMessage('לא הצלחנו לפתוח את הכיתה. נסה שוב.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
        <Plus className="h-4 w-4 text-violet-600" aria-hidden />
        פתיחת כיתה
      </h3>
      <label className="block text-sm text-slate-600 dark:text-slate-400" htmlFor="class-name">
        שם הכיתה
      </label>
      <input
        id="class-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="י׳3"
        maxLength={40}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
      />

      <label className="mt-3 block text-sm text-slate-600 dark:text-slate-400" htmlFor="class-units">
        רמה
      </label>
      <select
        id="class-units"
        value={units}
        onChange={(e) => setUnits(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
      >
        <option value={5}>5 יחידות</option>
        <option value={4}>4 יחידות</option>
        <option value={3}>3 יחידות</option>
      </select>

      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="mt-4 w-full rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-700 disabled:opacity-40"
      >
        {busy ? 'פותח…' : 'פתח כיתה'}
      </button>

      {message && (
        <p role="status" className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          {message}
        </p>
      )}
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        תקבל קוד בן שש ספרות. התלמידים מצטרפים איתו — בלי אימיילים, בלי הזמנות.
      </p>
    </form>
  );
}

function JoinClass({ onJoined }: { onJoined: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/school/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? 'לא הצלחנו לצרף אותך');
        setOk(false);
        return;
      }
      setOk(true);
      setMessage(`הצטרפת לכיתה ${data.name}`);
      setCode('');
      onJoined();
    } catch {
      setMessage('לא הצלחנו לצרף אותך. נסה שוב.');
      setOk(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
        <LogIn className="h-4 w-4 text-violet-600" aria-hidden />
        הצטרפות לכיתה
      </h3>
      <label className="block text-sm text-slate-600 dark:text-slate-400" htmlFor="join-code">
        הקוד שהמורה נתן
      </label>
      <input
        id="join-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="K7M-4PQ"
        dir="ltr"
        autoComplete="off"
        // The code is read off a projector and typed in a hurry. It is folded
        // on the server (O→0, I/l→1), so nothing here needs to police it.
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-widest text-slate-900 uppercase outline-none focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
      />
      <button
        type="submit"
        disabled={busy || !code.trim()}
        className="mt-4 w-full rounded-lg border border-violet-600 px-4 py-2 font-medium text-violet-700 transition hover:bg-violet-50 disabled:opacity-40 dark:text-violet-300 dark:hover:bg-violet-950"
      >
        {busy ? 'מצטרף…' : 'הצטרף'}
      </button>

      {message && (
        <p
          role="status"
          className={`mt-2 text-sm ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
