'use client';

// ============================================================
// components/scan/QuestionEditor.tsx — "נסח מחדש".
// ============================================================
//
// The single most valuable control on the screen, and the cheapest.
//
// OCR will sometimes read the question wrong. The alternatives are to hide
// that (and solve the wrong problem), to charge for a retry (and make honesty
// expensive), or to let the student fix the text and re-run everything from
// there for $0. This is the third one: editing re-enters the pipeline at the
// validation stage, so no image is reprocessed, no OCR runs, and no API is
// called. A correction costs nothing and is MORE accurate than any scan,
// because a human read the page.
//
// The preview under the box renders exactly what the solver will see, so a
// student can tell a real correction from a typo before committing.

import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, RotateCcw, X } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { isSafeToRenderAsMath, toDisplayQuestion } from '@/lib/mathscan';

export function QuestionEditor({
  question,
  onSubmit,
  busy = false,
  defaultOpen = false,
}: {
  question: string;
  onSubmit: (next: string) => void;
  busy?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState(question);
  const previousQuestion = useRef(question);

  useEffect(() => {
    if (previousQuestion.current === question) return;
    previousQuestion.current = question;
    // A new question means the edit succeeded (or a new scan arrived): reset
    // the draft — otherwise the old text sits in the box and the student
    // re-solves what they already finished — and collapse the editor so the
    // solution below it isn't pushed off the screen on a phone.
    setDraft(question);
    setOpen(false);
  }, [question]);

  const changed = draft.trim() !== question.trim();
  const preview = toDisplayQuestion(draft);
  const safe = isSafeToRenderAsMath(preview);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="scan-btn w-full sm:w-auto"
        disabled={busy}
      >
        <Pencil className="w-4 h-4" aria-hidden />
        <span>נסח מחדש</span>
      </button>
    );
  }

  return (
    <section className="scan-card p-4 space-y-3">
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black">תקן את מה שקראנו</h3>
        <button
          type="button"
          onClick={() => {
            setDraft(question);
            setOpen(false);
          }}
          className="scan-icon-btn"
          aria-label="סגור עריכה"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      <p className="text-xs scan-muted leading-relaxed">
        כתוב את השאלה כפי שהיא מופיעה אצלך. הנוסחאות בכתיב רגיל — למשל{' '}
        <code dir="ltr" className="scan-card-flat px-1.5 py-0.5 rounded">
          x^2 - 5x + 6 = 0
        </code>
        . התיקון נפתר מיד ובלי עלות.
      </p>

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={4}
        dir="rtl"
        className="scan-input"
        aria-label="טקסט השאלה"
        spellCheck={false}
      />

      {draft.trim().length > 0 && (
        <div className="scan-card-flat p-3">
          <div className="text-[10px] font-black tracking-widest scan-faint uppercase mb-1.5">
            כך זה ייקרא
          </div>
          {/* If the delimiters came out unbalanced, or Hebrew ended up inside
              a `$…$` pair, rendering through KaTeX would show the Hebrew
              REVERSED. Falling back to plain text is ugly and correct. */}
          {safe ? (
            <div className="chat-md math-content text-sm leading-relaxed">
              <MathText>{preview}</MathText>
            </div>
          ) : (
            <pre dir="rtl" className="text-sm whitespace-pre-wrap font-sans">
              {draft}
            </pre>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSubmit(draft.trim())}
          disabled={busy || !changed || draft.trim().length < 3}
          className="scan-btn scan-btn-primary flex-1 sm:flex-none"
        >
          <Check className="w-4 h-4" aria-hidden />
          <span>{busy ? 'פותר…' : 'פתור מחדש · חינם'}</span>
        </button>
        <button
          type="button"
          onClick={() => setDraft(question)}
          disabled={busy || !changed}
          className="scan-btn"
        >
          <RotateCcw className="w-4 h-4" aria-hidden />
          <span>שחזר</span>
        </button>
      </div>
    </section>
  );
}
