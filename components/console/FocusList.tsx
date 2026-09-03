'use client';

/**
 * FocusList — what was sent to practise, to whom, and how many closed it.
 *
 * This section may show "5/8": it is the one place a count is the point, and
 * it is not the first screen. The label is the same describeFocus() wording
 * the student sees, so teacher and student call the task by one name.
 */

import { ClipboardCheck } from 'lucide-react';
import { useClass } from '@/components/console/ClassContext';
import { hebDate, EMPTY } from '@/components/console/copy';
import { SectionHead } from '@/components/console/ui';

export default function FocusList({ limit, actions }: { limit?: number; actions?: React.ReactNode }) {
  const { focuses } = useClass();
  const rows = limit ? focuses.slice(0, limit) : focuses;

  return (
    <section>
      <SectionHead icon={ClipboardCheck} title="תרגולים ששלחתי" count={focuses.length} actions={actions} />
      {rows.length === 0 ? (
        <p className="surface-premium rounded-2xl px-5 py-6 text-sm text-slate-600">
          עוד לא שלחת תרגול. אפשר להתחיל מ״צריכים אותך״.
        </p>
      ) : (
        <ul className="surface-premium divide-y divide-slate-900/[0.06] rounded-2xl">
          {rows.map((f) => {
            const done = f.totalCount > 0 && f.done === f.totalCount;
            return (
              <li key={f.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <span className="w-28 shrink-0 font-display font-black text-ink">
                  {f.targetedCount === null ? 'כל הכיתה' : `${f.targetedCount} תלמידים`}
                </span>
                <span className="min-w-0 flex-1 text-sm text-slate-700">
                  {f.label}
                  {f.targetCount ? <span className="text-slate-500"> · {f.targetCount} תרגילים</span> : null}
                  {f.note && <span className="block text-xs text-slate-500">{f.note}</span>}
                </span>
                <span className="shrink-0 text-sm text-slate-500">{hebDate(f.dueOn) ?? ''}</span>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black tabular-nums ${
                    done
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800'
                      : 'border-violet-500/25 bg-violet-500/10 text-violet-800'
                  }`}
                >
                  {done ? 'כולם סגרו' : `${f.done} מתוך ${f.totalCount} סגרו`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <span className="sr-only">{EMPTY.sent}</span>
    </section>
  );
}
