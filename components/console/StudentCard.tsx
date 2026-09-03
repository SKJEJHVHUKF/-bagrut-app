'use client';

/**
 * StudentCard — one student, the way a teacher writes him in a notebook.
 *
 * A name, one word, one line, one thing to do. No number: the card answers
 * "who is this and does he need me", and a percentage answers neither. The
 * numbers live one click deeper, on his page, where they come second and
 * small.
 */

import Link from 'next/link';
import { ArrowLeft, Target } from 'lucide-react';
import type { StudentRow } from '@/lib/class-board';
import { useClass } from '@/components/console/ClassContext';
import { cardLine, BTN } from '@/components/console/copy';
import { Avatar, StateChip, Btn, btnSecondary } from '@/components/console/ui';

export type StudentGroupKey = 'needs' | 'fine' | 'fresh';

export default function StudentCard({
  student,
  group,
}: {
  student: StudentRow;
  group: StudentGroupKey;
}) {
  const { base, isDemo, openFocus } = useClass();
  const href = `${base}/student/${student.id}`;
  // "שלח תרגול" only where it is the obvious next thing — and never in the
  // sample view, whose ids are invented.
  const canSend = group === 'needs' && !isDemo;

  return (
    <article className="surface-premium card-3d flex h-full flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Avatar name={student.name} />
        <div className="min-w-0 flex-1">
          <Link
            href={href}
            className="block truncate font-display text-base font-black text-ink transition hover:text-violet-700"
          >
            {student.name}
          </Link>
          <div className="mt-1">
            <StateChip state={student.state} />
          </div>
        </div>
      </div>

      <p className="text-sm leading-snug text-slate-600">{cardLine(student)}</p>

      <div className="mt-auto pt-1">
        {canSend ? (
          <Btn
            kind="primary"
            className="w-full"
            onClick={() =>
              openFocus({ studentId: student.id, name: student.name }, student.stuck[0]?.topic ?? null)
            }
          >
            <Target className="h-4 w-4" aria-hidden />
            {BTN.send}
          </Btn>
        ) : (
          <Link href={href} className={`${btnSecondary} w-full`}>
            {BTN.card}
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
    </article>
  );
}
