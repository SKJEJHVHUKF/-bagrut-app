'use client';

/**
 * TeachSession — the student teaches, נועה (the model) plays the classmate.
 *
 * The live rubric checklist is the point of the screen: points light up as the
 * explanation covers them, so the student can SEE their understanding being
 * measured while they talk. That visible progress is what makes explaining feel
 * like a game instead of an exam.
 *
 * Coverage is accumulated here on the client — each turn returns only what was
 * newly covered — so the end-of-session report costs nothing extra.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Send, CheckCircle2, Circle, GraduationCap, Crown } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { AnswerInput } from '@/components/practice/AnswerInput';
import { symbolsForTopic } from '@/components/practice/MathSymbolBar';
import { TeachReport } from './TeachReport';
import { buildRubric } from '@/lib/teach/rubric';
import { TEACH_MAX_TURNS, MAX_TEACH_MESSAGE_LEN } from '@/lib/agents/config';
import { getUnitLevel, getPaper } from '@/lib/study-plan';
import type { TeachResponse } from '@/lib/teach/schemas';

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
  const rubric = buildRubric(subject, topic, subTopicId);

  const [turns, setTurns] = useState<Turn[]>([]);
  const [covered, setCovered] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [wall, setWall] = useState<Wall>({ kind: 'none' });
  const [finished, setFinished] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  // React 19 StrictMode mounts twice in dev. Without this guard the opening
  // turn fires twice and burns two calls off the daily cap before the student
  // has typed anything.
  const openedRef = useRef(false);

  const studentTurns = turns.filter((t) => t.role === 'user').length;
  const allCovered = !!rubric && covered.length >= rubric.points.length;
  const outOfTurns = studentTurns >= TEACH_MAX_TURNS;

  const send = useCallback(
    async (message: string, history: Turn[], coveredSoFar: string[]) => {
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
          return;
        }
        if (res.status === 429) {
          setWall({
            kind: 'quota',
            message: data.error ?? 'הגעת למכסה היומית.',
            proRequired: !!data.proRequired,
          });
          return;
        }
        if (!res.ok || data.error) {
          setWall({ kind: 'error', message: data.error ?? `שגיאה (${res.status})` });
          return;
        }

        const turn = data as TeachResponse;
        setTurns((prev) => [...prev, { role: 'assistant', content: turn.reply }]);
        if (turn.covered.length) {
          setCovered((prev) => Array.from(new Set([...prev, ...turn.covered])));
        }
      } catch (e) {
        setWall({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, loading]);

  if (!rubric) {
    return (
      <div className="surface-premium rounded-3xl p-5 text-sm text-slate-700">
        לא מצאתי את תת-הנושא הזה.
      </div>
    );
  }

  if (finished || allCovered || outOfTurns) {
    // Don't jump to the report until the last reply has landed — the student
    // should read what נועה said about their final explanation.
    if (!loading) {
      return <TeachReport rubric={rubric} covered={covered} onRestart={onRestart} />;
    }
  }

  function submit() {
    const text = draft.trim();
    if (!text || loading) return;
    const next: Turn[] = [...turns, { role: 'user', content: text }];
    setTurns(next);
    setDraft('');
    void send(text, next, covered);
  }

  const canSend = draft.trim().length > 0 && !loading && wall.kind === 'none';

  return (
    <div className="space-y-4">
      {/* ---- the live rubric checklist: the reason this feels like progress ---- */}
      <div className="surface-premium rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] font-black tracking-widest text-indigo-700 uppercase">
            מה צריך שנועה תבין
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
          {rubric.points.map((p) => {
            const ok = covered.includes(p.id);
            return (
              <div key={p.id} className="flex gap-2 items-start">
                <span className="flex-shrink-0 mt-0.5">
                  {ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </span>
                <div
                  className={
                    ok
                      ? 'flex-1 min-w-0 text-xs chat-md math-content text-slate-500 line-through decoration-emerald-600/50'
                      : 'flex-1 min-w-0 text-xs chat-md math-content text-slate-800'
                  }
                >
                  <MathText inline>{p.text}</MathText>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- the conversation ---- */}
      <div className="surface-premium rounded-2xl p-4 space-y-3 max-h-[26rem] overflow-y-auto">
        {turns.map((t, i) =>
          t.role === 'assistant' ? (
            <div key={i} className="flex gap-2 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-sm">
                🙋‍♀️
              </span>
              <div className="flex-1 min-w-0 bg-violet-500/[0.07] border border-violet-500/20 rounded-2xl rounded-tr-sm px-3 py-2">
                <div className="text-[10px] font-black text-violet-700 mb-0.5">נועה</div>
                <div className="text-sm chat-md math-content text-slate-800">
                  <MathText>{t.content}</MathText>
                </div>
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-2 items-start justify-end">
              <div className="flex-1 min-w-0 bg-indigo-500/[0.07] border border-indigo-500/20 rounded-2xl rounded-tl-sm px-3 py-2">
                <div className="text-[10px] font-black text-indigo-700 mb-0.5">אתה מסביר</div>
                <div className="text-sm chat-md math-content text-slate-800">
                  <MathText>{t.content}</MathText>
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
        <div ref={bottomRef} />
      </div>

      {/* ---- walls ---- */}
      {wall.kind === 'auth' && (
        <div className="surface-premium rounded-2xl p-4 space-y-3 text-center">
          <p className="text-sm text-slate-700">כדי ללמד את נועה צריך להתחבר — כך ההתקדמות נשמרת לך.</p>
          <Link href="/login?next=/teach" className="btn-primary inline-flex px-5 py-2.5 rounded-xl font-bold text-white text-sm">
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
        <div className="text-xs text-rose-700 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
          {wall.message}
        </div>
      )}

      {/* ---- composer ---- */}
      {wall.kind === 'none' && (
        <div className="surface-premium rounded-2xl p-4 space-y-2">
          <AnswerInput
            value={draft}
            onChange={setDraft}
            type="text"
            disabled={loading}
            symbolBar
            symbols={symbolsForTopic(topic)}
            rows={4}
            placeholder="תסביר לנועה במילים שלך — כאילו היא יושבת לידך…"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 tabular-nums">
              {draft.length}/{MAX_TEACH_MESSAGE_LEN} · הסבר {studentTurns + 1} מתוך {TEACH_MAX_TURNS}
            </span>
            <div className="flex items-center gap-2">
              {studentTurns > 0 && (
                <button
                  onClick={() => setFinished(true)}
                  disabled={loading}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors"
                >
                  סיים והצג סיכום
                </button>
              )}
              <button
                onClick={submit}
                disabled={!canSend}
                className="inline-flex items-center gap-2 btn-primary disabled:opacity-40 px-4 py-2 rounded-xl font-bold text-white text-sm"
              >
                <Send className="w-3.5 h-3.5" />
                הסבר
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <GraduationCap className="w-3.5 h-3.5" />
        ללמד מישהו אחר היא שיטת הלמידה החזקה ביותר שיש.
      </p>
    </div>
  );
}
