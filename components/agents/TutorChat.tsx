'use client';

/**
 * TutorChat — drop-in Socratic tutor panel.
 *
 * Renders the transcript with full LaTeX support via `MathText`
 * (react-markdown → remark-math → rehype-katex, with the app's RTL/bidi
 * handling), streams the reply, and surfaces quota walls as an upgrade nudge
 * rather than a generic error.
 *
 * Usage:
 *   <TutorChat unitLevel={5} formNumber="572" topic="מספרים מרוכבים" />
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MathText } from '@/components/practice/MathText';
import { useTutorChat } from '@/hooks/useTutorChat';

type Props = {
  unitLevel?: 3 | 4 | 5;
  formNumber?: string;
  topic?: string;
  /** Student snapshot passed through to the model for this turn. */
  context?: string;
  placeholder?: string;
  className?: string;
};

export function TutorChat({
  unitLevel = 5,
  formNumber = '572',
  topic,
  context,
  placeholder = 'מה לא מסתדר לך? כתוב את השאלה או איפה נתקעת…',
  className = '',
}: Props) {
  const [draft, setDraft] = useState('');
  const { messages, streaming, isLoading, error, quotaExceeded, remaining, send, stop, reset } =
    useTutorChat({ unitLevel, formNumber, topic, context });

  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streaming]);

  const submit = async () => {
    const text = draft;
    if (!text.trim() || isLoading) return;
    setDraft('');
    await send(text);
  };

  return (
    <div className={`surface-premium flex flex-col overflow-hidden ${className}`} dir="rtl">
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">מורה פרטי</p>
          <p className="truncate text-xs text-slate-500">
            {unitLevel} יח״ל · שאלון {formNumber}
            {topic ? ` · ${topic}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {remaining !== null && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              נותרו {remaining}
            </span>
          )}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={reset}
              className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              שיחה חדשה
            </button>
          )}
        </div>
      </div>

      {/* transcript */}
      <div className="min-h-[16rem] flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !streaming && (
          <p className="py-8 text-center text-sm text-slate-500">
            אני לא אפתור במקומך — אני אשאל אותך את השאלה הנכונה.
            <br />
            תאר איפה נתקעת, ונתקדם צעד־צעד.
          </p>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            // Student text is rendered as PLAIN TEXT, never markdown — it is
            // untrusted input and must not be able to inject markup.
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-violet-600 px-4 py-2 text-sm text-white">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="chat-md max-w-[92%] min-w-0 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-800">
                <MathText>{m.content}</MathText>
              </div>
            </div>
          )
        )}

        {streaming && (
          <div className="flex justify-end">
            <div className="chat-md max-w-[92%] min-w-0 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-800">
              <MathText>{streaming}</MathText>
            </div>
          </div>
        )}

        {isLoading && !streaming && (
          <div className="flex justify-end">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">חושב…</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* errors */}
      {error && (
        <div className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
          {quotaExceeded && (
            <Link href="/pricing" className="mr-2 font-semibold underline">
              שדרג ל-Pro
            </Link>
          )}
        </div>
      )}

      {/* composer */}
      <div className="flex items-end gap-2 border-t border-slate-200 px-3 py-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={2}
          maxLength={800}
          placeholder={placeholder}
          className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-400"
        />
        {isLoading ? (
          <button
            type="button"
            onClick={stop}
            className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            עצור
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={draft.trim().length < 3}
            className="btn-primary shrink-0 rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            שלח
          </button>
        )}
      </div>
    </div>
  );
}
