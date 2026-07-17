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
};

const PLACEHOLDER: Record<Props['type'], string> = {
  number: 'הכנס תשובה מספרית…',
  expression: 'הכנס ביטוי / תחום…',
  text: 'כתוב את התשובה שלך…',
};

export function AnswerInput({ value, onChange, type, disabled, symbolBar, symbols }: Props) {
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
    const next = value.slice(0, start) + sym.insert + value.slice(end);
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
        placeholder={PLACEHOLDER.text}
        rows={3}
        dir="auto"
        className="w-full bg-slate-900/[0.03] border border-slate-900/10 focus:border-indigo-500/60 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition-colors resize-y"
      />
    ) : (
      <input
        ref={setRef}
        type="text"
        inputMode={type === 'number' ? 'decimal' : 'text'}
        value={value}
        onChange={onInput}
        disabled={disabled}
        placeholder={PLACEHOLDER[type]}
        dir="auto"
        className="w-full bg-slate-900/[0.03] border border-slate-900/10 focus:border-indigo-500/60 focus:bg-white rounded-xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 outline-none transition-colors"
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
