'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { BookOpen, Sparkles, Target, AlertTriangle, Lightbulb, ArrowLeft, CheckCircle, Award } from 'lucide-react';
import type { Lesson } from '@/content/lessons/types';
import { MathText } from './MathText';
import { FormulaCard } from './FormulaCard';
import { WorkedExampleCard } from './WorkedExampleCard';
import { BagrutBadge } from './BagrutBadge';
import { markLessonViewed } from '@/lib/progress';
import { poolHas } from '@/lib/pool-availability';
import { hasBagrutBank } from '@/content/lessons';
import { markStep } from '@/lib/study-plan';
import { TopicJourney } from './TopicJourney';

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
      <header id="lesson-content" className="space-y-3 scroll-mt-20">
        <div className="text-xs font-black tracking-widest text-purple-300 uppercase flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>סיכום לימודי</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black leading-tight">
          <span className="bg-gradient-to-l from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            {lesson.title}
          </span>
        </h1>

        {/* Bagrut banner — shows the student instantly: which paper, weight,
            point value, appearsIn, and how the topic is examined. Sits
            BEFORE the prose intro because it's the anchor: "this is why
            you're studying this". Only renders for math5 topics. */}
        <BagrutBadge topic={lesson.topic} variant="banner" />

        <div className="chat-md text-sm sm:text-base text-slate-300 leading-relaxed">
          <MathText>{lesson.intro}</MathText>
        </div>
      </header>

      {/* Concepts */}
      <section>
        <div className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          <span>מושגים מרכזיים</span>
        </div>
        <div className="space-y-2">
          {lesson.concepts.map((c, i) => (
            <div
              key={i}
              className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3"
            >
              <div className="text-sm font-black text-purple-200 mb-1.5 chat-md">
                <MathText inline>{c.title}</MathText>
              </div>
              <div className="chat-md text-sm text-slate-200 leading-relaxed">
                <MathText>{c.body}</MathText>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Formulas */}
      {lesson.formulas.length > 0 && (
        <section>
          <div className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase">
            נוסחאות
          </div>
          <div className="grid grid-cols-1 gap-3">
            {lesson.formulas.map((f, i) => (
              <FormulaCard key={i} formula={f} />
            ))}
          </div>
        </section>
      )}

      {/* Worked examples */}
      <section>
        <div className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>דוגמאות פתורות</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          נסה לפתור בעצמך לפני שאתה לוחץ — אחר כך חשוף את הצעדים אחד-אחד.
        </p>
        <div className="space-y-2">
          {lesson.examples.map((ex, i) => (
            <WorkedExampleCard key={i} example={ex} index={i} />
          ))}
        </div>
      </section>

      {/* Pitfalls */}
      {lesson.pitfalls.length > 0 && (
        <section>
          <div className="text-xs font-black tracking-widest text-amber-300 mb-3 uppercase flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>טעויות נפוצות</span>
          </div>
          <div className="space-y-2">
            {lesson.pitfalls.map((p, i) => (
              <div
                key={i}
                className="bg-amber-500/5 border border-amber-500/30 rounded-2xl px-4 py-3 flex gap-3"
              >
                <Lightbulb className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <div className="chat-md text-sm text-amber-50/95 leading-relaxed">
                  <MathText>{p}</MathText>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Summary — quick "must remember" cheatsheet right before the CTA.
          Visually separated from concepts/pitfalls with an emerald accent
          to feel like the "study sheet" you'd carry into the exam. */}
      {lesson.summary && lesson.summary.length > 0 && (
        <section>
          <div className="text-xs font-black tracking-widest text-emerald-300 mb-3 uppercase flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>סיכום — מה לזכור</span>
          </div>
          <ul className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl px-4 py-3 space-y-2">
            {lesson.summary.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-emerald-50/95 leading-relaxed">
                <span className="text-emerald-300 flex-shrink-0 mt-0.5">✓</span>
                <div className="chat-md flex-1">
                  <MathText>{s}</MathText>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Exam tips — strategy hints (shortcuts, what the grader checks).
          Distinct from "pitfalls" (which describe student mistakes); these
          are positive moves. Purple accent to match the brand. */}
      {lesson.examTips && lesson.examTips.length > 0 && (
        <section>
          <div className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase flex items-center gap-2">
            <Award className="w-3.5 h-3.5" />
            <span>טיפים לבחינה</span>
          </div>
          <ul className="bg-purple-500/5 border border-purple-500/30 rounded-2xl px-4 py-3 space-y-2">
            {lesson.examTips.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-purple-50/95 leading-relaxed">
                <span className="text-purple-300 flex-shrink-0 mt-0.5">★</span>
                <div className="chat-md flex-1">
                  <MathText>{t}</MathText>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* CTA — start practice. We only show "בגרות מלאה" when there's a
          ready pool for that topic; otherwise it would mean a 30-50s wait
          and a live API charge for every student. Quick mode is always
          available (uses /api/practice and is faster). */}
      <section className="pt-2">
        <div className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase">
          מוכן/ה לתרגל?
        </div>
        <div className={`grid grid-cols-1 ${(hasBagrutBank(lesson.subject, lesson.topic) || poolHas(lesson.subject, lesson.topic, 'bagrut')) ? 'sm:grid-cols-2' : ''} gap-3`}>
          {(hasBagrutBank(lesson.subject, lesson.topic) || poolHas(lesson.subject, lesson.topic, 'bagrut')) && (
            <Link
              href={`/practice/${lesson.subject}/${encodeURIComponent(lesson.topic)}/exercise?mode=bagrut`}
              className="group inline-flex items-center justify-center gap-3 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-4 rounded-2xl font-bold text-white shadow-xl shadow-purple-500/40 transition-all"
            >
              <Target className="w-5 h-5" />
              <div className="text-right">
                <div className="text-sm">בגרות מלאה</div>
                <div className="text-[10px] font-normal opacity-80">שאלה עם סעיפים, רמזים ופתרון</div>
              </div>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
          )}
          <Link
            href={`/practice/${lesson.subject}/${encodeURIComponent(lesson.topic)}/exercise?mode=quick`}
            className="group inline-flex items-center justify-center gap-3 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-4 rounded-2xl font-bold text-white shadow-xl shadow-purple-500/40 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <div className="text-right">
              <div className="text-sm">תרגול מהיר</div>
              <div className="text-[10px] font-normal opacity-80">תרגיל אחד עם רמזים ופתרון מלא</div>
            </div>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </article>
  );
}
