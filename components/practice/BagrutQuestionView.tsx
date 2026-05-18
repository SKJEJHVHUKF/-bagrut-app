'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { MathText } from './MathText';
import { QuestionPartCard, type QuestionPart } from './QuestionPartCard';
import { markExerciseDone } from '@/lib/progress';

type BagrutQuestion = {
  context: string;
  topic_tag: string;
  parts: QuestionPart[];
};

type Difficulty = 'easier' | 'normal' | 'harder';

export function BagrutQuestionView({
  subject,
  topic,
  subjectLabel,
}: {
  subject: string;
  topic: string;
  subjectLabel: string;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<BagrutQuestion | null>(null);
  const [partsDone, setPartsDone] = useState<Set<number>>(new Set());

  async function load(d: Difficulty = difficulty) {
    setLoading(true);
    setError(null);
    setQuestion(null);
    setPartsDone(new Set());
    setDifficulty(d);
    try {
      const res = await fetch('/api/practice-bagrut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, difficulty: d }),
      });
      if (!res.ok) {
        let msg = '';
        try {
          const j = await res.json();
          msg = j?.error ?? '';
        } catch {
          msg = await res.text().catch(() => '');
        }
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as BagrutQuestion;
      setQuestion(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load('normal');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPartDone(i: number, total: number) {
    setPartsDone((prev) => {
      const next = new Set(prev);
      next.add(i);
      if (next.size === total) {
        markExerciseDone(subject, topic);
      }
      return next;
    });
  }

  if (loading) {
    return (
      <div className="space-y-3 py-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400" />
        <div className="text-sm text-slate-400">מכין שאלת בגרות עבורך — לוקח 20-40 שניות…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
          {error}
        </div>
        <button
          onClick={() => load(difficulty)}
          className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl font-bold text-white text-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>נסה שוב</span>
        </button>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="space-y-4">
      {/* Meta strip */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-200 font-bold">
          {subjectLabel}
        </span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-300">{topic}</span>
        {question.topic_tag && question.topic_tag !== topic && (
          <>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{question.topic_tag}</span>
          </>
        )}
      </div>

      {/* Context (if any) */}
      {question.context && question.context.trim().length > 0 && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 chat-md">
          <div className="text-[10px] font-black tracking-widest text-purple-300 mb-2 uppercase">
            נתוני השאלה
          </div>
          <div className="text-sm sm:text-base text-white leading-relaxed">
            <MathText>{question.context}</MathText>
          </div>
        </div>
      )}

      {/* Parts */}
      <div className="space-y-3">
        {question.parts.map((p, i) => (
          <QuestionPartCard
            key={i}
            part={p}
            onDone={() => onPartDone(i, question.parts.length)}
          />
        ))}
      </div>

      {/* New question / difficulty switch */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
        <button
          onClick={() => load(difficulty)}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-3 rounded-2xl font-bold text-white shadow-lg shadow-purple-500/30 transition-all text-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>שאלה חדשה</span>
        </button>
        <button
          onClick={() => load('easier')}
          className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 px-4 py-3 rounded-2xl font-bold text-emerald-200 text-sm transition-all"
        >
          <span>🟢 קל יותר</span>
        </button>
        <button
          onClick={() => load('harder')}
          className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-500/40 px-4 py-3 rounded-2xl font-bold text-rose-200 text-sm transition-all"
        >
          <span>🔴 מאתגר יותר</span>
        </button>
      </div>
    </div>
  );
}
