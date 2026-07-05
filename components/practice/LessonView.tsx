'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Target, AlertTriangle, Lightbulb, ArrowLeft, CheckCircle, Award, GraduationCap, PlayCircle, Lock as LockIcon, MessageCircle } from 'lucide-react';
import type { Lesson } from '@/content/lessons/types';
import { MathText } from './MathText';
import { FormulaCard } from './FormulaCard';
import { WorkedExampleCard } from './WorkedExampleCard';
import { BagrutBadge } from './BagrutBadge';
import { DiagramRenderer } from './DiagramRenderer';
import { markLessonViewed, getCompletedSubTopics } from '@/lib/progress';
import { poolHas } from '@/lib/pool-availability';
import { hasBagrutBank } from '@/content/lessons';
import { hasLearningPath } from '@/content/learning-paths';
import { CourseTracks } from '@/components/learn/CourseTracks';
import { markStep, getTopicLevel, type ProficiencyLevel } from '@/lib/study-plan';
import { TopicJourney } from './TopicJourney';
import { fadeUp, staggerContainer, inViewProps, buttonTap } from '@/lib/animations';

export function LessonView({ lesson }: { lesson: Lesson }) {
  // Track sub-topic completion to render checkmarks + progress bar.
  // Re-read on mount and after returning from the practice page (handled
  // implicitly because Next.js re-mounts when the route changes back).
  const [completedSubs, setCompletedSubs] = useState<Set<string>>(new Set());
  // Self-assessed level for this topic (study plan) — light-touch guidance
  // banner only, never a forced flow.
  const [planLevel, setPlanLevel] = useState<ProficiencyLevel | null>(null);

  useEffect(() => {
    markLessonViewed(lesson.subject, lesson.topic);
    markStep(lesson.subject, lesson.topic, 'understand');
    setCompletedSubs(getCompletedSubTopics(lesson.subject, lesson.topic));
    setPlanLevel(getTopicLevel(lesson.subject, lesson.topic));
  }, [lesson.subject, lesson.topic]);

  return (
    // flex + `order-*` lets us put the sub-topic MODULES first (the primary
    // learn+practice path) and the reference material below, without moving
    // the big JSX blocks. The full-topic bagrut sits last as a capstone.
    <article className="flex flex-col gap-6">
      {/* 3-step journey header — only renders if the student has a plan */}
      <TopicJourney subject={lesson.subject} topic={lesson.topic} />

      {/* Level-aware guidance banner */}
      {planLevel === 'weak' && (
        <div className="bg-indigo-500/[0.06] border border-indigo-500/25 rounded-2xl px-4 py-3 text-sm text-indigo-900 flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <span>
            סימנת שהנושא הזה מרגיש לך חלש — מומלץ להתחיל מ<b>מודול 1</b> ולעבור
            שלב-אחר-שלב. התרגול יתאים את עצמו לרמה שלך.
          </span>
        </div>
      )}
      {planLevel === 'strong' && (
        <div className="bg-emerald-500/[0.06] border border-emerald-500/25 rounded-2xl px-4 py-3 text-sm text-emerald-900 flex items-start gap-2.5">
          <Target className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>
            אתה חזק בנושא הזה — אפשר לרפרף על הסיכום ולקפוץ ישר ל<b>שאלות הבגרות</b>
            {' '}בתחתית העמוד. התרגול יגיש לך שאלות ברמה מתקדמת.
          </span>
        </div>
      )}

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
          className="text-xs font-black tracking-widest text-indigo-700 uppercase flex items-center gap-2"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>מסלול הלמידה בנושא</span>
        </motion.div>
        <motion.h1 variants={fadeUp} className="text-2xl sm:text-3xl font-black leading-tight">
          <span className="font-display text-slate-800">
            {lesson.title}
          </span>
        </motion.h1>

        <motion.div variants={fadeUp}>
          <BagrutBadge topic={lesson.topic} variant="banner" />
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="chat-md text-sm sm:text-base text-slate-700 leading-relaxed"
        >
          <MathText>{lesson.intro}</MathText>
        </motion.div>

        {/* "How this page works" — a fixed map so the student always knows
            where they are and what each block is. */}
        {lesson.subTopics && lesson.subTopics.length > 0 && (
          <motion.div
            variants={fadeUp}
            className="surface-premium rounded-2xl px-4 py-3"
          >
            <div className="text-[11px] font-black tracking-widest text-slate-500 uppercase mb-2">
              איך לומדים בעמוד הזה
            </div>
            <ol className="space-y-1.5 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 text-[11px] font-black flex items-center justify-center">1</span>
                <span><b>המסלול המודרך</b> — לומדים שלב אחר שלב: כל שלב מלמד תת-נושא אחד, עם תרגול ושאלת בגרות בסופו.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-md bg-indigo-500/15 border border-indigo-500/40 text-indigo-800 text-[11px] font-black flex items-center justify-center">2</span>
                <span><b>חומר עזר</b> — סיכום, נוסחאות ודוגמאות פתורות. לחזרה מהירה, לא חובה לפני התרגול.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-800 text-[11px] font-black flex items-center justify-center">3</span>
                <span><b>מבחן סיום</b> — שאלת בגרות מלאה ומשולבת, אחרי שסיימת את כל השלבים.</span>
              </li>
            </ol>
          </motion.div>
        )}
      </motion.header>

      {/* Grounded private-tutor entry — opens the chat focused on THIS topic.
          For complex numbers the tutor teaches from the verified content and
          follows the private-tutor bar (diagnoses, hints, never just answers). */}
      <Link
        href={`/chat?topic=${encodeURIComponent(lesson.topic)}`}
        className="group flex items-center gap-3 surface-premium rounded-2xl px-4 py-3 hover:border-indigo-500/50 transition-colors"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-indigo-800" />
        </div>
        <div className="flex-1 text-right">
          <div className="text-sm font-bold text-slate-900">שאל את המורה הפרטי על הנושא</div>
          <div className="text-[11px] text-slate-600">
            מורה מעוגן בחומר — מסביר, מכוון, ולא נותן תשובות מוכנות
          </div>
        </div>
        <ArrowLeft className="w-4 h-4 text-indigo-700 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
      </Link>

      {/* Reference-zone divider — everything below (until the capstone) is
          review material, clearly labeled so it never competes with the
          guided step-by-step path above it. */}
      <motion.div {...inViewProps} variants={staggerContainer} className="order-2 pt-4">
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/40 text-indigo-800 text-xs font-black flex items-center justify-center">2</span>
          <div>
            <div className="text-sm font-black text-slate-900">חומר עזר — סיכום מרוכז לחזרה</div>
            <div className="text-[11px] text-slate-600">מושגים, נוסחאות, דוגמאות וטעויות נפוצות. חוזרים לכאן בכל שלב שצריך.</div>
          </div>
          <div className="flex-1 h-px bg-slate-900/10" />
        </motion.div>
      </motion.div>

      {/* Concepts */}
      <motion.section {...inViewProps} variants={staggerContainer} className="order-2">
        <motion.div
          variants={fadeUp}
          className="text-xs font-black tracking-widest text-indigo-700 mb-3 uppercase flex items-center gap-2"
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
              className="surface-premium rounded-2xl px-4 py-3"
            >
              <div className="text-sm font-black text-indigo-800 mb-1.5 chat-md">
                <MathText inline>{c.title}</MathText>
              </div>
              <div className="chat-md text-sm text-slate-800 leading-relaxed">
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
        <motion.section {...inViewProps} variants={staggerContainer} className="order-2">
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-indigo-700 mb-3 uppercase"
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
      <motion.section {...inViewProps} variants={staggerContainer} className="order-2">
        <motion.div
          variants={fadeUp}
          className="text-xs font-black tracking-widest text-indigo-700 mb-3 uppercase flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>דוגמאות פתורות</span>
        </motion.div>
        <motion.p variants={fadeUp} className="text-xs text-slate-600 mb-3">
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
        <motion.section {...inViewProps} variants={staggerContainer} className="order-2">
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-amber-700 mb-3 uppercase flex items-center gap-2"
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
                <Lightbulb className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="chat-md text-sm text-amber-900 leading-relaxed">
                  <MathText>{p}</MathText>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* Summary — quick "must remember" cheatsheet right before the CTA. */}
      {lesson.summary && lesson.summary.length > 0 && (
        <motion.section {...inViewProps} variants={staggerContainer} className="order-2">
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-emerald-700 mb-3 uppercase flex items-center gap-2"
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
                className="flex gap-2 text-sm text-emerald-900 leading-relaxed"
              >
                <span className="text-emerald-700 flex-shrink-0 mt-0.5">✓</span>
                <div className="chat-md flex-1">
                  <MathText>{s}</MathText>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      )}

      {/* Course tracks — base (learn-from-0) + advanced (bagrut level).
          Extension courses, placed at the end of the reference zone with an
          explicit label so they don't compete with the guided path. */}
      {hasLearningPath(lesson.subject, lesson.topic) && (
        <motion.section {...inViewProps} variants={staggerContainer} className="order-2">
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-indigo-700 mb-3 uppercase"
          >
            🚀 קורסים ייעודיים לנושא — למי שרוצה להעמיק
          </motion.div>
          <motion.div variants={fadeUp}>
            <CourseTracks subject={lesson.subject} topic={lesson.topic} />
          </motion.div>
        </motion.section>
      )}

      {/* Exam tips — strategy hints. */}
      {lesson.examTips && lesson.examTips.length > 0 && (
        <motion.section {...inViewProps} variants={staggerContainer} className="order-2">
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-indigo-700 mb-3 uppercase flex items-center gap-2"
          >
            <Award className="w-3.5 h-3.5" />
            <span>טיפים לבחינה</span>
          </motion.div>
          <motion.ul
            variants={staggerContainer}
            className="bg-indigo-500/5 border border-indigo-500/30 rounded-2xl px-4 py-3 space-y-2"
          >
            {lesson.examTips.map((t, i) => (
              <motion.li
                key={i}
                variants={fadeUp}
                className="flex gap-2 text-sm text-indigo-900 leading-relaxed"
              >
                <span className="text-indigo-700 flex-shrink-0 mt-0.5">★</span>
                <div className="chat-md flex-1">
                  <MathText>{t}</MathText>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      )}

      {/* Sub-topics — course-style pedagogical learning path.
          Shows progress bar, numbered modules, checkmarks for completed,
          and highlights the next recommended module. */}
      {lesson.subTopics && lesson.subTopics.length > 0 && (() => {
        const subs = lesson.subTopics;
        const doneCount = subs.filter((s) => completedSubs.has(s.id)).length;
        const percent = Math.round((doneCount / subs.length) * 100);
        const nextIdx = subs.findIndex((s) => !completedSubs.has(s.id));
        const allDone = doneCount === subs.length;

        return (
          <motion.section {...inViewProps} variants={staggerContainer} className="order-1 pt-2">
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 text-xs font-black flex items-center justify-center">1</span>
              <div>
                <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span>המסלול המודרך — התחל כאן</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  {subs.length} שלבים בסדר הנכון · כל שלב: שיעור קצר ← תרגול ← שאלת בגרות
                </div>
              </div>
              <div className="flex-1 h-px bg-slate-900/10" />
            </motion.div>

            {/* Progress strip */}
            <motion.div
              variants={fadeUp}
              className="surface-premium rounded-2xl p-3 mb-3"
            >
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-sm font-bold text-emerald-800">
                  {allDone ? '🎓 סיימת את כל המודולים!' : `${doneCount}/${subs.length} מודולים הושלמו`}
                </div>
                <div className="text-xs text-emerald-800 font-mono">{percent}%</div>
              </div>
              <div className="h-1.5 bg-slate-900/[0.03] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-l from-emerald-500 to-teal-500"
                />
              </div>
              {!allDone && (
                <p className="text-[11px] text-slate-600 mt-2 leading-snug">
                  עבור כל מודול בסדר — סיכום, נוסחאות, ותרגול ייעודי. אחרי שהמסלול מלא, נסה את הבגרות המלאה.
                </p>
              )}
              {allDone && (
                <p className="text-[11px] text-emerald-800 mt-2 leading-snug">
                  כל הכבוד! עכשיו אתה מוכן לבגרות המלאה. גלול למטה ל-CTA. 🎯
                </p>
              )}
            </motion.div>

            <motion.div variants={staggerContainer} className="space-y-2">
              {subs.map((sub, i) => {
                const isDone = completedSubs.has(sub.id);
                const isNext = i === nextIdx;
                return (
                  <motion.div
                    key={sub.id}
                    variants={fadeUp}
                    whileHover={{ y: -3, x: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={`/practice/${lesson.subject}/${encodeURIComponent(lesson.topic)}/sub/${sub.id}`}
                      className={`card-3d block rounded-2xl p-4 transition-colors border ${
                        isDone
                          ? 'bg-gradient-to-br from-emerald-700/15 to-teal-700/10 border-emerald-500/50 hover:border-emerald-400'
                          : isNext
                            ? 'bg-gradient-to-br from-amber-600/15 to-orange-600/10 border-amber-500/50 hover:border-amber-400 shadow-lg shadow-amber-500/10'
                            : 'bg-gradient-to-br from-emerald-600/8 to-teal-600/5 border-emerald-500/20 hover:border-emerald-500/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Numbered or status badge */}
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-sm border ${
                            isDone
                              ? 'bg-emerald-500/30 border-emerald-400/60 text-emerald-800'
                              : isNext
                                ? 'bg-amber-500/25 border-amber-400/60 text-amber-800'
                                : 'bg-slate-900/[0.03] border-slate-900/[0.12] text-slate-700'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="text-[10px] leading-tight text-center">
                              שלב
                              <br />
                              <span className="text-sm">{i + 1}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="font-bold text-sm sm:text-base text-slate-900">
                              {sub.emoji && <span className="ml-1">{sub.emoji}</span>}
                              {sub.title}
                            </span>
                            {isNext && (
                              <span className="text-[10px] font-black tracking-wide bg-amber-500/25 border border-amber-400/50 text-amber-800 px-1.5 py-0.5 rounded-full">
                                ▶ הבא בתור
                              </span>
                            )}
                            {isDone && (
                              <span className="text-[10px] font-black tracking-wide bg-emerald-500/25 border border-emerald-400/50 text-emerald-800 px-1.5 py-0.5 rounded-full">
                                ✓ הושלם
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 leading-snug">{sub.tagline}</div>
                          <div className="text-[10px] text-emerald-800 mt-1.5 flex items-center gap-1.5 flex-wrap">
                            <span>{sub.lesson && sub.lesson.length > 0 ? '📖 שיעור מודרך' : '📖 סיכום'}</span>
                            <span>←</span>
                            <span>✏️ {sub.questions.length} תרגילים</span>
                            <span>←</span>
                            <span>🎯 שאלת בגרות</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 mt-1.5">
                          {isDone ? (
                            <PlayCircle className="w-4 h-4 text-emerald-800" />
                          ) : (
                            <ArrowLeft className="w-4 h-4 text-emerald-700" />
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>
        );
      })()}

      {/* Capstone — full mixed bagrut, positioned LAST (after the modules). */}
      <motion.section {...inViewProps} variants={staggerContainer} className="order-3 pt-2">
        {lesson.subTopics && lesson.subTopics.length > 0 ? (
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-800 text-xs font-black flex items-center justify-center">3</span>
            <div>
              <div className="text-sm font-black text-slate-900">🏁 מבחן סיום — בגרות מלאה ומשולבת</div>
              <div className="text-[11px] text-slate-600">אחרי שסיימת את כל השלבים — שאלה ברמת בחינה אמיתית שמשלבת את כל הנושא.</div>
            </div>
            <div className="flex-1 h-px bg-slate-900/10" />
          </motion.div>
        ) : (
          <motion.div
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-indigo-700 mb-3 uppercase"
          >
            מוכן לתרגל?
          </motion.div>
        )}
        <motion.div
          variants={staggerContainer}
          className={`grid grid-cols-1 ${(hasBagrutBank(lesson.subject, lesson.topic) || poolHas(lesson.subject, lesson.topic, 'bagrut')) ? 'sm:grid-cols-2' : ''} gap-3`}
        >
          {(hasBagrutBank(lesson.subject, lesson.topic) || poolHas(lesson.subject, lesson.topic, 'bagrut')) && (
            <motion.div variants={fadeUp} whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
              <Link
                href={`/practice/${lesson.subject}/${encodeURIComponent(lesson.topic)}/exercise?mode=bagrut`}
                className="group inline-flex items-center justify-center gap-3 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 px-6 py-4 rounded-2xl font-bold text-white shadow-xl shadow-indigo-500/40 transition-colors w-full"
              >
                <Target className="w-5 h-5" />
                <div className="text-right">
                  <div className="text-sm">בגרות מלאה</div>
                  <div className="text-[10px] font-normal opacity-80">שאלה משולבת על כל הנושא — קפסטון אחרי המודולים</div>
                </div>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
          <motion.div variants={fadeUp} whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
            <Link
              href={`/practice/${lesson.subject}/${encodeURIComponent(lesson.topic)}/exercise?mode=quick`}
              className="group inline-flex items-center justify-center gap-3 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 px-6 py-4 rounded-2xl font-bold text-white shadow-xl shadow-indigo-500/40 transition-colors w-full"
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
