'use client';

/**
 * useTutorChat — client for POST /api/chat/tutor.
 *
 * Owns the transcript (the route is stateless) and streams the reply token by
 * token. Two failure paths must both be handled, and they look nothing alike:
 *
 *   • BEFORE the stream opens  → HTTP 4xx/5xx with a JSON body
 *     ({ error, quotaExceeded?, proRequired? }).
 *   • AFTER the stream opens   → HTTP 200 + an SSE `error` event, because the
 *     headers are already on the wire and the status can no longer change.
 *
 * A client that only checks `res.ok` silently shows an empty bubble for the
 * second case.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type TutorTurn = { role: 'user' | 'assistant'; content: string };

export type UseTutorChatOptions = {
  unitLevel?: 3 | 4 | 5;
  formNumber?: string;
  topic?: string;
  /** Student snapshot for THIS turn (see lib/tutor-context.ts). */
  context?: string;
};

export type UseTutorChat = {
  messages: TutorTurn[];
  /** The reply currently streaming in, or '' when idle. */
  streaming: string;
  isLoading: boolean;
  error: string | null;
  /** true when the daily/hourly cap was hit — render an upgrade nudge. */
  quotaExceeded: boolean;
  /** Daily calls left, once the server has told us. */
  remaining: number | null;
  send: (text: string) => Promise<void>;
  stop: () => void;
  reset: () => void;
};

const HISTORY_TURNS = 6;

export function useTutorChat(options: UseTutorChatOptions = {}): UseTutorChat {
  const [messages, setMessages] = useState<TutorTurn[]>([]);
  const [streaming, setStreaming] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  // Options change on every parent render if passed inline; read them through a
  // ref so `send` stays referentially stable and doesn't retrigger effects.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => () => abortRef.current?.abort(), []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setStreaming('');
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setStreaming('');
    setError(null);
    setQuotaExceeded(false);
    setIsLoading(false);
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 3) {
      setError('כתוב שאלה של לפחות 3 תווים.');
      return;
    }
    if (abortRef.current) return; // a turn is already in flight

    const opts = optionsRef.current;
    const history = messages.slice(-HISTORY_TURNS);

    setError(null);
    setQuotaExceeded(false);
    setIsLoading(true);
    setStreaming('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);

    const controller = new AbortController();
    abortRef.current = controller;

    let acc = '';
    let streamError: string | null = null;

    try {
      const res = await fetch('/api/chat/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          history,
          unitLevel: opts.unitLevel,
          formNumber: opts.formNumber,
          ...(opts.topic ? { topic: opts.topic } : {}),
          ...(opts.context ? { context: opts.context } : {}),
        }),
      });

      // --- failure path 1: never got a stream ---
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}) as Record<string, unknown>);
        if (data.quotaExceeded) setQuotaExceeded(true);
        throw new Error(
          typeof data.error === 'string' ? data.error : 'שגיאה זמנית. נסה שוב.'
        );
      }

      // --- SSE frames: `event: <name>\ndata: <json>\n\n` ---
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let sep = buf.indexOf('\n\n');
        while (sep !== -1) {
          const frame = buf.slice(0, sep);
          buf = buf.slice(sep + 2);

          let name = '';
          let dataStr = '';
          for (const line of frame.split('\n')) {
            if (line.startsWith('event:')) name = line.slice(6).trim();
            else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
          }

          if (dataStr) {
            try {
              const payload = JSON.parse(dataStr);
              if (name === 'meta' && typeof payload.remaining === 'number') {
                setRemaining(payload.remaining);
              } else if (name === 'delta' && typeof payload.text === 'string') {
                acc += payload.text;
                setStreaming(acc);
              } else if (name === 'error') {
                streamError =
                  typeof payload.error === 'string' ? payload.error : 'שגיאה זמנית.';
              } else if (name === 'done' && typeof payload.reply === 'string') {
                acc = payload.reply; // authoritative
              }
            } catch {
              /* a partial/garbled frame is not worth failing the turn over */
            }
          }
          sep = buf.indexOf('\n\n');
        }
      }

      // --- failure path 2: HTTP 200, but the stream reported an error ---
      if (streamError || !acc.trim()) {
        throw new Error(streamError ?? 'לא התקבלה תשובה. נסה שוב.');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: acc }]);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        // Deliberate stop: keep whatever streamed in so far, don't show an error.
        if (acc.trim()) setMessages((prev) => [...prev, { role: 'assistant', content: acc }]);
      } else {
        setError(err instanceof Error ? err.message : 'שגיאה זמנית. נסה שוב.');
        // Roll back the optimistic user bubble so a retry isn't double-posted.
        setMessages((prev) => (prev.length ? prev.slice(0, -1) : prev));
      }
    } finally {
      abortRef.current = null;
      setIsLoading(false);
      setStreaming('');
    }
  }, [messages]);

  return { messages, streaming, isLoading, error, quotaExceeded, remaining, send, stop, reset };
}
