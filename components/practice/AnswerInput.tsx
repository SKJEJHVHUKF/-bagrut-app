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
        className="w-full bg-slate-950/40 border border-white/10 focus:border-purple-500/60 focus:bg-slate-950/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors resize-y"
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
      className="w-full bg-slate-950/40 border border-white/10 focus:border-purple-500/60 focus:bg-slate-950/60 rounded-xl px-4 py-3 text-base text-white placeholder:text-slate-500 outline-none transition-colors"
    />
  );
}
