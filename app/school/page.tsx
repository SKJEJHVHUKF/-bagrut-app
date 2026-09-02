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
import {
  Users,
  Plus,
  LogIn,
  Copy,
  Check,
  School,
  ArrowLeft,
  Info,
  ChevronDown,
} from 'lucide-react';
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

      <HowItWorks hasClasses={!!classes?.length} />

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

/**
 * The whole thing, in four steps, on the screen where someone first meets it.
 *
 * Written because the owner opened the page and said "כלום לא מובן" — and he
 * was right: it showed a class card and two forms, and never once said what the
 * product does or who does what. A teacher landing here has to understand the
 * loop before he will spend a lesson's goodwill introducing it to a class.
 *
 * It collapses to a single line once he has a class: an explanation you cannot
 * dismiss becomes furniture, and furniture is what people stop reading.
 */
function HowItWorks({ hasClasses }: { hasClasses: boolean }) {
  const [open, setOpen] = useState(!hasClasses);

  const steps = [
    {
      who: 'המורה',
      title: 'פותח כיתה',
      body: 'שם הכיתה ורמה, ומקבל קוד בן שש תווים.',
    },
    {
      who: 'התלמידים',
      title: 'מצטרפים עם הקוד',
      body: 'בתפריט ״הכיתה שלי״, פעם אחת. בלי אימיילים ובלי הזמנות.',
    },
    {
      who: 'התלמידים',
      title: 'מתרגלים כרגיל',
      body: 'אותה אפליקציה שהם כבר מכירים. כל תשובה נרשמת אוטומטית.',
    },
    {
      who: 'המורה',
      title: 'רואה ומכוון',
      body: 'מי תקוע, מה הכיתה לא הבינה — ושולח כל אחד לתרגל בדיוק במקום שלו.',
    },
  ];

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-start"
      >
        <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
          <Info className="h-4 w-4 text-violet-600" aria-hidden />
          איך זה עובד
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <ol className="grid gap-4 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-100 font-mono text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {s.title}
                    <span className="ms-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {s.who}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            רוצה לראות איך נראה הלוח לפני שאתה פותח כיתה?{' '}
            <Link
              href="/school/demo"
              className="font-medium text-violet-700 underline underline-offset-4 dark:text-violet-300"
            >
              תצוגת דוגמה עם כיתה מלאה
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * A class, and — just as important — WHAT TO TELL THE STUDENTS.
 *
 * The first version showed the join code as a chip and nothing else, and it was
 * unusable for the obvious reason: a teacher holding a six-character code still
 * has no idea what sentence to say to thirty teenagers, and they have no idea
 * where to type it. "Go to slash school" is not an instruction anyone follows.
 *
 * So the card carries the instruction, and the one button that matters copies a
 * finished message for the class WhatsApp group — which is how an Israeli
 * teacher actually distributes anything.
 */
function ClassCard({ klass }: { klass: ClassRow }) {
  const [copied, setCopied] = useState<'code' | 'message' | null>(null);

  function copy(what: 'code' | 'message') {
    // Built at click time: `window` does not exist during the server render,
    // and an effect just to learn our own address would be a round trip for a
    // string the browser already knows.
    const link = `${window.location.origin}/school`;
    const text =
      what === 'code'
        ? klass.joinCode!
        : `היי! אנחנו מתרגלים מתמטיקה ב-MathUp.\n\n1. נכנסים לקישור: ${link}\n2. מתחברים\n3. מקלידים את קוד הכיתה: ${klass.joinCode}\n\nמשם רואים בדיוק מה לתרגל.`;

    void navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(what);
        setTimeout(() => setCopied(null), 2000);
      },
      () => {}
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">
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
        </div>

        {/* The primary action, and it now LOOKS like one. As a bare heading
            link it was invisible: the whole board sat behind a click nothing
            invited. */}
        <Link
          href={`/school/class/${klass.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-700"
        >
          לוח הכיתה
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {klass.joinCode && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
          <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            איך התלמידים מצטרפים
          </h3>
          <ol className="mb-3 flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
            <li>
              1. נכנסים לאפליקציה ובוחרים בתפריט <strong>״הכיתה שלי״</strong>
            </li>
            <li>
              2. מקלידים את הקוד{' '}
              <button
                type="button"
                onClick={() => copy('code')}
                className="rounded bg-white px-2 py-0.5 font-mono font-semibold tracking-widest text-slate-900 ring-1 ring-slate-300 transition hover:ring-violet-400 dark:bg-slate-800 dark:text-slate-50 dark:ring-slate-700"
                aria-label={`העתק את הקוד ${klass.joinCode}`}
              >
                {klass.joinCode}
              </button>
            </li>
          </ol>

          <button
            type="button"
            onClick={() => copy('message')}
            className="inline-flex items-center gap-2 rounded-lg border border-violet-300 px-3 py-1.5 text-sm font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950"
          >
            {copied === 'message' ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                הועתק — הדבק בקבוצה
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden />
                העתק הודעה מוכנה לקבוצת הכיתה
              </>
            )}
          </button>
          {copied === 'code' && (
            <span className="mr-3 text-sm text-emerald-600 dark:text-emerald-400">הקוד הועתק</span>
          )}
        </div>
      )}
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
