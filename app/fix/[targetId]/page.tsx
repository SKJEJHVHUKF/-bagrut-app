'use client';

// /fix/[targetId] — the repair session.
//
// Everything on this page is a render of `decideNext(path, progress)`. The page
// holds no rules of its own: what comes next, when to re-teach, when the
// weakness is closed and when to stop are all decided in lib/remediation/path,
// which is pure and unit-tested. A UI that re-implements any of that is a UI
// that will disagree with the tests.
//
// Deliberately OUTSIDE middleware's PROTECTED_PREFIXES, like /roadmap and
// /practice: everything it needs is in localStorage, and keeping it public is
// what makes the whole flow verifiable in a browser without a login.
//
// The question itself is rendered by the shared QuestionRunnerCard — the same
// component the ladder and the daily review use. It already handles hints, the
// free retry, the worked solution, the per-distractor "why you got it wrong",
// answer checking and the review scheduling. A second runner would be a second
// place for all of that to drift.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { QuestionRunnerCard } from '@/components/roadmap/QuestionRunnerCard';
import { FixIntroCard } from '@/components/fix/FixIntroCard';
import { ReteachCard } from '@/components/fix/ReteachCard';
import { FixSummary } from '@/components/fix/FixSummary';
import { getSubTopic } from '@/content/lessons';
import { celebrateCompletion } from '@/lib/confetti';
import {
  consumeReteach,
  decideNext,
  getHealedMap,
  getWeaknesses,
  misconceptionInsight,
  resolveStepQuestion,
  setActiveFix,
  startFix,
  submitFixAnswer,
  summarise,
  type ActiveFix,
} from '@/lib/remediation';

const SUBJECT = 'math5';

type Failure = 'unknown-target' | 'no-supply' | 'already-healed';

export default function FixPage() {
  const params = useParams();
  const raw = params?.targetId;
  const targetId = decodeURIComponent(Array.isArray(raw) ? raw[0] : raw ?? '');

  const [ready, setReady] = useState(false);
  const [fix, setFix] = useState<ActiveFix | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [nextWeakness, setNextWeakness] = useState<{ id: string; title: string } | null>(null);

  // Start (or resume) the session once, on mount.
  //
  // This one really does setState synchronously, and the rule is right about
  // what that costs: one extra render on mount. It stays because `startFix`
  // WRITES — it creates or resumes a persisted repair session — so it cannot
  // move into a render-phase read the way the localStorage reads elsewhere in
  // this app did. Removing the second render means starting the session before
  // the page renders (a server component or a route handler), which is a
  // larger change than this cleanup.
  /* eslint-disable react-hooks/set-state-in-effect -- see the note above. */
  useEffect(() => {
    if (!targetId) {
      setFailure('unknown-target');
      setReady(true);
      return;
    }
    const res = startFix(targetId, SUBJECT);
    if (res.ok) {
      setFix(res.fix);
    } else if (res.reason === 'unknown-target' && getHealedMap()[targetId]) {
      // Not unknown — already repaired. Saying "we couldn't find that" about
      // something the student fixed last week reads as a bug.
      setFailure('already-healed');
    } else {
      setFailure(res.reason);
    }
    setReady(true);
  }, [targetId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const decision = useMemo(
    () => (fix ? decideNext(fix.path, fix.progress) : null),
    [fix],
  );

  // The step's question, resolved from static content.
  const currentQuestion = useMemo(() => {
    if (!fix || !decision) return null;
    if (decision.kind !== 'question' && decision.kind !== 'reteach') return null;
    return resolveStepQuestion(fix.path, decision.step);
  }, [fix, decision]);

  // Content renamed since the path was built: drop the orphaned step rather
  // than showing a blank card. Done in an effect, never during render.
  //
  // `setActiveFix` persists the pruned path, so this is a write, not a read;
  // the local `setFix` keeps the component in step with what was just written.
  // Deriving the pruned path during render instead would be circular —
  // `decision` and `currentQuestion` are themselves derived from `fix`.
  /* eslint-disable react-hooks/set-state-in-effect -- see the note above. */
  useEffect(() => {
    if (!fix || !decision) return;
    if (decision.kind !== 'question' && decision.kind !== 'reteach') return;
    if (currentQuestion) return;
    const pruned = {
      ...fix.path,
      steps: fix.path.steps.filter((s) => s.questionId !== decision.step.questionId),
    };
    setActiveFix(pruned, fix.progress);
    setFix({ path: pruned, progress: fix.progress });
  }, [fix, decision, currentQuestion]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // The question they just got wrong — the re-teach is built from THAT, never
  // from the question that comes next (which would hand over its solution).
  const failedQuestion = useMemo(() => {
    if (!fix) return null;
    const lastMiss = [...fix.progress.answered].reverse().find((a) => !a.correct);
    if (!lastMiss) return null;
    const step = fix.path.steps.find((s) => s.questionId === lastMiss.questionId);
    return step ? resolveStepQuestion(fix.path, step) : null;
  }, [fix]);

  const keyPoints = useMemo(() => {
    if (!fix) return [];
    return getSubTopic(fix.path.subject, fix.path.topic, fix.path.subTopicId)?.keyPoints ?? [];
  }, [fix]);

  const finishUp = useCallback(
    (current: ActiveFix) => {
      const others = getWeaknesses(SUBJECT).filter((w) => w.id !== current.path.targetId);
      setNextWeakness(others[0] ? { id: others[0].id, title: others[0].title } : null);
    },
    [],
  );

  function onResolved(firstTryCorrect: boolean) {
    if (!decision || decision.kind !== 'question') return;
    const next = submitFixAnswer(decision.step.questionId, firstTryCorrect);
    if (!next) return;
    setFix(next);
    if (next.progress.status !== 'active') {
      if (next.progress.status === 'healed') celebrateCompletion();
      finishUp(next);
    }
  }

  function onReteachRead() {
    const next = consumeReteach();
    if (next) setFix(next);
  }

  const learnHref = fix
    ? `/roadmap/${encodeURIComponent(fix.path.subTopicId)}?level=learn`
    : '/roadmap';

  return (
    <PracticeShell subtitle="מסלול תיקון" backHref="/roadmap" backLabel="למפה">
      {!ready ? (
        <div className="text-center text-sm text-slate-500 py-16">טוען…</div>
      ) : failure || !fix || !decision ? (
        <FailureState reason={failure ?? 'unknown-target'} />
      ) : (
        <div className="space-y-4">
          {decision.kind !== 'healed' && decision.kind !== 'paused' && (
            <FixIntroCard
              title={fix.path.title}
              detail={fix.path.detail}
              kind={fix.path.kind}
              band={fix.path.band}
              total={fix.path.steps.length}
              compact={fix.progress.answered.length > 0}
            />
          )}

          {/* A→B swap between question / re-teach / summary is a KEYED
              motion.div, never AnimatePresence — `mode="wait"` has stalled this
              exact kind of swap three separate times in this repo. */}
          <motion.div
            key={
              decision.kind === 'question' || decision.kind === 'reteach'
                ? `${decision.kind}-${decision.step.questionId}`
                : decision.kind
            }
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {decision.kind === 'reteach' && (
              <ReteachCard
                failedQuestion={failedQuestion}
                misconceptionInsight={misconceptionInsight(fix.path.misconceptionId)}
                keyPoints={keyPoints}
                onContinue={onReteachRead}
              />
            )}

            {decision.kind === 'question' && currentQuestion && (
              <QuestionRunnerCard
                key={decision.step.questionId}
                question={currentQuestion}
                position={decision.position}
                total={decision.total}
                subject={fix.path.subject}
                topic={fix.path.topic}
                subId={fix.path.subTopicId}
                source="fix"
                onResolved={onResolved}
              />
            )}

            {(decision.kind === 'healed' || decision.kind === 'paused') && (
              <FixSummary
                healed={decision.kind === 'healed'}
                pauseReason={decision.kind === 'paused' ? decision.reason : undefined}
                title={fix.path.title}
                answered={summarise(fix.progress).answered}
                correct={summarise(fix.progress).correct}
                learnHref={learnHref}
                nextWeakness={nextWeakness}
              />
            )}
          </motion.div>
        </div>
      )}
    </PracticeShell>
  );
}

/**
 * Nothing to repair. All three reasons are real and get their own words —
 * "something went wrong" would be a lie in two of the three cases.
 */
function FailureState({ reason }: { reason: Failure }) {
  const copy =
    reason === 'already-healed'
      ? {
          emoji: '✅',
          title: 'את זה כבר תיקנת',
          body: 'החולשה הזאת נסגרה, ולכן היא לא מוצעת שוב. אם היא תחזור בתרגול — נזהה ונחזיר אותה לכאן.',
        }
      : reason === 'no-supply'
        ? {
            emoji: '📚',
            title: 'אין מספיק תרגילים לתיקון ממוקד כאן',
            body: 'בתת-הנושא הזה אין כרגע מספיק שאלות כדי לבנות מסלול תיקון אמיתי. עדיף לחזור להסבר של השלב ואז לתרגל אותו רגיל.',
          }
        : {
            emoji: '🤔',
            title: 'לא מצאתי מה לתקן כאן',
            body: 'או שהמסלול הזה לא קיים, או שעדיין אין מספיק תשובות שלך בנושא כדי לדעת מה בדיוק נשבר. תרגל קצת ונחזור לזה.',
          };

  return (
    <div className="surface-premium rounded-3xl p-8 text-center space-y-3">
      <div className="text-4xl">{copy.emoji}</div>
      <h2 className="font-display text-xl font-black text-slate-900">{copy.title}</h2>
      <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">{copy.body}</p>
      <div className="flex flex-col gap-2 pt-1">
        <Link
          href="/roadmap"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-l from-cyan-700 to-violet-600 hover:from-cyan-700 hover:to-violet-500 px-5 py-3 rounded-2xl font-black text-white text-sm transition-colors"
        >
          <Wrench className="w-4 h-4" />
          <span>חזרה למפת הלמידה</span>
        </Link>
        <Link
          href="/errors"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-slate-500 hover:text-slate-700 text-sm transition-colors"
        >
          למחברת הטעויות שלי
        </Link>
      </div>
    </div>
  );
}
