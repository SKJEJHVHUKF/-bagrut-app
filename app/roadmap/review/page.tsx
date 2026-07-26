'use client';

// /roadmap/review — the daily spaced-repetition session. Re-serves the
// questions the student has missed (or that are due for a memory check),
// mixed across topics, using the same QuestionRunnerCard as the ladder. Each
// answer re-schedules its card (lib/review). No stars — review is retention,
// not a rung — but it feeds the streak and the mistake notebook.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowLeft, PartyPopper } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { QuestionRunnerCard } from '@/components/roadmap/QuestionRunnerCard';
import { dueItems, resolveQuestion, backfillFromMistakes, type ReviewItem } from '@/lib/review';
import { celebrateCompletion } from '@/lib/confetti';
import type { PracticeQuestion } from '@/content/lessons/types';

type Card = { item: ReviewItem; q: PracticeQuestion };

export default function ReviewPage() {
  const [ready, setReady] = useState(false);
  const [queue, setQueue] = useState<Card[]>([]);
  const [pos, setPos] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    backfillFromMistakes();
    const resolved = dueItems(Date.now(), 15)
      .map((item) => ({ item, q: resolveQuestion(item) }))
      .filter((c): c is Card => c.q !== null);
    setQueue(resolved);
    setReady(true);
  }, []);

  function onResolved(firstTryCorrect: boolean) {
    if (firstTryCorrect) setCorrect((c) => c + 1);
    if (pos + 1 < queue.length) {
      setPos((p) => p + 1);
    } else {
      setDone(true);
      celebrateCompletion();
    }
  }

  return (
    <PracticeShell subtitle="חזרה יומית" backHref="/roadmap" backLabel="למפה">
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <div className="text-3xl">🔁</div>
          <h1 className="font-display text-2xl font-black text-slate-900">חזרה יומית</h1>
          {ready && queue.length > 0 && !done && (
            <p className="text-sm text-slate-600">
              {queue.length} שאלות שכדאי לחזור עליהן — שאלה {pos + 1} מתוך {queue.length}
            </p>
          )}
        </div>

        {!ready ? (
          <div className="text-center text-sm text-slate-500 py-10">טוען…</div>
        ) : queue.length === 0 ? (
          <div className="surface-premium rounded-3xl p-8 text-center space-y-3">
            <PartyPopper className="w-10 h-10 mx-auto text-emerald-500" />
            <div className="font-black text-slate-900">אין שאלות לחזרה כרגע 🎉</div>
            <p className="text-sm text-slate-600 leading-relaxed">
              שאלות שתטעה בהן יופיעו כאן למחרת, כדי לוודא שהחומר באמת נכנס. בינתיים —
              המשך במסלול.
            </p>
            <Link
              href="/roadmap"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-violet-600 px-5 py-2.5 rounded-2xl font-bold text-white text-sm"
            >
              חזרה למפה <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        ) : done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="surface-premium rounded-3xl p-8 text-center space-y-3"
          >
            <RotateCcw className="w-10 h-10 mx-auto text-indigo-500" />
            <div className="font-display text-xl font-black text-slate-900">סיימת את החזרה היומית!</div>
            <p className="text-sm text-slate-600">
              חזרת על {queue.length} שאלות · {correct} נכונות בניסיון ראשון. השאלות שטעית בהן יחזרו
              שוב בקרוב, וזה בדיוק מה שמקבע את החומר.
            </p>
            <Link
              href="/roadmap"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 px-5 py-2.5 rounded-2xl font-bold text-white text-sm"
            >
              חזרה למפה <ArrowLeft className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <QuestionRunnerCard
            key={`${pos}-${queue[pos].item.questionId}`}
            question={queue[pos].q}
            position={pos + 1}
            total={queue.length}
            subject={queue[pos].item.subject}
            topic={queue[pos].item.topic}
            subId={queue[pos].item.subTopicId}
            source="review"
            onResolved={onResolved}
          />
        )}
      </div>
    </PracticeShell>
  );
}
