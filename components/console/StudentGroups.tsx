'use client';

/**
 * StudentGroups — the class in three groups: צריכים אותך / בסדר / לא התחילו.
 *
 * The groups ARE the analysis. A teacher does not sort a table by a column to
 * find who needs him; the screen has already put those students first, worst
 * first, under a heading that says so. The other two groups exist so the class
 * is complete — nobody is hidden — but they are calm, and capped on the first
 * screen with a link to the full list.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LifeBuoy, CheckCircle2, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StudentRow } from '@/lib/class-board';
import { fadeUp, staggerContainer, inViewProps } from '@/lib/animations';
import { useClass } from '@/components/console/ClassContext';
import { GROUP, EMPTY, BTN } from '@/components/console/copy';
import { SectionHead } from '@/components/console/ui';
import StudentCard, { type StudentGroupKey } from '@/components/console/StudentCard';

/** How much of a topic a student got wrong, summed over the topics he is
 *  stuck in — the ordering key for "who needs me most". Evidence, not a
 *  percentage: nine wrong answers outrank a prettier 0% over three. */
const wrongCount = (s: StudentRow) => s.stuck.reduce((a, t) => a + (t.measured - t.correct), 0);

export default function StudentGroups({
  cap,
  query = '',
}: {
  /** Cap on the calm groups (בסדר, לא התחילו). The first group is never capped. */
  cap?: number;
  query?: string;
}) {
  const { board, base } = useClass();
  const q = query.trim();
  const all = q ? board.students.filter((s) => s.name.includes(q)) : board.students;

  const needs = all
    .filter((s) => s.state === 'stuck' || s.state === 'away')
    .sort((a, b) => {
      if (a.state !== b.state) return a.state === 'stuck' ? -1 : 1;
      if (a.state === 'stuck') return wrongCount(b) - wrongCount(a);
      return (b.daysSinceActive ?? 0) - (a.daysSinceActive ?? 0);
    });
  const fine = all.filter((s) => s.state === 'active');
  const fresh = all.filter((s) => s.state === 'no-data');

  if (q && all.length === 0) {
    return <p className="surface-premium rounded-2xl px-5 py-8 text-center text-sm text-slate-600">{EMPTY.search}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* The group that matters gets the entrance; it is small, and the eye
          should land on it first. */}
      <section>
        <SectionHead icon={LifeBuoy} title={GROUP.needs} count={needs.length} />
        {needs.length === 0 ? (
          <p className="surface-premium rounded-2xl px-5 py-6 text-sm font-bold text-emerald-800">
            {EMPTY.needs}
          </p>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="perspective-1500 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {needs.map((s) => (
              <motion.div key={s.id} variants={fadeUp}>
                <StudentCard student={s} group="needs" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <CalmGroup title={GROUP.fine} icon={CheckCircle2} students={fine} group="fine" cap={cap} moreHref={`${base}/students`} />
      <CalmGroup title={GROUP.fresh} icon={UserPlus} students={fresh} group="fresh" cap={cap} moreHref={`${base}/students`} />
    </div>
  );
}

/** בסדר and לא התחילו: hidden when empty, capped on the overview, one fade for
 *  the whole block — thirty cards staggering in is a two-second reveal nobody
 *  asked for. */
function CalmGroup({
  title,
  icon,
  students,
  group,
  cap,
  moreHref,
}: {
  title: string;
  icon: LucideIcon;
  students: StudentRow[];
  group: StudentGroupKey;
  cap?: number;
  moreHref: string;
}) {
  if (students.length === 0) return null;
  const shown = cap ? students.slice(0, cap) : students;
  const hidden = students.length - shown.length;
  return (
    <motion.section variants={fadeUp} {...inViewProps}>
      <SectionHead
        icon={icon}
        title={title}
        count={students.length}
        actions={
          hidden > 0 && (
            <Link href={moreHref} className="text-xs font-bold text-violet-700 underline-offset-4 hover:underline">
              {BTN.more}
            </Link>
          )
        }
      />
      <div className="perspective-1500 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((s) => (
          <StudentCard key={s.id} student={s} group={group} />
        ))}
      </div>
    </motion.section>
  );
}
