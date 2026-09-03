'use client';

/**
 * /console — the teacher's classes.
 *
 * The console's home. A first visit is three steps and one field; after that
 * it is a short list of classes, each a row with its join code, the message to
 * paste into the class WhatsApp group, and the way into its board.
 *
 * The student's half lives at /my-class, inside the app he already uses.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Users, Plus, Check, ArrowLeft, MessageSquare, LayoutGrid, Printer, Download, Eye } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/lib/a11y/useDialog';
import { fadeUp } from '@/lib/animations';
import { Btn, btnSecondary, btnPrimary, inputCls } from '@/components/console/ui';

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
      <PageHeader
        title="הכיתות שלי"
        description="כל כיתה, מי בה, ואיך התלמידים מצטרפים אליה."
        actions={
          <>
            <Link href="/console-demo" className={btnSecondary}>
              <Eye className="h-4 w-4" aria-hidden />
              תצוגת דוגמה
            </Link>
            {classes && classes.length > 0 && (
              <Btn kind="primary" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                פתיחת כיתה
              </Btn>
            )}
          </>
        }
      />

      {error && (
        <p role="status" className="surface-premium mb-4 rounded-2xl px-4 py-3 text-sm font-bold text-amber-800">
          {error}
        </p>
      )}

      {classes === null ? (
        <p className="text-sm text-slate-500">טוען…</p>
      ) : classes.length === 0 && !error ? (
        <FirstClass onCreated={load} />
      ) : (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="surface-premium overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="text-[11px] font-black text-slate-500">
              <tr className="border-b border-slate-900/[0.06]">
                <th className="px-4 py-3 text-start">כיתה</th>
                <th className="px-4 py-3 text-start">רמה</th>
                <th className="px-4 py-3 text-start">שנה</th>
                <th className="px-4 py-3 text-center">תלמידים</th>
                <th className="px-4 py-3 text-start">קוד הצטרפות</th>
                <th className="px-4 py-3 text-end">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/[0.06]">
              {classes.map((c) => (
                <ClassLine key={c.id} klass={c} />
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <AnimatePresence>
        {creating && <CreateClassDialog onClose={() => setCreating(false)} onCreated={load} />}
      </AnimatePresence>
    </main>
  );
}

/**
 * The first visit, for a teacher who has never used software like this.
 * Three things that will happen, in order, and the only field she has to fill
 * in right now.
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
    { n: 3, title: 'חזור מחר', body: 'התלמידים מתרגלים כרגיל. המסך יגיד לך במשפט אחד מי צריך אותך ומה ללמד שוב.' },
  ];

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="grid gap-4 lg:grid-cols-5">
      <ol className="flex flex-col gap-3 lg:col-span-3">
        {steps.map((s) => (
          <li
            key={s.n}
            className={`flex gap-4 rounded-2xl p-4 ${s.n === 1 ? 'surface-premium' : 'bg-white/40 text-slate-500'}`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-sm font-black ${
                s.n === 1 ? 'bg-primary-deep text-white' : 'bg-slate-900/[0.06] text-slate-500'
              }`}
            >
              {s.n}
            </span>
            <div>
              <p className={`font-display font-black ${s.n === 1 ? 'text-ink' : ''}`}>{s.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <form onSubmit={submit} className="surface-premium rounded-2xl p-5 lg:col-span-2">
        <label className="block text-sm font-bold text-slate-700" htmlFor="first-class-name">
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
        <label className="mt-4 block text-sm font-bold text-slate-700" htmlFor="first-class-units">
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
        <button type="submit" disabled={busy || !name.trim()} className={`${btnPrimary} mt-5 w-full py-3 text-base`}>
          {busy ? 'פותח…' : 'פתח את הכיתה'}
        </button>
        {message && (
          <p role="status" className="mt-2 text-sm font-bold text-red-700">
            {message}
          </p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-slate-500">אפשר לשנות הכל אחר כך ב״הגדרות״. שום דבר כאן לא סופי.</p>
      </form>
    </motion.div>
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
        : `היי! אנחנו מתרגלים מתמטיקה ב-MathUp.\n\n1. נכנסים לקישור: ${link}\n2. מתחברים\n3. לוחצים על ״כניסה לכיתה שלי״ ומקלידים את הקוד: ${klass.joinCode}\n\nמשם רואים בדיוק מה לתרגל.`;
    void navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(what);
        setTimeout(() => setCopied(null), 2000);
      },
      () => {}
    );
  }

  return (
    <tr className="transition hover:bg-violet-50/40">
      <td className="px-4 py-3">
        <Link href={`/console/class/${klass.id}`} className="font-display text-base font-black text-ink hover:text-violet-700">
          {klass.name}
        </Link>
        {klass.school && <span className="block text-xs text-slate-500">{klass.school}</span>}
      </td>
      <td className="px-4 py-3 text-slate-600">{klass.units ? `${klass.units} יח״ל` : '—'}</td>
      <td className="px-4 py-3 text-slate-600">{klass.schoolYear}</td>
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center gap-1 font-display font-black text-ink">
          <Users className="h-3.5 w-3.5 text-violet-600" aria-hidden />
          {klass.studentCount}
        </span>
      </td>
      <td className="px-4 py-3">
        {klass.joinCode ? (
          <span className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copy('code')}
              title="העתק את הקוד"
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-2.5 py-1 font-mono text-sm font-black tracking-widest text-ink transition hover:border-violet-400"
              aria-label={`העתק את הקוד ${klass.joinCode}`}
            >
              {klass.joinCode}
              {copied === 'code' && <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={() => copy('message')}
              className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              {copied === 'message' ? 'הועתק — הדבק בקבוצה' : 'הודעה לכיתה'}
            </button>
          </span>
        ) : (
          <span className="text-slate-400">סגור להצטרפות</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center justify-end gap-1.5">
          <Link href={`/console/class/${klass.id}`} className={`${btnPrimary} px-3 py-1.5 text-xs`}>
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            לוח
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link href={`/console/class/${klass.id}/report`} className={`${btnSecondary} px-3 py-1.5 text-xs`}>
            <Printer className="h-3.5 w-3.5" aria-hidden />
            דוח
          </Link>
          <a href={`/api/school/classes/${klass.id}/export`} className={`${btnSecondary} px-3 py-1.5 text-xs`}>
            <Download className="h-3.5 w-3.5" aria-hidden />
            אקסל
          </a>
        </span>
      </td>
    </tr>
  );
}

function CreateClassDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [units, setUnits] = useState(5);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { panelRef, dialogProps } = useDialog<HTMLFormElement>(true, onClose, { label: 'פתיחת כיתה' });

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
    <motion.div
      // Above the app header (z-[90]) and the mobile tab bar (z-[55]).
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.form
        ref={panelRef}
        {...dialogProps}
        // Explicit as well as spread: scripts/verify-a11y.ts greps for a literal
        // role="dialog" or `useDialog(`, and the generic call site hides the
        // latter from its regex.
        role="dialog"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        className="surface-premium w-full max-w-md rounded-2xl p-5 outline-none"
      >
        <h2 className="font-display text-lg font-black text-ink">פתיחת כיתה</h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">
          תקבל קוד בן שש תווים. התלמידים מזינים אותו פעם אחת באפליקציה — בלי אימיילים, בלי הזמנות.
        </p>
        <label className="block text-sm font-bold text-slate-700" htmlFor="class-name">
          שם הכיתה
        </label>
        <input id="class-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="י׳3" maxLength={40} className={`${inputCls} mt-1`} />
        <label className="mt-3 block text-sm font-bold text-slate-700" htmlFor="class-units">
          רמה
        </label>
        <select id="class-units" value={units} onChange={(e) => setUnits(Number(e.target.value))} className={`${inputCls} mt-1`}>
          <option value={5}>5 יחידות</option>
          <option value={4}>4 יחידות</option>
          <option value={3}>3 יחידות</option>
        </select>
        {message && (
          <p role="status" className="mt-3 text-sm font-bold text-red-700">
            {message}
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <Btn kind="primary" type="submit" disabled={busy || !name.trim()} className="flex-1">
            {busy ? 'פותח…' : 'פתח כיתה'}
          </Btn>
          <Btn type="button" onClick={onClose}>
            ביטול
          </Btn>
        </div>
      </motion.form>
    </motion.div>
  );
}
