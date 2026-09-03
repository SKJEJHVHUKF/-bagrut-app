'use client';

/**
 * /console/class/[id]/student/[sid] — one student, in words first.
 *
 * The page a teacher opens before a conversation — with the student, a parent,
 * or himself. So it leads with what can be SAID: the state in a word, the one
 * line, the topics as words, the mistakes as sentences. The numbers are here
 * too, second and small, for the teacher who wants to check.
 *
 * Reads the class from the layout's provider — no fetch of its own — so this
 * page and the card that opened it are the same truth.
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Target, Printer, Lightbulb, BookOpen, AlertCircle, Activity, Send } from 'lucide-react';
import { fadeUp, inViewProps } from '@/lib/animations';
import { masteryCell } from '@/lib/mastery-scale';
import { ACTIVITY_DAYS, type StudentRow } from '@/lib/class-board';
import { TopicIcon } from '@/components/roadmap/TopicIcon';
import { useClass } from '@/components/console/ClassContext';
import {
  cardLine,
  agoLabel,
  hebDate,
  BTN,
  EMPTY,
  SECTION,
  NO_DATA,
  NO_DATA_STUDENT,
  STUDENT_NOT_FOUND,
} from '@/components/console/copy';
import { Avatar, StateChip, Btn, btnSecondary, SectionHead } from '@/components/console/ui';

export default function StudentPage() {
  const { sid } = useParams<{ sid: string }>();
  const { board, focuses, base, isDemo, openFocus } = useClass();
  const s = board.students.find((x) => x.id === sid);

  if (!s) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="surface-premium rounded-2xl px-5 py-8 text-center text-slate-700">{STUDENT_NOT_FOUND}</p>
        <Link href={base} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-violet-700">
          <ArrowRight className="h-4 w-4" aria-hidden />
          {BTN.back}
        </Link>
      </div>
    );
  }

  const sent = focuses.filter((f) => f.studentIds === null || f.studentIds.includes(s.id));
  const named = s.recentWrong.filter((w) => w.note);
  const unnamed = s.recentWrong.length - named.length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href={base} className="inline-flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-violet-700">
        <ArrowRight className="h-4 w-4" aria-hidden />
        {BTN.back}
      </Link>

      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="surface-premium flex flex-wrap items-center gap-4 rounded-2xl p-5"
      >
        <Avatar name={s.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-black text-ink">{s.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StateChip state={s.state} />
            <span className="text-sm text-slate-600">{cardLine(s)}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {!isDemo && (
            <Btn
              kind="primary"
              onClick={() => openFocus({ studentId: s.id, name: s.name }, s.stuck[0]?.topic ?? null)}
            >
              <Target className="h-4 w-4" aria-hidden />
              {BTN.send}
            </Btn>
          )}
          <Link href={`${base}/report?student=${s.id}`} className={btnSecondary}>
            <Printer className="h-4 w-4" aria-hidden />
            {BTN.report}
          </Link>
        </div>
      </motion.header>

      {s.attempts === 0 ? (
        <p className="surface-premium rounded-2xl px-5 py-8 text-center text-sm leading-relaxed text-slate-600">
          {NO_DATA_STUDENT}
        </p>
      ) : (
        <>
          <motion.section variants={fadeUp} {...inViewProps}>
            <SectionHead icon={BookOpen} title={SECTION.topics} hint="המילה קודם, המספר אחריה" />
            <div className="flex flex-wrap gap-2">
              {s.topics.map((t) => {
                const band = t.mastery === null ? null : masteryCell(t.mastery);
                return (
                  <span
                    key={t.topic}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      band ? `${band.cell} border-transparent` : 'border-dashed border-slate-300 text-slate-500'
                    }`}
                    title={`${t.correct} מתוך ${t.measured} תרגילים שנמדדו`}
                  >
                    <TopicIcon id={t.topic} className="h-4 w-4" />
                    <span className="font-bold">{t.topic}</span>
                    <span>{band ? band.label : NO_DATA}</span>
                    {band && (
                      <span className="text-[11px] tabular-nums opacity-70">{Math.round(t.mastery! * 100)}%</span>
                    )}
                  </span>
                );
              })}
            </div>
          </motion.section>

          {s.recentWrong.length > 0 && (
            <motion.section variants={fadeUp} {...inViewProps}>
              <SectionHead icon={AlertCircle} title={SECTION.mistakes} hint="הטעויות עצמן, החדשות קודם" />
              <ul className="surface-premium divide-y divide-slate-900/[0.06] rounded-2xl">
                {named.map((w, i) => (
                  <li key={i} className="px-4 py-3">
                    {/* The whole reason this page exists: not "he was wrong",
                        but the sentence a teacher can say to him. */}
                    <p className="text-sm font-bold text-ink">{w.note}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                      <span>{w.topic}</span>
                      <span>·</span>
                      <span>{agoLabel(w.daysAgo)}</span>
                      {w.hintUsed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-amber-800">
                          <Lightbulb className="h-3 w-3" aria-hidden />
                          אחרי רמז
                        </span>
                      )}
                    </p>
                  </li>
                ))}
                {unnamed > 0 && (
                  <li className="px-4 py-3 text-xs text-slate-500">
                    ועוד {unnamed} תשובות שגויות שהמערכת לא ידעה לתת להן שם.
                  </li>
                )}
              </ul>
            </motion.section>
          )}

          <motion.section variants={fadeUp} {...inViewProps}>
            <SectionHead icon={Activity} title={SECTION.activity} />
            <ActivityStrip daily={s.daily} />
          </motion.section>
        </>
      )}

      <motion.section variants={fadeUp} {...inViewProps}>
        <SectionHead icon={Send} title={SECTION.sent} count={sent.length} />
        {sent.length === 0 ? (
          <p className="surface-premium rounded-2xl px-5 py-6 text-sm text-slate-600">{EMPTY.sent}</p>
        ) : (
          <ul className="surface-premium divide-y divide-slate-900/[0.06] rounded-2xl">
            {sent.map((f) => (
              <li key={f.id} className="px-4 py-3 text-sm">
                <span className="font-bold text-ink">{f.label}</span>
                {f.targetCount ? <span className="text-slate-500"> · {f.targetCount} תרגילים</span> : null}
                {f.dueOn && <span className="text-slate-500"> · עד {hebDate(f.dueOn)}</span>}
                {f.note && <p className="mt-0.5 text-xs text-slate-500">{f.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </motion.section>
    </div>
  );
}

/**
 * Fourteen days as a bar strip. Bars and not a line: the question is "did he
 * show up on this day", a count per discrete day, and a line between two days
 * implies values in between that do not exist. One series, so no legend.
 */
function ActivityStrip({ daily }: { daily: StudentRow['daily'] }) {
  const max = Math.max(1, ...daily.map((d) => d.attempts));
  const days = daily.filter((d) => d.attempts > 0).length;
  return (
    <div className="surface-premium rounded-2xl p-4">
      <div className="flex h-16 items-end gap-1" role="img" aria-label={`פעילות יומית: ${days} ימים פעילים מתוך ${ACTIVITY_DAYS}`}>
        {daily.map((d) => {
          const h = d.attempts === 0 ? 3 : Math.max(8, Math.round((d.attempts / max) * 56));
          const when = d.daysAgo === 0 ? 'היום' : `לפני ${d.daysAgo} ימים`;
          return (
            <div key={d.daysAgo} className="flex-1" title={d.attempts === 0 ? `${when}: לא תרגל` : `${when}: ${d.correct} מתוך ${d.attempts}`}>
              <div
                className={`w-full rounded-t ${d.attempts === 0 ? 'bg-slate-200' : 'bg-violet-500'}`}
                style={{ height: `${h}px` }}
              />
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {days === 0 ? 'לא תרגל בשבועיים האחרונים.' : `תרגל ב-${days} מתוך ${ACTIVITY_DAYS} הימים האחרונים.`}
      </p>
    </div>
  );
}
