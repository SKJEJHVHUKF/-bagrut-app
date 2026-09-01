'use client';

// useTeachers — the one place the admin screens read the teacher system from.
//
// Four screens (סקירה, מורים, מורה יחיד, שכר) all need the same payload:
// who the teachers are, on what terms, with which students, and what they are
// owed. Fetching it in four places would mean four slightly different copies
// of the same types, which is how two screens end up disagreeing about a
// salary. One hook, one shape.

import { useCallback, useEffect, useState } from 'react';
import type { PaySummary } from '@/lib/teacher-pay';

export type Person = { id: string; email: string; name: string; missing: boolean };

export type Teacher = Person & {
  hourlyRate: number;
  weeklyHours: number;
  since: string | null;
  students: Person[];
  weeks: { weekStart: string; hours: number; note: string | null }[];
  pay: PaySummary;
};

/** A person's display name — never a blank cell. */
export const personLabel = (p: Person) => p.name || p.email || p.id.slice(0, 8);

// ₪ via Intl, not a hand-built `₪${n}` string. The manual form renders the
// symbol jammed against the digits and, in an RTL line, on the wrong side of
// them — "₪0" came out looking like a typo. Intl emits the Hebrew convention
// (900 ₪) with the bidi marks that keep it there.
const ILS = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const shekel = (n: number) => ILS.format(n);

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [candidates, setCandidates] = useState<Person[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/teachers', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      setTeachers(json.teachers ?? []);
      setCandidates(json.candidates ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'הטעינה נכשלה');
      setTeachers([]);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** Any mutation, then a reload — every screen writes through this. */
  const call = useCallback(
    async (url: string, method: string, body: unknown) => {
      setBusy(true);
      setError('');
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? `HTTP ${res.status}`);
        }
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'הפעולה נכשלה');
      } finally {
        setBusy(false);
      }
    },
    [reload]
  );

  return { teachers, candidates, error, busy, reload, call, setError };
}
