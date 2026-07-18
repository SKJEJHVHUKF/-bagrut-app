'use client';

// RoadmapLessonView — the /roadmap/[lessonId] lesson viewer. A tabbed,
// step-by-step view of ONE sub-topic, composed entirely from existing content:
//   תיאוריה  → the guided lesson steps (title + teach [+ diagram])
//   נוסחאות  → the sub-topic's formulas (FormulaCard)
//   דוגמה    → the worked examples embedded in the lesson steps
//   בוחן שלב → RoadmapStepQuiz (3 static questions, pass 2/3 to unlock next)

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sigma, Lightbulb, Target } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { FormulaCard } from '@/components/practice/FormulaCard';
import { WorkedExampleCard } from '@/components/practice/WorkedExampleCard';
import { DiagramRenderer } from '@/components/practice/DiagramRenderer';
import { RoadmapStepQuiz } from './RoadmapStepQuiz';
import type { SubTopic } from '@/content/lessons/types';
import type { RoadmapTabKind } from '@/types/roadmap';

const TABS: { key: RoadmapTabKind; label: string; icon: React.ReactNode }[] = [
  { key: 'theory', label: 'תיאוריה', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'formulas', label: 'נוסחאות', icon: <Sigma className="w-4 h-4" /> },
  { key: 'example', label: 'דוגמה', icon: <Lightbulb className="w-4 h-4" /> },
  { key: 'quiz', label: 'בוחן שלב', icon: <Target className="w-4 h-4" /> },
];

export function RoadmapLessonView({
  subject,
  topic,
  subTopic,
  nextSubId,
  nextTitle,
}: {
  subject: string;
  topic: string;
  subTopic: SubTopic;
  nextSubId: string | null;
  nextTitle?: string;
}) {
  const [tab, setTab] = useState<RoadmapTabKind>('theory');

  const lessonSteps = subTopic.lesson ?? [];
  const examples = lessonSteps.filter((s) => s.example).map((s) => s.example!);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="text-3xl">{subTopic.emoji ?? '📘'}</div>
        <h1 className="font-display text-2xl font-black text-slate-900">{subTopic.title}</h1>
        <p className="text-sm text-slate-600">{subTopic.tagline}</p>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-900/[0.03] border border-slate-900/[0.06]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-bold transition-colors ${
              tab === t.key ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25' : 'text-slate-600 hover:bg-slate-900/[0.04]'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'theory' && (
            <div className="space-y-3">
              {lessonSteps.length > 0 ? (
                lessonSteps.map((step, i) => (
                  <div key={i} className="surface-premium rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-[11px] font-black text-indigo-800 flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="text-sm font-black text-slate-900 chat-md">
                        <MathText inline>{step.title}</MathText>
                      </div>
                    </div>
                    <div className="chat-md text-sm text-slate-800 leading-relaxed">
                      <MathText>{step.teach}</MathText>
                    </div>
                    {step.diagrams && step.diagrams.length > 0 && (
                      <DiagramRenderer diagrams={step.diagrams} />
                    )}
                  </div>
                ))
              ) : (
                <div className="surface-premium rounded-2xl p-4 space-y-3">
                  <div className="chat-md text-sm text-slate-800 leading-relaxed">
                    <MathText>{subTopic.summary}</MathText>
                  </div>
                  {subTopic.keyPoints.length > 0 && (
                    <ul className="space-y-1.5">
                      {subTopic.keyPoints.map((k, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-800 chat-md">
                          <span className="text-indigo-600 font-black">•</span>
                          <MathText inline>{k}</MathText>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {/* keyPoints recap under the steps */}
              {lessonSteps.length > 0 && subTopic.keyPoints.length > 0 && (
                <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-2xl p-4">
                  <div className="text-[10px] font-black tracking-widest text-indigo-700 uppercase mb-2">
                    לזכור
                  </div>
                  <ul className="space-y-1.5">
                    {subTopic.keyPoints.map((k, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-800 chat-md">
                        <span className="text-indigo-600 font-black">•</span>
                        <MathText inline>{k}</MathText>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {tab === 'formulas' && (
            <div className="space-y-3">
              {subTopic.formulas.length > 0 ? (
                subTopic.formulas.map((f, i) => <FormulaCard key={i} formula={f} />)
              ) : (
                <div className="text-sm text-slate-500 text-center py-6">
                  אין נוסחאות ייעודיות לשלב הזה — עבור ישר לתיאוריה ולדוגמאות.
                </div>
              )}
            </div>
          )}

          {tab === 'example' && (
            <div className="space-y-2">
              {examples.length > 0 ? (
                examples.map((ex, i) => <WorkedExampleCard key={i} example={ex} index={i} />)
              ) : (
                <div className="text-sm text-slate-500 text-center py-6">אין דוגמאות פתורות לשלב הזה.</div>
              )}
            </div>
          )}

          {tab === 'quiz' && (
            <RoadmapStepQuiz
              subject={subject}
              topic={topic}
              subId={subTopic.id}
              questions={subTopic.questions}
              nextSubId={nextSubId}
              nextTitle={nextTitle}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nudge to the quiz from non-quiz tabs */}
      {tab !== 'quiz' && (
        <button
          onClick={() => setTab('quiz')}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-3 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/25 transition-colors"
        >
          <Target className="w-4 h-4" />
          <span>מוכן? עבור לבוחן השלב</span>
        </button>
      )}
    </div>
  );
}
