'use client';

// MathSymbolBar — a compact row of tappable chips that insert common math
// symbols at the caret, so students don't have to hunt for √ / π / ^ on a
// phone keyboard. Every glyph it inserts is understood by lib/answer-check
// (× ÷ − π normalise to *, /, -, pi; √() and ^() are parsed) so typed
// answers still grade deterministically.

export type MathSymbol = {
  /** What shows on the chip. */
  label: string;
  /** Text inserted at the caret. */
  insert: string;
  /** Chars to move the caret left after inserting (e.g. land inside √()). */
  caretBack?: number;
  /** Tooltip / accessible label. */
  title?: string;
};

/** A practical set for 5-unit bagrut final answers. */
export const DEFAULT_MATH_SYMBOLS: MathSymbol[] = [
  { label: '√', insert: '√()', caretBack: 1, title: 'שורש' },
  { label: 'x²', insert: '^2', title: 'בריבוע' },
  { label: 'xⁿ', insert: '^()', caretBack: 1, title: 'חזקה' },
  { label: 'π', insert: 'π', title: 'פאי' },
  { label: 'e', insert: 'e', title: 'המספר e' },
  { label: '°', insert: '°', title: 'מעלות' },
  { label: '≠', insert: '≠', title: 'שונה מ' },
  { label: '≤', insert: '≤', title: 'קטן או שווה' },
  { label: '≥', insert: '≥', title: 'גדול או שווה' },
  { label: '∞', insert: '∞', title: 'אינסוף' },
];

/** Extra symbols worth surfacing for specific topics. */
export function symbolsForTopic(topic?: string): MathSymbol[] {
  if (!topic) return DEFAULT_MATH_SYMBOLS;
  if (topic === 'מספרים מרוכבים') {
    return [
      { label: 'i', insert: 'i', title: 'יחידה מדומה' },
      { label: 'cis', insert: 'cis()', caretBack: 1, title: 'cis θ (במעלות)' },
      ...DEFAULT_MATH_SYMBOLS,
    ];
  }
  return DEFAULT_MATH_SYMBOLS;
}

export function MathSymbolBar({
  onInsert,
  symbols = DEFAULT_MATH_SYMBOLS,
  disabled,
}: {
  onInsert: (sym: MathSymbol) => void;
  symbols?: MathSymbol[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {symbols.map((sym) => (
        <button
          key={sym.label}
          type="button"
          // onMouseDown + preventDefault keeps focus (and the caret) on the
          // input so we can insert at the right spot instead of appending.
          onMouseDown={(e) => {
            e.preventDefault();
            if (!disabled) onInsert(sym);
          }}
          disabled={disabled}
          title={sym.title}
          tabIndex={-1}
          aria-label={sym.title ?? sym.label}
          className="min-w-[2.25rem] px-2 py-1.5 rounded-lg bg-indigo-500/[0.06] hover:bg-indigo-500/[0.12] active:bg-indigo-500/20 border border-indigo-500/20 text-sm font-bold text-indigo-800 disabled:opacity-40 transition-colors"
        >
          {sym.label}
        </button>
      ))}
    </div>
  );
}
