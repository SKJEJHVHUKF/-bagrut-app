'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { BookOpen, Sparkles, Target, AlertTriangle, Lightbulb, ArrowLeft } from 'lucide-react';
import type { Lesson } from '@/content/lessons/types';
import { MathText } from './MathText';
import { FormulaCard } from './FormulaCard';
import { WorkedExampleCard } from './WorkedExampleCard';
import { markLessonViewed } from '@/lib/progress';

export function LessonView({ lesson }: { lesson: Lesson }) {
  // Mark as "viewed" once the student reaches the lesson page. The exercise
  // route bumps a separate counter when they finish a question.
  useEffect(() => {
    markLessonViewed(lesson.subject, lesson.topic);
  }, [lesson.subject, lesson.topic]);

  return (
    <article className="space-y-6">
      {/* Title + intro */}
      <header className="space-y-3">
        <div className="text-xs font-black tracking-widest text-purple-300 uppercase flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>סיכום לימודי</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black leading-tight">
          <span className="bg-gradient-to-l from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            {lesson.title}
          </span>
        </h1>
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
              <div className="text-sm font-black text-purple-200 mb-1.5">{c.title}</div>
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

      {/* CTA — start practice */}
      <section className="pt-2">
        <div className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase">
          מוכן/ה לתרגל?
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <Link
            href={`/practice/${lesson.subject}/${encodeURIComponent(lesson.topic)}/exercise?mode=quick`}
            className="group inline-flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 px-6 py-4 rounded-2xl font-bold text-white transition-all"
          >
            <Sparkles className="w-5 h-5 text-purple-300" />
            <div className="text-right">
              <div className="text-sm">תרגול מהיר</div>
              <div className="text-[10px] font-normal text-slate-300">תרגיל אחד עם רמזים</div>
            </div>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </article>
  );
}
