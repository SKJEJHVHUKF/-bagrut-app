'use client';

// BagrutLevel — the 🎓 "בגרות" rung, the top of the ladder. Renders the
// sub-topic's tagged multi-part bagrut question(s) with the real practice
// card (deterministic checker + graded hints + grounded tutor). The student
// works each part; finishing awards stars from how many parts came out right.
//
// ONE QUESTION AT A TIME (2026-09-14). The rung used to stack every question on
// one page and grade all their parts together. That was fine at 1–3 questions;
// the owner then asked for at least 20 bagrut questions per stage ("לפחות 20
// תרגילים" on every rung, the בגרות rung included), and 20 four-part questions
// on one page is ~90 parts to finish in a single sitting before "סיימתי" means
// anything. So the rung now shows one question, grades that question's parts,
// and offers the next one; the question the student reached is remembered per
// sub-topic, so the 20 are actually reachable across visits.

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Flag, ChevronRight, ChevronLeft } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { QuestionPartCard, type PartDraft } from '@/components/practice/QuestionPartCard';
import { buttonTap } from '@/lib/animations';
import type { RoadmapLevel } from '@/lib/roadmap-levels';
import type { AttemptResult } from '@/lib/roadmap-progress';
import { LevelClearedPanel, LevelFailedPanel } from './ladder-ui';
import { useHydrated } from '@/lib/use-client-value';
import { clearRun, loadRun, loadRunIfNewer, saveRun } from '@/lib/level-run-resume';

/** What lib/level-run-resume stores for the bagrut rung. */
type StoredBagrutRun = {
  /** The rung's question ids — a changed rung does not resume a stale round. */
  sig: string;
  status: Record<string, 'correct' | 'wrong'>;
  isRetry: boolean;
  drafts: Record<string, PartDraft>;
  /** The question the student is on — the rung shows one at a time. */
  page?: number;
};

/** Which question of the rung the student reached, per sub-topic. A viewer
 *  convenience only: storage can be blocked, so every access is guarded. */
const positionKey = (subId: string) => `mathup:bagrut-rung:${subId}`;
function readPosition(subId: string, count: number): number {
  try {
    const n = Number(window.localStorage.getItem(positionKey(subId)));
    return Number.isInteger(n) && n > 0 && n < count ? n : 0;
  } catch {
    return 0;
  }
}
function writePosition(subId: string, n: number) {
  try {
    window.localStorage.setItem(positionKey(subId), String(n));
  } catch {
    /* storage blocked: the rung still works, it just starts at question 1 */
  }
}

export function BagrutLevel({
  subject,
  topic,
  subId,
  level,
  onSubmit,
  onBack,
  nextSubTopic,
  subTopicTitle,
}: {
  subject: string;
  topic: string;
  subId: string;
  level: RoadmapLevel;
  onSubmit: (score: number, total: number, opts?: { viaRetry?: boolean; force?: boolean }) => AttemptResult;
  onBack: () => void;
  /** The bagrut rung is the top of the ladder: "next" is the next sub-topic. */
  nextSubTopic?: { href: string; title?: string | null };
  subTopicTitle?: string;
}) {
  const [result, setResult] = useState<AttemptResult | null>(null);
  // Per-part outcome of the CURRENT question, keyed by "<questionId>.<partIndex>".
  const [status, setStatus] = useState<Record<string, 'correct' | 'wrong'>>({});
  const count = level.bagrut.length;
  // The page is restored with the round below, once storage is readable (a
  // server render has none): from the synced run when it has one, else from
  // this device's last position.
  const [qi, setQi] = useState(0);

  const q = level.bagrut[Math.min(qi, count - 1)];
  const totalParts = q?.parts.length ?? 0;
  // Only the current question's parts count: a restored round may carry others.
  const mine = Object.entries(status).filter(([id]) => q && id.startsWith(`${q.id}.`));
  const doneParts = mine.length;
  const correctParts = mine.filter(([, s]) => s === 'correct').length;

  function goTo(n: number) {
    const next = Math.max(0, Math.min(count - 1, n));
    setQi(next);
    writePosition(subId, next);
    setStatus({});
    setIsRetry(false);
    setResult(null);
    window.scrollTo({ top: 0 });
  }

  function setPart(id: string, outcome: 'correct' | 'wrong', force = false) {
    setStatus((prev) => {
      // A self-report overrides a prior auto-mark; an auto-mark never
      // downgrades an existing verdict.
      if (prev[id] && !force) return prev;
      return { ...prev, [id]: outcome };
    });
  }

  const [isRetry, setIsRetry] = useState(false);
  /** Every part's working state, keyed like `status` — so a student who leaves
   *  mid-question (typed answer, hints, a wrong check) comes back to it. */
  const [drafts, setDrafts] = useState<Record<string, PartDraft>>({});
  /** Bumped on a restore, to remount the part cards with the restored drafts. */
  const [restoreNonce, setRestoreNonce] = useState(0);
  const sig = level.bagrut.map((q) => q.id).join('|');

  function applyRun(raw: unknown) {
    const run = raw as Partial<StoredBagrutRun> | null;
    const ok = !!run && run.sig === sig;
    setStatus(ok ? (run.status ?? {}) : {});
    setIsRetry(ok ? !!run.isRetry : false);
    setDrafts(ok ? (run.drafts ?? {}) : {});
    const page = ok ? run.page : undefined;
    const hasPage = typeof page === 'number' && Number.isInteger(page) && page >= 0 && page < count;
    if (hasPage) setQi(page);
    setResult(null);
    setRestoreNonce((n) => n + 1);
    return hasPage;
  }

  // Resume the saved round once localStorage is readable (see RoadmapLevelRunner).
  const hydrated = useHydrated();
  const [restored, setRestored] = useState(false);
  if (hydrated && !restored) {
    setRestored(true);
    if (!applyRun(loadRun(topic, subId, level.kind))) setQi(readPosition(subId, count));
  }

  // A newer round arrived from another device through sync.
  useEffect(() => {
    const onSynced = () => {
      const next = loadRunIfNewer(topic, subId, level.kind);
      if (next !== undefined) applyRun(next);
    };
    window.addEventListener('bagrut-state-synced', onSynced);
    return () => window.removeEventListener('bagrut-state-synced', onSynced);
  });

  useEffect(() => {
    if (!restored) return;
    if (result) {
      clearRun(topic, subId, level.kind);
      return;
    }
    const touched = Object.keys(status).length > 0 || Object.values(drafts).some(
      (d) => d.hintsShown > 0 || d.stepsShown >= 0 || !!d.answer || d.parts.some(Boolean) || !!d.checkResult,
    );
    if (!touched && !isRetry && qi === 0) return; // nothing to resume yet
    const data: StoredBagrutRun = { sig, status, isRetry, drafts, page: qi };
    saveRun(topic, subId, level.kind, data);
  }, [restored, result, status, isRetry, drafts, qi, sig, topic, subId, level.kind]);

  // One stable callback per part: a fresh arrow each render would re-fire the
  // card's report effect on every render.
  const onPartDraft = useMemo(() => {
    const out: Record<string, (d: PartDraft) => void> = {};
    // Keyed like the part cards: by question id, since the rung shows one
    // question at a time and its index no longer names a card.
    level.bagrut.forEach((q) =>
      q.parts.forEach((_, pi) => {
        const id = `${q.id}.${pi}`;
        out[id] = (d) => setDrafts((prev) => ({ ...prev, [id]: d }));
      }),
    );
    return out;
  }, [level.bagrut, setDrafts]);

  function finish() {
    setResult(onSubmit(correctParts, totalParts, { viaRetry: isRetry }));
  }

  function retry() {
    setStatus({});
    setDrafts({});
    setRestoreNonce((n) => n + 1); // fresh part cards for the new attempt
    setIsRetry(true);
    setResult(null);
  }

  function continueAnyway() {
    setResult(onSubmit(correctParts, totalParts, { force: true }));
  }

  const hasNextQuestion = qi < count - 1;

  if (result) {
    if (result.passed) {
      return (
        <LevelClearedPanel
          level={level}
          result={result}
          nextSubTopic={nextSubTopic}
          subTopicTitle={subTopicTitle}
          onBack={onBack}
          onReplay={result.stars < 3 ? retry : undefined}
          nextQuestion={hasNextQuestion ? { label: `לשאלת הבגרות הבאה (${qi + 2} מתוך ${count})`, onClick: () => goTo(qi + 1) } : undefined}
        />
      );
    }
    return (
      <LevelFailedPanel
        level={level}
        score={result.score}
        total={result.total}
        required={result.requiredCorrect}
        missedCount={result.total - result.score}
        attempts={result.attempts}
        onRetry={retry}
        onContinueAnyway={continueAnyway}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800">
          → לסולם
        </button>
        <span className="font-black text-violet-700">🎓 רמת בגרות</span>
      </div>

      <div className="bg-gradient-to-br from-violet-600/10 to-violet-600/10 border border-violet-500/25 rounded-2xl p-4 flex gap-2.5 items-start">
        <Target className="w-4 h-4 text-violet-700 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-700 leading-relaxed">
          זו הרמה הגבוהה ביותר — שאלת בגרות אמיתית, רב-שלבית. פתור כמו בבחינה. אפשר לבדוק כל סעיף,
          לקבל רמז מדורג, או לשאול &quot;למה טעיתי?&quot; — המורה מעוגן בחומר הנושא.
        </p>
      </div>

      {q && (
        <section key={q.id} className="space-y-3">
          {count > 1 && (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => goTo(qi - 1)}
                disabled={qi === 0}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-900/5 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
                <span>הקודמת</span>
              </button>
              <div className="text-[11px] font-black tracking-widest text-slate-500">
                שאלה {qi + 1} מתוך {count}
              </div>
              <button
                onClick={() => goTo(qi + 1)}
                disabled={!hasNextQuestion}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-900/5 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <span>הבאה</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
          {/* Sticky, same reason as the ghost rung: the question sat at the top
              and scrolled away as soon as the student opened a part, so working
              on סעיף ג meant scrolling back up to re-read the givens.

              The cap was 35vh — about a third of the screen — so a question
              carrying a figure scrolled inside its own box. Itay, 2026-09-05:
              "שלא תהיה את הגלילה הזו בשאלה אלא שפשוט השאלה תהיה על דף מלא".
              65vh fits the geometry questions with their sketches whole, and
              `overflow-y-auto` renders no scrollbar at all once the content
              fits, so the bar disappears rather than just moving. Some cap has
              to stay while the box is sticky: without one, a long question
              would cover the answer area it is pinned above. */}
          {q.context && (
            <div className="sticky top-[58px] md:top-[104px] z-30 rounded-2xl border border-slate-900/10 bg-[var(--background)]/95 backdrop-blur-md p-4 chat-md text-sm text-slate-900 leading-relaxed shadow-sm max-h-[65vh] overflow-y-auto">
              <div className="text-[10px] font-black tracking-widest text-violet-700 uppercase mb-1">השאלה</div>
              <MathText>{q.context}</MathText>
            </div>
          )}
          {q.parts.map((part, pi) => {
            // Keyed by the question id so moving to another question remounts
            // every part card instead of carrying the previous one's state over.
            const id = `${q.id}.${pi}`;
            return (
              <QuestionPartCard
                key={`${restoreNonce}-${id}`}
                part={part}
                subject={subject}
                topic={topic}
                context={q.context}
                subTopicId={q.subTopicId}
                questionId={`${q.id}-${part.label}`}
                difficulty={q.difficulty}
                onDone={() => setPart(id, 'correct')}
                onSelfAssess={(correct) => setPart(id, correct ? 'correct' : 'wrong', true)}
                draft={drafts[id] ?? null}
                onDraft={onPartDraft[id]}
              />
            );
          })}
        </section>
      )}

      <div className="surface-premium rounded-2xl p-4 space-y-3">
        <div className="text-center text-sm text-slate-600">
          {doneParts === 0
            ? 'עבוד על הסעיפים — ואז סמן שסיימת.'
            : `השלמת ${doneParts} מתוך ${totalParts} סעיפים · ${correctParts} נכונים`}
        </div>
        <motion.button
          {...buttonTap}
          onClick={finish}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-5 py-3 rounded-2xl font-black text-white shadow-lg shadow-amber-500/30 transition-colors"
        >
          <Flag className="w-4 h-4" />
          <span>סיימתי את שאלת הבגרות</span>
        </motion.button>
      </div>
    </div>
  );
}
