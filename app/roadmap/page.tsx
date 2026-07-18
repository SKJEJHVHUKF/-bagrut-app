'use client';

// /roadmap — the personalized learning roadmap dashboard for questionnaire
// 582. A vertical timeline of 6 open main-topic sections; inside each, the
// sub-topic milestones unlock sequentially (LOCKED / UNLOCKED / COMPLETED).
// All progress is client-side (localStorage) → render after mount.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, PlayCircle, MapPin } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { fadeUp } from '@/lib/animations';
import { buildRoadmap582, allRoadmap582Nodes } from '@/constants/roadmapData';
import { nodeStatus, countCompleted } from '@/lib/roadmap-progress';
import type { StepStatus, RoadmapNode } from '@/types/roadmap';

export default function RoadmapPage() {
  const roadmap = useMemo(() => buildRoadmap582(), []);
  const allNodes = useMemo(() => allRoadmap582Nodes(), []);
  // localStorage read only after mount (avoids hydration mismatch).
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const overallDone = ready ? countCompleted(allNodes) : 0;
  const overallPct = allNodes.length ? Math.round((overallDone / allNodes.length) * 100) : 0;

  return (
    <PracticeShell subtitle="מסלול הלמידה" backHref="/practice" backLabel="לתרגול">
      <div className="space-y-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl sm:text-4xl font-black gradient-text">
            🗺️ מסלול הלמידה שלי
          </h1>
          <p className="text-sm text-slate-600">{roadmap.label}</p>
        </div>

        {/* Overall progress */}
        <motion.div {...fadeUp} className="surface-premium rounded-3xl p-5 flex items-center gap-4">
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
              ההתקדמות שלך בשאלון 582
            </div>
            <div className="text-sm text-slate-700 mt-1">
              {overallDone} מתוך {allNodes.length} שלבים הושלמו — המשך במסלול המסומן.
            </div>
          </div>
        </motion.div>

        {/* Main-topic sections */}
        {roadmap.mainTopics.map((mt) => {
          const topicDone = ready ? countCompleted(mt.nodes) : 0;
          const topicPct = mt.nodes.length ? Math.round((topicDone / mt.nodes.length) * 100) : 0;
          return (
            <motion.section {...fadeUp} key={mt.topic} className="surface-premium rounded-3xl p-5 space-y-4">
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
                        prevTitle={prev?.title}
                        stepNumber={i + 1}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.section>
          );
        })}

        <p className="text-center text-[11px] text-slate-500 leading-relaxed pt-1">
          ההתקדמות נשמרת במכשיר הזה. סיום בוחן-שלב (2 מתוך 3) פותח את השלב הבא באותו נושא.
        </p>
      </div>
    </PracticeShell>
  );
}

function RoadmapNodeCard({
  node,
  status,
  prevTitle,
  stepNumber,
}: {
  node: RoadmapNode;
  status: StepStatus;
  prevTitle?: string;
  stepNumber: number;
}) {
  const done = status === 'COMPLETED';
  const locked = status === 'LOCKED';

  const accent = done
    ? 'border-emerald-500/40 bg-emerald-500/10'
    : locked
    ? 'border-slate-900/[0.06] bg-slate-900/[0.02] opacity-60'
    : 'border-indigo-500/40 bg-gradient-to-br from-indigo-600/15 to-indigo-600/10 hover:border-indigo-500/60';

  const iconBg = done
    ? 'bg-emerald-500/30 text-emerald-800'
    : locked
    ? 'bg-slate-900/[0.03] text-slate-500'
    : 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white';

  const content = (
    <div className={`relative rounded-2xl border p-3 transition-all ${accent}`}>
      {/* timeline dot marker (aligns with the vertical line) */}
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${
            !locked && !done ? 'ring-2 ring-indigo-400/40 animate-pulse' : ''
          }`}
        >
          {done ? (
            <CheckCircle className="w-5 h-5" />
          ) : locked ? (
            <Lock className="w-4 h-4" />
          ) : (
            <span className="text-lg">{node.emoji ?? '📘'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
            שלב {stepNumber}
          </div>
          <div className="text-sm font-black text-slate-900">{node.title}</div>
          <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
            {locked
              ? `🔒 נפתח אחרי שתסיים את "${prevTitle ?? 'השלב הקודם'}"`
              : done
              ? '✓ הושלם'
              : node.tagline}
          </div>
        </div>
        {!locked && !done && <PlayCircle className="w-4 h-4 text-indigo-700 flex-shrink-0 mt-1" />}
        {done && <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-1" />}
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
