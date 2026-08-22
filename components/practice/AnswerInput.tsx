'use client';

import { ChangeEvent, useEffect, useRef } from 'react';
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

const FIELD_CLASS =
  'w-full bg-slate-900/[0.03] border border-slate-900/10 focus:border-violet-500/60 focus:bg-white rounded-xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 outline-none transition-colors';

/** Insert a symbol at the caret of `el` (append when there is no field yet)
 *  and restore focus + caret after React re-renders the controlled value.
 *  Returns the new field value. */
function insertSymbol(
  el: HTMLInputElement | HTMLTextAreaElement | null,
  value: string,
  sym: MathSymbol,
  maxLength?: number,
): string {
  if (!el) return value + sym.insert;
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  // The DOM `maxLength` does not constrain a programmatic value, so without
  // this clamp the symbol bar could push the field past its own limit and the
  // server would then truncate mid-word — exactly what maxLength exists to
  // prevent.
  const raw = value.slice(0, start) + sym.insert + value.slice(end);
  const next = maxLength ? raw.slice(0, maxLength) : raw;
  const caret = start + sym.insert.length - (sym.caretBack ?? 0);
  requestAnimationFrame(() => {
    el.focus();
    try {
      el.setSelectionRange(caret, caret);
    } catch {
      // some input types don't support selection ranges — ignore
    }
  });
  return next;
}

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
        className={FIELD_CLASS}
      />
    );

  if (!showBar) return field;

  return (
    <div className="space-y-2">
      <MathSymbolBar
        onInsert={(sym) => onChange(insertSymbol(inputRef.current, value, sym, maxLength))}
        symbols={symbols}
        disabled={disabled}
      />
      {field}
    </div>
  );
}

/**
 * One labelled box per quantity a question asks for ("מצא את $a_1$ ואת $d$"),
 * driven by the question's `answerLabels`. One symbol bar serves every box and
 * inserts into the one last focused. `values` is one string per box, in label
 * order — grade it with checkAnswerParts, never by joining it into one string.
 */
export function AnswerParts({
  labels,
  values,
  onChange,
  disabled,
  wrong,
  locked,
  symbols,
}: {
  labels: string[];
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  /** Per-box verdict after a check: a wrong box is outlined and focused, so
   *  the student sees WHICH of a₁ / d missed rather than a bare "wrong". */
  wrong?: boolean[];
  /** Boxes already graded right — shown green with a ✓ and no longer
   *  editable, so a second attempt only has to fix what was wrong. */
  locked?: boolean[];
  symbols?: MathSymbol[];
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focused = useRef(0);

  // After a check, put the caret in the first wrong box. Keyed on the joined
  // string, not the array: the parent rebuilds the array every render, and an
  // effect on it would steal focus on every keystroke.
  const wrongKey = wrong?.join(',') ?? '';
  useEffect(() => {
    const i = wrongKey ? wrongKey.split(',').indexOf('true') : -1;
    if (i >= 0) refs.current[i]?.focus();
  }, [wrongKey]);

  function setPart(i: number, v: string) {
    const next = values.slice();
    next[i] = v;
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {!disabled && (
        <MathSymbolBar
          symbols={symbols}
          onInsert={(sym) => {
            const i = focused.current;
            if (locked?.[i]) return;
            setPart(i, insertSymbol(refs.current[i] ?? null, values[i] ?? '', sym));
          }}
        />
      )}
      {labels.map((label, i) => {
        const state = locked?.[i] ? 'locked' : wrong?.[i] ? 'wrong' : 'open';
        return (
          <label key={i} className="flex items-center gap-3">
            <span
              dir="auto"
              className={`flex-shrink-0 min-w-[2.75rem] text-center text-sm font-black rounded-lg px-2.5 py-1.5 ${
                state === 'locked'
                  ? 'bg-emerald-500/15 text-emerald-800'
                  : state === 'wrong'
                    ? 'bg-rose-500/10 text-rose-800'
                    : 'bg-violet-500/[0.08] text-violet-800'
              }`}
            >
              {label}
              {state === 'locked' && <span aria-label="נכון"> ✓</span>}
            </span>
            <input
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="text"
              inputMode="text"
              value={values[i] ?? ''}
              onChange={(e) => setPart(i, e.target.value)}
              onFocus={() => {
                focused.current = i;
              }}
              disabled={disabled || state === 'locked'}
              placeholder={`רשום את ${label}`}
              dir="auto"
              className={`${FIELD_CLASS} flex-1 min-w-0 ${
                state === 'locked'
                  ? 'border-emerald-500/50 bg-emerald-500/[0.06] text-emerald-900'
                  : state === 'wrong'
                    ? 'border-rose-500/60 bg-rose-500/[0.04]'
                    : ''
              }`}
            />
          </label>
        );
      })}
    </div>
  );
}

/** One line of feedback for a PARTLY right labelled answer — names the boxes
 *  that are right and the one(s) still to fix. Only meaningful when at least
 *  one box is correct; callers fall back to their usual "wrong" text otherwise. */
export function describeParts(labels: string[], verdicts: ('correct' | 'wrong')[]): string {
  const right = labels.filter((_, i) => verdicts[i] === 'correct');
  const wrong = labels.filter((_, i) => verdicts[i] === 'wrong');
  return `ענית נכון על ${right.join(', ')} ✓, עכשיו תקן את ${wrong.join(' ואת ')} ונסה שוב.`;
}
