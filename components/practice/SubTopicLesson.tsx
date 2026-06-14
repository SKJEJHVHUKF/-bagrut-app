'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Trophy,
} from 'lucide-react';
import { MathText } from './MathText';
import { FormulaCard } from './FormulaCard';
import { WorkedExampleCard } from './WorkedExampleCard';
import { DiagramRenderer } from './DiagramRenderer';
import { buttonTap } from '@/lib/animations';
import type { SubTopic } from '@/content/lessons/types';

export type NextSubTopicRef = { id: string; title: string } | null;

/**
 * SubTopicLesson — the GUIDED, step-by-step mini-lesson for a sub-topic.
 *
 * Instead of a wall-of-summary, it teaches ONE step at a time: each step has
 * a short explanation, an optional formula, and an optional fully-worked
 * example the student can try before revealing. Steps cascade in as the
 * student clicks "next step", so understanding builds gradually. When the
 * lesson is done, a recap (key points + formulas) and a clear CTA to the
 * focused drills appear — keeping the "teach → example → practice → next"
 * flow comfortable and professional.
 */
export function SubTopicLesson({
  subject,
  topic,
  subTopic,
  nextSubTopic = null,
}: {
  subject: string;
  topic: string;
  subTopic: SubTopic;
  nextSubTopic?: NextSubTopicRef;
}) {
  const steps = subTopic.lesson ?? [];
  const total = steps.length;
  const [revealed, setRevealed] = useState(1);
  const done = revealed >= total;

  const backHref = `/practice/${subject}/${encodeURIComponent(topic)}`;
  const practiceHref = `/practice/${subject}/${encodeURIComponent(topic)}/sub/${subTopic.id}/practice`;
  const nextHref = nextSubTopic
    ? `/practice/${subject}/${encodeURIComponent(topic)}/sub/${nextSubTopic.id}`
    : null;

  const progress = Math.round((Math.min(revealed, total) / total) * 100);

  return (
    <article className="space-y-5">
      {/* Breadcrumb */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
      >
        → חזרה ל{topic}
      </Link>

      {/* Header + progress */}
      <header className="space-y-3">
        <div className="text-xs font-black tracking-widest text-emerald-300 uppercase flex items-center gap-2">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>לימוד מודרך · {topic}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black leading-tight flex items-baseline gap-2">
          {subTopic.emoji && <span className="text-3xl sm:text-4xl">{subTopic.emoji}</span>}
          <span className="font-display text-slate-100">{subTopic.title}</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{subTopic.tagline}</p>

        <div className="surface-premium rounded-2xl p-3">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-xs font-bold text-emerald-100">
              {done ? '🎓 סיימת את הלימוד' : `שלב ${Math.min(revealed, total)} מתוך ${total}`}
            </div>
            <div className="text-xs text-emerald-300/80 font-mono">{progress}%</div>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full bg-gradient-to-l from-emerald-500 to-teal-500"
            />
          </div>
        </div>
      </header>

      {/* Steps — cascade in one at a time */}
      <div className="space-y-4">
        {steps.slice(0, revealed).map((step, i) => (
          <motion.section
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="surface-premium rounded-2xl p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-emerald-500/25 border border-emerald-400/50 flex items-center justify-center text-sm font-black text-emerald-100">
                {i + 1}
              </div>
              <h2 className="font-display text-base sm:text-lg font-bold text-white chat-md">
                <MathText inline>{step.title}</MathText>
              </h2>
            </div>

            <div className="chat-md text-sm sm:text-base text-slate-200 leading-relaxed">
              <MathText>{step.teach}</MathText>
            </div>

            {step.formula && <FormulaCard formula={step.formula} />}

            {step.example && <WorkedExampleCard example={step.example} index={i} />}

            {step.diagrams && step.diagrams.length > 0 && (
              <DiagramRenderer diagrams={step.diagrams} />
            )}
          </motion.section>
        ))}
      </div>

      {/* Next-step button OR completion */}
      {!done ? (
        <motion.button
          {...buttonTap}
          onClick={() => setRevealed((n) => Math.min(n + 1, total))}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-3.5 rounded-2xl font-bold text-white shadow-lg shadow-emerald-500/30 transition-colors"
        >
          <span>הבנתי — לצעד הבא ({revealed + 1}/{total})</span>
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
      ) : (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="space-y-4"
        >
          <div className="bg-gradient-to-br from-emerald-600/15 to-teal-600/15 border border-emerald-500/40 rounded-2xl p-5 text-center space-y-2">
            <Trophy className="w-9 h-9 mx-auto text-amber-300" />
            <h2 className="font-display text-xl font-black text-white">סיימת את הלימוד! 🎉</h2>
            <p className="text-sm text-slate-300">עברת על {total} השלבים. עכשיו נקבע את זה בתרגול.</p>
          </div>

          {/* Recap — key points */}
          {subTopic.keyPoints.length > 0 && (
            <div>
              <div className="text-xs font-black tracking-widest text-emerald-300 mb-2 uppercase flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>לסיכום — מה לזכור</span>
              </div>
              <ul className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl px-4 py-3 space-y-2">
                {subTopic.keyPoints.map((k, i) => (
                  <li key={i} className="flex gap-2 text-sm text-emerald-50/95 leading-relaxed">
                    <span className="text-emerald-300 flex-shrink-0 mt-0.5">✓</span>
                    <div className="chat-md flex-1">
                      <MathText>{k}</MathText>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recap — formulas */}
          {subTopic.formulas.length > 0 && (
            <div>
              <div className="text-xs font-black tracking-widest text-indigo-300 mb-2 uppercase">
                נוסחאות לתת-נושא הזה
              </div>
              <div className="grid grid-cols-1 gap-3">
                {subTopic.formulas.map((f, i) => (
                  <FormulaCard key={i} formula={f} />
                ))}
              </div>
            </div>
          )}

          {/* Primary CTA — practice */}
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
            <Link
              href={practiceHref}
              className="group inline-flex items-center justify-center gap-3 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-4 rounded-2xl font-bold text-white shadow-xl shadow-emerald-500/30 transition-colors w-full"
            >
              <Sparkles className="w-5 h-5" />
              <div className="text-right">
                <div className="text-sm">עכשיו בוא נתרגל</div>
                <div className="text-[10px] font-normal opacity-80">
                  {subTopic.questions.length} תרגילים ממוקדים על {subTopic.title}
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Secondary — skip straight to the next sub-topic */}
          {nextHref && nextSubTopic && (
            <Link
              href={nextHref}
              className="group flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-emerald-200 transition-colors"
            >
              <span>או דלג לתת-הנושא הבא: {nextSubTopic.title}</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-1 transition-transform" />
            </Link>
          )}
        </motion.section>
      )}
    </article>
  );
}
