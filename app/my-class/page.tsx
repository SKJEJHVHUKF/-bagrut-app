'use client';

/**
 * /my-class — the STUDENT's side of the class, inside the app he already uses.
 *
 * The opposite decision from /console, and deliberately so. A teacher gets a
 * console with none of the learner's furniture; a student gets his class
 * WITHOUT leaving anything behind — the same navigation, the same tutor, the
 * same practice one tap away. He is not visiting an administrative system, he
 * is seeing what his teacher asked him to do.
 *
 * Two states and nothing else: type the code, or see what was asked.
 */

import { useCallback, useEffect, useState } from 'react';
import { School, LogIn, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import StudentFocus from '@/components/StudentFocus';

type Membership = { classId: string; name: string };

export default function MyClassPage() {
  const [classes, setClasses] = useState<Membership[] | null>(null);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setClasses([]);
        return;
      }
      // class_members has RLS with no policies (service-role only), so the
      // student's own memberships come through the API rather than a direct
      // select. One call, and it fails soft: a student with no class sees the
      // join box, which is the right screen either way.
      const res = await fetch('/api/school/my-classes');
      const data = res.ok ? await res.json() : { classes: [] };
      setClasses(data.classes ?? []);
    } catch {
      setClasses([]);
    }
  }, []);

  useEffect(() => {
    // `load` is async, so its setState calls land in a later microtask.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <main dir="rtl" className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <School className="h-7 w-7 text-violet-600" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">הכיתה שלי</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            מה שהמורה ביקש שתתרגל, במקום אחד
          </p>
        </div>
      </header>

      <StudentFocus />

      {classes === null ? (
        <p className="text-sm text-slate-500">טוען…</p>
      ) : classes.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            אתה בכיתה{' '}
            <strong className="font-semibold text-slate-900 dark:text-slate-50">
              {classes.map((c) => c.name).join(', ')}
            </strong>
            . כשהמורה יבקש משהו — הוא יופיע כאן ובמסלול הלמידה.
          </p>
          <JoinClass onJoined={load} compact />
        </div>
      ) : (
        <JoinClass onJoined={load} />
      )}
    </main>
  );
}

function JoinClass({ onJoined, compact = false }: { onJoined: () => void; compact?: boolean }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [open, setOpen] = useState(!compact);

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

  if (compact && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-sm font-medium text-violet-700 underline underline-offset-4 dark:text-violet-300"
      >
        להצטרף לכיתה נוספת
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={
        compact
          ? 'mt-4 border-t border-slate-100 pt-4 dark:border-slate-800'
          : 'rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900'
      }
    >
      {!compact && (
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
          <LogIn className="h-4 w-4 text-violet-600" aria-hidden />
          כניסה לכיתה שלי
        </h2>
      )}
      <label className="block text-sm text-slate-600 dark:text-slate-400" htmlFor="join-code">
        הקוד שהמורה שלח לך
      </label>
      <input
        id="join-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="K7M-4PQ"
        dir="ltr"
        autoComplete="off"
        // Folded on the server (O→0, I/l→1), so nothing here needs to police
        // what a student types in a hurry off a projector.
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-center font-mono text-xl tracking-widest text-slate-900 uppercase outline-none transition focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
      />
      <button
        type="submit"
        disabled={busy || !code.trim()}
        className="mt-3 w-full rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-700 disabled:opacity-40"
      >
        {busy ? 'מצטרף…' : 'הצטרף לכיתה'}
      </button>

      {message && (
        <p
          role="status"
          className={`mt-2 flex items-center gap-1.5 text-sm ${
            ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {ok && <Check className="h-4 w-4" aria-hidden />}
          {message}
        </p>
      )}
    </form>
  );
}
