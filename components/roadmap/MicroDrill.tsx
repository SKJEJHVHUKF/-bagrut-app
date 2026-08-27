'use client';

// MicroDrill — the "micro-loop" inline exercise inside a learn-level step:
// idea → worked example → NOW YOU TRY. One short question answered on the
// spot, with instant feedback + the full solution. Formative only — it is
// NOT scored into the ladder stars and not logged as a measurement.

import { useEffect, useMemo, useState } from 'react';
import { publishTutorFocus, FOCUS_PRIORITY } from '@/lib/tutor-presence';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, CheckCircle, XCircle, KeyRound, Lightbulb, RotateCcw } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { celebrateCorrect } from '@/lib/confetti';
import { seededOrder } from '@/lib/shuffle';
import { voiceCorrect, voiceWrong } from '@/lib/voice';
import type { PracticeQuestion } from '@/content/lessons/types';

const LETTERS = ['א', 'ב', 'ג', 'ד'];

export function MicroDrill({
  drill,
  onAnswered,
}: {
  drill: PracticeQuestion;
  /** Fired once, the first time the student answers — `correct` is the MCQ
   *  outcome (open drills report true on reveal). Lets the learn rung gate on
   *  engagement. */
  onAnswered?: (correct: boolean) => void;
}) {
  // THREE tries before the answer is handed over. A one-shot drill that opened
  // the full solution on the first click taught nothing to the student who was
  // one careless step away — they read the answer instead of finding it. First
  // miss opens the authored hint, second miss says "one try left", third miss
  // reveals. The FIRST attempt is still the one reported to the rung.
  const MAX_TRIES = 3;
  const [selected, setSelected] = useState<number | null>(null); // original index, last pick
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false); // open drills only
  const correct = selected !== null && selected === drill.correct;
  const outOfTries = wrongPicks.length >= MAX_TRIES;
  /** The solution is on screen — right answer, tries exhausted, or open drill. */
  const answered = correct || outOfTries || revealed;

  // ===== the drill IS the question on screen =====
  // This sits inside the learn rung, which publishes its own sub-topic context
  // at `lesson` priority. Both publish; `question` is more specific and wins,
  // so the tutor sees the drill rather than "you are in a lesson" — and neither
  // component has to know the other exists.
  useEffect(() => {
    publishTutorFocus(
      'micro-drill',
      {
        where: 'תרגול קצר',
        questionText: drill.question,
        question: drill,
        ...(selected !== null && selected !== drill.correct
          ? { chosenIndex: selected, wrongAnswer: drill.answers?.[selected] }
          : {}),
      },
      FOCUS_PRIORITY.question,
    );
    return () => publishTutorFocus('micro-drill', null);
  }, [drill, selected]);

  // Deterministic per-drill option order (seeded by id) so the correct answer
  // isn't always first. Stable across renders and SSR-safe.
  const order = useMemo(
    () => (drill.kind === 'mcq' ? seededOrder(drill.answers?.length ?? 0, drill.id) : []),
    [drill],
  );

  function pick(i: number) {
    if (answered || wrongPicks.includes(i)) return;
    setSelected(i);
    const isRight = i === drill.correct;
    if (isRight) celebrateCorrect();
    else setWrongPicks((prev) => [...prev, i]);
    // Fires ONCE, on the first pick — the rung scores the first attempt, so the
    // extra tries are for learning and cost nothing.
    if (selected === null && wrongPicks.length === 0) onAnswered?.(isRight);
  }

  return (
    <div className="mt-3 rounded-2xl border border-violet-500/30 bg-violet-500/[0.05] p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-400/40 flex items-center justify-center flex-shrink-0">
          <Pencil className="w-3.5 h-3.5 text-violet-700" />
        </div>
        <span className="text-[10px] font-black tracking-widest text-violet-700 uppercase">
          עכשיו אתה — תרגיל קצר
        </span>
      </div>

      <div className="chat-md text-sm text-slate-900 leading-relaxed mb-2">
        <MathText>{drill.question}</MathText>
      </div>

      {/* MCQ micro-drill */}
      {drill.kind === 'mcq' && drill.answers && (
        <div className="space-y-1.5">
          {order.map((origIdx, i) => {
            const ans = drill.answers![origIdx];
            const isCorrect = origIdx === drill.correct;
            const isWrongPick = wrongPicks.includes(origIdx);
            let cls = 'bg-white/70 hover:bg-white border-slate-900/10 text-slate-900';
            if (answered && isCorrect) cls = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900';
            else if (isWrongPick) cls = 'bg-rose-500/15 border-rose-500/50 text-rose-800';
            else if (answered) cls = 'bg-white/40 border-slate-900/[0.06] text-slate-500';
            return (
              <button
                key={origIdx}
                onClick={() => pick(origIdx)}
                disabled={answered || isWrongPick}
                className={`w-full text-right px-3 py-2 rounded-xl border transition-colors chat-md text-sm ${cls}`}
              >
                <span className="font-bold opacity-60 ml-2">{LETTERS[i]}.</span>
                <MathText inline>{ans}</MathText>
              </button>
            );
          })}
        </div>
      )}

      {/* Missed, but still has tries left: the hint first, then a nudge. The
          solution stays closed — that is the whole point of the extra tries. */}
      {drill.kind === 'mcq' && !answered && wrongPicks.length > 0 && (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm font-bold text-rose-700">
            <XCircle className="w-4 h-4" /> לא מדויק — יש לך עוד {MAX_TRIES - wrongPicks.length} ניסיונות.
          </div>
          {drill.hint && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900">
              <Lightbulb className="mt-0.5 w-4 h-4 flex-shrink-0 text-amber-700" />
              <div className="chat-md min-w-0 flex-1"><MathText>{drill.hint}</MathText></div>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <RotateCcw className="w-3 h-3" /> בחר תשובה אחרת.
          </div>
        </div>
      )}

      {/* Open micro-drill — solve on paper, reveal to compare */}
      {drill.kind === 'open' && !revealed && (
        <button
          onClick={() => { setRevealed(true); onAnswered?.(true); }}
          className="w-full inline-flex items-center justify-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/40 px-3 py-2 rounded-xl font-bold text-violet-800 text-sm transition-colors"
        >
          <KeyRound className="w-4 h-4" />
          <span>פתרתי — הצג פתרון להשוואה</span>
        </button>
      )}

      {/* Feedback + solution */}
      <AnimatePresence initial={false}>
        {answered && (
          <motion.div
            key="sol"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            {selected !== null && (
              <div
                className={`mt-2 flex items-center gap-1.5 text-sm font-bold ${
                  correct ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>
                  {correct
                    ? wrongPicks.length > 0
                      ? 'יפה — הגעת לתשובה הנכונה.'
                      : voiceCorrect(drill.id)
                    : voiceWrong(drill.id)}
                </span>
              </div>
            )}
            {/* Roomier than it was: at space-y-1.5 the steps read as one block of
                text and students could not tell where a step ended. space-y-3
                was still too tight to read as separate steps — see the same
                widening in QuestionRunnerCard. */}
            <div className="mt-2 bg-white/80 border border-slate-900/[0.08] rounded-xl p-4 space-y-5">
              {drill.solution.steps.map((s, i) => (
                <div key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-800 chat-md">
                  <span className="font-black text-violet-600 flex-shrink-0">{i + 1}.</span>
                  <MathText>{s}</MathText>
                </div>
              ))}
              <div className="pt-2 mt-1 border-t border-slate-900/[0.06] text-sm font-bold text-emerald-800 chat-md">
                <MathText inline>{drill.solution.finalAnswer}</MathText>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
