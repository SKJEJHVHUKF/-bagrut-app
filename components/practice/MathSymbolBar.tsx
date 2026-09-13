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

/** For an answer that IS an algebraic expression in x (an antiderivative, a
 *  derivative): the keys needed to TYPE one on a phone. Itay, 2026-09-13, on
 *  "חשב את ∫ x/√(x²+1) dx": the box asks for an expression with a root, and
 *  ≠ ≤ ≥ ∞ ° are no help writing it — "שורש ועוד פחות חילוק כפל". A Hebrew
 *  phone keyboard has no Latin x on its first page either. */
export const EXPRESSION_SYMBOLS: MathSymbol[] = [
  { label: 'x', insert: 'x', title: 'המשתנה x' },
  { label: '√', insert: '√()', caretBack: 1, title: 'שורש' },
  { label: '( )', insert: '()', caretBack: 1, title: 'סוגריים' },
  { label: '+', insert: '+', title: 'ועוד' },
  { label: '−', insert: '−', title: 'פחות' },
  { label: '×', insert: '×', title: 'כפל' },
  { label: '÷', insert: '/', title: 'חילוק (קו שבר)' },
  { label: 'x²', insert: '^2', title: 'בריבוע' },
  { label: 'xⁿ', insert: '^()', caretBack: 1, title: 'חזקה' },
];

const CONSTANT_OF_INTEGRATION: MathSymbol = { label: '+C', insert: '+C', title: 'קבוע האינטגרציה' };

/** Pick the keys from what the expected answer IS, not from the topic:
 *  an antiderivative gets the expression keys and +C, any other expression in
 *  x gets the expression keys, and everything else (a number, a point, a
 *  domain with < >) keeps the set it had. */
export function symbolsForAnswer(finalAnswer?: string, topic?: string): MathSymbol[] {
  const raw = finalAnswer ?? '';
  const islands = raw.match(/\$[^$]+\$/g) ?? [];
  // LaTeX command names removed: \times and \max contain an x
  const bare = (s: string) => s.slice(1, -1).replace(/\\[a-zA-Z]+/g, ' ');
  if (islands.some((s) => /\+\s*C(?![a-zA-Z])/.test(bare(s)))) return [...EXPRESSION_SYMBOLS, CONSTANT_OF_INTEGRATION];
  // An expression answer is ONE island that is an expression in x, optionally
  // introduced as "f'(x) =" or "y =". Several islands are points, values or
  // a list, and "ציר $x$" names the axis — neither is typed with these keys.
  if (islands.length !== 1) return symbolsForTopic(topic);
  const body = bare(islands[0]).replace(/^\s*(?:[a-zA-Z]'*\s*\(\s*x\s*\)|y)\s*=/, '');
  const relation = /[<>≤≥≠∞=]/.test(body) || /\\(?:le|ge|leq|geq|ne|neq|infty)(?![a-zA-Z])/.test(islands[0]);
  if (/x/.test(body) && /[\d)}^]\s*x|x\s*[\^+\-−*/]|[+\-−]\s*x|√|sqrt/.test(body + islands[0]) && !relation) return EXPRESSION_SYMBOLS;
  return symbolsForTopic(topic);
}

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
          // No tabIndex={-1}: onMouseDown already keeps the caret in the input,
          // and a roving-tabindex toolbar would need arrow-key handling this
          // bar doesn't have — so -1 on every button meant a keyboard user
          // could not reach the symbol bar at all. A <button> fires onClick on
          // Enter/Space, so it works from the keyboard as-is.
          aria-label={sym.title ?? sym.label}
          className="min-w-[2.25rem] px-2 py-1.5 rounded-lg bg-violet-500/[0.06] hover:bg-violet-500/[0.12] active:bg-violet-500/20 border border-violet-500/20 text-sm font-bold text-violet-800 disabled:opacity-40 transition-colors"
        >
          {sym.label}
        </button>
      ))}
    </div>
  );
}
