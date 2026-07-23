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
import { Lock, CheckCircle, PlayCircle, Crown, Star, Sparkles } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { MathText } from '@/components/practice/MathText';
import { buildRoadmap, allRoadmapNodes, DEFAULT_PAPER } from '@/constants/roadmapData';
import { getPaper } from '@/lib/study-plan';
import type { BagrutPaper } from '@/content/bagrut-curriculum';
import { getSubTopic } from '@/content/lessons';
import { buildSubTopicLevels, type RoadmapLevel } from '@/lib/roadmap-levels';
import { nodeStatus, countCompleted, nodeLevelSummary, type NodeLevelSummary } from '@/lib/roadmap-progress';
import type { StepStatus, RoadmapNode } from '@/types/roadmap';

const SUBJECT = 'math5';

export default function RoadmapPage() {
  // Active paper (581/582) — read after mount to avoid hydration mismatch.
  const [paper, setPaperState] = useState<BagrutPaper>(DEFAULT_PAPER);
  const roadmap = useMemo(() => buildRoadmap(paper), [paper]);
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
  useEffect(() => {
    setReady(true);
    setPaperState(getPaper() ?? DEFAULT_PAPER);
    // The AppChrome paper switcher dispatches this so the map re-renders live.
    const onPaperChange = () => setPaperState(getPaper() ?? DEFAULT_PAPER);
    window.addEventListener('bagrut-paper-changed', onPaperChange);
    return () => window.removeEventListener('bagrut-paper-changed', onPaperChange);
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
  }, [ready, allNodes, levelsBySub]);

  const overallDone = ready ? countCompleted(allNodes) : 0;
  const overallPct = allNodes.length ? Math.round((overallDone / allNodes.length) * 100) : 0;
  const totalXp = ready ? Object.values(summaries).reduce((s, x) => s + x.xp, 0) : 0;
  const masteredCount = ready ? Object.values(summaries).filter((x) => x.mastered).length : 0;

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
          className="surface-premium rounded-3xl p-5 space-y-4"
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
                  stroke="#4F46E5"
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
            <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-2xl px-3 py-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-700 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-base font-black text-indigo-800 leading-none">{totalXp}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">נקודות XP</div>
              </div>
            </div>
            <div className="bg-amber-500/[0.08] border border-amber-500/25 rounded-2xl px-3 py-2.5 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-base font-black text-amber-700 leading-none">
                  {masteredCount}/{allNodes.length}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">בשליטה מלאה</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main-topic sections */}
        {roadmap.mainTopics.map((mt) => {
          const topicDone = ready ? countCompleted(mt.nodes) : 0;
          const topicPct = mt.nodes.length ? Math.round((topicDone / mt.nodes.length) * 100) : 0;
          return (
            <motion.section
              key={mt.topic}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="surface-premium rounded-3xl p-5 space-y-4"
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
        })}

        <p className="text-center text-[11px] text-slate-500 leading-relaxed pt-1">
          ההתקדמות נשמרת במכשיר הזה. כל שלב הוא סולם של רמות — מטפסים מ&quot;לומדים&quot; ועד &quot;בגרות&quot;.
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
}: {
  node: RoadmapNode;
  status: StepStatus;
  summary: NodeLevelSummary | null;
  levelCount: number;
  prevTitle?: string;
  stepNumber: number;
}) {
  const mastered = !!summary?.mastered;
  const done = status === 'COMPLETED';
  const locked = status === 'LOCKED';
  const cleared = summary?.clearedCount ?? 0;
  const total = summary?.totalLevels ?? levelCount;
  const inProgress = !locked && !done && cleared > 0;

  const accent = mastered
    ? 'border-amber-400/50 bg-amber-500/[0.08]'
    : done
      ? 'border-emerald-500/40 bg-emerald-500/10'
      : locked
        ? 'border-slate-900/[0.06] bg-slate-900/[0.02] opacity-60'
        : 'border-indigo-500/40 bg-gradient-to-br from-indigo-600/15 to-indigo-600/10 hover:border-indigo-500/60';

  const iconBg = mastered
    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
    : done
      ? 'bg-emerald-500/30 text-emerald-800'
      : locked
        ? 'bg-slate-900/[0.03] text-slate-500'
        : 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white';

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
