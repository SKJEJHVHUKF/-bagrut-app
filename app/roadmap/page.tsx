'use client';

// /roadmap — the personalized learning roadmap dashboard for questionnaire
// 582. A vertical timeline of 6 open main-topic sections; inside each, the
// sub-topic milestones unlock sequentially. Each milestone is now a LEVEL
// LADDER (see lib/roadmap-levels.ts) — the card shows how many rungs are
// cleared, the stars earned, and a crown when the sub-topic is mastered.
// All progress is client-side (localStorage) → render after mount.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, PlayCircle, Crown, Star, Sparkles, ArrowLeft, CalendarClock, Gauge } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { MathText } from '@/components/practice/MathText';
import { buildRoadmapFromPlan, allRoadmapNodes, DEFAULT_PAPER } from '@/constants/roadmapData';
import { getPaper, getPlan, type StudyPlan } from '@/lib/study-plan';
import type { BagrutPaper } from '@/content/bagrut-curriculum';
import { getSubTopic } from '@/content/lessons';
import { buildSubTopicLevels, type RoadmapLevel } from '@/lib/roadmap-levels';
import { nodeStatus, countCompleted, nodeLevelSummary, type NodeLevelSummary } from '@/lib/roadmap-progress';
import { getResumePoint } from '@/lib/roadmap-resume';
import { computePacing } from '@/lib/pacing';
import { dueCount, dueCountBySubTopic, backfillFromMistakes } from '@/lib/review';
import { createClient } from '@/lib/supabase/client';
import { RotateCcw } from 'lucide-react';
import type { StepStatus, RoadmapNode } from '@/types/roadmap';

const SUBJECT = 'math5';

export default function RoadmapPage() {
  // Active paper (581/582) + plan — read after mount to avoid hydration mismatch.
  const [paper, setPaperState] = useState<BagrutPaper>(DEFAULT_PAPER);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const roadmap = useMemo(() => buildRoadmapFromPlan(plan, paper), [plan, paper]);
  const allNodes = useMemo(() => allRoadmapNodes(paper), [paper]);

  // Levels per node are pure (content-derived) → build once.
  const levelsBySub = useMemo(() => {
    const map: Record<string, RoadmapLevel[]> = {};
    for (const n of allNodes) {
      const st = getSubTopic(SUBJECT, n.topic, n.subId);
      map[n.subId] = st ? buildSubTopicLevels(SUBJECT, n.topic, st) : [];
    }
    return map;
  }, [allNodes]);

  // localStorage read only after mount (avoids hydration mismatch).
  const [ready, setReady] = useState(false);
  const [syncTick, setSyncTick] = useState(0);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    backfillFromMistakes(); // seed the review queue from past mistakes (once)
    setReady(true);
    setPaperState(getPaper() ?? DEFAULT_PAPER);
    setPlan(getPlan());
    // The AppChrome paper switcher dispatches this so the map re-renders live.
    const onPaperChange = () => {
      setPaperState(getPaper() ?? DEFAULT_PAPER);
      setPlan(getPlan());
    };
    // A cross-device pull just merged new progress into localStorage → re-read.
    const onSynced = () => {
      setPaperState(getPaper() ?? DEFAULT_PAPER);
      setPlan(getPlan());
      setSyncTick((t) => t + 1);
    };
    window.addEventListener('bagrut-paper-changed', onPaperChange);
    window.addEventListener('bagrut-state-synced', onSynced);
    createClient()
      .auth.getUser()
      .then(({ data }) => setSignedIn(!!data.user))
      .catch(() => setSignedIn(false));
    return () => {
      window.removeEventListener('bagrut-paper-changed', onPaperChange);
      window.removeEventListener('bagrut-state-synced', onSynced);
    };
  }, []);

  // Per-node ladder summaries (depend on stored progress).
  const summaries = useMemo(() => {
    const map: Record<string, NodeLevelSummary> = {};
    if (!ready) return map;
    for (const n of allNodes) {
      map[n.subId] = nodeLevelSummary(n.topic, n.subId, levelsBySub[n.subId] ?? []);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, allNodes, levelsBySub, syncTick]);

  const overallDone = ready ? countCompleted(allNodes) : 0;
  const overallPct = allNodes.length ? Math.round((overallDone / allNodes.length) * 100) : 0;
  const totalXp = ready ? Object.values(summaries).reduce((s, x) => s + x.xp, 0) : 0;
  const masteredCount = ready ? Object.values(summaries).filter((x) => x.mastered).length : 0;

  // "Continue where you left off" + exam-date pacing (both localStorage-derived).
  const resume = useMemo(
    () => (ready ? getResumePoint(roadmap.mainTopics, levelsBySub) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, roadmap, levelsBySub, summaries],
  );
  const pacing = useMemo(
    () => (ready ? computePacing(roadmap.mainTopics, levelsBySub, plan) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, roadmap, levelsBySub, plan, summaries],
  );

  // Spaced-repetition: how many questions are due for review today.
  const reviewDue = useMemo(() => (ready ? dueCount() : 0), [ready, syncTick]);
  const dueBySub = useMemo(
    () => (ready ? dueCountBySubTopic() : {}),
    [ready, syncTick],
  );

  return (
    <PracticeShell subtitle="מסלול הלמידה" backHref="/" backLabel="בית">
      <div className="space-y-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl sm:text-4xl font-black gradient-text">
            🗺️ מסלול הלמידה שלי
          </h1>
          <p className="text-sm text-slate-600">{roadmap.label}</p>
        </div>

        {/* Overall progress */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="glass-card rounded-3xl p-5 space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0 w-16 h-16">
              <svg viewBox="0 0 48 48" className="w-16 h-16 -rotate-90">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="5" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${(overallPct / 100) * 125.7} 125.7`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-indigo-800">
                {overallPct}%
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black tracking-widest text-indigo-700 uppercase">
                ההתקדמות שלך ב{roadmap.label}
              </div>
              <div className="text-sm text-slate-700 mt-1">
                {overallDone} מתוך {allNodes.length} שלבים הושלמו — המשך במסלול המסומן.
              </div>
            </div>
          </div>
          {/* XP + mastery strip */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[var(--primary-container)]/60 border border-indigo-500/20 rounded-2xl px-3 py-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-700 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-base font-black text-indigo-800 leading-none">{totalXp}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">נקודות XP</div>
              </div>
            </div>
            <div className="bg-amber-500/[0.08] border border-amber-500/25 rounded-2xl px-3 py-2.5 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-base font-black text-amber-700 leading-none">
                  {masteredCount}/{allNodes.length}
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">בשליטה מלאה</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Daily spaced-repetition review — the highest-priority thing today */}
        {reviewDue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Link
              href="/roadmap/review"
              className="group flex items-center gap-3 rounded-3xl p-4 bg-gradient-to-l from-rose-500 to-orange-500 shadow-lg shadow-rose-500/25 hover:from-rose-400 hover:to-orange-400 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">
                🔁
              </div>
              <div className="flex-1 min-w-0 text-white">
                <div className="text-[10px] font-black tracking-widest uppercase text-white/70">הכי חשוב היום</div>
                <div className="text-sm font-black leading-tight mt-0.5">חזרה יומית · {reviewDue} שאלות</div>
                <div className="text-[11px] text-white/80 mt-0.5">מחזק את מה שכבר למדת כדי שלא יישכח</div>
              </div>
              <RotateCcw className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-500 flex-shrink-0" />
            </Link>
          </motion.div>
        )}

        {/* Anonymous students: nudge to sign in so progress isn't device-bound */}
        {signedIn === false && overallDone > 0 && (
          <Link
            href="/signup?next=/roadmap"
            className="flex items-center gap-2.5 rounded-2xl p-3.5 bg-amber-500/[0.08] border border-amber-500/30 hover:bg-amber-500/[0.12] transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-[12px] text-amber-900 leading-snug flex-1">
              ההתקדמות שלך שמורה רק במכשיר הזה — <span className="font-black underline">התחבר</span> כדי לא לאבד אותה ולגשת מכל מכשיר.
            </span>
          </Link>
        )}

        {/* Continue where you left off */}
        {resume && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* indigo/violet-600, not -500: the labels on this card are white at
                10-14px, and white on indigo-500 is 4.47:1 / on violet-500 4.23:1
                — both under the 4.5:1 AA floor for small text. 600 gives 6.3:1. */}
            <Link
              href={resume.href}
              className="group flex items-center gap-3 rounded-3xl p-4 bg-gradient-to-l from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-violet-500 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">
                {resume.levelEmoji}
              </div>
              <div className="flex-1 min-w-0 text-white">
                <div className="text-[10px] font-black tracking-widest uppercase text-white/70">
                  {resume.reason === 'in-progress'
                    ? 'המשך מאיפה שהפסקת'
                    : resume.reason === 'mastery'
                      ? 'להשלמת שליטה'
                      : 'הצעד הבא שלך'}
                </div>
                <div className="text-sm font-black leading-tight mt-0.5 truncate">
                  <MathText inline>{resume.title}</MathText>
                </div>
                <div className="text-[11px] text-white/80 mt-0.5">
                  רמת {resume.levelTitle} {resume.levelEmoji}
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-white rotate-180 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            </Link>
          </motion.div>
        )}

        {/* Exam-date pacing */}
        {pacing && pacing.status !== 'no-date' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`rounded-2xl p-4 border flex items-start gap-3 ${
              pacing.status === 'behind'
                ? 'bg-amber-500/[0.08] border-amber-500/30'
                : pacing.status === 'done'
                  ? 'bg-emerald-500/[0.08] border-emerald-500/30'
                  : 'bg-sky-500/[0.06] border-sky-500/25'
            }`}
          >
            {pacing.status === 'behind' ? (
              <Gauge className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <CalendarClock className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              {pacing.daysLeft > 0 && pacing.status !== 'done' && (
                <div className="text-xs font-black text-slate-800">
                  {pacing.daysLeft} ימים לבגרות · יעד היום: {pacing.todayTarget} שאלות
                </div>
              )}
              <div className="text-[12px] text-slate-600 mt-0.5 leading-relaxed">{pacing.message}</div>
            </div>
          </motion.div>
        )}

        {/* Main-topic sections */}
        {roadmap.mainTopics.map((mt, mtIdx) => {
          const showDivider =
            roadmap.planTopicCount > 0 &&
            roadmap.planTopicCount < roadmap.mainTopics.length &&
            mtIdx === roadmap.planTopicCount;
          return (
          <div key={`wrap-${mt.topic}`}>
          {showDivider && (
            <div className="flex items-center gap-3 py-1 mb-3">
              <div className="h-px flex-1 bg-slate-900/10" />
              <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">נושאים נוספים</span>
              <div className="h-px flex-1 bg-slate-900/10" />
            </div>
          )}
          {(() => {
          const topicDone = ready ? countCompleted(mt.nodes) : 0;
          const topicPct = mt.nodes.length ? Math.round((topicDone / mt.nodes.length) * 100) : 0;
          return (
            <motion.section
              key={mt.topic}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="glass-card rounded-3xl p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">{mt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-slate-900">{mt.displayName}</div>
                  <div className="text-[11px] text-slate-500">
                    {topicDone}/{mt.nodes.length} שלבים
                  </div>
                </div>
                <span className="text-sm font-black text-indigo-700">{topicPct}%</span>
              </div>
              <div className="h-1.5 bg-slate-900/[0.03] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${topicPct}%` }}
                />
              </div>

              {/* Vertical timeline of sub-topic nodes */}
              <div className="relative pr-5">
                <div className="absolute right-[7px] top-3 bottom-3 w-0.5 bg-slate-900/10" />
                <div className="space-y-2">
                  {mt.nodes.map((node, i) => {
                    const prev = i > 0 ? mt.nodes[i - 1] : null;
                    const status: StepStatus = ready
                      ? nodeStatus(node.topic, node.subId, prev ? prev.subId : null)
                      : i === 0
                        ? 'UNLOCKED'
                        : 'LOCKED';
                    return (
                      <RoadmapNodeCard
                        key={node.subId}
                        node={node}
                        status={status}
                        summary={ready ? summaries[node.subId] : null}
                        levelCount={levelsBySub[node.subId]?.length ?? 0}
                        prevTitle={prev?.title}
                        stepNumber={i + 1}
                        reviewDue={dueBySub[node.subId] ?? 0}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Reference + advanced course for this topic (formulas, worked
                  examples, Pro course) — kept reachable from the spine. */}
              <Link
                href={`/practice/${SUBJECT}/${encodeURIComponent(mt.topic)}`}
                className="block text-center text-[11px] text-slate-500 hover:text-indigo-700 transition-colors pt-1"
              >
                📚 חומרי עזר וקורס מתקדם בנושא
              </Link>
            </motion.section>
          );
          })()}
          </div>
          );
        })}

        <p className="text-center text-[11px] text-slate-500 leading-relaxed pt-1">
          {signedIn
            ? 'ההתקדמות שלך מסתנכרנת לחשבון וזמינה בכל מכשיר. כל שלב הוא סולם של רמות — מ"לומדים" ועד "בגרות".'
            : 'ההתקדמות נשמרת במכשיר הזה. התחבר כדי לשמור אותה בכל מכשיר. כל שלב הוא סולם של רמות — מ"לומדים" ועד "בגרות".'}
        </p>
      </div>
    </PracticeShell>
  );
}

function RoadmapNodeCard({
  node,
  status,
  summary,
  levelCount,
  prevTitle,
  stepNumber,
  reviewDue,
}: {
  node: RoadmapNode;
  status: StepStatus;
  summary: NodeLevelSummary | null;
  levelCount: number;
  prevTitle?: string;
  stepNumber: number;
  reviewDue: number;
}) {
  const mastered = !!summary?.mastered;
  const done = status === 'COMPLETED';
  const locked = status === 'LOCKED';
  const cleared = summary?.clearedCount ?? 0;
  const total = summary?.totalLevels ?? levelCount;
  const inProgress = !locked && !done && cleared > 0;

  const accent = mastered
    ? 'border-amber-400/50 bg-amber-100/70'
    : done
      ? 'border-emerald-500/35 bg-emerald-100/60'
      : locked
        ? 'border-slate-900/[0.06] bg-white/40 opacity-60'
        : 'border-indigo-500/35 bg-[var(--primary-container)]/70 hover:border-indigo-500/60';

  const iconBg = mastered
    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
    : done
      ? 'bg-emerald-500/25 text-emerald-800'
      : locked
        ? 'bg-slate-900/[0.03] text-slate-500'
        : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white';

  // One-line status under the title.
  const statusLine = locked
    ? `🔒 נפתח אחרי שתסיים את "${prevTitle ?? 'השלב הקודם'}"`
    : mastered
      ? '👑 שליטה מלאה בכל הרמות'
      : done
        ? `✓ הליבה הושלמה · ${cleared}/${total} רמות`
        : inProgress
          ? `רמה ${Math.min(cleared + 1, total)} מתוך ${total} · ממשיכים לטפס`
          : node.tagline;

  const content = (
    <div className={`relative rounded-2xl border p-3 transition-all ${accent}`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${
            !locked && !done && !mastered ? 'ring-2 ring-indigo-400/40 animate-pulse' : ''
          }`}
        >
          {mastered ? (
            <Crown className="w-5 h-5" />
          ) : done ? (
            <CheckCircle className="w-5 h-5" />
          ) : locked ? (
            <Lock className="w-4 h-4" />
          ) : (
            <span className="text-lg">{node.emoji ?? '📘'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase">שלב {stepNumber}</div>
            {!locked && total > 0 && (
              <div className="flex items-center gap-1.5">
                {/* rung dots */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: total }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < cleared ? (mastered ? 'bg-amber-500' : 'bg-indigo-500') : 'bg-slate-900/15'
                      }`}
                    />
                  ))}
                </div>
                {summary && summary.stars > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    {summary.stars}
                  </span>
                )}
                {reviewDue > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-500/10 border border-rose-500/25 rounded-full px-1.5">
                    🔁 {reviewDue}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-sm font-black text-slate-900 chat-md">
            <MathText inline>{node.title}</MathText>
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1 chat-md">
            <MathText inline>{statusLine}</MathText>
          </div>
        </div>
        {!locked && !done && !mastered && <PlayCircle className="w-4 h-4 text-indigo-700 flex-shrink-0 mt-1" />}
      </div>
    </div>
  );

  if (locked) return content;
  return (
    <Link href={`/roadmap/${encodeURIComponent(node.subId)}`} className="block">
      {content}
    </Link>
  );
}
