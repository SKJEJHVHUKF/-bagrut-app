// ============================================================
// mathscan/tutor-client.ts — the browser half of the question tutor.
// ============================================================
//
// Reads the SSE stream from /api/scan-tutor and hands deltas to the caller.
// Kept out of the component so the transport (and its error mapping) can be
// tested and changed without touching the UI, and so the UI never has to know
// what an `event:` frame looks like.

import type { ScanResult, TutorGrounding, TutorMessage } from './types';

export type TutorStreamHandlers = {
  onDelta: (text: string) => void;
  onMeta?: (meta: { remaining: number; turnsLeft: number }) => void;
  onDone?: (info: { costUsd: number }) => void;
};

export class TutorError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly kind: 'auth' | 'quota' | 'turns' | 'other'
  ) {
    super(message);
    this.name = 'TutorError';
  }
}

/** Build the tutor's grounding from a finished scan. The tutor is told about
 *  the solution the STUDENT can see — never a different one. */
export function groundingFromResult(result: ScanResult): TutorGrounding | null {
  const explanation = result.explanations.full ?? result.explanations.partial;
  if (!explanation) return null;
  return {
    question: result.question,
    steps: explanation.steps.map((step) => ({ title: step.title, content: step.content })),
    finalAnswer: explanation.finalAnswer ?? '',
    topic: result.topic,
    unitLevel: result.unitLevel,
    source: result.source,
  };
}

/**
 * Send one turn and stream the reply.
 *
 * `messages` must end with the student's new question. The whole transcript
 * is sent every turn — the endpoint is stateless, and it uses the transcript
 * to enforce its per-question turn ceiling.
 */
export async function askTutor(
  grounding: TutorGrounding,
  messages: TutorMessage[],
  handlers: TutorStreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch('/api/scan-tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grounding, messages }),
    signal,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const message = typeof data.error === 'string' ? data.error : 'שגיאה בתשובת המורה';
    const kind: TutorError['kind'] =
      response.status === 401
        ? 'auth'
        : data.turnLimit === true
          ? 'turns'
          : response.status === 429
            ? 'quota'
            : 'other';
    throw new TutorError(message, response.status, kind);
  }

  const body = response.body;
  if (!body) throw new TutorError('לא התקבלה תשובה', 500, 'other');

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // SSE frames are separated by a blank line, and a single read can end
  // mid-frame — so the tail stays in the buffer until its terminator arrives.
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');

      let event = 'message';
      let data = '';
      for (const line of frame.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7).trim();
        else if (line.startsWith('data: ')) data += line.slice(6);
      }
      if (!data) continue;

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }

      if (event === 'delta' && typeof parsed.text === 'string') handlers.onDelta(parsed.text);
      else if (event === 'meta') {
        handlers.onMeta?.({
          remaining: Number(parsed.remaining ?? 0),
          turnsLeft: Number(parsed.turnsLeft ?? 0),
        });
      } else if (event === 'done') {
        handlers.onDone?.({ costUsd: Number(parsed.costUsd ?? 0) });
      } else if (event === 'error') {
        throw new TutorError(
          typeof parsed.error === 'string' ? parsed.error : 'שגיאה בתשובת המורה',
          500,
          'other'
        );
      }
    }
  }
}

/**
 * Opening questions, chosen from what the scan actually produced.
 *
 * A blank chat box under a solution is a dead end — the student who couldn't
 * solve the question usually can't name what they don't understand either.
 * These give them a way in, and each maps to a real weak point of the
 * specific solution rather than being generic filler.
 */
export function suggestedQuestions(result: ScanResult): string[] {
  const suggestions: string[] = [];
  const explanation = result.explanations.full ?? result.explanations.partial;
  const steps = explanation?.steps ?? [];

  // Name a real step so the tutor gets a concrete anchor.
  const pivotal = steps.find((step) =>
    /דיסקרימיננטה|נוסחה|גוזרים|אינטגרציה|מפרקים|מבודדים|נקודות האיפוס/.test(step.title)
  );
  if (pivotal) suggestions.push(`למה בשלב "${pivotal.title}" עשינו את זה?`);

  if (result.problem?.kind === 'inequality') {
    suggestions.push('איך יודעים מתי הסימן מתהפך?');
  }
  if (result.problem?.domain === 'calculus') {
    suggestions.push('איזה כלל גזירה השתמשנו בו וכיצד מזהים אותו?');
  }
  if (result.problem?.multiPart) {
    suggestions.push('תסביר לי רק את סעיף א, לאט');
  }

  suggestions.push('לא הבנתי את השלב הראשון');
  suggestions.push('תן לי תרגיל דומה לתרגול');

  return [...new Set(suggestions)].slice(0, 4);
}
