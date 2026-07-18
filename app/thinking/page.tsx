'use client';

// /thinking — the "סעיפי חשיבה והבנה" (Unseen Buster) mode. Pick a topic,
// then answer AI-generated qualitative conceptual questions in free Hebrew
// and get a rubric-style evaluation. Pro-only (gated server-side).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThinkingPractice } from '@/components/thinking/ThinkingPractice';
import { allLessonKeys } from '@/content/lessons';
import {
  curriculumIndex,
  getTopicMapping,
  isTopicInActivePaper,
  type BagrutPaper,
} from '@/content/bagrut-curriculum';
import { getPaper } from '@/lib/study-plan';

export default function ThinkingPage() {
  const [paper, setPaper] = useState<BagrutPaper | null>(null);
  const [topic, setTopic] = useState<string | null>(null);

  useEffect(() => {
    setPaper(getPaper());
  }, []);

  const topics = allLessonKeys()
    .filter((k) => k.subject === 'math5')
    .filter((k) => !paper || isTopicInActivePaper(k.topic, paper))
    .sort((a, b) => curriculumIndex(a.topic) - curriculumIndex(b.topic));

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-800 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/practice" className="text-sm text-slate-600 hover:text-slate-800 transition-colors">
            → חזרה לתרגול
          </Link>
        </div>

        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-black gradient-text">
            🧠 סעיפי חשיבה והבנה
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            האימון לשאלות ה&quot;לא מוכר&quot; של הבגרות — ניתוח גרפים, השפעת פרמטרים,
            ונימוקים מילוליים. אתה מסביר במילים שלך, והמורה בודק את שלמות ההיגיון
            ומראה איך לנסח תשובה לציון מלא.
          </p>
        </div>

        {!topic ? (
          <div className="surface-premium rounded-3xl p-5 space-y-3">
            <div className="text-xs font-black tracking-widest text-indigo-700 uppercase">
              בחר נושא
            </div>
            <div className="grid grid-cols-2 gap-2">
              {topics.map(({ topic: t }) => {
                const m = getTopicMapping(t);
                return (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className="flex items-center gap-2 text-right px-4 py-3 rounded-2xl bg-slate-900/[0.03] hover:bg-slate-900/[0.05] border border-slate-900/10 hover:border-indigo-500/40 transition-colors"
                  >
                    <span className="text-base flex-shrink-0">{m?.emoji ?? '📐'}</span>
                    <span className="font-bold text-sm text-slate-900">{t}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => setTopic(null)}
              className="text-sm text-indigo-700 hover:text-indigo-900 font-bold transition-colors"
            >
              ← בחר נושא אחר
            </button>
            <ThinkingPractice topic={topic} />
          </>
        )}
      </div>
    </div>
  );
}
