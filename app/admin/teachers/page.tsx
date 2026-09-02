'use client';

// The teacher list. One row per teacher, and a row is a link — everything you
// can DO to a teacher happens on his own screen, not in a card wedged into a
// list. That is the whole reason this screen is boring.

import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { ArrowLeft, CircleAlert, RefreshCw, UserPlus } from 'lucide-react';
import { personLabel, shekel, useTeachers } from '../useTeachers';

export default function TeachersPage() {
  const { teachers, error, reload } = useTeachers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="מורים"
        description="המורים הפרטיים שלך. לחיצה על מורה פותחת את המסך שלו — תנאים, תלמידים ותיקוני שעות."
        actions={
          <button
            onClick={() => void reload()}
            className="flex items-center gap-2 bg-white/70 hover:bg-white border border-slate-200 hover:border-violet-400 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${teachers === null ? 'animate-spin' : ''}`} />
            <span>רענון</span>
          </button>
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
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-sm text-slate-600 mb-4">
            עוד אין מורים. מורה הוא חשבון רגיל שסומן כמורה במסך החשבונות.
          </p>
          <Link
            href="/admin/accounts"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            למסך החשבונות
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {teachers?.map((t) => {
          const incomplete = t.hourlyRate <= 0 || t.weeklyHours <= 0;
          return (
            <Link
              key={t.id}
              href={`/admin/teachers/${t.id}`}
              className="group glass-card rounded-2xl p-4 flex flex-wrap items-center gap-4 hover:border-violet-400 transition-colors"
            >
              <div className="flex-1 min-w-[160px]">
                <div className="font-black text-sm text-ink">{personLabel(t)}</div>
                <div className="text-[11px] text-slate-500">{t.email}</div>
              </div>

              {incomplete ? (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-1 text-[11px] font-black text-amber-800">
                  <CircleAlert className="w-3 h-3" />
                  חסרים תנאים
                </span>
              ) : (
                <div className="text-center">
                  <div className="font-display text-base font-black text-ink leading-none">
                    {t.weeklyHours} ש׳
                  </div>
                  <div className="text-[10px] text-slate-500">בשבוע</div>
                </div>
              )}

              <div className="text-center">
                <div className="font-display text-base font-black text-ink leading-none">
                  {t.students.length}
                </div>
                <div className="text-[10px] text-slate-500">תלמידים</div>
              </div>

              {/* The salary accrues by itself. These two are the only evidence
                  that a person was on the other end of it. */}
              <div className="text-center w-20">
                <div
                  className={`text-[11px] font-bold leading-tight ${
                    t.lastSignInAt ? 'text-slate-600' : 'text-red-600'
                  }`}
                >
                  {t.lastSignInAt
                    ? `נכנס לפני ${Math.max(
                        0,
                        Math.floor((Date.now() - Date.parse(t.lastSignInAt)) / 86400000)
                      )} ימים`
                    : 'לא נכנס מעולם'}
                </div>
                <div
                  className={`text-[10px] ${
                    t.assignmentsGiven === 0 ? 'text-red-600 font-bold' : 'text-slate-500'
                  }`}
                >
                  {t.assignmentsGiven} מטלות
                </div>
              </div>

              <div className="text-center w-24">
                <div className="text-base font-black text-violet-700 leading-none">
                  {shekel(t.pay.month.pay)}
                </div>
                <div className="text-[10px] text-slate-500">החודש עד כה</div>
              </div>

              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
