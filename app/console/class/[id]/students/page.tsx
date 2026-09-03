'use client';

/**
 * /console/class/[id]/students — the whole class, in the same three groups.
 *
 * No table, no sort, no filter chips: the groups are the filter, and a search
 * box finds a name. The Excel export is the table, for the teacher who wants
 * one.
 */

import { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useClass } from '@/components/console/ClassContext';
import { inputCls } from '@/components/console/ui';
import StudentGroups from '@/components/console/StudentGroups';

export default function StudentsPage() {
  const { board } = useClass();
  const [q, setQ] = useState('');
  return (
    <>
      <PageHeader title="תלמידים" description={`כל ${board.studentCount} התלמידים, לפי מצב.`} />
      <label className="relative mb-6 block max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חיפוש לפי שם"
          aria-label="חיפוש תלמיד"
          className={`${inputCls} py-2.5 pe-9`}
        />
      </label>
      <StudentGroups query={q} />
    </>
  );
}
