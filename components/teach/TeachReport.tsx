'use client';

/**
 * TeachReport — the end of a "למד את הבוט" session.
 *
 * ⚠️ THIS NO LONGER WRITES TO THE MISTAKE NOTEBOOK, deliberately.
 *
 * The first version wrote one `recordMistake` per uncovered point, tagged
 * `'אחר'` because no existing ErrorCategory fits "couldn't explain it". Two
 * sessions were enough to make /errors report "100% מהטעויות שלך הן מסוג אחר"
 * and name אחר as "הטעות מספר 1 שלך" — a working feature degraded into noise by
 * a feature that had nothing real to say to it. The records also had no
 * `questionId` and no `correctAnswer`, so they rendered as dead cards the
 * student could neither practise nor re-tag.
 *
 * What survives is the part that was genuinely useful: scheduling ONE real
 * question from the sub-topic for spaced review, which goes through the normal
 * review path and resolves to actual content.
 *
 * The report also has to be a way BACK INTO LEARNING, not a scorecard. Every
 * uncovered point links to the guided lesson rung that teaches it.
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, RotateCcw, BookOpen, AlertTriangle } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { seedFromMiss } from '@/lib/review';
import { getSubTopic } from '@/content/lessons';
import { celebrateCompletion, sparkle } from '@/lib/confetti';
import type { Rubric } from '@/lib/teach/rubric';

/**
 * The question scheduled for review. Prefer a `mid` one: an `easy` drill rarely
 * exercises the idea the explanation was missing, and a `hard` one punishes a
 * student who has just been told they have a gap.
 */
function reviewQuestionId(subject: string, topic: string, subTopicId: string): string | null {
  const qs = getSubTopic(subject, topic, subTopicId)?.questions ?? [];
  if (!qs.length) return null;
  return (qs.find((q) => q.difficulty === 'mid') ?? qs[0]).id;
}

export function TeachReport({
  rubric,
  covered,
  hadWrongMath,
  misconception,
  onRestart,
}: {
  rubric: Rubric;
  covered: string[];
  /** True if anything the student said this session was wrong OR imprecise.
   *  A full checklist earned on shaky maths must not end in confetti. */
  hadWrongMath: boolean;
  /** The first thing that went wrong, in נועה's words. Without this the banner
   *  could only say that "something" was inaccurate — which tells the student
   *  nothing and guarantees the misconception survives the session. */
  misconception?: string;
  onRestart: () => void;
}) {
  const missed = rubric.points.filter((p) => !covered.includes(p.id));
  const hit = rubric.points.length - missed.length;
  const clean = missed.length === 0 && !hadWrongMath;

  const learnHref = `/roadmap/${rubric.subTopicId}?level=learn`;

  const doneRef = useRef(false);
  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    if (clean) celebrateCompletion();
    else sparkle();

    // Only schedule review when there is actually a gap to close.
    if (missed.length === 0 && !hadWrongMath) return;
    const qid = reviewQuestionId(rubric.subject, rubric.topic, rubric.subTopicId);
    if (qid) {
      seedFromMiss({
        subject: rubric.subject,
        topic: rubric.topic,
        subTopicId: rubric.subTopicId,
        questionId: qid,
      });
    }
    // Intentionally runs once per mounted report — see doneRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="surface-premium rounded-3xl p-5 space-y-5">
      <div className="text-center space-y-1">
        <div className="text-4xl">{clean ? '🎓' : '📘'}</div>
        <h2 className="font-display text-2xl font-black text-slate-900">
          {clean ? 'לימדת את זה כמו שצריך!' : 'סיימת ללמד'}
        </h2>
        <p className="text-sm text-slate-600">
          נועה הבינה ממך <strong className="text-indigo-700">{hit}</strong> מתוך{' '}
          <strong>{rubric.points.length}</strong> הדברים ב&quot;{rubric.title}&quot;.
        </p>
      </div>

      {hadWrongMath && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            {misconception ? (
              <p className="text-sm text-slate-900 font-bold chat-md math-content">
                <MathText inline>{misconception}</MathText>
              </p>
            ) : null}
            <p className="text-sm text-slate-800 leading-relaxed">
              משהו שאמרת במהלך ההסבר לא היה מדויק. להסביר משהו בביטחון בניסוח שגוי זה בדיוק
              מה שנתקע בבגרות — שווה לחזור ללומדים לפני שממשיכים.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {rubric.points.map((p) => {
          const ok = covered.includes(p.id);
          return (
            <div
              key={p.id}
              className={
                ok
                  ? 'flex gap-2 items-start bg-emerald-500/[0.07] border border-emerald-500/25 rounded-xl px-3 py-2.5'
                  : 'flex gap-2 items-start bg-slate-900/[0.03] border border-slate-900/10 rounded-xl px-3 py-2.5'
              }
            >
              <span className="flex-shrink-0 mt-0.5">
                {ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-500" />
                )}
              </span>
              {/* chat-md on this inner div, never on the flex row — every
                  .chat-md rule is a descendant selector. */}
              <div className="flex-1 min-w-0 text-sm chat-md text-slate-800 math-content">
                <MathText inline>{p.text}</MathText>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gated on `!clean`, not on `missed.length` — the wrong-maths banner
          above tells the student to go back to the lesson, and when the
          checklist is full but the maths was shaky that advice used to come
          with no link to follow. */}
      {!clean && (
        <div className="bg-indigo-500/[0.06] border border-indigo-500/25 rounded-2xl px-4 py-3 space-y-2">
          <p className="text-sm text-slate-800 leading-relaxed">
            <strong className="text-slate-900">אם אתה לא מצליח להסביר את זה — אתה עוד לא באמת יודע את זה.</strong>{' '}
            זה בדיוק מה שכדאי לחזור עליו.
          </p>
          <Link
            href={learnHref}
            className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-indigo-50 border border-indigo-500/30 px-4 py-2.5 rounded-xl font-bold text-indigo-800 text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            חזור ללומדים בתת-הנושא הזה
          </Link>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={onRestart}
          className="w-full inline-flex items-center justify-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 px-4 py-2.5 rounded-xl font-bold text-slate-700 text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          ללמד תת-נושא אחר
        </button>
      </div>
    </div>
  );
}
