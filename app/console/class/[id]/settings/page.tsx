'use client';

/**
 * /console/class/[id]/settings — the management in "management system".
 *
 * Rename, change level, close the door (archive stops joining and hides the
 * class from students), and remove a student who joined the wrong class. Each
 * is one small request; none is destructive without a confirm.
 */

import { useState } from 'react';
import { Trash2, DoorClosed, DoorOpen, Settings, KeyRound, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useClass } from '@/components/console/ClassContext';
import { Btn, inputCls, SectionHead, Avatar } from '@/components/console/ui';

export default function SettingsPage() {
  const { data, board, classId, reload, isDemo } = useClass();
  const [name, setName] = useState(data.class.name);
  const [units, setUnits] = useState<number>(data.class.units ?? 5);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>, ok: string) {
    if (!classId) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/school/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      setMsg(res.ok ? ok : (d.error ?? 'לא הצלחנו לשמור'));
      if (res.ok) reload();
    } catch {
      setMsg('לא הצלחנו לשמור. נסה שוב.');
    } finally {
      setBusy(false);
    }
  }

  async function removeStudent(id: string, studentName: string) {
    if (!classId) return;
    if (!window.confirm(`להסיר את ${studentName} מהכיתה? ההיסטוריה שלו נשמרת, רק השיוך נמחק.`)) return;
    const res = await fetch(`/api/school/classes/${classId}/members/${id}`, { method: 'DELETE' });
    if (res.ok) reload();
    else setMsg('לא הצלחנו להסיר');
  }

  if (isDemo) {
    return (
      <>
        <PageHeader title="הגדרות" />
        <p className="text-sm text-slate-500">בתצוגת דוגמה אין מה להגדיר.</p>
      </>
    );
  }

  const open = !data.class.archived;

  return (
    <>
      <PageHeader title="הגדרות" description="שם, רמה, הצטרפות, ומי בכיתה." />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface-premium rounded-2xl p-5">
          <SectionHead icon={Settings} title="פרטי הכיתה" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void patch({ name: name.trim(), units }, 'נשמר');
            }}
            className="flex flex-col gap-3"
          >
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">שם הכיתה</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">רמה</span>
              <select value={units} onChange={(e) => setUnits(Number(e.target.value))} className={inputCls}>
                <option value={5}>5 יחידות</option>
                <option value={4}>4 יחידות</option>
                <option value={3}>3 יחידות</option>
              </select>
            </label>
            <div className="flex items-center gap-3">
              <Btn kind="primary" type="submit" disabled={busy || !name.trim()}>
                שמירה
              </Btn>
              {msg && <span className="text-sm text-slate-600">{msg}</span>}
            </div>
          </form>
        </section>

        <section className="surface-premium rounded-2xl p-5">
          <SectionHead
            icon={KeyRound}
            title="הצטרפות"
            hint={open ? 'הקוד פעיל — תלמידים חדשים יכולים להצטרף.' : 'הכיתה סגורה — הקוד לא עובד.'}
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 font-mono text-2xl font-black tracking-widest text-ink">
              {data.class.joinCode ?? '—'}
            </span>
            <Btn onClick={() => void patch({ archived: open }, open ? 'ההצטרפות נסגרה' : 'ההצטרפות נפתחה')} disabled={busy}>
              {open ? (
                <>
                  <DoorClosed className="h-4 w-4" aria-hidden />
                  סגור הצטרפות
                </>
              ) : (
                <>
                  <DoorOpen className="h-4 w-4" aria-hidden />
                  פתח הצטרפות
                </>
              )}
            </Btn>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            הדרך הזולה ביותר למנוע שהקוד יעבור בין שכבות: לסגור אחרי שכולם בפנים.
          </p>
        </section>

        <section className="surface-premium rounded-2xl p-5 lg:col-span-2">
          <SectionHead icon={Users} title="תלמידים בכיתה" count={board.students.length} />
          {board.students.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">עוד אף אחד לא הצטרף.</p>
          ) : (
            <ul className="divide-y divide-slate-900/[0.06]">
              {board.students.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2">
                  <Avatar name={s.name} />
                  <span className="flex-1 font-bold text-ink">{s.name}</span>
                  <span className="text-sm text-slate-500">{s.attempts === 0 ? 'טרם התחיל' : `${s.attempts} תרגילים`}</span>
                  <Btn kind="ghost" onClick={() => void removeStudent(s.id, s.name)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                    הסר
                  </Btn>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
