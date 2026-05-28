'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Target,
  Lightbulb,
  KeyRound,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Trophy,
  RefreshCw,
} from 'lucide-react';
import { MathText } from './MathText';
import { buttonTap } from '@/lib/animations';
import { sparkle, celebrateCorrect, celebrateCompletion } from '@/lib/confetti';
import { markExerciseDone } from '@/lib/progress';
import { markStep } from '@/lib/study-plan';
import type { SubTopic } from '@/content/lessons/types';

type Props = {
  subject: string;
  topic: string;
  subTopic: SubTopic;
};

/**
 * SubTopicPractice — sequential focused practice for a sub-topic.
 * Goes one question at a time. MCQ shows 4 options; open shows a textarea.
 * Hint button reveals the single hint (if any). "Show solution" reveals
 * step-by-step. "Next" advances. A final summary card celebrates completion.
 */
export function SubTopicPractice({ subject, topic, subTopic }: Props) {
  const questions = subTopic.questions;
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [openAnswer, setOpenAnswer] = useState('');
  const [hintShown, setHintShown] = useState(false);
  const [solutionShown, setSolutionShown] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const total = questions.length;
  const current = questions[idx];
  const isLast = idx === total - 1;

  function resetCardState() {
    setSelected(null);
    setOpenAnswer('');
    setHintShown(false);
    setSolutionShown(false);
  }

  function handleMCQSelect(i: number) {
    if (selected !== null) return; // already answered
    setSelected(i);
    if (i === current.correct) {
      setCorrectCount((c) => c + 1);
      celebrateCorrect();
      toast.success('תשובה נכונה! 🎯', { duration: 1500 });
    } else {
      toast.error('לא נכון — בדוק את הפתרון', { duration: 2000 });
    }
    setSolutionShown(true);
  }

  function handleOpenCheck() {
    // For open questions we don't auto-grade — just reveal the solution.
    setSolutionShown(true);
    toast.info('השווה את התשובה שלך לפתרון', { duration: 2000 });
  }

  function revealHint() {
    setHintShown(true);
    sparkle();
    toast.info('רמז נחשף', { duration: 1500 });
  }

  function next() {
    if (isLast) {
      // Finished all questions — mark progress and show summary
      setDone(true);
      celebrateCompletion();
      markExerciseDone(subject, topic);
      markStep(subject, topic, 'practice');
      toast.success(`סיימת את התרגול! 🎉`, {
        description: `${correctCount}/${total} תשובות נכונות`,
        duration: 3000,
      });
      return;
    }
    setIdx((i) => i + 1);
    resetCardState();
  }

  function restart() {
    setIdx(0);
    setCorrectCount(0);
    setDone(false);
    resetCardState();
  }

  // ===== Completion summary =====
  if (done) {
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="space-y-4"
      >
        <div className="bg-gradient-to-br from-emerald-600/15 to-teal-600/15 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-4">
          <Trophy className="w-12 h-12 mx-auto text-amber-300" />
          <h2 className="text-2xl font-black text-white">סיימת את התרגול!</h2>
          <div className="text-5xl font-black text-emerald-200">{correctCount}/{total}</div>
          <div className="text-sm text-slate-300">
            {percent === 100
              ? '🌟 ציון מושלם — אתה שולט בתת-נושא הזה.'
              : percent >= 70
                ? '✨ ביצוע מצוין. מומלץ לחזור על השאלות ששגית.'
                : percent >= 40
                  ? '🚀 ביצוע טוב. תרגל שוב כדי להעמיק.'
                  : '💪 נסה שוב — זה תת-נושא חדש, וזה בסדר ללמוד תוך כדי.'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <motion.button
            {...buttonTap}
            onClick={restart}
            className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-2xl font-bold text-white text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>תרגל שוב</span>
          </motion.button>
          <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}>
            <Link
              href={`/practice/${subject}/${encodeURIComponent(topic)}`}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-3 rounded-2xl font-bold text-white text-sm shadow-lg shadow-emerald-500/30 transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>חזרה לנושא</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // ===== Active question =====
  return (
    <div className="space-y-4">
      {/* Header — progress */}
      <div className="flex items-center justify-between text-xs">
        <Link
          href={`/practice/${subject}/${encodeURIComponent(topic)}/sub/${subTopic.id}`}
          className="text-slate-400 hover:text-slate-200"
        >
          → חזרה לסיכום
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">שאלה</span>
          <span className="font-bold text-emerald-300">
            {idx + 1}/{total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${((idx + 1) / total) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="h-full bg-gradient-to-l from-emerald-500 to-teal-500"
        />
      </div>

      {/* Question card */}
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 chat-md"
      >
        <div className="text-xs font-black tracking-widest text-emerald-300 mb-3 uppercase flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          <span>
            {current.difficulty === 'easy' ? '🟢 קל' : current.difficulty === 'mid' ? '🟡 בינוני' : '🔴 מאתגר'}
          </span>
        </div>
        <div className="text-base sm:text-lg font-medium leading-relaxed text-white">
          <MathText>{current.question}</MathText>
        </div>
      </motion.div>

      {/* MCQ options */}
      {current.kind === 'mcq' && current.answers && (
        <div className="space-y-2">
          {current.answers.map((ans, i) => {
            const isCorrect = i === current.correct;
            const isSelected = selected === i;
            const showOutcome = selected !== null;

            return (
              <motion.button
                key={i}
                {...buttonTap}
                onClick={() => handleMCQSelect(i)}
                disabled={selected !== null}
                className={`w-full text-right px-4 py-3 rounded-xl border transition-colors chat-md text-sm ${
                  showOutcome && isCorrect
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-50'
                    : showOutcome && isSelected
                      ? 'bg-rose-500/15 border-rose-500/50 text-rose-50'
                      : showOutcome
                        ? 'bg-white/[0.02] border-white/5 text-slate-400'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
              >
                <span className="font-bold opacity-60 ml-2">{['א', 'ב', 'ג', 'ד'][i]}.</span>
                <MathText inline>{ans}</MathText>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Open answer */}
      {current.kind === 'open' && !solutionShown && (
        <div className="space-y-2">
          <textarea
            value={openAnswer}
            onChange={(e) => setOpenAnswer(e.target.value)}
            placeholder="כתוב כאן את התשובה שלך..."
            rows={3}
            className="w-full bg-slate-950/50 border border-white/10 focus:border-emerald-500/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors resize-y"
            dir="auto"
          />
          <motion.button
            {...buttonTap}
            onClick={handleOpenCheck}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 px-4 py-2.5 rounded-xl font-bold text-emerald-100 text-sm transition-colors"
          >
            <span>הצג פתרון להשוואה</span>
          </motion.button>
        </div>
      )}

      {/* Hint */}
      <AnimatePresence initial={false}>
        {hintShown && current.hint && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex gap-2 items-start"
          >
            <Lightbulb className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-[10px] font-black tracking-widest text-amber-300 uppercase mb-1">רמז</div>
              <div className="chat-md text-sm text-amber-50">
                <MathText inline>{current.hint}</MathText>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint button */}
      {current.hint && !hintShown && !solutionShown && (
        <motion.button
          {...buttonTap}
          onClick={revealHint}
          className="w-full inline-flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-4 py-2.5 rounded-xl font-bold text-amber-100 text-sm transition-colors"
        >
          <Lightbulb className="w-4 h-4" />
          <span>💡 רמז</span>
        </motion.button>
      )}

      {/* Solution */}
      <AnimatePresence initial={false}>
        {solutionShown && (
          <motion.div
            key="solution"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
            className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/30 rounded-2xl p-4"
          >
            <div className="text-xs font-black tracking-widest text-emerald-300 mb-3 uppercase flex items-center gap-2">
              <KeyRound className="w-3 h-3" />
              <span>פתרון</span>
            </div>
            <ol className="space-y-2">
              {current.solution.steps.map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 + i * 0.06, ease: 'easeOut' }}
                  className="flex gap-2.5"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-[11px] font-black text-emerald-100">
                    {i + 1}
                  </div>
                  <div className="flex-1 chat-md text-sm text-slate-100 pt-0.5">
                    <MathText>{step}</MathText>
                  </div>
                </motion.li>
              ))}
            </ol>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.35,
                delay: 0.1 + current.solution.steps.length * 0.06,
                ease: 'easeOut',
              }}
              className="mt-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl px-3 py-2.5"
            >
              <div className="text-[10px] font-black tracking-widest text-emerald-300 mb-1 uppercase flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3" />
                <span>תשובה סופית</span>
              </div>
              <div className="text-sm font-bold text-emerald-50 chat-md">
                <MathText inline>{current.solution.finalAnswer}</MathText>
              </div>
            </motion.div>
            {current.solution.explanation && (
              <div className="mt-3 text-xs text-slate-400 chat-md leading-relaxed">
                <MathText>{current.solution.explanation}</MathText>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next */}
      {solutionShown && (
        <motion.button
          {...buttonTap}
          onClick={next}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-3 rounded-2xl font-bold text-white shadow-lg shadow-emerald-500/30 transition-colors"
        >
          <span>{isLast ? '✓ סיים תרגול' : 'השאלה הבאה'}</span>
          {!isLast && <ArrowLeft className="w-4 h-4" />}
        </motion.button>
      )}
    </div>
  );
}
