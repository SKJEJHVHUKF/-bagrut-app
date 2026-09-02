'use client';

// The admin area's landing screen: what is set up, what is owed, and — the
// part the old console never answered — WHAT TO DO NEXT.
//
// Setting a teacher up is a four-step chain (create the account → mark him a
// teacher → set his terms → give him students), and a half-finished chain
// looks exactly like a finished one: a teacher with no rate still appears in
// every list, he is just silently owed ₪0. So the steps are derived from the
// data and listed as work, each one linking to the screen that completes it.

import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  GraduationCap,
  PhoneCall,
  RefreshCw,
  Users,
  Wallet,
} from 'lucide-react';
import { personLabel, shekel, useTeachers } from './useTeachers';

export default function AdminOverview() {
  const { teachers, candidates, error, reload } = useTeachers();

  const monthTotal = (teachers ?? []).reduce((sum, t) => sum + t.pay.month.pay, 0);
  const assigned = new Set((teachers ?? []).flatMap((t) => t.students.map((s) => s.id)));

  // The next steps, in the order they have to happen.
  const todo: { text: string; href: string; cta: string }[] = [];
  if (teachers?.length === 0) {
    todo.push({
      text: 'עוד אין מורים במערכת. צור חשבון ואז סמן אותו כמורה.',
      href: '/admin/accounts',
      cta: 'למסך החשבונות',
    });
  }
  for (const t of teachers ?? []) {
    if (t.hourlyRate <= 0 || t.weeklyHours <= 0) {
      todo.push({
        text: `${personLabel(t)} — עדיין בלי תעריף או שעות שבועיות, ולכן מוצג כמי שמגיע לו 0 ₪.`,
        href: `/admin/teachers/${t.id}`,
        cta: 'קבע תנאים',
      });
    } else if (t.students.length === 0) {
      todo.push({
        text: `${personLabel(t)} — מוגדר, אבל עוד לא שויכו אליו תלמידים, אז הלוח שלו ריק.`,
        href: `/admin/teachers/${t.id}`,
        cta: 'שייך תלמידים',
      });
    }
  }

  const unassigned = candidates.filter((c) => !assigned.has(c.id)).length;

  // THE SILENCE LIST. Parents cancel after three quiet weeks, not after a bad
  // grade — and the tutor deliberately holds no email or phone number, so a
  // student who stops showing up can only be reached from here. Fourteen days
  // is the threshold because a weekly lesson means two missed cycles.
  const QUIET_DAYS = 14;
  const quiet = (teachers ?? [])
    .flatMap((t) =>
      t.students.map((s) => ({
        ...s,
        teacherName: personLabel(t),
        teacherId: t.id,
        days:
          s.lastAnswerAt === null
            ? null
            : Math.floor((Date.now() - s.lastAnswerAt) / 86400000),
      }))
    )
    .filter((s) => s.syncedAt === null || s.days === null || s.days >= QUIET_DAYS)
    // Never-synced first: that student is not quiet, he was never here at all.
    .sort((a, b) => (b.days ?? 9999) - (a.days ?? 9999));

  return (
    <div className="space-y-6">
      <PageHeader
        title="סקירה"
        description="מצב מערכת המורים במבט אחד — מה מוגדר, מה חסר, וכמה שכר נצבר החודש."
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: GraduationCap,
            label: 'מורים',
            value: teachers === null ? '…' : teachers.length,
            href: '/admin/teachers',
          },
          {
            icon: Users,
            label: 'תלמידים משויכים',
            value: teachers === null ? '…' : assigned.size,
            href: '/admin/teachers',
          },
          {
            icon: Users,
            label: 'תלמידים ללא מורה',
            value: teachers === null ? '…' : unassigned,
            href: '/admin/accounts',
          },
          {
            icon: Wallet,
            label: 'שכר החודש עד כה',
            value: teachers === null ? '…' : shekel(monthTotal),
            href: '/admin/pay',
          },
        ].map(({ icon: Icon, label, value, href }) => (
          <Link key={label} href={href} className="glass-card rounded-2xl p-4 hover:border-violet-400 transition-colors">
            <Icon aria-hidden="true" className="w-4 h-4 text-violet-600 mb-2" />
            <div
              className={`text-2xl font-black text-ink leading-none ${
                // ₪ is missing from the display face and renders as a box.
                label.includes('שכר') ? '' : 'font-display'
              }`}
            >
              {value}
            </div>
            <div className="text-[11px] text-slate-600 mt-1 leading-tight">{label}</div>
          </Link>
        ))}
      </div>

      <section className="glass-card rounded-2xl p-4">
        <h2 className="text-sm font-black text-ink mb-3">הצעדים הבאים</h2>

        {teachers === null ? (
          <p className="text-sm text-slate-500">טוען…</p>
        ) : todo.length === 0 ? (
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            הכל מוגדר. השעות והשכר מצטברים מעצמם, שבוע אחרי שבוע.
          </div>
        ) : (
          <ul className="space-y-2">
            {todo.map((step) => (
              <li
                key={step.text}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"
              >
                <CircleAlert aria-hidden="true" className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="flex-1 min-w-[200px] text-sm text-amber-900">{step.text}</span>
                <Link
                  href={step.href}
                  className="group flex items-center gap-1.5 bg-white border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900"
                >
                  {step.cta}
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quiet students — the one screen that turns a number into a phone call. */}
      {quiet.length > 0 && (
        <section className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <PhoneCall aria-hidden="true" className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-black text-ink">תלמידים ששתקו</h2>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            לא תרגלו {QUIET_DAYS} ימים או יותר. המורה לא מחזיק את פרטי הקשר שלהם — הפנייה היא ממך.
          </p>
          <div className="space-y-1">
            {quiet.slice(0, 10).map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2"
              >
                <span className="flex-1 min-w-[140px]">
                  <span className="block text-sm font-bold text-ink">{personLabel(s)}</span>
                  <span className="block text-[11px] text-slate-600">{s.email}</span>
                </span>
                <span className="text-[11px] font-bold text-red-700">
                  {s.syncedAt === null
                    ? 'לא נכנס לאפליקציה מעולם'
                    : s.days === null
                      ? 'לא ענה על שאלה מעולם'
                      : `לא תרגל ${s.days} ימים`}
                </span>
                <Link
                  href={`/admin/teachers/${s.teacherId}`}
                  className="text-[11px] font-bold text-slate-500 hover:text-violet-700"
                >
                  אצל {s.teacherName}
                </Link>
              </div>
            ))}
          </div>
          {quiet.length > 10 && (
            <p className="text-[11px] text-slate-500 mt-2">ועוד {quiet.length - 10}.</p>
          )}
        </section>
      )}

      <section className="glass-card rounded-2xl p-4">
        <h2 className="text-sm font-black text-ink mb-2">איך זה עובד</h2>
        <ol className="text-sm text-slate-700 space-y-1.5 list-decimal pr-5 leading-relaxed">
          <li>
            יוצרים חשבון למורה במסך <b>חשבונות</b> ולוחצים על הכפתור שהופך אותו למורה.
          </li>
          <li>
            במסך <b>מורים</b> קובעים לו תעריף שעתי ושעות שבועיות — פעם אחת.
          </li>
          <li>באותו מסך משייכים אליו את התלמידים שלו.</li>
          <li>
            מכאן זה אוטומטי: השעות והשכר מצטברים כל שבוע, והמורה רואה בלוח שלו איפה כל תלמיד נתקע.
            שבוע שהיה שונה מתקנים ידנית, וזה משנה גם את החישוב אחורה.
          </li>
        </ol>
      </section>
    </div>
  );
}
