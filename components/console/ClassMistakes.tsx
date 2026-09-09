'use client';

/**
 * ClassMistakes — the same mistake, counted across the class.
 *
 * The rest of the overview answers "who needs me". This answers "what do I
 * teach on Sunday", which is a different question with a different answer: a
 * misconception seven students share is a lesson, and the same one in a single
 * student is a five-minute talk at his desk. The board could not tell those
 * apart until it started comparing students to each other.
 *
 * Every row carries the NAMES, and its button sends practice to exactly those
 * students — not to the class. Picking seven names out of thirty by hand is
 * the work this screen exists to remove.
 *
 * Zero API: lib/class-mistakes is arithmetic over answers already in Postgres,
 * and the Hebrew is authored in content/cognition. Nothing here calls a model.
 */

import { motion } from 'framer-motion';
import { Brain, Target } from 'lucide-react';
import { fadeUp, inViewProps } from '@/lib/animations';
import { MathText } from '@/components/practice/MathText';
import { useClass } from '@/components/console/ClassContext';
import { SectionHead, Btn } from '@/components/console/ui';

/** How many rows the overview shows before it stops being a list a person
 *  reads. The student pages carry the rest. */
const LIMIT = 4;

export default function ClassMistakes() {
  const { sharedMistakes, board, isDemo, openFocus } = useClass();
  if (sharedMistakes.length === 0) return null;

  // With a handful of students every mistake is "shared by 1", and calling that
  // a class pattern would be a lie. Above the threshold, only real overlap is
  // worth the teacher's Sunday.
  const small = board.studentCount < 5;
  const rows = (small ? sharedMistakes : sharedMistakes.filter((m) => m.students.length > 1)).slice(
    0,
    LIMIT
  );
  if (rows.length === 0) return null;

  return (
    <motion.section variants={fadeUp} {...inViewProps}>
      <SectionHead
        icon={Brain}
        title="הטעויות של הכיתה"
        hint={small ? 'כיתה קטנה — אלה הטעויות של התלמידים עצמם' : 'מה שיותר מתלמיד אחד עושה'}
      />
      <ul className="flex flex-col gap-2">
        {rows.map((m) => (
          <li key={m.key} className="surface-premium rounded-2xl px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-2">
              {m.kind === 'misconception' && (
                <span className="rounded-full bg-violet-700 px-3 py-0.5 text-sm font-black text-white">
                  טעות מזוהה
                </span>
              )}
              {/* Through MathText, never raw — see the same rule on the student
                  page: a title carrying $…$ would print its dollars and reverse
                  its exponents inside this RTL line. */}
              <span className="font-display text-lg font-black text-ink">
                <MathText inline>{m.title}</MathText>
              </span>
              <span className="text-base text-slate-700">{m.topic}</span>
              <span className="ms-auto text-base font-black text-violet-800">
                {m.students.length === 1 ? 'תלמיד אחד' : `${m.students.length} תלמידים`}
              </span>
            </div>

            <div className="mt-1.5 text-base leading-relaxed text-slate-800">
              <MathText inline>{m.detail}</MathText>
            </div>

            {/* The names, not just the count — otherwise the teacher opens
                thirty cards to find out who. */}
            <p className="mt-1.5 text-base text-slate-700">
              {m.students.map((s) => s.name).join(' · ')}
              {m.chronicCount > 0 && (
                <span className="font-bold text-red-800">
                  {' '}
                  · אצל {m.chronicCount} זה חזר אחרי תיקון
                </span>
              )}
            </p>

            {!isDemo && (
              <Btn
                kind="primary"
                className="mt-3"
                onClick={() =>
                  openFocus(
                    {
                      studentIds: m.students.map((s) => s.id),
                      label:
                        m.students.length === 1
                          ? m.students[0].name
                          : `${m.students.length} שעושים את הטעות הזאת`,
                    },
                    m.topic
                  )
                }
              >
                <Target className="h-4 w-4" aria-hidden />
                {m.students.length === 1
                  ? `שלח ל${m.students[0].name} תרגול`
                  : `שלח תרגול ל-${m.students.length} האלה`}
              </Btn>
            )}
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
