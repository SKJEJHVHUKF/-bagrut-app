'use client';

/**
 * StudentsTable — the roster, as a table a teacher can actually work.
 *
 * The board answers "who needs me this week" in four lines, which is the right
 * answer at 08:15 between lessons. This is the other mode, and the product was
 * missing it: sitting down with the whole class and going through it — sorting
 * by who has done nothing, by who is weakest, by who has not been seen. A
 * heatmap cannot be sorted, and a stack of cards cannot be scanned.
 *
 * Every column is a number the board already computed (lib/class-board). This
 * component sorts and renders; it decides nothing, so a row here can never
 * disagree with the same student's card.
 */

import { useMemo, useState } from 'react';
import { ArrowUpDown, Target } from 'lucide-react';
import type { StudentRow } from '@/lib/class-board';
import { masteryCell } from '@/lib/mastery-scale';

type SortKey = 'name' | 'state' | 'mastery' | 'activity' | 'attempts';

/** Sort order for the state column: the student who needs the teacher most
 *  comes first, which is not alphabetical and not the enum's order. */
const STATE_RANK: Record<StudentRow['state'], number> = {
  stuck: 0,
  away: 1,
  'no-data': 2,
  active: 3,
};

const STATE_LABEL: Record<StudentRow['state'], { text: string; cls: string }> = {
  stuck: {
    text: 'תקוע',
    cls: 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-200',
  },
  away: {
    text: 'לא נכנס',
    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200',
  },
  'no-data': {
    text: 'טרם התחיל',
    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  active: {
    text: 'בסדר',
    cls: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-200',
  },
};

function agoLabel(days: number | null): string {
  if (days === null) return '—';
  if (days <= 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days === 2) return 'שלשום';
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 14) return 'לפני שבוע';
  return `לפני ${Math.floor(days / 7)} שבועות`;
}

export default function StudentsTable({
  students,
  onOpen,
  onFocus,
}: {
  students: StudentRow[];
  onOpen: (s: StudentRow) => void;
  /** null in the sample view — the ids are invented there. */
  onFocus: ((s: StudentRow) => void) | null;
}) {
  const [sort, setSort] = useState<SortKey>('state');

  const rows = useMemo(() => {
    const copy = [...students];
    copy.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name, 'he');
        case 'mastery':
          // A student with no data sorts LAST rather than as a zero — the same
          // rule the rest of the board keeps. He is not the weakest student;
          // he is not a measurement at all.
          if (a.mastery === null && b.mastery === null) return 0;
          if (a.mastery === null) return 1;
          if (b.mastery === null) return -1;
          return a.mastery - b.mastery;
        case 'activity':
          if (a.daysSinceActive === null && b.daysSinceActive === null) return 0;
          if (a.daysSinceActive === null) return 1;
          if (b.daysSinceActive === null) return -1;
          return b.daysSinceActive - a.daysSinceActive;
        case 'attempts':
          return a.attempts - b.attempts;
        case 'state':
        default:
          return STATE_RANK[a.state] - STATE_RANK[b.state] || a.name.localeCompare(b.name, 'he');
      }
    });
    return copy;
  }, [students, sort]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <Th label="תלמיד" k="name" sort={sort} onSort={setSort} align="start" />
            <Th label="מצב" k="state" sort={sort} onSort={setSort} />
            <Th label="שליטה" k="mastery" sort={sort} onSort={setSort} />
            <Th label="נופל ב" />
            <Th label="תרגילים" k="attempts" sort={sort} onSort={setSort} />
            <Th label="פעילות אחרונה" k="activity" sort={sort} onSort={setSort} />
            <th className="w-px" />
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const st = STATE_LABEL[s.state];
            const worst = s.stuck[0] ?? null;
            return (
              <tr
                key={s.id}
                className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
              >
                <td className="py-2.5 pe-3">
                  <button
                    type="button"
                    onClick={() => onOpen(s)}
                    className="rounded font-medium text-slate-900 underline-offset-4 transition hover:text-violet-700 hover:underline dark:text-slate-50 dark:hover:text-violet-300"
                  >
                    {s.name}
                  </button>
                </td>
                <td className="px-2 py-2.5 text-center">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${st.cls}`}
                  >
                    {st.text}
                  </span>
                </td>
                <td className="px-2 py-2.5">
                  {s.mastery === null ? (
                    <span className="block text-center text-slate-400">אין נתונים</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <span
                          className={`block h-full rounded-full ${masteryCell(s.mastery).bar}`}
                          style={{ width: `${Math.round(s.mastery * 100)}%` }}
                        />
                      </span>
                      <span className="w-9 font-mono tabular-nums text-slate-900 dark:text-slate-50">
                        {Math.round(s.mastery * 100)}%
                      </span>
                    </span>
                  )}
                </td>
                <td className="px-2 py-2.5 text-center text-slate-600 dark:text-slate-400">
                  {/* The single most useful cell on the row: not a score, the
                      TOPIC. It is what a teacher would write next to a name on
                      a piece of paper. */}
                  {worst ? (
                    <span className="whitespace-nowrap">
                      {worst.topic}{' '}
                      <span className="font-mono text-xs text-slate-400 tabular-nums">
                        {Math.round((worst.mastery ?? 0) * 100)}%
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                  )}
                </td>
                <td className="px-2 py-2.5 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {s.attempts === 0 ? <span className="text-slate-300">—</span> : s.attempts}
                </td>
                <td className="px-2 py-2.5 text-center whitespace-nowrap text-slate-600 dark:text-slate-400">
                  {agoLabel(s.daysSinceActive)}
                </td>
                <td className="ps-2 py-2.5 text-end">
                  {onFocus && (
                    <button
                      type="button"
                      onClick={() => onFocus(s)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:text-slate-300"
                    >
                      <Target className="h-3.5 w-3.5" aria-hidden />
                      שלח תרגול
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  label,
  k,
  sort,
  onSort,
  align = 'center',
}: {
  label: string;
  k?: SortKey;
  sort?: SortKey;
  onSort?: (k: SortKey) => void;
  align?: 'start' | 'center';
}) {
  const active = k && sort === k;
  return (
    <th
      className={`pb-2 text-xs font-medium ${align === 'start' ? 'text-start pe-3' : 'text-center px-2'} ${
        active ? 'text-violet-700 dark:text-violet-300' : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      {k && onSort ? (
        <button
          type="button"
          onClick={() => onSort(k)}
          className="inline-flex items-center gap-1 rounded transition hover:text-violet-700 dark:hover:text-violet-300"
          aria-label={`מיין לפי ${label}`}
        >
          {label}
          <ArrowUpDown className={`h-3 w-3 ${active ? '' : 'opacity-40'}`} aria-hidden />
        </button>
      ) : (
        label
      )}
    </th>
  );
}
