'use client';

/**
 * TeachSession — the student teaches, נועה (the model) plays the classmate.
 *
 * TWO DESIGN RULES EARNED THE HARD WAY:
 *
 * 1. THE CHECKLIST TEXT IS HIDDEN UNTIL EARNED. The first version printed every
 *    rubric point verbatim above the composer. That turned "teaching" into
 *    reading four sentences off the screen and paraphrasing them — the score
 *    measured transcription, not understanding. Now an unearned point is an
 *    anonymous locked slot: the student still sees progress (2/5) and still
 *    feels the pull of what's missing, but the answers are not on screen.
 *
 * 2. NO STATE CAN STRAND THE STUDENT. The composer used to be the only route
 *    back to `send()`, and the "finish" button lived inside it — so any error
 *    or the daily-quota 429 removed every control on the page and silently
 *    destroyed the session. The finish button now lives outside every wall, and
 *    errors are retryable.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Send,
  CheckCircle2,
  Lock,
  GraduationCap,
  Crown,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { AnswerInput } from '@/components/practice/AnswerInput';
import { symbolsForTopic } from '@/components/practice/MathSymbolBar';
import { TeachReport } from './TeachReport';
import { buildRubric } from '@/lib/teach/rubric';
import { TEACH_MAX_TURNS, MAX_TEACH_MESSAGE_LEN } from '@/lib/agents/config';
import { getUnitLevel, getPaper } from '@/lib/study-plan';
import type { TeachResponse, Correctness } from '@/lib/teach/schemas';

type Turn = { role: 'user' | 'assistant'; content: string };

type Wall =
  | { kind: 'none' }
  | { kind: 'auth' }
  | { kind: 'quota'; message: string; proRequired: boolean }
  | { kind: 'error'; message: string };

export function TeachSession({
  subject,
  topic,
  subTopicId,
  onRestart,
}: {
  subject: string;
  topic: string;
  subTopicId: string;
  onRestart: () => void;
}) {
  // Memoised: this walks the content registry and its result feeds KaTeX
  // rendering. Recomputing it on every keystroke re-parsed every formula.
  const rubric = useMemo(
    () => buildRubric(subject, topic, subTopicId),
    [subject, topic, subTopicId]
  );

  const [turns, setTurns] = useState<Turn[]>([]);
  const [covered, setCovered] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [wall, setWall] = useState<Wall>({ kind: 'none' });
  const [finished, setFinished] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  /** Whether anything the student said this session was mathematically wrong.
   *  Gates the celebration — a session cannot end in confetti on bad math. */
  const [everWrong, setEverWrong] = useState(false);
  const [lastCorrectness, setLastCorrectness] = useState<Correctness>('none');
  /** The first thing the student got wrong, in נועה's words. Generated and paid
   *  for on every turn; without this it was thrown away, leaving the report to
   *  say only that "something" was wrong. */
  const [misconception, setMisconception] = useState('');

  const scrollRef = useRef<HTMLDivElement | null>(null);
  // React 19 StrictMode mounts twice in dev. Without this guard the opening
  // turn fires twice and burns two calls off the daily cap.
  const openedRef = useRef(false);
  /** The last message we tried to send, so an error is retryable. */
  const lastSentRef = useRef<{ message: string; history: Turn[]; covered: string[] } | null>(null);

  const studentTurns = turns.filter((t) => t.role === 'user').length;
  const allCovered = !!rubric && rubric.points.length > 0 && covered.length >= rubric.points.length;
  const outOfTurns = studentTurns >= TEACH_MAX_TURNS;
  const ended = finished || allCovered || outOfTurns;

  const send = useCallback(
    async (message: string, history: Turn[], coveredSoFar: string[]) => {
      lastSentRef.current = { message, history, covered: coveredSoFar };
      setLoading(true);
      setWall({ kind: 'none' });
      try {
        const res = await fetch('/api/teach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject,
            topic,
            subTopicId,
            message,
            history,
            covered: coveredSoFar,
            unitLevel: getUnitLevel(),
            formNumber: getPaper() ?? undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.status === 401) {
          setWall({ kind: 'auth' });
          return false;
        }
        if (res.status === 429) {
          // Not every 429 is the daily cap. The guard also returns 429 for the
          // per-minute burst limiter (a fingerprint bucket shared with every
          // other AI route, so a student who just used the tutor — or shares a
          // school NAT — trips it) and for the hourly ceiling. Those are
          // 60-second and 10-minute conditions; rendering them as a permanent
          // "upgrade to Pro" dead end was wrong. Only the daily cap carries
          // `proRequired`.
          const isDailyCap = data.proRequired !== undefined;
          if (isDailyCap) {
            setWall({
              kind: 'quota',
              message: data.error ?? 'הגעת למכסה היומית.',
              proRequired: !!data.proRequired,
            });
          } else {
            setWall({ kind: 'error', message: data.error ?? 'יותר מדי בקשות. נסה שוב בעוד רגע.' });
          }
          return false;
        }
        if (!res.ok || data.error) {
          setWall({ kind: 'error', message: data.error ?? `שגיאה (${res.status})` });
          return false;
        }

        const turn = data as TeachResponse;
        setTurns((prev) => [...prev, { role: 'assistant', content: turn.reply }]);
        if (turn.covered.length) {
          setCovered((prev) => Array.from(new Set([...prev, ...turn.covered])));
        }
        setLastCorrectness(turn.correctness);
        // `partly` counts too. The prompt only withholds a point when a
        // statement is outright שגוי, so five consecutive "roughly right but
        // imprecise" turns could reach a full checklist, `everWrong === false`,
        // and a 🎓 celebration for an explanation that was never actually sound.
        if (turn.correctness === 'wrong' || turn.correctness === 'partly') setEverWrong(true);
        // Keep the FIRST thing that went wrong — that's the one the student
        // built the rest of the explanation on top of.
        if (turn.misconception) setMisconception((prev) => prev || turn.misconception);
        if (typeof turn.remaining === 'number') setRemaining(turn.remaining);
        return true;
      } catch (e) {
        setWall({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [subject, topic, subTopicId]
  );

  // Opening turn — נועה speaks first with her confusion.
  useEffect(() => {
    if (openedRef.current || !rubric) return;
    openedRef.current = true;
    void send('', [], []);
  }, [rubric, send]);

  // Scroll the TRANSCRIPT, not the document. scrollIntoView moved the whole
  // page and threw the composer off screen on every send.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, loading]);

  /**
   * One attempt at a student turn, optimistic then rolled back on failure.
   *
   * Both `submit` and `retry` go through here on purpose. An earlier version
   * had `retry` call `send` directly, which re-sent the message to the model
   * but never restored the student's own bubble to the transcript — a
   * successful retry appended נועה's reply under a question the student could
   * no longer see themselves having asked.
   */
  const attempt = useCallback(
    (message: string, history: Turn[], coveredSoFar: string[]) => {
      if (!message) {
        // Opening turn: נועה speaks first, there is no student bubble.
        void send('', history, coveredSoFar);
        return;
      }
      setTurns([...history, { role: 'user', content: message }]);
      setDraft('');
      // The turn is only *kept* if the call succeeds. A failed call used to
      // leave the message in the transcript and still burn one of the five.
      void send(message, history, coveredSoFar).then((ok) => {
        if (!ok) {
          setTurns(history);
          setDraft(message);
        }
      });
    },
    [send]
  );

  const submit = useCallback(() => {
    const text = draft.trim();
    if (!text || loading) return;
    attempt(text, turns, covered);
  }, [draft, loading, turns, covered, attempt]);

  const retry = useCallback(() => {
    const last = lastSentRef.current;
    if (!last || loading) return;
    attempt(last.message, last.history, last.covered);
  }, [loading, attempt]);

  if (!rubric) {
    return (
      <div className="surface-premium rounded-3xl p-5 text-sm text-slate-700">
        לא מצאתי את תת-הנושא הזה.
      </div>
    );
  }

  if (showReport) {
    return (
      <TeachReport
        rubric={rubric}
        covered={covered}
        hadWrongMath={everWrong}
        misconception={misconception}
        onRestart={onRestart}
      />
    );
  }

  const canSend = draft.trim().length > 0 && !loading && wall.kind === 'none' && !ended;
  const turnLabel = Math.min(studentTurns + 1, TEACH_MAX_TURNS);

  return (
    <div className="space-y-4">
      {/* ---- progress: count + locked slots, never the answers ---- */}
      <div className="surface-premium rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] font-black tracking-widest text-indigo-700 uppercase">
            מה נועה כבר הבינה ממך
          </div>
          <div className="text-xs font-black text-slate-700 tabular-nums">
            {covered.length}/{rubric.points.length}
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-slate-900/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-indigo-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${(covered.length / rubric.points.length) * 100}%` }}
          />
        </div>
        <div className="space-y-1">
          {rubric.points.map((p, i) => {
            const ok = covered.includes(p.id);
            return (
              <div key={p.id} className="flex gap-2 items-start">
                <span className="flex-shrink-0 mt-0.5">
                  {ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </span>
                {ok ? (
                  <div className="flex-1 min-w-0 text-xs chat-md math-content text-emerald-800">
                    <MathText inline>{p.text}</MathText>
                  </div>
                ) : (
                  // Anonymous on purpose — printing the text here would let the
                  // student read the rubric aloud and score full marks.
                  //
                  // Deliberately NOT numbered: the points are the guided
                  // lesson's steps in order, and that lesson is rendered with
                  // matching 1..n badges on a page the report itself links to.
                  // "נקודה 3" was therefore an index into a visible answer key.
                  <div className="flex-1 min-w-0 text-xs text-slate-500 italic">
                    עוד משהו שנועה עדיין לא הבינה
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- the conversation ---- */}
      <div
        ref={scrollRef}
        className="surface-premium rounded-2xl p-4 space-y-3 max-h-[24rem] overflow-y-auto"
      >
        {turns.length === 0 && !loading && (
          <p className="text-xs text-slate-500 text-center py-4">נועה מתיישבת לידך…</p>
        )}

        {turns.map((t, i) =>
          t.role === 'assistant' ? (
            <div key={i} className="flex gap-2 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-sm">
                🙋‍♀️
              </span>
              <div className="flex-1 min-w-0 bg-violet-500/[0.09] border border-violet-500/25 rounded-2xl rounded-tr-sm px-3 py-2">
                <div className="text-[10px] font-black text-violet-700 mb-0.5">נועה</div>
                <div className="text-sm chat-md math-content text-slate-800">
                  <MathText>{t.content}</MathText>
                </div>
              </div>
            </div>
          ) : (
            // The student's own words are NOT run through markdown — a stray
            // *, _ or # in their explanation would silently reformat what they
            // wrote back at them.
            <div key={i} className="ps-9">
              <div className="bg-slate-900/[0.04] border border-slate-900/10 rounded-2xl rounded-tl-sm px-3 py-2">
                <div className="text-[10px] font-black text-slate-500 mb-0.5">אתה הסברת</div>
                <div dir="rtl" className="text-sm text-slate-800 whitespace-pre-wrap break-words">
                  {t.content}
                </div>
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="flex gap-2 items-center text-xs text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>נועה חושבת…</span>
          </div>
        )}
      </div>

      {/* ---- walls. None of them removes the way out (see below). ---- */}
      {wall.kind === 'auth' && (
        <div className="surface-premium rounded-2xl p-4 space-y-3 text-center">
          <p className="text-sm text-slate-700">כדי ללמד את נועה צריך להתחבר — כך ההתקדמות נשמרת לך.</p>
          <Link
            href={`/login?next=${encodeURIComponent(`/teach?topic=${topic}&sub=${subTopicId}`)}`}
            className="btn-primary inline-flex px-5 py-2.5 rounded-xl font-bold text-white text-sm"
          >
            התחבר
          </Link>
        </div>
      )}
      {wall.kind === 'quota' && (
        <div className="surface-premium rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-800">
            <Crown className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{wall.message}</span>
          </div>
          {wall.proRequired && (
            <Link href="/pricing" className="btn-primary inline-flex px-4 py-2 rounded-xl font-bold text-white text-sm">
              שדרג ל-Pro
            </Link>
          )}
        </div>
      )}
      {wall.kind === 'error' && (
        <div className="surface-premium rounded-2xl p-4 space-y-3">
          <p className="text-sm text-rose-700">{wall.message}</p>
          <button
            onClick={retry}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 disabled:opacity-40 px-4 py-2.5 rounded-xl font-bold text-slate-800 text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            נסה שוב
          </button>
        </div>
      )}

      {/* ---- end of session: נועה's last reply is on screen ABOVE this, and
              the student chooses when to move on. The report used to replace
              the transcript in the same React commit that appended that reply,
              so the last thing she said was paid for and never painted. ---- */}
      {ended ? (
        <div className="surface-premium rounded-2xl p-4 space-y-3 text-center">
          <p className="text-sm text-slate-700">
            {allCovered
              ? 'נועה הבינה את כל מה שצריך. '
              : outOfTurns
                ? 'סיימת את ההסברים לסשן הזה. '
                : ''}
            מוכן לראות מה כיסית?
          </p>
          <button
            onClick={() => setShowReport(true)}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 btn-primary disabled:opacity-40 px-4 py-3 rounded-xl font-bold text-white text-sm"
          >
            <span>צפה בסיכום</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Only the AUTH wall hides the composer. On an error or a rate
              limit the rollback restores the student's text to `draft`, and if
              the composer is unmounted they can never see it, edit it, or
              shorten it — the restore was dead code. */}
          {wall.kind !== 'auth' && (
            <div className="surface-premium rounded-2xl p-4 space-y-2">
              <AnswerInput
                value={draft}
                onChange={(v) => {
                  setDraft(v);
                  // Editing after a failure re-arms the send button — otherwise
                  // `canSend` stays false forever and the only way forward is
                  // re-sending the exact text that just failed.
                  setWall((w) => (w.kind === 'error' ? { kind: 'none' } : w));
                }}
                type="text"
                disabled={loading}
                symbolBar
                symbols={symbolsForTopic(topic)}
                rows={4}
                maxLength={MAX_TEACH_MESSAGE_LEN}
                largeText
                placeholder="תסביר לנועה במילים שלך — כאילו היא יושבת לידך…"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {draft.length}/{MAX_TEACH_MESSAGE_LEN} · הסבר {turnLabel} מתוך {TEACH_MAX_TURNS}
                </span>
                <button
                  onClick={submit}
                  disabled={!canSend}
                  className="inline-flex items-center gap-2 btn-primary disabled:opacity-40 px-4 py-2 rounded-xl font-bold text-white text-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  הסבר
                </button>
              </div>
              {lastCorrectness === 'wrong' && (
                <p className="text-[11px] text-amber-700">
                  נועה לא השתכנעה מהצעד האחרון — כדאי לחזור אליו לפני שממשיכים.
                </p>
              )}
            </div>
          )}

          {/* Deliberately OUTSIDE every wall: whatever goes wrong, the student
              can still bank the coverage they earned.
              Gated on `turns.length`, not `studentTurns` — a rolled-back failed
              turn drops studentTurns back to 0, which used to hide this button
              in exactly the state that needs it most.
              `disabled={loading}` matters: clicking mid-call mounted the report
              on pre-response state, so a paid reply was discarded and the
              report's once-only effects (celebration, review seeding) fired
              against a verdict that changed a second later. */}
          {turns.length > 0 && (
            <button
              onClick={() => {
                setFinished(true);
                setShowReport(true);
              }}
              disabled={loading}
              className="w-full text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40 py-1 transition-colors"
            >
              סיים והצג סיכום
            </button>
          )}
        </>
      )}

      {remaining !== null && remaining <= 2 && (
        <p className="text-[11px] text-amber-700 text-center">
          נשארו לך {remaining} תורות היום.
        </p>
      )}

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <GraduationCap className="w-3.5 h-3.5" />
        ללמד מישהו אחר היא שיטת הלמידה החזקה ביותר שיש.
      </p>
    </div>
  );
}
