'use client';

import { ChangeEvent } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  type: 'number' | 'expression' | 'text';
  disabled?: boolean;
};

const PLACEHOLDER: Record<Props['type'], string> = {
  number: 'הכנס תשובה מספרית…',
  expression: 'הכנס ביטוי / תחום…',
  text: 'כתוב את התשובה שלך…',
};

export function AnswerInput({ value, onChange, type, disabled }: Props) {
  const onInput = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange(e.target.value);

  if (type === 'text') {
    return (
      <textarea
        value={value}
        onChange={onInput}
        disabled={disabled}
        placeholder={PLACEHOLDER.text}
        rows={3}
        dir="auto"
        className="w-full bg-slate-900/[0.03] border border-slate-900/10 focus:border-indigo-500/60 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition-colors resize-y"
      />
    );
  }

  return (
    <input
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
}
