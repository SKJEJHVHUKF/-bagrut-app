'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ArrowLeft, Target, CheckCircle, Sparkles } from 'lucide-react';
import { MathText } from './MathText';
import { FormulaCard } from './FormulaCard';
import { fadeUp, staggerContainer, inViewProps } from '@/lib/animations';
import type { SubTopic } from '@/content/lessons/types';

type Props = {
  subject: string;
  topic: string;
  subTopic: SubTopic;
};

/**
 * SubTopicLanding — the focused mini-lesson page for a sub-topic.
 * Shows a tight summary, the formulas relevant to THIS sub-topic only,
 * key points, and a CTA to start the focused practice.
 */
export function SubTopicLanding({ subject, topic, subTopic }: Props) {
  const practiceHref = `/practice/${subject}/${encodeURIComponent(topic)}/sub/${subTopic.id}/practice`;
  const backHref = `/practice/${subject}/${encodeURIComponent(topic)}`;

  return (
    <article className="space-y-6">
      {/* Breadcrumb back */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
      >
        → חזרה ל{topic}
      </Link>

      {/* Header */}
      <motion.header
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-3"
      >
        <motion.div
          variants={fadeUp}
          className="text-xs font-black tracking-widest text-emerald-300 uppercase flex items-center gap-2"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>תת-נושא · {topic}</span>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="text-2xl sm:text-3xl font-black leading-tight flex items-baseline gap-2"
        >
          {subTopic.emoji && <span className="text-3xl sm:text-4xl">{subTopic.emoji}</span>}
          <span className="bg-gradient-to-l from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent">
            {subTopic.title}
          </span>
        </motion.h1>
        <motion.p variants={fadeUp} className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {subTopic.tagline}
        </motion.p>
      </motion.header>

      {/* Summary */}
      <motion.section {...inViewProps} variants={staggerContainer}>
        <motion.div
          variants={fadeUp}
          className="text-xs font-black tracking-widest text-emerald-300 mb-3 uppercase flex items-center gap-2"
        >
          <Target className="w-3.5 h-3.5" />
          <span>סיכום ממוקד</span>
        </motion.div>
        <motion.div
          variants={fadeUp}
          className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 chat-md text-sm sm:text-base text-slate-200 leading-relaxed"
        >
          <MathText>{subTopic.summary}</MathText>
        </motion.div>
      </motion.section>

      {/* Key points */}
      {subTopic.keyPoints.length > 0 && (
        <motion.section {...inViewProps} variants={staggerContainer}>
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-emerald-300 mb-3 uppercase flex items-center gap-2"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>נקודות מפתח לזכירה</span>
          </motion.div>
          <motion.ul
            variants={staggerContainer}
            className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl px-4 py-3 space-y-2"
          >
            {subTopic.keyPoints.map((k, i) => (
              <motion.li
                key={i}
                variants={fadeUp}
                className="flex gap-2 text-sm text-emerald-50/95 leading-relaxed"
              >
                <span className="text-emerald-300 flex-shrink-0 mt-0.5">✓</span>
                <div className="chat-md flex-1">
                  <MathText>{k}</MathText>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      )}

      {/* Formulas */}
      {subTopic.formulas.length > 0 && (
        <motion.section {...inViewProps} variants={staggerContainer}>
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase"
          >
            נוסחאות לתת-נושא הזה
          </motion.div>
          <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-3">
            {subTopic.formulas.map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <FormulaCard formula={f} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* CTA */}
      <motion.section {...inViewProps} variants={staggerContainer} className="pt-2">
        <motion.div
          variants={fadeUp}
          className="text-xs font-black tracking-widest text-emerald-300 mb-3 uppercase"
        >
          מוכן/ה לתרגל?
        </motion.div>
        <motion.div variants={fadeUp} whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Link
            href={practiceHref}
            className="group inline-flex items-center justify-center gap-3 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-4 rounded-2xl font-bold text-white shadow-xl shadow-emerald-500/30 transition-colors w-full"
          >
            <Sparkles className="w-5 h-5" />
            <div className="text-right">
              <div className="text-sm">תרגול ייעודי</div>
              <div className="text-[10px] font-normal opacity-80">
                {subTopic.questions.length} תרגילים ממוקדים על {subTopic.title}
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </motion.section>
    </article>
  );
}
