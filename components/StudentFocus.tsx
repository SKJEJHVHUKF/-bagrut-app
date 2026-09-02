'use client';

/**
 * StudentFocus — "המורה ביקש", on the student's side.
 *
 * The other half of the loop. A teacher pointing at a topic is worth nothing
 * until the student sees it, and sees it where he already is rather than in a
 * separate inbox he has to remember to open.
 *
 * ⚠️ NO API ROUTE. This reads `public.focus` straight from the browser with the
 * student's own session, because the RLS policy in supabase-school.sql already
 * answers the only question that matters — "is this one for me" — including the
 * whole-class case. A route here would re-implement that policy in TypeScript
 * and cost a serverless invocation to reach the same answer.
 *
 * ⚠️ PROGRESS IS COUNTED LOCALLY, from the student's own answer log, with the
 * SAME function the teacher's board uses server-side (lib/assignment-progress).
 * That is deliberate: the counter is instant and free, and it cannot disagree
 * with what the teacher sees, because it is not a second implementation.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getResults } from '@/lib/results';
import { assignmentProgress } from '@/lib/assignment-progress';
import { RUNG_LABEL, type Rung } from '@/lib/rungs';

type FocusRow = {
  id: string;
  topic: string;
  sub_topic_id: string | null;
  rung: string | null;
  target_count: number | null;
  due_on: string | null;
  note: string | null;
  created_at: string;
};

/** Focuses older than this stop being shown. A task from three months ago is
 *  not a task any more, and a list that only grows is a list nobody reads. */
const MAX_AGE_DAYS = 45;

/** The app is single-subject, and the practice routes spell it `math5`
 *  (app/insights, app/errors build the same links). Stored nowhere on the focus
 *  row because a second subject would need far more than a column. */
const SUBJECT = 'math5';

/**
 * The deepest link the focus justifies.
 *
 * This is the difference between "go practise sequences" and landing on the
 * exact sub-topic drill the teacher meant — which is the whole promise of
 * pointing at something precise. Same shape app/errors and app/insights use.
 */
function practiceHref(topic: string, subTopicId: string | null): string {
  const base = `/practice/${SUBJECT}/${encodeURIComponent(topic)}`;
  return subTopicId ? `${base}/sub/${encodeURIComponent(subTopicId)}/practice` : base;
}

export default function StudentFocus() {
  const [rows, setRows] = useState<FocusRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const since = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    void createClient()
      .from('focus')
      .select('id, topic, sub_topic_id, rung, target_count, due_on, note, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        // A student in no class, or a database without the school tables yet,
        // both land here as an empty list rather than an error. Nothing on this
        // screen is worth showing a student a failure for.
        if (!cancelled) setRows((data as FocusRow[]) ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
                  href={practiceHref(f.topic, f.sub_topic_id)}
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
