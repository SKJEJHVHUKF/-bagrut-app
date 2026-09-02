'use client';

/**
 * /console/class/[id]/students — the roster, with a toolbar.
 *
 * Search by name, filter by state, sort by any column. This is the "sit down
 * with the whole class" mode; the overview is the ninety-second one.
 */

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useClass } from '@/components/console/ClassContext';
import PageHeader from '@/components/console/PageHeader';
import { inputCls } from '@/components/console/Panel';
import StudentsTable from '@/components/school/StudentsTable';
import type { StudentRow } from '@/lib/class-board';

const FILTERS: { id: 'all' | StudentRow['state']; label: string }[] = [
  { id: 'all', label: 'כולם' },
  { id: 'stuck', label: 'תקועים' },
  { id: 'away', label: 'לא נכנסו' },
  { id: 'no-data', label: 'טרם התחילו' },
  { id: 'active', label: 'בסדר' },
];

export default function StudentsPage() {
  const { board, showStudent, openFocus, isDemo } = useClass();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  const rows = useMemo(() => {
    const needle = q.trim();
    return board.students.filter(
      (s) => (filter === 'all' || s.state === filter) && (!needle || s.name.includes(needle))
    );
  }, [board.students, q, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: board.students.length };
    for (const s of board.students) c[s.state] = (c[s.state] ?? 0) + 1;
    return c;
  }, [board.students]);

  return (
    <>
      <PageHeader title="תלמידים" subtitle="כל תלמיד כשורה — מיון בכל עמודה, חיפוש, וסינון לפי מצב." />

      <div className="rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
          <label className="relative block w-56">
            <Search
              className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="חיפוש תלמיד"
              aria-label="חיפוש תלמיד"
              className={`${inputCls} ps-3 pe-8`}
            />
          </label>
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="סינון לפי מצב">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  filter === f.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
                <span className="ms-1 font-mono tabular-nums opacity-70">{counts[f.id] ?? 0}</span>
              </button>
            ))}
          </div>
          <span className="ms-auto text-xs text-slate-400">{rows.length} מוצגים</span>
        </div>
        <div className="px-4 py-2">
          <StudentsTable
            students={rows}
            onOpen={showStudent}
            onFocus={isDemo ? null : (s) => openFocus({ studentId: s.id, name: s.name })}
          />
        </div>
      </div>
    </>
  );
}
