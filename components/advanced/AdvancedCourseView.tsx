'use client';

import { useCallback, useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Rocket, Clock, Lock, AlertTriangle, BookOpen, ArrowLeft } from 'lucide-react';
import type { AdvancedCourse } from '@/content/advanced-courses/types';
import { ADVANCED_SECTIONS } from '@/content/advanced-courses/types';
import {
  getAdvancedProgress,
  getCompletedAdvancedSections,
  markGatePassed,
  markAdvancedSectionDone,
  markSimulationPassed,
  toggleAdvancedSection,
} from '@/lib/advanced-progress';
import { fadeUp, staggerContainer, inViewProps } from '@/lib/animations';
import { SectionShell } from '@/components/learn/PathSections';
import { MathText } from '@/components/practice/MathText';
import { EntryGate } from './EntryGate';
import { PatternMapView } from './PatternMapView';
import { TechniqueCard } from './TechniqueCard';
import { WorkedExamView } from './WorkedExamView';
import { ExamQuestionCard } from './ExamQuestionCard';
import { ExamSimulation } from './ExamSimulation';

export function AdvancedCourseView({ course }: { course: AdvancedCourse }) {
  const { subject, topic } = course;
  const [done, setDone] = useState<Set<string>>(new Set());
  const [gatePassed, setGatePassed] = useState(false);
  const [gateSkipped, setGateSkipped] = useState(false);
  const [simPassed, setSimPassed] = useState(false);

  useEffect(() => {
    const p = getAdvancedProgress(subject, topic);
    setGatePassed(!!p.gatePassed);
    setGateSkipped(!!p.gateSkipped);
    setSimPassed(!!p.simulationPassed);
    setDone(getCompletedAdvancedSections(subject, topic));
  }, [subject, topic]);

  const onToggle = useCallback(
    (sectionId: string) => setDone(toggleAdvancedSection(subject, topic, sectionId)),
    [subject, topic],
  );

  const handleGatePassed = useCallback(
    (viaSkip: boolean) => {
      const p = markGatePassed(subject, topic, viaSkip);
      setGatePassed(true);
      setGateSkipped(viaSkip);
      setDone(new Set(p.completedSections ?? []));
    },
    [subject, topic],
  );

  const handleSimulationPassed = useCallback(() => {
    const p = markSimulationPassed(subject, topic);
    setSimPassed(true);
    setDone(new Set(p.completedSections ?? []));
  }, [subject, topic]);

  const totalSections = ADVANCED_SECTIONS.length;
  const doneCount = ADVANCED_SECTIONS.filter((s) => done.has(s.id)).length;
  const percent = Math.round((doneCount / totalSections) * 100);

  return (
    <article className="space-y-7">
      {/* ===== Header ===== */}
      <motion.header initial="hidden" animate="visible" variants={staggerContainer} className="space-y-3">
        <motion.div
          variants={fadeUp}
          className="text-xs font-black tracking-widest text-indigo-300 uppercase flex items-center gap-2"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>קורס מתקדם · רמת בגרות</span>
        </motion.div>
        <motion.h1 variants={fadeUp} className="text-2xl sm:text-3xl font-black leading-tight">
          <span className="font-display text-slate-100">
            {course.title}
          </span>
        </motion.h1>
        <motion.p variants={fadeUp} className="text-sm text-slate-300 leading-relaxed chat-md">
          <MathText inline>{course.tagline}</MathText>
        </motion.p>
        <motion.div variants={fadeUp} className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
          <span className="inline-flex items-center gap-1.5 surface-premium rounded-full px-2.5 py-1">
            <Clock className="w-3.5 h-3.5" />
            {course.estimatedMinutes} דקות
          </span>
          <span className="inline-flex items-center gap-1.5 surface-premium rounded-full px-2.5 py-1">
            {totalSections} חלקים
          </span>
          <Link
            href={`/learn/${subject}/${encodeURIComponent(topic)}`}
            className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 rounded-full px-2.5 py-1 hover:bg-emerald-500/20 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>לקורס הבסיס</span>
          </Link>
        </motion.div>
      </motion.header>

      {/* ===== Progress strip + jump nav ===== */}
      <motion.div
        {...inViewProps}
        variants={fadeUp}
        className="surface-premium rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-baseline justify-between">
          <div className="text-sm font-bold text-indigo-100">
            {simPassed
              ? '🎓 הנושא הושלם ברמת בגרות!'
              : `${doneCount}/${totalSections} חלקים הושלמו`}
          </div>
          <div className="text-xs text-indigo-300/80 font-mono">{percent}%</div>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-gradient-to-l from-indigo-500 to-indigo-500"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {ADVANCED_SECTIONS.map((s, i) => {
            const locked = !gatePassed && s.id !== 'gate';
            return (
              <a
                key={s.id}
                href={locked ? '#section-gate' : `#section-${s.id}`}
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                  done.has(s.id)
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
                    : locked
                      ? 'bg-white/[0.02] border-white/5 text-slate-500'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span>{done.has(s.id) ? '✓' : locked ? '🔒' : i + 1}</span>
                <span>{s.emoji}</span>
                <span className="hidden sm:inline">{s.title}</span>
              </a>
            );
          })}
        </div>
      </motion.div>

      {/* ===== §1 Entry gate ===== */}
      <SectionShell
        index={1}
        sectionId="gate"
        title="שער כניסה"
        emoji="🚪"
        subtitle="בדיקה קצרה מקורס הבסיס — חובה לפני שממשיכים"
        done={done.has('gate')}
        onToggle={() => onToggle('gate')}
      >
        <EntryGate
          gate={course.gate}
          subject={subject}
          topic={topic}
          passed={gatePassed}
          skipped={gateSkipped}
          onPassed={handleGatePassed}
        />
      </SectionShell>

      {/* ===== §2-§7 — locked until the gate is passed ===== */}
      <LockedGroup locked={!gatePassed}>
        <SectionShell
          index={2}
          sectionId="patterns"
          title="מפת סוגי השאלות"
          emoji="🗺️"
          subtitle="התבניות שחוזרות בבגרויות — ואיך מזהים אותן"
          done={done.has('patterns')}
          onToggle={() => onToggle('patterns')}
        >
          <PatternMapView patterns={course.patterns} />
        </SectionShell>

        <SectionShell
          index={3}
          sectionId="techniques"
          title="טכניקות מתקדמות"
          emoji="🛠️"
          subtitle="מה שקורס הבסיס לא כיסה: פרמטרים, הוכחות, שילובים"
          done={done.has('techniques')}
          onToggle={() => onToggle('techniques')}
        >
          <div className="space-y-2.5">
            {course.techniques.map((t, i) => (
              <TechniqueCard key={t.id} technique={t} index={i} />
            ))}
          </div>
        </SectionShell>

        <SectionShell
          index={4}
          sectionId="worked-exams"
          title="בגרויות מפורקות"
          emoji="🔍"
          subtitle="חשיבה בקול רם: מה כל סעיף באמת שואל ומה הבודק מחפש"
          done={done.has('worked-exams')}
          onToggle={() => onToggle('worked-exams')}
        >
          <div className="space-y-3">
            {course.workedExams.map((we, i) => (
              <WorkedExamView key={we.id} exam={we} index={i} />
            ))}
          </div>
        </SectionShell>

        <SectionShell
          index={5}
          sectionId="exam-practice"
          title="תרגול ברמת בגרות"
          emoji="📝"
          subtitle="שאלות מלאות עם מחוון ניקוד וזמן יעד"
          done={done.has('exam-practice')}
          onToggle={() => onToggle('exam-practice')}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              פתור עם שעון ביד — זמן היעד רשום על כל שאלה. אחרי הפתרון, גרד את עצמך מול המחוון
              בדיוק כמו בודק.
            </p>
            {course.examPractice.map((q, i) => (
              <ExamQuestionCard key={q.id} q={q} index={i} />
            ))}
          </div>
        </SectionShell>

        <SectionShell
          index={6}
          sectionId="traps"
          title="מלכודות ברמת בגרות"
          emoji="🪤"
          subtitle="הטעויות שמפילות דווקא תלמידים טובים"
          done={done.has('traps')}
          onToggle={() => onToggle('traps')}
        >
          <div className="space-y-2">
            {course.traps.map((t, i) => (
              <div key={i} className="bg-amber-500/5 border border-amber-500/30 rounded-2xl px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="chat-md text-sm text-amber-50 leading-relaxed">
                      <span className="font-bold text-indigo-300">המלכודת: </span>
                      <MathText inline>{t.trap}</MathText>
                    </div>
                    <div className="chat-md text-xs text-indigo-200/90 leading-relaxed">
                      <span className="font-bold">המחיר: </span>
                      <MathText inline>{t.consequence}</MathText>
                    </div>
                    <div className="chat-md text-sm text-emerald-50/90 leading-relaxed">
                      <span className="font-bold text-emerald-300">ההרגל שמציל: </span>
                      <MathText inline>{t.avoid}</MathText>
                    </div>
                    {t.relatedPatternId && (
                      <a
                        href={`#pattern-${t.relatedPatternId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300/80 hover:text-indigo-200 transition-colors"
                      >
                        <span>לתבנית הרלוונטית</span>
                        <ArrowLeft className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          index={7}
          sectionId="simulation"
          title="סימולציית סיום"
          emoji="⏱️"
          subtitle="שאלה מלאה במצב בחינה — טיימר, בלי רמזים"
          done={done.has('simulation')}
          onToggle={() => onToggle('simulation')}
        >
          <ExamSimulation
            simulation={course.simulation}
            passed={simPassed}
            onPassed={handleSimulationPassed}
          />
        </SectionShell>
      </LockedGroup>
    </article>
  );
}

/** Wraps sections 2-7. When locked, replaces them with a single lock card
 *  pointing back to the gate — the content isn't rendered at all. */
function LockedGroup({ locked, children }: { locked: boolean; children: ReactNode }) {
  if (!locked) return <>{children}</>;
  return (
    <motion.div
      {...inViewProps}
      variants={fadeUp}
      className="surface-premium border-dashed rounded-2xl p-8 text-center space-y-3"
    >
      <Lock className="w-10 h-10 mx-auto text-slate-500" />
      <div className="text-base font-black text-slate-300">שאר הקורס נעול</div>
      <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
        מפת התבניות, הטכניקות, הבגרויות המפורקות, התרגול והסימולציה ייפתחו אחרי שתעבור את שער
        הכניסה (או תבחר לדלג עליו).
      </p>
      <a
        href="#section-gate"
        className="inline-flex items-center gap-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 px-4 py-2 rounded-xl font-bold text-indigo-100 text-sm transition-colors"
      >
        <span>לשער הכניסה</span>
        <ArrowLeft className="w-4 h-4" />
      </a>
    </motion.div>
  );
}
