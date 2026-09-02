'use client';

/**
 * /console — the teacher's classes.
 *
 * The console's home, and deliberately NOT the student app: no learning path,
 * no quick quiz, no tutor bubble. A teacher opening this is running a class,
 * not studying for a bagrut, and every control on the screen belongs to that
 * job. (The chrome is removed by /console being in STAFF_PREFIXES — see
 * lib/nav.ts.)
 *
 * The student's half lives at /my-class, inside the app he already uses.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Check,
  ArrowLeft,
  Info,
  ChevronDown,
  MessageSquare,
  Eye,
} from 'lucide-react';

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

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/school/classes');
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
    // `load` is async, so its setState calls land in a later microtask.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            הכיתות שלי
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            מעקב אחרי כל תלמיד וכל הכיתה, במקום אחד
          </p>
        </div>
        <Link
          href="/console-demo"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <Eye className="h-4 w-4" aria-hidden />
          תצוגת דוגמה
        </Link>
      </div>

      {error && (
        <p
          role="status"
          className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          {error}
        </p>
      )}

      <HowItWorks hasClasses={!!classes?.length} />

      {classes === null ? (
        <p className="text-sm text-slate-500">טוען…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            {classes.length === 0 && !error ? (
              <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700">
                עוד אין לך כיתות. פתח אחת מימין — זה לוקח חצי דקה.
              </p>
            ) : (
              classes.map((c) => <ClassCard key={c.id} klass={c} />)
            )}
          </div>
          <CreateClass onCreated={load} />
        </div>
      )}
    </main>
  );
}

/**
 * The whole thing, in four steps, on the screen where a teacher first meets it.
 *
 * Written because the owner opened the page and said nothing was clear — and he
 * was right: it showed a class card and a form, and never said what the product
 * does or who does what. Collapses once he has a class: an explanation you
 * cannot dismiss becomes furniture, and furniture is what people stop reading.
 */
function HowItWorks({ hasClasses }: { hasClasses: boolean }) {
  const [open, setOpen] = useState(!hasClasses);

  const steps = [
    { who: 'אתה', title: 'פותח כיתה', body: 'שם ורמה, ומקבל קוד בן שש תווים.' },
    {
      who: 'התלמידים',
      title: 'מצטרפים עם הקוד',
      body: 'באפליקציה הרגילה שלהם, בתפריט ״הכיתה שלי״. פעם אחת בשנה.',
    },
    {
      who: 'התלמידים',
      title: 'מתרגלים כרגיל',
      body: 'שום דבר לא משתנה להם. כל תשובה נרשמת מעצמה.',
    },
    {
      who: 'אתה',
      title: 'רואה ומכוון',
      body: 'מי תקוע, מה הכיתה לא הבינה — ושולח כל אחד בדיוק למקום שלו.',
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
        <ol className="grid gap-4 border-t border-slate-100 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800">
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
      )}
    </section>
  );
}

/**
 * A class, and — just as important — WHAT TO TELL THE STUDENTS.
 *
 * A teacher holding a six-character code still has no idea what sentence to say
 * to thirty teenagers, and they have no idea where to type it. So the card
 * carries the instruction, and the button that matters copies a finished
 * message for the class WhatsApp group — which is how anything actually reaches
 * an Israeli classroom.
 */
function ClassCard({ klass }: { klass: ClassRow }) {
  const [copied, setCopied] = useState<'code' | 'message' | null>(null);

  function copy(what: 'code' | 'message') {
    // Built at click time: `window` does not exist during the server render,
    // and an effect just to learn our own address would be a round trip for a
    // string the browser already has.
    const link = `${window.location.origin}/my-class`;
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold text-slate-900 dark:text-slate-50">
            {klass.name}
          </h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {/* "אין עדיין תלמידים" and "0 תלמידים" read differently to a
                  person, and only one of them is an instruction. */}
              {klass.studentCount === 0 ? 'אין עדיין תלמידים' : `${klass.studentCount} תלמידים`}
            </span>
            {klass.units && <span>{klass.units} יח״ל</span>}
            <span>{klass.schoolYear}</span>
          </p>
        </div>

        <Link
          href={`/console/class/${klass.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-700"
        >
          לוח הכיתה
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {klass.joinCode && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">קוד הצטרפות</p>
            <button
              type="button"
              onClick={() => copy('code')}
              className="mt-0.5 font-mono text-2xl font-semibold tracking-widest text-slate-900 underline-offset-4 transition hover:text-violet-700 hover:underline dark:text-slate-50"
              aria-label={`העתק את הקוד ${klass.joinCode}`}
            >
              {klass.joinCode}
            </button>
          </div>

          <p className="min-w-0 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            התלמידים נכנסים לאפליקציה, בוחרים <strong className="font-medium">״הכיתה שלי״</strong>{' '}
            ומקלידים אותו. בלי אימיילים, בלי הזמנות.
          </p>

          <button
            type="button"
            onClick={() => copy('message')}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-violet-300 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950"
          >
            {copied === 'message' ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                הועתק — הדבק בקבוצה
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" aria-hidden />
                העתק הודעה לקבוצת הכיתה
              </>
            )}
          </button>
          {copied === 'code' && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">הקוד הועתק</span>
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
      className="h-fit rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
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

      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="mt-4 w-full rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-700 disabled:opacity-40"
      >
        {busy ? 'פותח…' : 'פתח כיתה'}
      </button>

      {message && (
        <p role="status" className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          {message}
        </p>
      )}
    </form>
  );
}

const inputCls =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50';
