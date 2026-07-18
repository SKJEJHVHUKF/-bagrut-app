'use client';

// ThinkingPractice — the "סעיפי חשיבה והבנה" mode. Loads a qualitative
// conceptual question from /api/thinking, lets the student answer in free
// Hebrew, and shows an AI rubric (covered / missing points + a full-score
// model answer) from /api/thinking/evaluate. Pro-only server-side.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Brain, CheckCircle, XCircle, Crown, ArrowLeft, Sparkles } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { recordMistake } from '@/lib/mistakes';

type Question = {
  question: string;
  idealAnswerPoints: string[];
  fullAnswer: string;
};

type Evaluation = {
  score: number;
  coveredPoints: string[];
  missingPoints: string[];
  feedback: string;
  modelAnswer: string;
};

function scoreColor(s: number): string {
  if (s >= 70) return 'text-emerald-700';
  if (s >= 40) return 'text-amber-700';
  return 'text-rose-700';
}

export function ThinkingPractice({ topic, subject = 'math5' }: { topic: string; subject?: string }) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proUpsell, setProUpsell] = useState(false);
  const [showModel, setShowModel] = useState(false);

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEvaluation(null);
    setAnswer('');
    setShowModel(false);
    setProUpsell(false);
    try {
      const res = await fetch('/api/thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        setProUpsell(true);
        return;
      }
      if (!res.ok || data.error) {
        setError(data.error ?? `שגיאה (${res.status})`);
        return;
      }
      setQuestion(data as Question);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [topic]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  async function evaluate() {
    if (!question || !answer.trim() || evaluating) return;
    setEvaluating(true);
    setError(null);
    try {
      const res = await fetch('/api/thinking/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          idealAnswerPoints: question.idealAnswerPoints,
          answer,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        setProUpsell(true);
        return;
      }
      if (!res.ok || data.error) {
        setError(data.error ?? `שגיאה (${res.status})`);
        return;
      }
      const ev = data as Evaluation;
      setEvaluation(ev);
      if (ev.score < 60) {
        recordMistake({
          subject,
          topic,
          questionText: question.question,
          userAnswer: answer,
          correctAnswer: question.fullAnswer,
          category: 'אחר',
          source: 'thinking',
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setEvaluating(false);
    }
  }

  if (proUpsell) {
    return (
      <div className="surface-premium rounded-3xl p-6 space-y-4 text-center">
        <Crown className="w-10 h-10 mx-auto text-amber-600" />
        <h2 className="text-xl font-black text-slate-900">סעיפי חשיבה והבנה — פיצ׳ר Pro</h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
          זהו האימון לשאלות ה&quot;לא מוכר&quot; של הבגרות — ניתוח גרפים, השפעת פרמטרים,
          ונימוקים מילוליים. המורה בודק את ההסבר שלך ומראה איך לנסח תשובה לציון מלא.
        </p>
        <Link
          href="/pricing"
          className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-white"
        >
          שדרג ל-Pro
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading && !question && (
        <div className="surface-premium rounded-3xl p-8 text-center text-slate-500 text-sm">
          <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2 text-indigo-600" />
          מכין לך שאלת חשיבה…
        </div>
      )}

      {question && (
        <>
          <div className="surface-premium rounded-3xl p-5 space-y-3">
            <div className="text-xs font-black tracking-widest text-indigo-700 uppercase flex items-center gap-2">
              <Brain className="w-3.5 h-3.5" />
              <span>סעיף חשיבה והבנה · {topic}</span>
            </div>
            <div className="text-base sm:text-lg font-medium leading-relaxed text-slate-900 chat-md">
              <MathText>{question.question}</MathText>
            </div>
          </div>

          {!evaluation ? (
            <div className="space-y-2">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="הסבר במילים שלך — כמו שהיית כותב בבגרות…"
                rows={5}
                dir="auto"
                className="w-full surface-premium rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 transition-colors resize-y"
              />
              <button
                onClick={evaluate}
                disabled={!answer.trim() || evaluating}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 px-4 py-3 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/25 transition-colors"
              >
                {evaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>בודק את ההסבר שלך…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>בדוק את ההסבר שלי</span>
                  </>
                )}
              </button>
              {error && (
                <div className="text-xs text-rose-700 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Score */}
              <div className="surface-premium rounded-2xl p-5 text-center">
                <div className={`text-5xl font-black ${scoreColor(evaluation.score)}`}>
                  {evaluation.score}
                  <span className="text-lg text-slate-400">/100</span>
                </div>
                <div className="text-[11px] text-slate-500 font-bold mt-1">שלמות ההסבר</div>
              </div>

              {/* Covered */}
              {evaluation.coveredPoints.length > 0 && (
                <div className="surface-premium rounded-2xl p-4 space-y-2">
                  <div className="text-[10px] font-black tracking-widest text-emerald-700 uppercase">
                    מה שכיסית ✓
                  </div>
                  {evaluation.coveredPoints.map((p, i) => (
                    <div key={i} className="flex gap-2 items-start text-sm text-slate-800 chat-md">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <MathText inline>{p}</MathText>
                    </div>
                  ))}
                </div>
              )}

              {/* Missing */}
              {evaluation.missingPoints.length > 0 && (
                <div className="surface-premium rounded-2xl p-4 space-y-2">
                  <div className="text-[10px] font-black tracking-widest text-amber-700 uppercase">
                    מה שחסר
                  </div>
                  {evaluation.missingPoints.map((p, i) => (
                    <div key={i} className="flex gap-2 items-start text-sm text-slate-800 chat-md">
                      <XCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <MathText inline>{p}</MathText>
                    </div>
                  ))}
                </div>
              )}

              {/* Feedback */}
              {evaluation.feedback && (
                <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-2xl p-4 text-sm text-slate-800 chat-md leading-relaxed">
                  <MathText>{evaluation.feedback}</MathText>
                </div>
              )}

              {/* Model answer */}
              <div className="result-box rounded-2xl p-4">
                <button
                  onClick={() => setShowModel((v) => !v)}
                  className="text-xs font-black tracking-widest text-emerald-700 uppercase"
                >
                  תשובה לציון מלא {showModel ? '▲' : '▼'}
                </button>
                {showModel && (
                  <div className="mt-2 text-sm text-slate-800 chat-md leading-relaxed">
                    <MathText>{evaluation.modelAnswer}</MathText>
                  </div>
                )}
              </div>

              <button
                onClick={loadQuestion}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-3 rounded-2xl font-bold text-white shadow-lg shadow-emerald-500/25 transition-colors"
              >
                <span>שאלת חשיבה הבאה</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {error && !question && (
        <div className="text-center">
          <div className="text-sm text-rose-700 mb-2">{error}</div>
          <button
            onClick={loadQuestion}
            className="text-sm font-bold text-indigo-700 hover:text-indigo-900"
          >
            נסה שוב
          </button>
        </div>
      )}
    </div>
  );
}
