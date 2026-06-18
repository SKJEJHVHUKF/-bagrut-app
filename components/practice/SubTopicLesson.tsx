'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowLeft, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { MathText } from './MathText';
import { FormulaCard } from './FormulaCard';
import { WorkedExampleCard } from './WorkedExampleCard';
import { DiagramRenderer } from './DiagramRenderer';
import type { SubTopic } from '@/content/lessons/types';

export type NextSubTopicRef = { id: string; title: string } | null;

/**
 * SubTopicLesson — the guided mini-lesson for a sub-topic.
 *
 * All steps are laid out in a clean, well-spaced scroll — NO click-to-reveal
 * gating (that felt clunky). Each step is a short, precise explanation + an
 * optional formula + an optional worked example (collapsed by default so the
 * page stays airy; expanding shows the FULL solution at once, like the bagrut
 * archive). The recap + practice CTA sit at the end:
 * "teach → example → … → recap → practice → next".
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
  const backHref = `/practice/${subject}/${encodeURIComponent(topic)}`;
  const practiceHref = `/practice/${subject}/${encodeURIComponent(topic)}/sub/${subTopic.id}/practice`;
  const nextHref = nextSubTopic
    ? `/practice/${subject}/${encodeURIComponent(topic)}/sub/${nextSubTopic.id}`
    : null;

  return (
    <article className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
      >
        → חזרה ל{topic}
      </Link>

      {/* Header */}
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
        <div className="text-[11px] text-slate-500">
          {steps.length} שלבים · קרא ברוגע, פתח דוגמה כשבא לך, ואז צא לתרגול.
        </div>
      </header>

      {/* Steps — all laid out, generously spaced (not dense) */}
      <div className="space-y-5">
        {steps.map((step, i) => (
          <motion.section
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="surface-premium rounded-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-emerald-500/25 border border-emerald-400/50 flex items-center justify-center text-sm font-black text-emerald-100">
                {i + 1}
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white chat-md">
                <MathText inline>{step.title}</MathText>
              </h2>
            </div>

            <div className="chat-md text-sm sm:text-base text-slate-200">
              <MathText>{step.teach}</MathText>
            </div>

            {(step.formula || step.example || (step.diagrams && step.diagrams.length > 0)) && (
              <div className="space-y-3 pt-1">
                {step.formula && <FormulaCard formula={step.formula} />}
                {step.example && <WorkedExampleCard example={step.example} index={i} />}
                {step.diagrams && step.diagrams.length > 0 && (
                  <DiagramRenderer diagrams={step.diagrams} />
                )}
              </div>
            )}
          </motion.section>
        ))}
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
              {subTopic.questions.length} תרגילים ממוקדים — ובסוף שאלת בגרות על הנושא
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
    </article>
  );
}
