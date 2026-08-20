'use client';

// AdminDashboard — the owner's console: every registered account, who signed
// in and when, hand out / revoke Pro, create and delete accounts.
// Server side of everything lives in /api/admin/users.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import MathUpLogo from '@/components/MathUpLogo';
import { PageHeader } from '@/components/PageHeader';
import { isAdmin } from '@/lib/access';
import {
  Activity,
  ArrowLeft,
  Crown,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';

type Row = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
  pro: boolean;
};

const dateFmt = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'short',
  year: '2-digit',
});

function timeAgo(iso: string | null): string {
  if (!iso) return 'מעולם';
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return 'עכשיו';
  const rtf = new Intl.RelativeTimeFormat('he', { numeric: 'auto' });
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), 'day');
  return rtf.format(Math.round(diffSec / 2592000), 'month');
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function AdminDashboard({ selfId }: { selfId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  // Add-account form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setRows(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'טעינת המשתמשים נכשלה');
      setRows((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function mutate(method: 'POST' | 'PATCH' | 'DELETE', body: unknown) {
    setError('');
    const res = await fetch('/api/admin/users', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? `HTTP ${res.status}`);
    }
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await mutate('POST', { email, password, name });
      setEmail('');
      setPassword('');
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההוספה נכשלה');
    } finally {
      setAdding(false);
    }
  }

  async function togglePro(row: Row) {
    setBusyId(row.id);
    try {
      await mutate('PATCH', { id: row.id, pro: !row.pro });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'עדכון ה-Pro נכשל');
    } finally {
      setBusyId('');
    }
  }

  async function removeUser(row: Row) {
    const label = row.name ? `${row.name} (${row.email})` : row.email;
    if (!window.confirm(`למחוק את החשבון של ${label}?\nכל הנתונים שלו יימחקו לצמיתות.`)) return;
    setBusyId(row.id);
    try {
      await mutate('DELETE', { id: row.id });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'המחיקה נכשלה');
    } finally {
      setBusyId('');
    }
  }

  const total = rows?.length ?? 0;
  const activeWeek =
    rows?.filter((r) => r.lastSignInAt && Date.now() - new Date(r.lastSignInAt).getTime() < WEEK_MS)
      .length ?? 0;
  const proCount = rows?.filter((r) => r.pro).length ?? 0;

  return (
    <div
      className="min-h-screen text-slate-900 relative overflow-x-hidden"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/30 blur-[120px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/25 blur-[120px] animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
      </div>

      {/* Top bar (mobile — desktop has the global header) */}
      <nav className="md:hidden sticky top-0 z-50 glass-card border-x-0 border-t-0 rounded-none">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <MathUpLogo size="md" />
            <div>
              <div className="text-base font-black font-display text-slate-800">MathUp</div>
              <div className="text-[10px] text-slate-600 -mt-0.5">לוח בקרה</div>
            </div>
          </Link>
          <Link
            href="/"
            className="group flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-violet-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          >
            <span>לאפליקציה</span>
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <PageHeader
          title="לוח בקרה"
          description="כל מי שנרשם לאפליקציה — מתי התחבר לאחרונה, מי Pro, והוספה או הסרה של חשבונות."
          actions={
            <button
              onClick={() => void load()}
              className="flex items-center gap-2 bg-white/70 hover:bg-white border border-slate-200 hover:border-violet-400 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rows === null ? 'animate-spin' : ''}`} />
              <span>רענון</span>
            </button>
          }
        />

        {error && (
          <div role="alert" className="mb-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Users, label: 'נרשמים', value: total },
            { icon: Activity, label: 'התחברו בשבוע האחרון', value: activeWeek },
            { icon: Crown, label: 'מנויי Pro', value: proCount },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass-card rounded-2xl p-4">
              <Icon aria-hidden="true" className="w-4 h-4 text-violet-600 mb-2" />
              <div className="font-display text-2xl font-black text-ink leading-none">
                {rows === null ? '…' : value}
              </div>
              <div className="text-[11px] text-slate-600 mt-1 leading-tight">{label}</div>
            </div>
          ))}
        </div>

        {/* Add account */}
        <form onSubmit={addUser} className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus aria-hidden="true" className="w-4 h-4 text-violet-600" />
            <h2 className="text-sm font-black text-ink">הוספת חשבון</h2>
            <span className="text-[11px] text-slate-500">— נכנס מיד עם הסיסמה שתקבע, בלי מייל אימות</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="אימייל"
              aria-label="אימייל"
              autoComplete="off"
              dir="ltr"
              className="flex-1 min-w-[180px] rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm placeholder:text-right focus:border-violet-500 focus:outline-none"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="סיסמה (לפחות 6 תווים)"
              aria-label="סיסמה"
              autoComplete="new-password"
              dir="ltr"
              className="flex-1 min-w-[160px] rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm placeholder:text-right focus:border-violet-500 focus:outline-none"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם (לא חובה)"
              aria-label="שם"
              autoComplete="off"
              className="flex-1 min-w-[120px] rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={adding}
              className="rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-4 py-2 text-sm font-black text-white transition-colors"
            >
              {adding ? 'מוסיף…' : 'הוסף'}
            </button>
          </div>
        </form>

        {/* Accounts table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-right text-[11px] text-slate-500">
                  <th className="px-4 py-3 font-bold">משתמש</th>
                  <th className="px-4 py-3 font-bold whitespace-nowrap">התחברות אחרונה</th>
                  <th className="px-4 py-3 font-bold whitespace-nowrap">נרשם</th>
                  <th className="px-4 py-3 font-bold">Pro</th>
                  <th className="px-4 py-3 font-bold">
                    <span className="sr-only">פעולות</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows === null && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      טוען משתמשים…
                    </td>
                  </tr>
                )}
                {rows?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      אין עדיין נרשמים.
                    </td>
                  </tr>
                )}
                {rows?.map((row) => {
                  const busy = busyId === row.id;
                  const self = row.id === selfId;
                  return (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span dir="ltr" className="font-bold text-slate-800">
                            {row.email}
                          </span>
                          {isAdmin(row) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 border border-violet-300 px-2 py-0.5 text-[10px] font-black text-violet-700">
                              <ShieldCheck aria-hidden="true" className="w-3 h-3" />
                              מנהל{self ? ' (אתה)' : ''}
                            </span>
                          )}
                          {!row.confirmed && (
                            <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-700">
                              לא מאומת
                            </span>
                          )}
                        </div>
                        {row.name && <div className="text-xs text-slate-500 mt-0.5">{row.name}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {timeAgo(row.lastSignInAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {dateFmt.format(new Date(row.createdAt))}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => void togglePro(row)}
                          disabled={busy}
                          title={row.pro ? 'לחיצה תבטל את ה-Pro' : 'לחיצה תעניק Pro'}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black transition-colors disabled:opacity-50 ${
                            row.pro
                              ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                              : 'bg-slate-100 border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-700'
                          }`}
                        >
                          <Crown aria-hidden="true" className="w-3 h-3" />
                          {row.pro ? 'Pro' : 'חינם'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-left">
                        {!self && (
                          <button
                            onClick={() => void removeUser(row)}
                            disabled={busy}
                            aria-label={`מחק את ${row.email}`}
                            className="rounded-xl p-2 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <Trash2 aria-hidden="true" className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
