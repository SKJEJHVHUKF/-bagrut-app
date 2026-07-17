'use client';

import { useState } from 'react';
import { ERROR_CATEGORIES, updateMistakeCategory, type ErrorCategory } from '@/lib/mistakes';

// MistakeTagger — a compact category picker shown after a wrong answer. Lets
// the student label WHAT kind of mistake it was, which powers the /errors
// dashboard's error profile. When the AI already suggested a category we
// pre-select it (still re-taggable by the student).
export function MistakeTagger({
  mistakeId,
  initial,
}: {
  mistakeId: string;
  initial?: ErrorCategory | null;
}) {
  const [cat, setCat] = useState<ErrorCategory | null>(initial ?? null);

  return (
    <div className="mt-2">
      <div className="text-[11px] font-bold text-slate-600 mb-1.5">
        {cat ? 'סוג הטעות: ' : 'איזו טעות זו הייתה? '}
        <span className="text-slate-400 font-normal">(נשמר במחברת הטעויות)</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ERROR_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCat(c);
              updateMistakeCategory(mistakeId, c);
            }}
            className={
              cat === c
                ? 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white border border-indigo-600'
                : 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 text-slate-600 transition-colors'
            }
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
