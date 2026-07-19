'use client';

// ladder-ui — small shared pieces for the sub-topic level ladder:
//   <StarRow>          a 1-3 star rating strip
//   <LevelClearedPanel> the celebration shown when a rung is cleared

import { motion } from 'framer-motion';
import { Star, ArrowLeft, RefreshCw, Trophy, Crown, Map } from 'lucide-react';
import { buttonTap } from '@/lib/animations';
import type { RoadmapLevel } from '@/lib/roadmap-levels';
import type { ClearResult } from '@/lib/roadmap-progress';

export function StarRow({
  value,
  max = 3,
  className = '',
  size = 'w-4 h-4',
}: {
  value: number;
  max?: number;
  className?: string;
  size?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${i < value ? 'text-amber-500 fill-amber-400' : 'text-slate-300'}`}
        />
      ))}
    </div>
  );
}

export function LevelClearedPanel({
  level,
  result,
  nextTitle,
  onNext,
  onBack,
  onReplay,
}: {
  level: RoadmapLevel;
  result: ClearResult;
  /** Title of the next rung (if any). */
  nextTitle?: string;
  onNext?: () => void;
  onBack: () => void;
  onReplay?: () => void;
}) {
  const { stars, xpGained, justMastered, justCoreDone } = result;

  const headline = justMastered
    ? 'שליטה מלאה בתת-הנושא! 👑'
    : justCoreDone
      ? 'עברת את הליבה — נפתח השלב הבא! 🎉'
      : `כל הכבוד — רמת "${level.title}" הושלמה!`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-4"
    >
      <div className="rounded-3xl p-6 text-center space-y-3 border bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border-amber-500/40">
        {justMastered ? (
          <Crown className="w-12 h-12 mx-auto text-amber-500" />
        ) : (
          <Trophy className="w-12 h-12 mx-auto text-amber-600" />
        )}
        <StarRow value={stars} className="justify-center" size="w-7 h-7" />
        <h3 className="font-display text-xl font-black text-slate-900">{headline}</h3>
        {xpGained > 0 && (
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 py-1 text-sm font-black text-indigo-700">
            +{xpGained} XP
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {onNext && nextTitle && (
          <motion.button
            {...buttonTap}
            onClick={onNext}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-3 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/25 transition-colors"
          >
            <span>עלה לרמה הבאה: {nextTitle}</span>
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
        )}
        <motion.button
          {...buttonTap}
          onClick={onBack}
          className="w-full inline-flex items-center justify-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 px-5 py-3 rounded-2xl font-bold text-slate-800 transition-colors"
        >
          <Map className="w-4 h-4" />
          <span>חזרה לסולם הרמות</span>
        </motion.button>
        {onReplay && (
          <button
            onClick={onReplay}
            className="w-full inline-flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-indigo-700 py-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>תרגל את הרמה הזו שוב</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
