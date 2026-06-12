'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Brain, Target, Lock, CheckCircle, ArrowLeft, PlayCircle } from 'lucide-react';
import { getPlan, type PlanTopic } from '@/lib/study-plan';
import { isProUser, type UserLike } from '@/lib/access';
import { createClient } from '@/lib/supabase/client';

/**
 * TopicJourney — top-of-page header showing the 3-stage journey for the
 * current topic (understand → quiz → practice). Mirrors the Multi/100ble
 * UX the owner shared: a clear sequential path with lock/done states.
 *
 * Stage 1 (Understand) auto-completes once the student lands on the
 * lesson page (markStep('understand') runs in LessonView). Stages 2 and 3
 * lock until the previous one is done.
 */
export function TopicJourney({
  subject,
  topic,
}: {
  subject: string;
  topic: string;
}) {
  const [planTopic, setPlanTopic] = useState<PlanTopic | null>(null);
  const [hasPlan, setHasPlan] = useState(false);
  const [pro, setPro] = useState(false);

  useEffect(() => {
    const plan = getPlan();
    if (!plan) {
      setHasPlan(false);
      return;
    }
    setHasPlan(true);
    const t = plan.topics.find((x) => x.subject === subject && x.topic === topic);
    setPlanTopic(t ?? null);
  }, [subject, topic]);

  // Pro/admin users get all stages unlocked from the start (no progress
  // gate). Admin override is built into isProUser via email check.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setPro(isProUser(data.user as UserLike));
    });
  }, []);

  // If the student has no plan, skip the journey UI — they're just browsing.
  if (!hasPlan) return null;

  // Default state for a topic not in the plan: all 3 unlocked, none done.
  const steps = planTopic?.steps ?? {
    understand: false,
    quiz: false,
    practice: false,
  };

  const stage1Done = steps.understand;
  const stage2Done = steps.quiz;
  const stage3Done = steps.practice;

  // Progress-based locks (free tier). Pro/admin bypass them entirely so
  // they can jump into any stage without finishing the previous ones —
  // useful for testing, reviewing, or just preferring a different order.
  const stage2Locked = !pro && !stage1Done;
  const stage3Locked = !pro && !stage2Done;

  const completed = (stage1Done ? 1 : 0) + (stage2Done ? 1 : 0) + (stage3Done ? 1 : 0);

  return (
    <section className="mb-5 space-y-3">
      {/* Header with progress count */}
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-black tracking-widest text-indigo-300 uppercase flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          <span>מסלול הלימוד</span>
        </div>
        <div className="text-xs text-slate-400">
          <span className="font-black text-indigo-300">{completed}/3</span>
          <span> שלבים</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-l from-indigo-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${(completed / 3) * 100}%` }}
        />
      </div>

      {/* 3 step cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <StepCard
          icon={<BookOpen className="w-5 h-5" />}
          number={1}
          title="הבנה"
          subtitle="קריאת השיעור"
          done={stage1Done}
          locked={false}
          href={`#lesson-content`}
        />
        <StepCard
          icon={<Brain className="w-5 h-5" />}
          number={2}
          title="מבחן הבנה"
          subtitle="5 שאלות quiz"
          done={stage2Done}
          locked={stage2Locked}
          href={`/quiz?subject=${subject}&topic=${encodeURIComponent(topic)}`}
        />
        <StepCard
          icon={<Target className="w-5 h-5" />}
          number={3}
          title="תרגול"
          subtitle="שאלת בגרות"
          done={stage3Done}
          locked={stage3Locked}
          href={`/practice/${subject}/${encodeURIComponent(topic)}/exercise?mode=bagrut`}
        />
      </div>
    </section>
  );
}

function StepCard({
  icon,
  number,
  title,
  subtitle,
  done,
  locked,
  href,
}: {
  icon: React.ReactNode;
  number: number;
  title: string;
  subtitle: string;
  done: boolean;
  locked: boolean;
  href: string;
}) {
  const accent = done
    ? 'border-emerald-500/40 bg-emerald-500/10'
    : locked
    ? 'border-white/5 bg-white/[0.02] opacity-60'
    : 'border-indigo-500/40 bg-gradient-to-br from-indigo-600/15 to-indigo-600/15 hover:border-indigo-500/60';

  const iconBg = done
    ? 'bg-emerald-500/30 text-emerald-200'
    : locked
    ? 'bg-white/5 text-slate-500'
    : 'bg-gradient-to-br from-indigo-500 to-indigo-500 text-white';

  const content = (
    <div className={`rounded-2xl border p-3 transition-all ${accent}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {done ? <CheckCircle className="w-5 h-5" /> : locked ? <Lock className="w-4 h-4" /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            שלב {number}
          </div>
          <div className="text-sm font-black text-white">{title}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{subtitle}</div>
        </div>
        {!locked && !done && (
          <PlayCircle className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-1" />
        )}
        {done && (
          <ArrowLeft className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-1" />
        )}
      </div>
    </div>
  );

  if (locked) return content;
  // Internal anchor for stage 1 — smooth scroll to lesson body.
  if (href.startsWith('#')) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
