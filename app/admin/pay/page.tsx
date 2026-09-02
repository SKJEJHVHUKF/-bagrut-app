'use client';

// Payroll — the screen the owner opens once a month to pay people.
//
// One row per teacher, one total at the bottom, and every number derived from
// the standing weekly figure plus any corrections. Nothing here is a stored
// balance: change a rate or fix a week and this screen re-prices immediately,
// including retroactively.

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { CircleAlert, RefreshCw } from 'lucide-react';
import { israelDay } from '@/lib/teacher-pay';
import { personLabel, shekel, useTeachers } from '../useTeachers';

/** Coarse on purpose — this column answers "has he shown up at all". */
function signedInAgo(iso: string | null): { text: string; cold: boolean } {
  if (!iso) return { text: 'לא נכנס מעולם', cold: true };
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
  if (days > 30) return { text: `לפני ${Math.floor(days / 30)} חודשים`, cold: true };
  if (days > 7) return { text: `לפני ${days} ימים`, cold: true };
  if (days > 0) return { text: `לפני ${days} ימים`, cold: false };
  return { text: 'היום', cold: false };
}

export default function PayPage() {
  // Empty = the current month. Payday is the 1st, and on the 1st the screen
  // has already rolled over to a month nobody has worked yet.
  const [month, setMonth] = useState('');
  const { teachers, error, reload } = useTeachers(month || undefined);
  const thisMonth = israelDay(new Date()).slice(0, 7);

  const rows = teachers ?? [];
  const weekTotal = rows.reduce((sum, t) => sum + t.pay.week.pay, 0);
  const monthTotal = rows.reduce((sum, t) => sum + t.pay.month.pay, 0);
  const monthLabel = rows[0]?.pay.month.month ?? (month || thisMonth);

  return (
    <div className="space-y-6">
      <PageHeader
        title="שכר"
        description="כמה מגיע לכל מורה — השבוע והחודש. מחושב מהשעות השבועיות שקבעת, בתוספת תיקונים."
        actions={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
              חודש
              <input
                type="month"
                max={thisMonth}
                value={month || thisMonth}
                onChange={(e) => setMonth(e.target.value === thisMonth ? '' : e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900"
              />
            </label>
            <button
              onClick={() => void reload()}
              className="flex items-center gap-2 bg-white/70 hover:bg-white border border-slate-200 hover:border-violet-400 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${teachers === null ? 'animate-spin' : ''}`} />
              <span>רענון</span>
            </button>
          </div>
        }
      />

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
        >
          {error}
        </div>
      )}

      {teachers === null && <p className="text-sm text-slate-500 py-8 text-center">טוען…</p>}

      {teachers?.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-600">
          אין מורים, אז אין שכר לחשב.
        </div>
      )}

      {rows.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-[11px] font-black text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3">מורה</th>
                  <th className="px-4 py-3">נכנס ללוח</th>
                  <th className="px-4 py-3">מטלות</th>
                  <th className="px-4 py-3">תעריף</th>
                  <th className="px-4 py-3">ש״ש</th>
                  <th className="px-4 py-3">השבוע</th>
                  <th className="px-4 py-3">שעות החודש</th>
                  <th className="px-4 py-3">לתשלום החודש</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const incomplete = t.hourlyRate <= 0 || t.weeklyHours <= 0;
                  const corrected = t.pay.month.weeks.filter((w) => w.edited).length;
                  return (
                    <tr key={t.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/teachers/${t.id}`}
                          className="font-bold text-ink hover:text-violet-700"
                        >
                          {personLabel(t)}
                        </Link>
                        {corrected > 0 && (
                          <div className="text-[11px] text-amber-700 font-bold">
                            {corrected} שבועות תוקנו ידנית
                          </div>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-[11px] font-bold ${
                        signedInAgo(t.lastSignInAt).cold ? 'text-red-600' : 'text-slate-600'
                      }`}>
                        {signedInAgo(t.lastSignInAt).text}
                      </td>
                      <td className={`px-4 py-3 font-bold ${
                        t.assignmentsGiven === 0 ? 'text-red-600' : 'text-slate-700'
                      }`}>
                        {t.assignmentsGiven}
                      </td>
                      <td className="px-4 py-3">
                        {incomplete ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700">
                            <CircleAlert className="w-3 h-3" />
                            לא הוגדר
                          </span>
                        ) : (
                          shekel(t.hourlyRate)
                        )}
                      </td>
                      <td className="px-4 py-3">{t.weeklyHours}</td>
                      <td className="px-4 py-3">
                        {t.pay.week.hours} ש׳
                        <span className="text-slate-400"> · </span>
                        {shekel(t.pay.week.pay)}
                      </td>
                      <td className="px-4 py-3">{t.pay.month.hours} ש׳</td>
                      <td className="px-4 py-3 font-black text-violet-700">
                        {shekel(t.pay.month.pay)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-black">
                  <td className="px-4 py-3" colSpan={5}>
                    סה״כ {monthLabel}
                  </td>
                  <td className="px-4 py-3">{shekel(weekTotal)}</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-violet-700">{shekel(monthTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-500 leading-relaxed">
        &quot;החודש&quot; כולל רק שבועות שכבר התחילו, כך שבאמצע החודש זה מה שנצבר עד עכשיו ולא תחזית.
        המספרים אינם נשמרים בשום מקום — שינוי תעריף או תיקון שבוע משנה גם את החישוב אחורה, כולל
        לחודשים שכבר שולמו. &quot;נכנס ללוח&quot; ו&quot;מטלות&quot; הן שתי העדויות היחידות שמישהו
        באמת עבד: השכר נצבר מעצמו גם אם המורה לא פתח את המסך אף פעם.
      </p>
    </div>
  );
}
