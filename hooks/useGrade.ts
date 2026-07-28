'use client';

/**
 * useGrade — client for POST /api/chat/grade.
 *
 * Non-streaming: the route returns one typed JSON verdict. The response shape
 * is guaranteed server-side by the structured-output schema, so there is
 * nothing to defensively parse here beyond the HTTP envelope.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GradeResponse } from '@/lib/agents/schemas';

export type GradeInput = {
  /** The student's work. Required. */
  solution: string;
  /** The problem being solved — strongly recommended; grading blind is worse. */
  question?: string;
  unitLevel?: 3 | 4 | 5;
  formNumber?: string;
  topic?: string;
};

export type UseGrade = {
  grade: GradeResponse | null;
  isLoading: boolean;
  error: string | null;
  quotaExceeded: boolean;
  proRequired: boolean;
  run: (input: GradeInput) => Promise<GradeResponse | null>;
  clear: () => void;
};

export function useGrade(): UseGrade {
  const [grade, setGrade] = useState<GradeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [proRequired, setProRequired] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const clear = useCallback(() => {
    setGrade(null);
    setError(null);
    setQuotaExceeded(false);
    setProRequired(false);
  }, []);

  const run = useCallback(async (input: GradeInput): Promise<GradeResponse | null> => {
    if (input.solution.trim().length < 3) {
      setError('אין פתרון לבדוק.');
      return null;
    }
    if (abortRef.current) return null;

    setIsLoading(true);
    setError(null);
    setQuotaExceeded(false);
    setProRequired(false);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          solution: input.solution.trim(),
          ...(input.question ? { question: input.question } : {}),
          ...(input.topic ? { topic: input.topic } : {}),
          unitLevel: input.unitLevel,
          formNumber: input.formNumber,
        }),
      });

      const data = await res.json().catch(() => ({}) as Record<string, unknown>);

      if (!res.ok) {
        if (data.quotaExceeded) setQuotaExceeded(true);
        if (data.proRequired) setProRequired(true);
        throw new Error(
          typeof data.error === 'string' ? data.error : 'שגיאה בבדיקת הפתרון.'
        );
      }

      const result = data as GradeResponse;
      setGrade(result);
      return result;
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'שגיאה בבדיקת הפתרון.');
      }
      return null;
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  }, []);

  return { grade, isLoading, error, quotaExceeded, proRequired, run, clear };
}
