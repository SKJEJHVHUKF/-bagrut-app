'use client';

// BagrutLevel — the 🎓 "בגרות" rung, the top of the ladder. Renders the
// sub-topic's tagged multi-part bagrut question(s) with the real practice
// card (deterministic checker + graded hints + grounded tutor). The student
// works each part; finishing awards stars from how many parts came out right.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Flag } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { QuestionPartCard } from '@/components/practice/QuestionPartCard';
import { buttonTap } from '@/lib/animations';
import type { RoadmapLevel } from '@/lib/roadmap-levels';
import type { AttemptResult } from '@/lib/roadmap-progress';
import { LevelClearedPanel, LevelFailedPanel } from './ladder-ui';
import { teachHref } from '@/lib/teach/rubric';

export function BagrutLevel({
  subject,
  topic,
  subId,
  level,
  onSubmit,
  onBack,
}: {
  subject: string;
  topic: string;
  subId: string;
  level: RoadmapLevel;
  onSubmit: (score: number, total: number, opts?: { viaRetry?: boolean; force?: boolean }) => AttemptResult;
  onBack: () => void;
}) {
  const [result, setResult] = useState<AttemptResult | null>(null);
  // Per-part outcome keyed by a stable "<qIndex>.<partIndex>" id.
  const [status, setStatus] = useState<Record<string, 'correct' | 'wrong'>>({});

  const totalParts = level.bagrut.reduce((n, q) => n + q.parts.length, 0);
  const doneParts = Object.keys(status).length;
  const correctParts = Object.values(status).filter((s) => s === 'correct').length;

  function setPart(id: string, outcome: 'correct' | 'wrong', force = false) {
    setStatus((prev) => {
      // A self-report overrides a prior auto-mark; an auto-mark never
      // downgrades an existing verdict.
      if (prev[id] && !force) return prev;
      return { ...prev, [id]: outcome };
    });
  }

  const [isRetry, setIsRetry] = useState(false);

  function finish() {
    setResult(onSubmit(correctParts, totalParts, { viaRetry: isRetry }));
  }

  function retry() {
    setStatus({});
    setIsRetry(true);
    setResult(null);
  }

  function continueAnyway() {
    setResult(onSubmit(correctParts, totalParts, { force: true }));
  }

  if (result) {
    if (result.passed) {
      return (
        <LevelClearedPanel
          level={level}
          result={result}
          onBack={onBack}
          onReplay={result.stars < 3 ? retry : undefined}
          teachHref={teachHref(subject, topic, subId)}
        />
      );
    }
    return (
      <LevelFailedPanel
        level={level}
        score={result.score}
        total={result.total}
        required={result.requiredCorrect}
        missedCount={result.total - result.score}
        attempts={result.attempts}
        onRetry={retry}
        onContinueAnyway={continueAnyway}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800">
          → לסולם
        </button>
        <span className="font-black text-violet-700">🎓 רמת בגרות</span>
      </div>

      <div className="bg-gradient-to-br from-violet-600/10 to-violet-600/10 border border-violet-500/25 rounded-2xl p-4 flex gap-2.5 items-start">
        <Target className="w-4 h-4 text-violet-700 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-700 leading-relaxed">
          זו הרמה הגבוהה ביותר — שאלת בגרות אמיתית, רב-שלבית. פתור כמו בבחינה. אפשר לבדוק כל סעיף,
          לקבל רמז מדורג, או לשאול &quot;למה טעיתי?&quot; — המורה מעוגן בחומר הנושא.
        </p>
      </div>

      {level.bagrut.map((q, qi) => (
        <section key={q.id} className="space-y-3">
          {level.bagrut.length > 1 && (
            <div className="text-[11px] font-black tracking-widest text-slate-500 uppercase">
              שאלה {qi + 1} מתוך {level.bagrut.length}
            </div>
          )}
          {q.context && (
            <div className="surface-premium rounded-2xl p-4 chat-md text-sm text-slate-900 leading-relaxed">
              <MathText>{q.context}</MathText>
            </div>
          )}
          {q.parts.map((part, pi) => {
            const id = `${qi}.${pi}`;
            return (
              <QuestionPartCard
                key={id}
                part={part}
                subject={subject}
                topic={topic}
                context={q.context}
                subTopicId={q.subTopicId}
                questionId={`${q.id}-${part.label}`}
                difficulty={q.difficulty}
                onDone={() => setPart(id, 'correct')}
                onSelfAssess={(correct) => setPart(id, correct ? 'correct' : 'wrong', true)}
              />
            );
          })}
        </section>
      ))}

      <div className="surface-premium rounded-2xl p-4 space-y-3">
        <div className="text-center text-sm text-slate-600">
          {doneParts === 0
            ? 'עבוד על הסעיפים — ואז סמן שסיימת.'
            : `השלמת ${doneParts} מתוך ${totalParts} סעיפים · ${correctParts} נכונים`}
        </div>
        <motion.button
          {...buttonTap}
          onClick={finish}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-5 py-3 rounded-2xl font-black text-white shadow-lg shadow-amber-500/30 transition-colors"
        >
          <Flag className="w-4 h-4" />
          <span>סיימתי את שאלת הבגרות</span>
        </motion.button>
      </div>
    </div>
  );
}
