'use client';

/**
 * StudentCard — one student, the way a teacher writes him in a notebook.
 *
 * A name, one word, one line, one thing to do. No number: the card answers
 * "who is this and does he need me", and a percentage answers neither. The
 * numbers live one click deeper, on his page, where they come second and
 * small.
 *
 * ⚠️ THE CARD OPENS HIS PROGRESS — it does not send practice.
 * It used to do the opposite: the students who needed the teacher most got a
 * "שלח תרגול" button, and everyone else got a quiet link to their page. The
 * owner read that and said the board "only points at giving practice, without
 * real tracking of the student" — and he was right about the ORDER. Sending
 * practice before opening the student is prescribing before examining, and it
 * was the loudest button on the screen precisely where the teacher knew least.
 *
 * The send did not disappear; it moved to where the teacher can already see
 * what he is aiming at — the student's own page, and the class-mistakes rows,
 * which name the mistake first and send to exactly the students who make it.
 */

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { StudentRow } from '@/lib/class-board';
import { useClass } from '@/components/console/ClassContext';
import { cardLine, progressLabel } from '@/components/console/copy';
import { Avatar, StateChip, btnPrimary } from '@/components/console/ui';

export default function StudentCard({ student }: { student: StudentRow }) {
  const { base } = useClass();
  const href = `${base}/student/${student.id}`;

  return (
    <article className="surface-premium card-3d flex h-full flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Avatar name={student.name} />
        <div className="min-w-0 flex-1">
          <Link
            href={href}
            className="block truncate font-display text-lg font-black text-ink transition hover:text-violet-800"
          >
            {student.name}
          </Link>
          <div className="mt-1">
            <StateChip state={student.state} />
          </div>
        </div>
      </div>

      <p className="text-base leading-relaxed text-slate-800">{cardLine(student)}</p>

      <div className="mt-auto pt-1">
        <Link href={href} className={`${btnPrimary} w-full`}>
          {progressLabel(student.name)}
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
