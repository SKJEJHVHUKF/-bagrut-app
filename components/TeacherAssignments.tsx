'use client';

// TeacherAssignments — the tasks the student's own private teacher gave him.
//
// Rendered at the top of /my-plan. Invisible to everyone else: the rows come
// from public.assignments under the `own assignments select` RLS policy, so
// the database itself — not this component, and not an API route — is what
// stops one student from seeing another's tasks.
//
// Progress is counted LOCALLY, from the same answer log the rest of the app
// writes (lib/results.ts). No request, no cost, and it matches what the
// teacher sees on his side because both count the same events.
//
// Degrades to nothing: no teacher, no tasks, or a database where
// supabase-teachers.sql was never run — the section simply does not render.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getResults } from '@/lib/results';
import { assignmentProgress } from '@/lib/assignment-progress';
import { subTopicHref, topicHref } from '@/lib/track';

type Row = {
  id: string;
  title: string;
  topic: string;
  sub_topic_id: string | null;
  target_count: number;
  due_date: string | null;
  created_at: string;
};

const SUBJECT = 'math5';

function dueLabel(due: string | null): { text: string; late: boolean } | null {
  if (!due) return null;
  const today = new Date().toISOString().slice(0, 10);
  const text = new Date(`${due}T00:00:00Z`).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
  });
  return { text: `עד ${text}`, late: due < today };
}

export default function TeacherAssignments() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('assignments')
          .select('id, title, topic, sub_topic_id, target_count, due_date, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
        if (alive && data) setRows(data as Row[]);
      } catch {
        // No table, no session, no network — the student's plan is unaffected.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (rows.length === 0) return null;

  const results = getResults(SUBJECT);

  return (
    <section className="glass-card rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList aria-hidden="true" className="w-4 h-4 text-violet-600" />
        <h2 className="text-sm font-black text-ink">המורה שלך נתן לך</h2>
      </div>

      <div className="space-y-2">
        {rows.map((a) => {
          // The same counter the teacher's dashboard runs, on the same events.
          const { answered: done } = assignmentProgress(results, {
            topic: a.topic,
            subTopicId: a.sub_topic_id,
            createdAt: a.created_at,
          });
          const complete = done >= a.target_count;
          const due = dueLabel(a.due_date);

          return (
            <Link
              key={a.id}
              // The sub-topic form when the tutor narrowed the task, because
              // landing the student on the whole topic throws away exactly the
              // precision the tutor chose. Every one of the 95 sub-topics
              // resolves to a ladder, so this needs no fallback; topicHref
              // matches on the topic's TITLE, which is what `a.topic` holds.
              href={a.sub_topic_id ? subTopicHref(a.sub_topic_id) : topicHref(a.topic)}
              className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                complete
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-white/70 border-slate-200 hover:border-violet-400'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-ink truncate">{a.title}</div>
                <div className="text-[11px] text-slate-500">
                  {a.topic}
                  {due && (
                    <span className={due.late && !complete ? 'text-red-600 font-bold' : ''}>
                      {' · '}
                      {due.text}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-center shrink-0">
                <div
                  className={`font-display text-base font-black leading-none ${
                    complete ? 'text-emerald-600' : 'text-violet-700'
                  }`}
                >
                  {done}/{a.target_count}
                </div>
                <div className="text-[10px] text-slate-500">{complete ? 'הושלם' : 'שאלות'}</div>
              </div>

              <ArrowLeft
                aria-hidden="true"
                className="w-4 h-4 text-slate-400 shrink-0 group-hover:-translate-x-1 transition-transform"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
