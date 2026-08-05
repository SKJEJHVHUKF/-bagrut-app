'use client';

// ============================================================
// components/scan/QuestionTutor.tsx — the tutor that sits with the question.
// ============================================================
//
// A chat bound to ONE scanned question, under the solution it explains. The
// student who photographed something they didn't understand now has someone
// to ask, with the question and the worked steps already in context — they
// never have to re-type or re-explain what they are looking at.
//
// Three deliberate choices:
//
//   1. It is CLOSED until asked for. An open chat box under a solution reads
//      as an obligation; a single button reads as an offer.
//   2. Suggested openers, derived from THIS solution's actual steps. A
//      student stuck enough to scan usually can't name what confuses them,
//      and a blank box asks them to do exactly that.
//   3. Streaming. The answer forms word by word at identical cost, which is
//      the difference between "thinking with me" and "loading".

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Crown, Loader2, MessageCircle, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { MathText } from '@/components/practice/MathText';
import { isSafeToRenderAsMath } from '@/lib/mathscan';
import type { ScanResult, TutorMessage } from '@/lib/mathscan';
import {
  askTutor,
  groundingFromResult,
  suggestedQuestions,
  TutorError,
} from '@/lib/mathscan/tutor-client';

export function QuestionTutor({ result }: { result: ScanResult }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<{ message: string; kind: TutorError['kind'] } | null>(null);
  const [turnsLeft, setTurnsLeft] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const grounding = groundingFromResult(result);
  const suggestions = suggestedQuestions(result);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, open, streaming]);

  // Abort an in-flight stream when the component goes away, so a student who
  // navigates mid-answer doesn't leave a request writing into dead state.
  useEffect(() => () => abortRef.current?.abort(), []);

  if (!grounding) return null;

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || streaming) return;

    setError(null);
    setDraft('');
    const nextMessages: TutorMessage[] = [...messages, { role: 'user', content: question }];
    setMessages(nextMessages);
    setStreaming(true);

    // The assistant bubble is appended empty and filled by the stream, so the
    // student sees the answer forming rather than a spinner.
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await askTutor(
        grounding,
        nextMessages,
        {
          onDelta: (delta) => {
            setMessages((current) => {
              const copy = [...current];
              const last = copy[copy.length - 1];
              if (last?.role === 'assistant') {
                copy[copy.length - 1] = { ...last, content: last.content + delta };
              }
              return copy;
            });
          },
          onMeta: (meta) => setTurnsLeft(meta.turnsLeft),
        },
        controller.signal
      );
      // An empty reply would leave a blank bubble on screen forever.
      setMessages((current) => {
        const last = current[current.length - 1];
        if (last?.role === 'assistant' && !last.content.trim()) return current.slice(0, -1);
        return current;
      });
    } catch (err) {
      // Drop the empty assistant bubble and put the student's question back
      // in the box, so a failure costs them nothing to retry.
      setMessages(nextMessages.slice(0, -1));
      setDraft(question);
      if (err instanceof TutorError) setError({ message: err.message, kind: err.kind });
      else if ((err as Error)?.name !== 'AbortError') {
        setError({ message: 'שגיאה בתשובת המורה. נסה שוב.', kind: 'other' });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="scan-card w-full p-4 flex items-center gap-3 text-right transition-transform active:scale-[.995]"
      >
        <span
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--scan-primary-soft)' }}
          aria-hidden
        >
          <MessageCircle className="w-5 h-5" style={{ color: 'var(--scan-primary)' }} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-black text-sm">משהו עדיין לא ברור?</span>
          <span className="block text-xs scan-muted mt-0.5">
            שאל את המורה על השאלה הזאת — הוא רואה אותה ואת הפתרון
          </span>
        </span>
      </button>
    );
  }

  return (
    <section className="scan-card p-4 space-y-3" aria-label="מורה לשאלה">
      <header className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4" style={{ color: 'var(--scan-primary)' }} aria-hidden />
        <h3 className="text-sm font-black flex-1">המורה לשאלה הזאת</h3>
        {turnsLeft !== null && turnsLeft <= 2 && (
          <span className="scan-chip scan-chip-warn">נותרו {turnsLeft} תשובות</span>
        )}
      </header>

      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs scan-muted leading-relaxed">
            הוא רואה בדיוק את השאלה שצילמת ואת הפתרון שמוצג לך. אפשר לשאול על שלב מסוים, לבקש
            הסבר אחר, או לבקש תרגיל דומה.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="scan-chip scan-chip-primary hover:opacity-80 transition-opacity"
              >
                <Sparkles className="w-3 h-3" aria-hidden />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <ol className="space-y-2 max-h-[420px] overflow-y-auto" aria-live="polite">
          {messages.map((message, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className={message.role === 'user' ? 'flex justify-start' : 'flex justify-end'}
            >
              <div
                className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                style={
                  message.role === 'user'
                    ? {
                        background: 'var(--scan-primary-soft)',
                        border: '1px solid var(--scan-line-strong)',
                      }
                    : { background: 'var(--scan-card-2)', border: '1px solid var(--scan-line)' }
                }
              >
                {message.role === 'assistant' && !message.content && (
                  <span className="inline-flex items-center gap-2 scan-faint">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                    <span className="text-xs">חושב…</span>
                  </span>
                )}
                {message.content && <Rich>{message.content}</Rich>}
              </div>
            </motion.li>
          ))}
          <div ref={endRef} />
        </ol>
      )}

      {error && (
        <div
          className="rounded-xl p-3 flex gap-2 text-sm"
          style={{ background: 'var(--scan-danger-soft)', border: '1px solid var(--scan-danger)' }}
          role="alert"
        >
          <AlertTriangle
            className="w-4 h-4 shrink-0 mt-0.5"
            style={{ color: 'var(--scan-danger)' }}
            aria-hidden
          />
          <div className="flex-1 min-w-0 space-y-2">
            <p className="leading-relaxed">{error.message}</p>
            {error.kind === 'auth' && (
              <Link
                href={`/login?next=${encodeURIComponent('/scan')}`}
                className="scan-btn scan-btn-primary !py-2 !px-4 text-xs"
              >
                התחברות
              </Link>
            )}
            {error.kind === 'quota' && (
              <Link href="/pricing" className="scan-btn scan-btn-primary !py-2 !px-4 text-xs">
                <Crown className="w-3.5 h-3.5" aria-hidden />
                <span>שדרג ל-Pro</span>
              </Link>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
        className="flex gap-2"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="מה לא ברור לך?"
          dir="rtl"
          className="scan-input flex-1"
          disabled={streaming}
          aria-label="שאלה למורה"
          maxLength={600}
        />
        <button
          type="submit"
          disabled={streaming || draft.trim().length === 0}
          className="scan-btn scan-btn-primary !px-4"
          aria-label="שלח"
        >
          {streaming ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Send className="w-4 h-4" aria-hidden />
          )}
        </button>
      </form>
    </section>
  );
}

/** Hebrew + LaTeX, degrading to plain text when the delimiters are unsafe.
 *  Model output is never trusted to be balanced — an unclosed `$` would send
 *  the rest of the reply through KaTeX and render the Hebrew reversed. */
function Rich({ children }: { children: string }) {
  if (!isSafeToRenderAsMath(children)) {
    return (
      <p dir="rtl" className="whitespace-pre-wrap">
        {children}
      </p>
    );
  }
  return (
    <div className="chat-md math-content">
      <MathText>{children}</MathText>
    </div>
  );
}
