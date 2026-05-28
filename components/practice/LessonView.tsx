'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Target, AlertTriangle, Lightbulb, ArrowLeft, CheckCircle, Award, GraduationCap } from 'lucide-react';
import type { Lesson } from '@/content/lessons/types';
import { MathText } from './MathText';
import { FormulaCard } from './FormulaCard';
import { WorkedExampleCard } from './WorkedExampleCard';
import { BagrutBadge } from './BagrutBadge';
import { DiagramRenderer } from './DiagramRenderer';
import { markLessonViewed } from '@/lib/progress';
import { poolHas } from '@/lib/pool-availability';
import { hasBagrutBank } from '@/content/lessons';
import { markStep } from '@/lib/study-plan';
import { TopicJourney } from './TopicJourney';
import { fadeUp, staggerContainer, inViewProps, buttonTap } from '@/lib/animations';

export function LessonView({ lesson }: { lesson: Lesson }) {
  // Mark as "viewed" once the student reaches the lesson page. The exercise
  // route bumps a separate counter when they finish a question.
  // Also mark the 'understand' step in the personalized study plan so the
  // TopicJourney header can advance to stage 2.
  useEffect(() => {
    markLessonViewed(lesson.subject, lesson.topic);
    markStep(lesson.subject, lesson.topic, 'understand');
  }, [lesson.subject, lesson.topic]);

  return (
    <article className="space-y-6">
      {/* 3-step journey header — only renders if the student has a plan */}
      <TopicJourney subject={lesson.subject} topic={lesson.topic} />

      {/* Title + intro */}
      <motion.header
        id="lesson-content"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-3 scroll-mt-20"
      >
        <motion.div
          variants={fadeUp}
          className="text-xs font-black tracking-widest text-purple-300 uppercase flex items-center gap-2"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>סיכום לימודי</span>
        </motion.div>
        <motion.h1 variants={fadeUp} className="text-2xl sm:text-3xl font-black leading-tight">
          <span className="bg-gradient-to-l from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            {lesson.title}
          </span>
        </motion.h1>

        <motion.div variants={fadeUp}>
          <BagrutBadge topic={lesson.topic} variant="banner" />
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="chat-md text-sm sm:text-base text-slate-300 leading-relaxed"
        >
          <MathText>{lesson.intro}</MathText>
        </motion.div>
      </motion.header>

      {/* Concepts */}
      <motion.section {...inViewProps} variants={staggerContainer}>
        <motion.div
          variants={fadeUp}
          className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase flex items-center gap-2"
        >
          <Target className="w-3.5 h-3.5" />
          <span>מושגים מרכזיים</span>
        </motion.div>
        <motion.div variants={staggerContainer} className="space-y-2">
          {lesson.concepts.map((c, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ x: -2 }}
              transition={{ duration: 0.2 }}
              className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3"
            >
              <div className="text-sm font-black text-purple-200 mb-1.5 chat-md">
                <MathText inline>{c.title}</MathText>
              </div>
              <div className="chat-md text-sm text-slate-200 leading-relaxed">
                <MathText>{c.body}</MathText>
              </div>
              {c.diagrams && c.diagrams.length > 0 && (
                <DiagramRenderer diagrams={c.diagrams} />
              )}
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Formulas */}
      {lesson.formulas.length > 0 && (
        <motion.section {...inViewProps} variants={staggerContainer}>
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase"
          >
            נוסחאות
          </motion.div>
          <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-3">
            {lesson.formulas.map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <FormulaCard formula={f} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* Worked examples */}
      <motion.section {...inViewProps} variants={staggerContainer}>
        <motion.div
          variants={fadeUp}
          className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>דוגמאות פתורות</span>
        </motion.div>
        <motion.p variants={fadeUp} className="text-xs text-slate-400 mb-3">
          נסה לפתור בעצמך לפני שאתה לוחץ — אחר כך חשוף את הצעדים אחד-אחד.
        </motion.p>
        <motion.div variants={staggerContainer} className="space-y-2">
          {lesson.examples.map((ex, i) => (
            <motion.div key={i} variants={fadeUp}>
              <WorkedExampleCard example={ex} index={i} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Pitfalls */}
      {lesson.pitfalls.length > 0 && (
        <motion.section {...inViewProps} variants={staggerContainer}>
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-amber-300 mb-3 uppercase flex items-center gap-2"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>טעויות נפוצות</span>
          </motion.div>
          <motion.div variants={staggerContainer} className="space-y-2">
            {lesson.pitfalls.map((p, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ x: -2 }}
                transition={{ duration: 0.2 }}
                className="bg-amber-500/5 border border-amber-500/30 rounded-2xl px-4 py-3 flex gap-3"
              >
                <Lightbulb className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <div className="chat-md text-sm text-amber-50/95 leading-relaxed">
                  <MathText>{p}</MathText>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* Summary — quick "must remember" cheatsheet right before the CTA. */}
      {lesson.summary && lesson.summary.length > 0 && (
        <motion.section {...inViewProps} variants={staggerContainer}>
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-emerald-300 mb-3 uppercase flex items-center gap-2"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>סיכום — מה לזכור</span>
          </motion.div>
          <motion.ul
            variants={staggerContainer}
            className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl px-4 py-3 space-y-2"
          >
            {lesson.summary.map((s, i) => (
              <motion.li
                key={i}
                variants={fadeUp}
                className="flex gap-2 text-sm text-emerald-50/95 leading-relaxed"
              >
                <span className="text-emerald-300 flex-shrink-0 mt-0.5">✓</span>
                <div className="chat-md flex-1">
                  <MathText>{s}</MathText>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      )}

      {/* Exam tips — strategy hints. */}
      {lesson.examTips && lesson.examTips.length > 0 && (
        <motion.section {...inViewProps} variants={staggerContainer}>
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase flex items-center gap-2"
          >
            <Award className="w-3.5 h-3.5" />
            <span>טיפים לבחינה</span>
          </motion.div>
          <motion.ul
            variants={staggerContainer}
            className="bg-purple-500/5 border border-purple-500/30 rounded-2xl px-4 py-3 space-y-2"
          >
            {lesson.examTips.map((t, i) => (
              <motion.li
                key={i}
                variants={fadeUp}
                className="flex gap-2 text-sm text-purple-50/95 leading-relaxed"
              >
                <span className="text-purple-300 flex-shrink-0 mt-0.5">★</span>
                <div className="chat-md flex-1">
                  <MathText>{t}</MathText>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      )}

      {/* Sub-topics — pedagogical learning path before tackling main bagrut. */}
      {lesson.subTopics && lesson.subTopics.length > 0 && (
        <motion.section {...inViewProps} variants={staggerContainer} className="pt-2">
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-emerald-300 mb-3 uppercase flex items-center gap-2"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>מסלול לימוד · תרגול לפי תת-נושאים</span>
          </motion.div>
          <motion.p variants={fadeUp} className="text-xs text-slate-400 mb-3">
            תרגל כל תת-נושא בנפרד — סיכום קצר, נוסחאות, ותרגול ייעודי — לפני שאתה ניגש לבגרות המלאה.
          </motion.p>
          <motion.div variants={staggerContainer} className="space-y-2">
            {lesson.subTopics.map((sub, i) => (
              <motion.div
                key={sub.id}
                variants={fadeUp}
                whileHover={{ y: -3, x: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={`/practice/${lesson.subject}/${encodeURIComponent(lesson.topic)}/sub/${sub.id}`}
                  className="card-3d block bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-4 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-200 shadow-sm">
                      {sub.emoji ?? i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm sm:text-base text-white mb-0.5">
                        {sub.title}
                      </div>
                      <div className="text-xs text-slate-400 leading-snug">{sub.tagline}</div>
                      <div className="text-[10px] text-emerald-300/80 mt-1.5">
                        {sub.questions.length} תרגילים ייעודיים
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-1.5" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* CTA — start practice. */}
      <motion.section {...inViewProps} variants={staggerContainer} className="pt-2">
        <motion.div
          variants={fadeUp}
          className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase"
        >
          {lesson.subTopics && lesson.subTopics.length > 0 ? 'או — תרגול כללי בנושא' : 'מוכן/ה לתרגל?'}
        </motion.div>
        <motion.div
          variants={staggerContainer}
          className={`grid grid-cols-1 ${(hasBagrutBank(lesson.subject, lesson.topic) || poolHas(lesson.subject, lesson.topic, 'bagrut')) ? 'sm:grid-cols-2' : ''} gap-3`}
        >
          {(hasBagrutBank(lesson.subject, lesson.topic) || poolHas(lesson.subject, lesson.topic, 'bagrut')) && (
            <motion.div variants={fadeUp} whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
              <Link
                href={`/practice/${lesson.subject}/${encodeURIComponent(lesson.topic)}/exercise?mode=bagrut`}
                className="group inline-flex items-center justify-center gap-3 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-4 rounded-2xl font-bold text-white shadow-xl shadow-purple-500/40 transition-colors w-full"
              >
                <Target className="w-5 h-5" />
                <div className="text-right">
                  <div className="text-sm">בגרות מלאה</div>
                  <div className="text-[10px] font-normal opacity-80">שאלה עם סעיפים, רמזים ופתרון</div>
                </div>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
          <motion.div variants={fadeUp} whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
            <Link
              href={`/practice/${lesson.subject}/${encodeURIComponent(lesson.topic)}/exercise?mode=quick`}
              className="group inline-flex items-center justify-center gap-3 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-4 rounded-2xl font-bold text-white shadow-xl shadow-purple-500/40 transition-colors w-full"
            >
              <Sparkles className="w-5 h-5" />
              <div className="text-right">
                <div className="text-sm">תרגול מהיר</div>
                <div className="text-[10px] font-normal opacity-80">תרגיל אחד עם רמזים ופתרון מלא</div>
              </div>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>
    </article>
  );
}
