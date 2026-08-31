'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Rocket, ArrowLeft, Lock, Crown } from 'lucide-react';
import { PATH_SECTIONS } from '@/content/learning-paths/types';
import { ADVANCED_SECTIONS } from '@/content/advanced-courses/types';
import { hasAdvancedCourse } from '@/content/advanced-courses';
import { getCompletedSections } from '@/lib/learn-progress';
import { getAdvancedProgress, getCompletedAdvancedSections } from '@/lib/advanced-progress';
import { createClient } from '@/lib/supabase/client';
import { isProUser } from '@/lib/access';
import { fadeUp, inViewProps } from '@/lib/animations';
import { useClientValue } from '@/lib/use-client-value';

/** Stable server-render snapshot. */
const NO_STATUSES: { base: TrackStatus | null; adv: TrackStatus | null } = { base: null, adv: null };

type TrackStatus = { label: string; cls: string };

/**
 * CourseTracks — the two-track block on the topic page: "קורס בסיס"
 * (learn-from-0 path) and "קורס מתקדם" (bagrut level), each with a live
 * status chip (not started / in progress / done) from localStorage.
 * Rendered only for topics that have a learning path; the advanced card
 * appears only when an advanced course exists. The advanced course's
 * actual lock is enforced inside its page (entry gate).
 */
export function CourseTracks({ subject, topic }: { subject: string; topic: string }) {
  const advanced = hasAdvancedCourse(subject, topic);

  const [pro, setPro] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setPro(isProUser(data.user)));
  }, []);

  // Both badges are derived from localStorage progress, so neither exists during
  // the server render — read as one snapshot at hydration.
  const readStatuses = useCallback((): { base: TrackStatus | null; adv: TrackStatus | null } => {
    // Base track status
    const baseDone = getCompletedSections(subject, topic).size;
    const base: TrackStatus =
      baseDone >= PATH_SECTIONS.length
        ? { label: '✓ הושלם', cls: 'bg-emerald-500/25 border-emerald-400/50 text-emerald-800' }
        : baseDone > 0
          ? {
              label: `בתהליך · ${baseDone}/${PATH_SECTIONS.length}`,
              cls: 'bg-amber-500/20 border-amber-400/40 text-amber-800',
            }
          : { label: 'התחל כאן', cls: 'bg-slate-900/5 border-slate-900/15 text-slate-800' };

    // Advanced track status
    let adv: TrackStatus | null = null;
    if (advanced) {
      const p = getAdvancedProgress(subject, topic);
      const advDone = getCompletedAdvancedSections(subject, topic).size;
      adv =
        p.simulationPassed
          ? { label: '🎓 הושלם', cls: 'bg-violet-500/25 border-violet-400/50 text-violet-800' }
          : p.gatePassed
            ? {
                label: `בתהליך · ${advDone}/${ADVANCED_SECTIONS.length}`,
                cls: 'bg-amber-500/20 border-amber-400/40 text-amber-800',
              }
            : { label: '🔒 שער כניסה', cls: 'bg-slate-900/5 border-slate-900/15 text-slate-700' };
    }
    return { base, adv };
  }, [subject, topic, advanced]);
  const { base: baseStatus, adv: advStatus } = useClientValue(readStatuses, NO_STATUSES);

  const topicHref = encodeURIComponent(topic);

  return (
    <motion.div {...inViewProps} variants={fadeUp}>
      <div className={`grid grid-cols-1 ${advanced ? 'sm:grid-cols-2' : ''} gap-3`}>
        {/* Base track */}
        <Link
          href={`/learn/${subject}/${topicHref}`}
          className="group block rounded-2xl p-4 bg-gradient-to-br from-emerald-600/20 to-teal-600/10 border border-emerald-500/40 hover:border-emerald-400 transition-colors shadow-lg shadow-emerald-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-emerald-500/25 border border-emerald-400/50 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-emerald-800" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="font-black text-sm sm:text-base text-slate-900">קורס בסיס — לימוד מ-0</span>
                {baseStatus && (
                  <span className={`text-[9px] font-black tracking-wide border px-1.5 py-0.5 rounded-full ${baseStatus.cls}`}>
                    {baseStatus.label}
                  </span>
                )}
              </div>
              <div className="text-xs text-emerald-800 leading-snug">
                לא מכיר את הנושא? מכאן: אינטואיציה, מושגים, דוגמאות ותרגול מדורג.
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-emerald-700 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </Link>

        {/* Advanced track */}
        {advanced && (
          <Link
            href={`/learn/${subject}/${topicHref}/advanced`}
            className="group block rounded-2xl p-4 bg-gradient-to-br from-violet-600/20 to-violet-600/10 border border-violet-500/40 hover:border-violet-400 transition-colors shadow-lg shadow-violet-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-violet-500/25 border border-violet-400/50 flex items-center justify-center">
                {advStatus?.label === '🔒 שער כניסה' ? (
                  <Lock className="w-5 h-5 text-violet-800" />
                ) : (
                  <Rocket className="w-6 h-6 text-violet-800" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-black text-sm sm:text-base text-slate-900">קורס מתקדם — רמת בגרות</span>
                  {!pro ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wide border border-amber-400/50 bg-amber-500/15 text-amber-800 px-1.5 py-0.5 rounded-full">
                      <Crown className="w-2.5 h-2.5" /> PRO
                    </span>
                  ) : (
                    advStatus && (
                      <span className={`text-[9px] font-black tracking-wide border px-1.5 py-0.5 rounded-full ${advStatus.cls}`}>
                        {advStatus.label}
                      </span>
                    )
                  )}
                </div>
                <div className="text-xs text-violet-800 leading-snug">
                  סיימת את הבסיס? תבניות, מחוון, בגרויות מפורקות וסימולציה עם טיימר.
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-violet-700 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
