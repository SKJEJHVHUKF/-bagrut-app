'use client';

/**
 * TeachReport — the end of a "למד את הבוט" session.
 *
 * The payoff isn't a score, it's the gap list: the rubric points the student
 * never managed to say out loud. Those are written into the SAME מחברת טעויות
 * as a wrong answer, and one real question from the sub-topic is scheduled for
 * spaced review — so teaching feeds the rest of the app instead of being a
 * novelty that ends when you close the tab.
 *
 * The write happens exactly once per session (see `writtenRef`) — a re-render
 * must not duplicate mistake records.
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, RotateCcw, NotebookPen } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { recordMistake } from '@/lib/mistakes';
import { seedFromMiss } from '@/lib/review';
import { getSubTopic } from '@/content/lessons';
import { celebrateCompletion, sparkle } from '@/lib/confetti';
import type { Rubric } from '@/lib/teach/rubric';

/**
 * The question we schedule for review when the student couldn't explain
 * something. Prefer a `mid` one: an `easy` drill rarely exercises the idea the
 * explanation was missing, and a `hard` one punishes a student who has just
 * been told they have a gap.
 */
function reviewQuestionId(subject: string, topic: string, subTopicId: string): string | null {
  const qs = getSubTopic(subject, topic, subTopicId)?.questions ?? [];
  if (!qs.length) return null;
  return (qs.find((q) => q.difficulty === 'mid') ?? qs[0]).id;
}

export function TeachReport({
  rubric,
  covered,
  onRestart,
}: {
  rubric: Rubric;
  covered: string[];
  onRestart: () => void;
}) {
  const missed = rubric.points.filter((p) => !covered.includes(p.id));
  const hit = rubric.points.length - missed.length;
  const perfect = missed.length === 0;

  const writtenRef = useRef(false);
  useEffect(() => {
    if (writtenRef.current) return;
    writtenRef.current = true;

    if (perfect) {
      celebrateCompletion();
      return;
    }
    sparkle();

    for (const point of missed) {
      recordMistake({
        subject: rubric.subject,
        topic: rubric.topic,
        subTopicId: rubric.subTopicId,
        // No questionId — this is a concept the student couldn't articulate,
        // not a question they got wrong. The text IS the finding.
        questionText: `לא הצלחת להסביר: ${point.text}`,
        category: 'אחר',
        source: 'teach',
      });
    }

    // Schedule ONE real question so the gap comes back through the normal
    // review path. A fabricated questionId here would create a review item
    // that `resolveQuestion` can never resolve — a silent hole in the queue.
    const qid = reviewQuestionId(rubric.subject, rubric.topic, rubric.subTopicId);
    if (qid) {
      seedFromMiss({
        subject: rubric.subject,
        topic: rubric.topic,
        subTopicId: rubric.subTopicId,
        questionId: qid,
      });
    }
  }, [missed, perfect, rubric]);

  return (
    <div className="surface-premium rounded-3xl p-5 space-y-5">
      <div className="text-center space-y-1">
        <div className="text-4xl">{perfect ? '🎓' : '📓'}</div>
        <h2 className="font-display text-2xl font-black text-slate-900">
          {perfect ? 'לימדת את כל מה שצריך!' : 'סיימת ללמד'}
        </h2>
        <p className="text-sm text-slate-600">
          כיסית <strong className="text-indigo-700">{hit}</strong> מתוך{' '}
          <strong>{rubric.points.length}</strong> הנקודות הקריטיות ב&quot;{rubric.title}&quot;.
        </p>
      </div>

      <div className="space-y-1.5">
        {rubric.points.map((p) => {
          const ok = covered.includes(p.id);
          return (
            <div
              key={p.id}
              className={
                ok
                  ? 'flex gap-2 items-start bg-emerald-500/[0.07] border border-emerald-500/25 rounded-xl px-3 py-2.5'
                  : 'flex gap-2 items-start bg-amber-500/[0.07] border border-amber-500/30 rounded-xl px-3 py-2.5'
              }
            >
              <span className="flex-shrink-0 mt-0.5">
                {ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Circle className="w-4 h-4 text-amber-600" />
                )}
              </span>
              {/* chat-md sits on this inner div, never on the flex row above —
                  every .chat-md rule is a descendant selector. */}
              <div className="flex-1 min-w-0 text-sm chat-md text-slate-800 math-content">
                <MathText inline>{p.text}</MathText>
              </div>
            </div>
          );
        })}
      </div>

      {!perfect && (
        <div className="bg-slate-900/[0.03] border border-slate-900/10 rounded-2xl px-4 py-3 space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-amber-700 uppercase">
            <NotebookPen className="w-3.5 h-3.5" />
            נשמר לך
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            מה שלא הצלחת להסביר נכנס למחברת הטעויות, ושאלה מתת-הנושא הזה נקבעה לחזרה.
            <strong className="text-slate-900"> אם אתה לא מצליח להסביר את זה — אתה עוד לא באמת יודע את זה.</strong>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 px-3 py-2.5 rounded-xl font-bold text-slate-700 text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          ללמד תת-נושא אחר
        </button>
        <Link
          href="/errors"
          className="inline-flex items-center justify-center gap-2 btn-primary px-3 py-2.5 rounded-xl font-bold text-white text-sm"
        >
          מחברת הטעויות
        </Link>
      </div>
    </div>
  );
}
