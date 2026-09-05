'use client';

/**
 * FocusList — what was sent to practise, to whom, and WHO has not closed it.
 *
 * This section may show "5 מתוך 8 סגרו": it is the one place a count is the
 * point, and it is not the first screen. The label is the same describeFocus()
 * wording the student sees, so teacher and student call the task by one name.
 *
 * ⚠️ The count was all this showed, and that was the flaw. A teacher who reads
 * "5 מתוך 8 סגרו" knows the task is unfinished and still has to open eight
 * student cards to learn which three to talk to. The board already walks every
 * targeted student to produce that number, so the names were there all along —
 * they just were not being sent. Now they are, worst first, with one button
 * that opens the send dialog with exactly those students already ticked.
 */

import { ClipboardCheck } from 'lucide-react';
import { useClass } from '@/components/console/ClassContext';
import { hebDate, notDoneUnder, BTN, EMPTY } from '@/components/console/copy';
import { SectionHead, Btn } from '@/components/console/ui';

export default function FocusList({ limit, actions }: { limit?: number; actions?: React.ReactNode }) {
  const { focuses, isDemo, openFocus } = useClass();
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
            // `?? []` because a payload cached from before this shipped has no
            // list — an older response should render one line short, not throw.
            const notDone = f.notDone ?? [];

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

                {notDone.length > 0 && (
                  <div className="flex basis-full flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="min-w-0 flex-1 text-xs text-slate-500">
                      {notDoneUnder(notDone.map((s) => s.name))}
                    </span>
                    {!isDemo && (
                      <Btn
                        kind="secondary"
                        className="px-2.5 py-1 text-xs"
                        onClick={() =>
                          openFocus(
                            {
                              studentIds: notDone.map((s) => s.id),
                              label: `${notDone.length} שלא סגרו`,
                            },
                            f.topic
                          )
                        }
                      >
                        {BTN.again}
                      </Btn>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <span className="sr-only">{EMPTY.sent}</span>
    </section>
  );
}
