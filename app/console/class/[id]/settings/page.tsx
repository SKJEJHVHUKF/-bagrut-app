'use client';

/**
 * /console/class/[id]/settings — the management in "management system".
 *
 * Rename, change level, close the door (archive stops joining and hides the
 * class from students), and remove a student who joined the wrong class. Each
 * is one small request; none is destructive without a confirm.
 */

import { useState } from 'react';
import { Trash2, DoorClosed, DoorOpen } from 'lucide-react';
import { useClass } from '@/components/console/ClassContext';
import PageHeader from '@/components/console/PageHeader';
import { Panel, Btn, inputCls } from '@/components/console/Panel';

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
      <PageHeader title="הגדרות" subtitle="שם, רמה, הצטרפות, ומי בכיתה." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="פרטי הכיתה">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void patch({ name: name.trim(), units }, 'נשמר');
            }}
            className="flex flex-col gap-3"
          >
            <label className="block">
              <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">שם הכיתה</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">רמה</span>
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
              {msg && <span className="text-sm text-slate-500">{msg}</span>}
            </div>
          </form>
        </Panel>

        <Panel
          title="הצטרפות"
          blurb={
            open
              ? 'הקוד פעיל. תלמידים חדשים יכולים להצטרף.'
              : 'הכיתה סגורה. הקוד לא עובד, והכיתה לא מופיעה לתלמידים.'
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-2xl font-semibold tracking-widest text-slate-900 dark:text-slate-50">
              {data.class.joinCode ?? '—'}
            </span>
            <Btn
              onClick={() => void patch({ archived: open }, open ? 'ההצטרפות נסגרה' : 'ההצטרפות נפתחה')}
              disabled={busy}
            >
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
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            הדרך הזולה ביותר למנוע שהקוד יעבור בין שכבות: לסגור אחרי שכולם בפנים.
          </p>
        </Panel>

        <div className="lg:col-span-2">
          <Panel title="תלמידים בכיתה" count={board.students.length} flush>
            {board.students.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">עוד אף אחד לא הצטרף.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {board.students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">{s.name}</td>
                      <td className="px-4 py-2 text-slate-500">
                        {s.attempts === 0 ? 'טרם התחיל' : `${s.attempts} תרגילים`}
                      </td>
                      <td className="px-4 py-2 text-end">
                        <Btn kind="ghost" onClick={() => void removeStudent(s.id, s.name)}>
                          <Trash2 className="h-4 w-4" aria-hidden />
                          הסר
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
