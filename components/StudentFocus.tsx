'use client';

/**
 * StudentFocus — "המורה ביקש", on the student's side.
 *
 * The other half of the loop. A teacher pointing at a topic is worth nothing
 * until the student sees it, and sees it where he already is rather than in a
 * separate inbox he has to remember to open.
 *
 * ⚠️ THE ROWS ARE HANDED IN, not fetched here. This component used to select
 * `public.focus` straight from the browser and trust an RLS policy to answer
 * "is this one for me" — and that policy could never be true, so a task a
 * teacher sent never showed up at all. lib/focus-visibility.ts has the full
 * post-mortem. /api/school/my-classes answers it now, on a client that can
 * actually read the tables, in the same call the page already made.
 *
 * ⚠️ THE LINK IS THE ROADMAP, never /practice. The owner tapped his teacher's
 * task on his phone and landed on a screen from before מסלול הלמידה existed —
 * "a path that has long been out of use". A task that opens outside the journey
 * is a task that takes the student out of the product. The URL is built server
 * side (lib/focus-target focusHref) and arrives on the row.
 *
 * ⚠️ PROGRESS IS COUNTED LOCALLY, from the student's own answer log, with the
 * SAME function the teacher's board uses server-side (lib/assignment-progress).
 * That is deliberate: the counter is instant and free, and it cannot disagree
 * with what the teacher sees, because it is not a second implementation.
 */

import Link from 'next/link';
import { Target, Check } from 'lucide-react';
import { getResults } from '@/lib/results';
import { assignmentProgress } from '@/lib/assignment-progress';
import { RUNG_LABEL, type Rung } from '@/lib/rungs';
import type { StudentFocusRow } from '@/lib/focus-visibility';

export default function StudentFocus({ rows }: { rows: StudentFocusRow[] | null }) {
  if (!rows || rows.length === 0) return null;

  const answers = getResults();

  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400">
        <Target className="h-4 w-4 text-violet-600" aria-hidden />
        המורה ביקש
      </h2>
      <ul className="flex flex-col gap-2">
        {rows.map((f) => {
          const progress = assignmentProgress(answers, {
            topic: f.topic,
            subTopicId: f.sub_topic_id,
            createdAt: f.created_at,
          });
          const target = f.target_count ?? 0;
          const done = target > 0 ? progress.answered >= target : progress.answered > 0;

          return (
            <li
              key={f.id}
              className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {done ? (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <Check className="h-3 w-3" aria-hidden />
                    הושלם
                  </span>
                ) : (
                  <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                    {target > 0 ? `${progress.answered}/${target}` : 'להתחיל'}
                  </span>
                )}

                <span className="font-semibold text-slate-900 dark:text-slate-50">{f.topic}</span>

                {f.rung && RUNG_LABEL[f.rung as Rung] && (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {RUNG_LABEL[f.rung as Rung]}
                  </span>
                )}

                {f.due_on && (
                  <span className="text-sm text-slate-500 dark:text-slate-400">עד {f.due_on}</span>
                )}

                <Link
                  href={f.href}
                  className="mr-auto rounded bg-violet-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-violet-700"
                >
                  {done ? 'לתרגל שוב' : 'לתרגול'}
                </Link>
              </div>

              {f.note && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.note}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
