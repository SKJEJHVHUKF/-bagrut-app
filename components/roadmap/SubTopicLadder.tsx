'use client';

// SubTopicLadder — the /roadmap/[lessonId] interior. Replaces the old flat
// 4-tab viewer with a graded LEVEL LADDER: the student climbs
// 📖 לומדים → 🌱 חימום → ⚡ ביסוס → 🔥 אתגר → 🎓 בגרות, one rung at a time.
// Each rung unlocks the next; stars + XP + a mastery crown reward the climb.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Check, Play, Crown, Sparkles, ArrowLeft, Star } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { celebrateCompletion, sparkle } from '@/lib/confetti';
import { buildSubTopicLevels, type RoadmapLevel } from '@/lib/roadmap-levels';
import {
  levelStatus,
  levelStars,
  nodeLevelSummary,
  markLevelCleared,
  type ClearResult,
} from '@/lib/roadmap-progress';
import type { SubTopic } from '@/content/lessons/types';
import type { StepStatus } from '@/types/roadmap';
import { StarRow } from './ladder-ui';
import { LearnLevel } from './LearnLevel';
import { RoadmapLevelRunner } from './RoadmapLevelRunner';
import { BagrutLevel } from './BagrutLevel';

export function SubTopicLadder({
  subject,
  topic,
  subTopic,
  nextSubId,
  nextTitle,
}: {
  subject: string;
  topic: string;
  subTopic: SubTopic;
  nextSubId: string | null;
  nextTitle?: string;
}) {
  const levels = useMemo(() => buildSubTopicLevels(subject, topic, subTopic), [subject, topic, subTopic]);

  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0); // bump to recompute after a clear
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  useEffect(() => setReady(true), []);

  // Recompute derived progress whenever storage changes (version) or mount.
  const summary = useMemo(
    () => (ready ? nodeLevelSummary(topic, subTopic.id, levels) : null),
    [ready, version, topic, subTopic.id, levels],
  );

  function statusOf(level: RoadmapLevel): StepStatus {
    if (!ready) return level.index === 0 ? 'UNLOCKED' : 'LOCKED';
    return levelStatus(topic, subTopic.id, level, levels);
  }

  function handleCleared(level: RoadmapLevel, stars: number, score: number, total: number): ClearResult {
    const res = markLevelCleared(topic, subTopic.id, level, levels, stars, score, total);
    if (res.justMastered || res.justCoreDone) celebrateCompletion();
    else if (res.firstClear) sparkle();
    setVersion((v) => v + 1);
    return res;
  }

  const openLevel = openIndex !== null ? levels[openIndex] : null;
  const nextOf = (i: number) => (i + 1 < levels.length ? levels[i + 1] : null);

  // ===== A single rung is open → render its runner =====
  if (openLevel) {
    const onBack = () => {
      setOpenIndex(null);
      setVersion((v) => v + 1);
    };
    const nl = nextOf(openLevel.index);
    const onNext = nl ? () => setOpenIndex(nl.index) : undefined;
    const nextTitleLevel = nl?.title;

    return (
      <div className="space-y-4">
        <LadderHeader subTopic={subTopic} />
        {/* Keyed (not AnimatePresence) so switching rungs remounts cleanly —
            a "wait"-mode exit could otherwise stall the swap between levels. */}
        <motion.div
          key={openLevel.index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {openLevel.kind === 'learn' ? (
              <LearnLevel
                subTopic={subTopic}
                level={openLevel}
                onCleared={(s, sc, t) => handleCleared(openLevel, s, sc, t)}
                nextTitle={nextTitleLevel}
                onNext={onNext}
                onBack={onBack}
              />
            ) : openLevel.kind === 'bagrut' ? (
              <BagrutLevel
                subject={subject}
                topic={topic}
                level={openLevel}
                onCleared={(s, sc, t) => handleCleared(openLevel, s, sc, t)}
                onBack={onBack}
              />
            ) : (
              <RoadmapLevelRunner
                subject={subject}
                topic={topic}
                subId={subTopic.id}
                level={openLevel}
                onCleared={(s, sc, t) => handleCleared(openLevel, s, sc, t)}
                nextTitle={nextTitleLevel}
                onNext={onNext}
                onBack={onBack}
              />
            )}
        </motion.div>
      </div>
    );
  }

  // ===== Ladder overview =====
  const currentIndex = summary ? summary.currentIndex : 0;
  const current = currentIndex < levels.length ? levels[currentIndex] : null;
  const clearedCount = summary?.clearedCount ?? 0;
  const stars = summary?.stars ?? 0;
  const maxStars = summary?.maxStars ?? levels.length * 3;
  const xp = summary?.xp ?? 0;
  const mastered = summary?.mastered ?? false;
  const coreDone = summary?.coreDone ?? false;

  return (
    <div className="space-y-4">
      <LadderHeader subTopic={subTopic} />

      {/* Mastery meter */}
      <div
        className={`surface-premium rounded-3xl p-5 space-y-3 ${
          mastered ? 'ring-2 ring-amber-400/50' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              mastered
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                : 'bg-indigo-500/15 text-indigo-700'
            }`}
          >
            {mastered ? <Crown className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-slate-900">
              {mastered ? 'שליטה מלאה 👑' : `${clearedCount}/${levels.length} רמות הושלמו`}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                {stars}/{maxStars}
              </span>
              <span className="font-bold text-indigo-700">{xp} XP</span>
              {coreDone && !mastered && <span className="text-emerald-700 font-bold">✓ הליבה הושלמה</span>}
            </div>
          </div>
        </div>
        <div className="h-2 bg-slate-900/[0.04] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levels.length ? (clearedCount / levels.length) * 100 : 0}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${
              mastered
                ? 'bg-gradient-to-l from-amber-400 to-amber-600'
                : 'bg-gradient-to-l from-indigo-500 to-violet-500'
            }`}
          />
        </div>
      </div>

      {/* The ladder — rendered top rung first so it visually "climbs" upward */}
      <div className="space-y-2.5">
        {[...levels].reverse().map((level) => {
          const status = statusOf(level);
          const isCurrent = ready && current?.index === level.index && status !== 'COMPLETED';
          const st = ready ? levelStars(topic, subTopic.id, level.kind) : 0;
          const prevTitle = level.index > 0 ? levels[level.index - 1].title : undefined;
          return (
            <RungCard
              key={level.kind}
              level={level}
              status={status}
              isCurrent={isCurrent}
              stars={st}
              prevTitle={prevTitle}
              onOpen={() => setOpenIndex(level.index)}
            />
          );
        })}
      </div>

      {/* Primary CTA */}
      {current ? (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpenIndex(current.index)}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-3.5 rounded-2xl font-black text-white shadow-lg shadow-indigo-500/25 transition-colors"
        >
          <Play className="w-4 h-4" />
          <span>
            {clearedCount === 0 ? 'התחל' : 'המשך'}: רמת {current.title} {current.emoji}
          </span>
        </motion.button>
      ) : (
        <div className="space-y-2">
          {nextSubId ? (
            <Link
              href={`/roadmap/${encodeURIComponent(nextSubId)}`}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-3.5 rounded-2xl font-black text-white shadow-lg shadow-emerald-500/30 transition-colors"
            >
              <span>המשך לשלב הבא{nextTitle ? `: ${nextTitle}` : ''}</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/roadmap"
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 px-5 py-3.5 rounded-2xl font-black text-white shadow-lg shadow-emerald-500/30"
            >
              סיימת את הנושא! חזרה למפה
            </Link>
          )}
        </div>
      )}

      <Link href="/roadmap" className="block text-center text-xs text-slate-500 hover:text-indigo-700 py-1">
        חזרה למפת הלמידה
      </Link>
    </div>
  );
}

function LadderHeader({ subTopic }: { subTopic: SubTopic }) {
  return (
    <div className="text-center space-y-1">
      <div className="text-3xl">{subTopic.emoji ?? '📘'}</div>
      <h1 className="font-display text-2xl font-black text-slate-900 chat-md">
        <MathText inline>{subTopic.title}</MathText>
      </h1>
      <p className="text-sm text-slate-600 chat-md">
        <MathText inline>{subTopic.tagline}</MathText>
      </p>
    </div>
  );
}

function RungCard({
  level,
  status,
  isCurrent,
  stars,
  prevTitle,
  onOpen,
}: {
  level: RoadmapLevel;
  status: StepStatus;
  isCurrent: boolean;
  stars: number;
  prevTitle?: string;
  onOpen: () => void;
}) {
  const done = status === 'COMPLETED';
  const locked = status === 'LOCKED';

  const shell = done
    ? 'border-emerald-500/40 bg-emerald-500/[0.08]'
    : locked
      ? 'border-slate-900/[0.06] bg-slate-900/[0.02] opacity-60'
      : isCurrent
        ? 'border-indigo-500/50 bg-gradient-to-br from-indigo-600/15 to-violet-600/10 shadow-md shadow-indigo-500/10'
        : 'border-indigo-500/30 bg-indigo-500/[0.05] hover:border-indigo-500/50';

  const badge = done
    ? 'bg-emerald-500/25 text-emerald-800'
    : locked
      ? 'bg-slate-900/[0.03] text-slate-400'
      : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white';

  const inner = (
    <div className={`relative rounded-2xl border p-3.5 transition-all ${shell}`}>
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${badge} ${
            isCurrent ? 'ring-2 ring-indigo-400/50 animate-pulse' : ''
          }`}
        >
          {done ? <Check className="w-5 h-5" /> : locked ? <Lock className="w-4 h-4" /> : <span>{level.emoji}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
              רמה {level.index + 1}
            </span>
            {isCurrent && (
              <span className="text-[9px] font-black tracking-wide text-indigo-700 bg-indigo-500/15 rounded-full px-1.5 py-0.5">
                עכשיו
              </span>
            )}
          </div>
          <div className="text-sm font-black text-slate-900">{level.title}</div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            {locked ? `🔒 נפתח אחרי רמת "${prevTitle ?? 'הקודמת'}"` : level.subtitle}
          </div>
        </div>
        <div className="flex-shrink-0">
          {done ? (
            <StarRow value={stars} size="w-3.5 h-3.5" />
          ) : !locked ? (
            <Play className="w-4 h-4 text-indigo-700" />
          ) : null}
        </div>
      </div>
    </div>
  );

  if (locked) return inner;
  return (
    <button onClick={onOpen} className="block w-full text-right">
      {inner}
    </button>
  );
}
