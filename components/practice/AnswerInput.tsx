'use client';

import { ChangeEvent, useRef } from 'react';
import { MathSymbolBar, type MathSymbol } from './MathSymbolBar';

type Props = {
  value: string;
  onChange: (v: string) => void;
  type: 'number' | 'expression' | 'text';
  disabled?: boolean;
  /** Show the math-symbol helper bar. Defaults to on for number/expression. */
  symbolBar?: boolean;
  /** Override the symbol set (e.g. topic-aware). */
  symbols?: MathSymbol[];
  /** Override the placeholder. The defaults below assume the student is
   *  answering a question; /teach has them explaining one, which needs
   *  different framing. */
  placeholder?: string;
  /** Textarea height for `type: 'text'`. */
  rows?: number;
  /** Hard cap on input length. Without it a server-side truncation silently
   *  eats the end of a long answer mid-word. */
  maxLength?: number;
  /** Render at 16px instead of 14px. iOS Safari auto-zooms the page on focus
   *  for any field under 16px, which on a long-form answer leaves the student
   *  zoomed in and scrolled sideways. */
  largeText?: boolean;
};

const PLACEHOLDER: Record<Props['type'], string> = {
  number: 'הכנס תשובה מספרית…',
  expression: 'הכנס ביטוי / תחום…',
  text: 'כתוב את התשובה שלך…',
};

export function AnswerInput({
  value,
  onChange,
  type,
  disabled,
  symbolBar,
  symbols,
  placeholder,
  rows,
  maxLength,
  largeText,
}: Props) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const setRef = (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    inputRef.current = el;
  };
  const onInput = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange(e.target.value);

  // Default: show the helper bar for math answers (not plain-text ones).
  const showBar = (symbolBar ?? type !== 'text') && !disabled;

  function insertSymbol(sym: MathSymbol) {
    const el = inputRef.current;
    if (!el) {
      onChange(value + sym.insert);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    // The DOM `maxLength` does not constrain a programmatic value, so without
    // this clamp the symbol bar could push the field past its own limit and the
    // server would then truncate mid-word — exactly what maxLength exists to
    // prevent.
    const raw = value.slice(0, start) + sym.insert + value.slice(end);
    const next = maxLength ? raw.slice(0, maxLength) : raw;
    onChange(next);
    // Restore focus + caret after React re-renders the controlled value.
    const caret = start + sym.insert.length - (sym.caretBack ?? 0);
    requestAnimationFrame(() => {
      el.focus();
      try {
        el.setSelectionRange(caret, caret);
      } catch {
        // some input types don't support selection ranges — ignore
      }
    });
  }

  const field =
    type === 'text' ? (
      <textarea
        ref={setRef}
        value={value}
        onChange={onInput}
        disabled={disabled}
        placeholder={placeholder ?? PLACEHOLDER.text}
        rows={rows ?? 3}
        maxLength={maxLength}
        dir="auto"
        className={`w-full bg-slate-900/[0.03] border border-slate-900/10 focus:border-violet-500/60 focus:bg-white rounded-xl px-4 py-3 ${
          largeText ? 'text-base' : 'text-sm'
        } text-slate-900 placeholder:text-slate-500 outline-none transition-colors resize-y`}
      />
    ) : (
      <input
        ref={setRef}
        type="text"
        inputMode={type === 'number' ? 'decimal' : 'text'}
        value={value}
        onChange={onInput}
        disabled={disabled}
        placeholder={placeholder ?? PLACEHOLDER[type]}
        maxLength={maxLength}
        dir="auto"
        className="w-full bg-slate-900/[0.03] border border-slate-900/10 focus:border-violet-500/60 focus:bg-white rounded-xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 outline-none transition-colors"
      />
    );

  if (!showBar) return field;

  return (
    <div className="space-y-2">
      <MathSymbolBar onInsert={insertSymbol} symbols={symbols} disabled={disabled} />
      {field}
    </div>
  );
}
