'use client';

/**
 * /console/class/[id] — fetches one class and hands it to the board view.
 *
 * Deliberately thin. Everything that decides what a teacher SEES lives in
 * components/school/ClassBoardView, so that /console-demo can render the same
 * screen from a sample with no account — and so a change to the board reaches
 * both without anyone remembering to copy it.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ClassBoardView, { type Payload } from '@/components/school/ClassBoardView';

export default function ClassBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/school/classes/${id}`);
      if (res.status === 403) {
        setError('אין לך גישה לכיתה הזו');
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
      setError(null);
    } catch {
      // Says what to do, not what failed.
      setError('לא הצלחנו לטעון את הלוח. נסה לרענן.');
    }
  }, [id]);

  useEffect(() => {
    // `load` is async, so its setState calls land in a later microtask rather
    // than synchronously inside the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (error) {
    return (
      <main dir="rtl" className="mx-auto max-w-5xl px-4 py-10">
        <p
          role="status"
          className="rounded-xl bg-amber-50 px-4 py-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          {error}
        </p>
        <Link href="/console" className="mt-4 inline-block text-violet-700 dark:text-violet-300">
          חזרה לכיתות
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main dir="rtl" className="mx-auto max-w-5xl px-4 py-10 text-slate-500">
        טוען…
      </main>
    );
  }

  return <ClassBoardView data={data} classId={id} onReload={load} />;
}
