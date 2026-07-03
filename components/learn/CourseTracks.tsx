'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Rocket, ArrowLeft, Lock } from 'lucide-react';
import { PATH_SECTIONS } from '@/content/learning-paths/types';
import { ADVANCED_SECTIONS } from '@/content/advanced-courses/types';
import { hasAdvancedCourse } from '@/content/advanced-courses';
import { getCompletedSections } from '@/lib/learn-progress';
import { getAdvancedProgress, getCompletedAdvancedSections } from '@/lib/advanced-progress';
import { fadeUp, inViewProps } from '@/lib/animations';

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

  const [baseStatus, setBaseStatus] = useState<TrackStatus | null>(null);
  const [advStatus, setAdvStatus] = useState<TrackStatus | null>(null);

  useEffect(() => {
    // Base track status
    const baseDone = getCompletedSections(subject, topic).size;
    setBaseStatus(
      baseDone >= PATH_SECTIONS.length
        ? { label: '✓ הושלם', cls: 'bg-emerald-500/25 border-emerald-400/50 text-emerald-800' }
        : baseDone > 0
          ? {
              label: `בתהליך · ${baseDone}/${PATH_SECTIONS.length}`,
              cls: 'bg-amber-500/20 border-amber-400/40 text-amber-800',
            }
          : { label: 'התחל כאן', cls: 'bg-slate-900/5 border-slate-900/15 text-slate-800' },
    );

    // Advanced track status
    if (advanced) {
      const p = getAdvancedProgress(subject, topic);
      const advDone = getCompletedAdvancedSections(subject, topic).size;
      setAdvStatus(
        p.simulationPassed
          ? { label: '🎓 הושלם', cls: 'bg-indigo-500/25 border-indigo-400/50 text-indigo-800' }
          : p.gatePassed
            ? {
                label: `בתהליך · ${advDone}/${ADVANCED_SECTIONS.length}`,
                cls: 'bg-amber-500/20 border-amber-400/40 text-amber-800',
              }
            : { label: '🔒 שער כניסה', cls: 'bg-slate-900/5 border-slate-900/15 text-slate-700' },
      );
    }
  }, [subject, topic, advanced]);

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
              <div className="text-xs text-emerald-100/80 leading-snug">
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
            className="group block rounded-2xl p-4 bg-gradient-to-br from-indigo-600/20 to-indigo-600/10 border border-indigo-500/40 hover:border-indigo-400 transition-colors shadow-lg shadow-indigo-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-indigo-500/25 border border-indigo-400/50 flex items-center justify-center">
                {advStatus?.label === '🔒 שער כניסה' ? (
                  <Lock className="w-5 h-5 text-indigo-800" />
                ) : (
                  <Rocket className="w-6 h-6 text-indigo-800" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-black text-sm sm:text-base text-slate-900">קורס מתקדם — רמת בגרות</span>
                  {advStatus && (
                    <span className={`text-[9px] font-black tracking-wide border px-1.5 py-0.5 rounded-full ${advStatus.cls}`}>
                      {advStatus.label}
                    </span>
                  )}
                </div>
                <div className="text-xs text-indigo-100/80 leading-snug">
                  סיימת את הבסיס? תבניות, מחוון, בגרויות מפורקות וסימולציה עם טיימר.
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-indigo-700 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
