'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Clock, ArrowLeft, Target, Sparkles, Rocket } from 'lucide-react';
import type { LearningPath } from '@/content/learning-paths/types';
import { PATH_SECTIONS } from '@/content/learning-paths/types';
import { hasLesson } from '@/content/lessons';
import { hasAdvancedCourse } from '@/content/advanced-courses';
import {
  getCompletedSections,
  toggleSection,
  markSectionDone,
} from '@/lib/learn-progress';
import { fadeUp, staggerContainer, inViewProps, buttonTap } from '@/lib/animations';
import {
  SectionShell,
  PrerequisitesView,
  IntuitionView,
  ConceptsView,
  PitfallsView,
  FormulaSheetView,
} from './PathSections';
import { GuidedExampleCard } from './GuidedExampleCard';
import { GradedQuestionCard } from './GradedQuestionCard';
import { BagrutQuestionBlock } from './BagrutQuestionBlock';
import { ComprehensionCheck } from './ComprehensionCheck';

export function LearningPathView({ path }: { path: LearningPath }) {
  const { subject, topic } = path;
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDone(getCompletedSections(subject, topic));
  }, [subject, topic]);

  const onToggle = useCallback(
    (sectionId: string) => setDone(toggleSection(subject, topic, sectionId)),
    [subject, topic],
  );
  const onMarkDone = useCallback(
    (sectionId: string) => setDone(markSectionDone(subject, topic, sectionId)),
    [subject, topic],
  );

  const totalSections = PATH_SECTIONS.length;
  const doneCount = PATH_SECTIONS.filter((s) => done.has(s.id)).length;
  const percent = Math.round((doneCount / totalSections) * 100);
  const allDone = doneCount === totalSections;
  const hasLegacyLesson = hasLesson(subject, topic);

  return (
    <article className="space-y-7">
      {/* ===== Header ===== */}
      <motion.header
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-3"
      >
        <motion.div
          variants={fadeUp}
          className="text-xs font-black tracking-widest text-emerald-700 uppercase flex items-center gap-2"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>מסלול לימוד מ-0</span>
        </motion.div>
        <motion.h1 variants={fadeUp} className="text-2xl sm:text-3xl font-black leading-tight">
          <span className="font-display text-slate-800">
            {path.title}
          </span>
        </motion.h1>
        <motion.p variants={fadeUp} className="text-sm text-slate-700 leading-relaxed">
          {path.tagline}
        </motion.p>
        <motion.div variants={fadeUp} className="flex items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 surface-premium rounded-full px-2.5 py-1">
            <Clock className="w-3.5 h-3.5" />
            {path.estimatedMinutes} דקות
          </span>
          <span className="inline-flex items-center gap-1.5 surface-premium rounded-full px-2.5 py-1">
            {totalSections} חלקים
          </span>
        </motion.div>
      </motion.header>

      {/* ===== Progress strip + section nav ===== */}
      <motion.div
        {...inViewProps}
        variants={fadeUp}
        className="surface-premium rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-baseline justify-between">
          <div className="text-sm font-bold text-emerald-800">
            {allDone ? '🎓 סיימת את כל המסלול!' : `${doneCount}/${totalSections} חלקים הושלמו`}
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
        {/* Jump nav */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PATH_SECTIONS.map((s, i) => (
            <a
              key={s.id}
              href={`#section-${s.id}`}
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                done.has(s.id)
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800'
                  : 'bg-slate-900/[0.03] border-slate-900/10 text-slate-700 hover:bg-slate-900/5'
              }`}
            >
              <span>{done.has(s.id) ? '✓' : i + 1}</span>
              <span>{s.emoji}</span>
              <span className="hidden sm:inline">{s.title}</span>
            </a>
          ))}
        </div>
      </motion.div>

      {/* ===== §1 Prerequisites ===== */}
      <SectionShell
        index={1}
        sectionId="prerequisites"
        title="דרישות קדם"
        emoji="🎒"
        subtitle="מה צריך לדעת לפני שמתחילים"
        done={done.has('prerequisites')}
        onToggle={() => onToggle('prerequisites')}
      >
        <PrerequisitesView items={path.prerequisites} />
      </SectionShell>

      {/* ===== §2 Intuition ===== */}
      <SectionShell
        index={2}
        sectionId="intuition"
        title="למה זה בכלל קיים"
        emoji="💡"
        subtitle="האינטואיציה — לפני הנוסחאות"
        done={done.has('intuition')}
        onToggle={() => onToggle('intuition')}
      >
        <IntuitionView data={path.intuition} />
      </SectionShell>

      {/* ===== §3 Concepts ===== */}
      <SectionShell
        index={3}
        sectionId="concepts"
        title="בניית המושגים"
        emoji="🧱"
        subtitle="צעד-צעד, מהפשוט למורכב"
        done={done.has('concepts')}
        onToggle={() => onToggle('concepts')}
      >
        <ConceptsView atoms={path.concepts} />
      </SectionShell>

      {/* ===== §4 Guided examples ===== */}
      <SectionShell
        index={4}
        sectionId="examples"
        title="דוגמאות פתורות מודרכות"
        emoji="🧭"
        subtitle="כל צעד מוסבר — כולל איך בוחרים שיטה"
        done={done.has('examples')}
        onToggle={() => onToggle('examples')}
      >
        <div className="space-y-2">
          <p className="text-xs text-slate-600">
            נסה לפתור לבד לפני שאתה חושף — אחר כך גלה צעד-צעד.
          </p>
          {path.guidedExamples.map((ex, i) => (
            <GuidedExampleCard key={ex.id} example={ex} index={i} />
          ))}
        </div>
      </SectionShell>

      {/* ===== §5 Pitfalls ===== */}
      <SectionShell
        index={5}
        sectionId="pitfalls"
        title="טעויות נפוצות ומלכודות"
        emoji="⚠️"
        subtitle="איפה תלמידים נכשלים — ואיך להימנע"
        done={done.has('pitfalls')}
        onToggle={() => onToggle('pitfalls')}
      >
        <PitfallsView items={path.pitfalls} />
      </SectionShell>

      {/* ===== §6 Graded practice ===== */}
      <SectionShell
        index={6}
        sectionId="practice"
        title="תרגול מדורג"
        emoji="🎯"
        subtitle="שלוש רמות — ממושג בודד עד בגרות מלאה"
        done={done.has('practice')}
        onToggle={() => onToggle('practice')}
      >
        <div className="space-y-5">
          <PracticeLevel
            badge="רמה 1"
            tone="emerald"
            title="מושג בודד"
            subtitle="כמעט העתקה של הדוגמאות"
          >
            <div className="space-y-2.5">
              {path.practice.level1.map((q, i) => (
                <GradedQuestionCard key={q.id} q={q} index={i} />
              ))}
            </div>
          </PracticeLevel>

          <PracticeLevel
            badge="רמה 2"
            tone="amber"
            title="שילוב שני מושגים"
            subtitle="צריך לחבר בין שני רעיונות"
          >
            <div className="space-y-2.5">
              {path.practice.level2.map((q, i) => (
                <GradedQuestionCard key={q.id} q={q} index={i} />
              ))}
            </div>
          </PracticeLevel>

          <PracticeLevel
            badge="רמה 3"
            tone="rose"
            title="שאלת בגרות מלאה"
            subtitle="שאלה עם סעיפים, כמו במבחן"
          >
            <div className="space-y-3">
              {path.practice.level3.map((q, i) => (
                <BagrutQuestionBlock key={q.id} q={q} index={i} />
              ))}
            </div>
          </PracticeLevel>
        </div>
      </SectionShell>

      {/* ===== §7 Formula sheet ===== */}
      <SectionShell
        index={7}
        sectionId="formula-sheet"
        title="סיכום מהיר ודף נוסחאות"
        emoji="📋"
        subtitle="לסקירה מהירה לפני מבחן"
        done={done.has('formula-sheet')}
        onToggle={() => onToggle('formula-sheet')}
      >
        <FormulaSheetView data={path.formulaSheet} />
      </SectionShell>

      {/* ===== §8 Comprehension check ===== */}
      <SectionShell
        index={8}
        sectionId="check"
        title="בדיקת הבנה"
        emoji="✅"
        subtitle="ודא שליטה לפני הנושא הבא"
        done={done.has('check')}
        onToggle={() => onToggle('check')}
      >
        <ComprehensionCheck
          questions={path.comprehensionCheck}
          onComplete={() => onMarkDone('check')}
        />
      </SectionShell>

      {/* ===== Advanced course CTA — the natural next step ===== */}
      {hasAdvancedCourse(subject, topic) && (
        <motion.section {...inViewProps} variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Link
              href={`/learn/${subject}/${encodeURIComponent(topic)}/advanced`}
              className="group block rounded-2xl p-4 bg-gradient-to-br from-indigo-600/20 to-indigo-600/10 border border-indigo-500/40 hover:border-indigo-400 transition-colors shadow-lg shadow-indigo-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-indigo-500/25 border border-indigo-400/50 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-indigo-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm sm:text-base text-slate-900 mb-0.5">
                    הצעד הבא: קורס מתקדם — רמת בגרות
                  </div>
                  <div className="text-xs text-indigo-800 leading-snug">
                    זיהוי תבניות, טכניקות, בגרויות מפורקות עם מחוון, וסימולציית סיום עם טיימר.
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-indigo-700 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        </motion.section>
      )}

      {/* ===== Footer CTA ===== */}
      <motion.section {...inViewProps} variants={staggerContainer} className="pt-2">
        <motion.div
          variants={fadeUp}
          className="bg-gradient-to-br from-emerald-600/15 to-teal-600/10 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-3"
        >
          <Sparkles className="w-8 h-8 mx-auto text-emerald-700" />
          <div className="text-base font-black text-slate-900">
            {allDone ? 'כל הכבוד — שלטת בנושא!' : 'מוכן ליותר תרגול?'}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed max-w-md mx-auto">
            המשך לתרגול נוסף בנושא — שאלות מהירות ושאלות בגרות מלאות עם בדיקת תשובה.
          </p>
          {hasLegacyLesson && (
            <motion.div {...buttonTap} className="inline-block">
              <Link
                href={`/practice/${subject}/${encodeURIComponent(topic)}/exercise?mode=bagrut`}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-3 rounded-2xl font-bold text-white shadow-xl shadow-emerald-500/30 transition-colors"
              >
                <Target className="w-5 h-5" />
                <span>עוד תרגול בנושא</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </motion.div>
      </motion.section>
    </article>
  );
}

// Small labeled wrapper for a practice level.
function PracticeLevel({
  badge,
  tone,
  title,
  subtitle,
  children,
}: {
  badge: string;
  tone: 'emerald' | 'amber' | 'rose';
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const toneMap = {
    emerald: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800',
    amber: 'bg-amber-500/15 border-amber-500/40 text-amber-800',
    rose: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-800',
  };
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2.5">
        <span
          className={`text-[11px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg border ${toneMap[tone]}`}
        >
          {badge}
        </span>
        <div>
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <div className="text-[11px] text-slate-600">{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
