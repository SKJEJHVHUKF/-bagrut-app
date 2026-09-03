'use client';

/**
 * StudentPanel — one student, in depth.
 *
 * The screen a teacher opens BEFORE a conversation: with the student, with a
 * parent, or with himself when deciding what to do about someone. So it is
 * built around evidence rather than scores. "He got 42%" is not something you
 * can say to a fifteen-year-old; "you keep opening sin(2α) as 2sinα" is.
 *
 * ⚠️ NO FETCH. Everything here comes from the row the board already loaded. A
 * panel that re-queried could disagree with the line the teacher clicked, and
 * "the card says one thing and the list says another" is the fastest way to
 * lose trust in a dashboard.
 */

import Link from 'next/link';
import { X, Target, Lightbulb, Printer } from 'lucide-react';
import type { StudentRow } from '@/lib/class-board';
import { ACTIVITY_DAYS } from '@/lib/class-board';
import { masteryCell } from '@/lib/mastery-scale';

/** Hebrew counts days properly or not at all: "לפני 1 ימים" is the tell of a
 *  screen nobody read out loud. */
function agoLabel(days: number): string {
  if (days <= 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days === 2) return 'שלשום';
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 14) return 'לפני שבוע';
  return `לפני ${Math.floor(days / 7)} שבועות`;
}

export default function StudentPanel({
  student,
  onClose,
  onFocus,
  reportHref = null,
}: {
  student: StudentRow;
  onClose: () => void;
  /** null in the sample view — the ids are invented there. */
  onFocus: (() => void) | null;
  /** The printable one-page report for THIS student. null in the sample view. */
  reportHref?: string | null;
}) {
  const activeDays = student.daily.filter((d) => d.attempts > 0).length;

  // Only the mistakes lib/answer-check could NAME are worth a row: a card of
  // twelve identical "topic · yesterday" lines with nothing under them reads as
  // broken, and tells the teacher nothing he cannot see in the percentage. The
  // rest are counted in one honest line underneath.
  const named = student.recentWrong.filter((w) => w.note);
  const unnamed = student.recentWrong.length - named.length;

  return (
    <div
      // z-[100] because the app header is z-[90] and the mobile tab bar is
      // z-[55]: at z-50 this panel opened UNDER its own title, and the close
      // button was unreachable.
      className="fixed inset-0 z-[100] flex justify-start bg-slate-900/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <aside
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label={`כרטיס תלמיד — ${student.name}`}
        onClick={(e) => e.stopPropagation()}
        className="ms-auto flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl dark:bg-slate-900"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{student.name}</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {student.daysSinceActive === null
                ? 'טרם התחיל לתרגל'
                : `תרגל לאחרונה ${agoLabel(student.daysSinceActive)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="flex flex-col gap-6 px-5 py-5">
          {/* ---- the four numbers, before any chart --------------------------
              A stat tile is the right form when the job is a single value; a
              chart of four unrelated scalars would be a chart for its own sake. */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="תרגילים" value={student.attempts === 0 ? null : student.attempts} />
            <Stat
              label="שליטה"
              value={student.mastery === null ? null : `${Math.round(student.mastery * 100)}%`}
            />
            <Stat label="נושאים תקועים" value={student.stuck.length} zeroIsReal />
            <Stat
              label={`ימים פעילים מ-${ACTIVITY_DAYS}`}
              value={student.attempts === 0 ? null : activeDays}
              zeroIsReal
            />
          </div>

          {student.attempts === 0 ? (
            <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
              התלמיד הצטרף לכיתה אבל עוד לא פתר שאלה.
              <br />
              <span className="text-slate-400">אין כאן אפס — פשוט אין עדיין מה למדוד.</span>
            </p>
          ) : (
            <>
              <Section title="פעילות" hint={`${ACTIVITY_DAYS} הימים האחרונים`}>
                <ActivityStrip daily={student.daily} />
              </Section>

              <Section title="שליטה לפי נושא">
                <ul className="flex flex-col gap-1.5">
                  {student.topics.map((t) => (
                    <li key={t.topic} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 truncate text-sm text-slate-700 dark:text-slate-300">
                        {t.topic}
                      </span>
                      <MasteryBar mastery={t.mastery} />
                      <span className="w-14 shrink-0 text-end font-mono text-sm tabular-nums text-slate-900 dark:text-slate-50">
                        {t.mastery === null ? '—' : `${Math.round(t.mastery * 100)}%`}
                      </span>
                      <span className="w-12 shrink-0 text-end font-mono text-xs tabular-nums text-slate-400">
                        {t.correct}/{t.measured}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>

              {student.recentWrong.length > 0 && (
                <Section
                  title="איפה הוא נופל"
                  hint="הטעויות שהמערכת זיהתה, החדשות קודם"
                >
                  {named.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {named.map((w, i) => (
                        <li
                          key={i}
                          className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/40"
                        >
                          {/* The whole reason this panel exists: not "he got
                              42%", which you cannot say to a fifteen-year-old,
                              but the sentence a teacher can actually open a
                              conversation with. */}
                          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                            {w.note}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                            <span>{w.topic}</span>
                            <span aria-hidden>·</span>
                            <span>{agoLabel(w.daysAgo)}</span>
                            {w.hintUsed && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                <Lightbulb className="h-3 w-3" aria-hidden />
                                אחרי רמז
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {unnamed > 0 && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {named.length > 0 ? 'ועוד ' : ''}
                      {unnamed} תשובות שגויות שהמערכת לא זיהתה בהן טעות אופיינית.
                    </p>
                  )}
                </Section>
              )}
            </>
          )}
        </div>

        {(onFocus || reportHref) && (
          <footer className="sticky bottom-0 mt-auto flex gap-2 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            {onFocus && (
              <button
                type="button"
                onClick={onFocus}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-700"
              >
                <Target className="h-4 w-4" aria-hidden />
                שלח ל{student.name} תרגול
              </button>
            )}
            {reportHref && (
              // One student's page, for the parents' evening he is on the
              // agenda of — printing the whole class to hand over one sheet is
              // how a teacher stops using a feature.
              <Link
                href={reportHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:text-slate-300"
              >
                <Printer className="h-4 w-4" aria-hidden />
                דוח
              </Link>
            )}
          </footer>
        )}
      </aside>
    </div>
  );
}

/** A single value. `null` renders as "אין נתונים", never as 0 — the rule the
 *  whole board is built on. `zeroIsReal` marks the counters where a real zero
 *  is a measurement ("no topics stuck" is good news). */
function Stat({
  label,
  value,
  zeroIsReal = false,
}: {
  label: string;
  value: string | number | null;
  zeroIsReal?: boolean;
}) {
  const empty = value === null || (!zeroIsReal && value === 0);
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-950/50">
      <div className="font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
        {empty ? <span className="text-base text-slate-400">—</span> : value}
      </div>
      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-baseline gap-2">
        <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400">
          {title}
        </span>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </h3>
      {children}
    </section>
  );
}

/**
 * Fourteen days of activity as a bar strip.
 *
 * Bars and not a line: the question is "did he show up on this day", which is a
 * count per discrete day, and a line between two days implies values in
 * between that do not exist. One series, so no legend — the section title names
 * it. Every bar carries a title attribute rather than a number on top: a label
 * on all fourteen would be noise, and the shape is the message.
 */
function ActivityStrip({ daily }: { daily: { daysAgo: number; attempts: number; correct: number }[] }) {
  const max = Math.max(1, ...daily.map((d) => d.attempts));
  return (
    <div className="flex h-16 items-end gap-1" role="img" aria-label="פעילות יומית בשבועיים האחרונים">
      {daily.map((d) => {
        const h = d.attempts === 0 ? 3 : Math.max(8, Math.round((d.attempts / max) * 56));
        return (
          <div
            key={d.daysAgo}
            className="flex-1"
            title={
              d.attempts === 0
                ? `${agoLabel(d.daysAgo)}: לא תרגל`
                : `${agoLabel(d.daysAgo)}: ${d.correct} נכונות מתוך ${d.attempts}`
            }
          >
            <div
              className={`w-full rounded-t ${
                d.attempts === 0
                  ? 'bg-slate-200 dark:bg-slate-800'
                  : 'bg-violet-500 dark:bg-violet-400'
              }`}
              style={{ height: `${h}px` }}
            />
          </div>
        );
      })}
    </div>
  );
}

/** One bar on the diverging mastery scale, so a row reads the same way as the
 *  matching heatmap cell. */
function MasteryBar({ mastery }: { mastery: number | null }) {
  if (mastery === null) {
    return (
      <span className="h-2 flex-1 rounded-full border border-dashed border-slate-300 dark:border-slate-700" />
    );
  }
  const band = masteryCell(mastery);
  return (
    <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <span
        className={`block h-full rounded-full ${band.bar}`}
        style={{ width: `${Math.round(mastery * 100)}%` }}
      />
    </span>
  );
}
