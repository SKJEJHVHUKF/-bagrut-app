'use client';

// The floating scientific calculator — the square key beside the נוסחאות pill
// on every study page.
//
// Three rules come from how a student actually uses it mid-exercise:
//
// 1. It NEVER steals focus. Every click inside the panel calls preventDefault
//    on mousedown, so the answer field the student is typing into keeps focus
//    and its caret. Without this, each key press blurred the input and the
//    student had to click back into it between digits.
// 2. It opens at the SIDE (the free margin next to the centred exercise
//    column, on the same edge as the trigger) and is DRAGGABLE by its header,
//    because no single fixed corner is clear of the answer inputs at every
//    viewport width. Where the student parks it is remembered in localStorage.
// 3. Non-modal, exactly like the formula drawer: no backdrop, no
//    close-on-outside-click, so the exercise stays visible AND clickable.
//    Closing is the X or ESC.
//
// No keyboard shortcuts by design — the student is usually typing into an
// input on the page, and a global keydown listener would eat those keystrokes.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Calculator as CalcIcon, X, Delete, GripHorizontal } from 'lucide-react';
import { clampToViewport, display, evaluateExpr, type AngleMode } from '@/lib/calculator';

type Tone = 'fn' | 'num' | 'op' | 'eq' | 'clear';
type Key = { label: string; ins?: string; act?: 'eq' | 'ac' | 'del'; tone: Tone; span?: boolean };

const fn = (label: string, ins: string): Key => ({ label, ins, tone: 'fn' });
const num = (label: string, span = false): Key => ({ label, ins: label, tone: 'num', span });
const op = (label: string, ins: string): Key => ({ label, ins, tone: 'op' });

// mathjs syntax on the right of every pair; lib/calculator.ts maps it back to
// what the student reads. `log` is the natural log there, `log10` is base 10.
// nCr/nPr are mathjs `combinations`/`permutations` — the comma key is what
// makes those two-argument keys usable at all.
const KEYS: Key[] = [
  fn('sin', 'sin('), fn('cos', 'cos('), fn('tan', 'tan('), fn('ln', 'log('), fn('log', 'log10('),
  fn('sin⁻¹', 'asin('), fn('cos⁻¹', 'acos('), fn('tan⁻¹', 'atan('), fn('√', 'sqrt('), fn('x²', '^2'),
  fn('nCr', 'combinations('), fn('nPr', 'permutations('), fn('n!', '!'), fn('xʸ', '^'), fn('π', 'pi'),
  fn('(', '('), fn(')', ')'), fn(',', ','), fn('e', 'e'), fn('Ans', 'ans'),
  num('7'), num('8'), num('9'), op('÷', '/'), { label: 'DEL', act: 'del', tone: 'clear' },
  num('4'), num('5'), num('6'), op('×', '*'), { label: 'AC', act: 'ac', tone: 'clear' },
  num('1'), num('2'), num('3'), op('−', '-'), op('+', '+'),
  num('0', true), num('.'), { label: '=', act: 'eq', tone: 'eq', span: true },
];

const TONE: Record<Tone, string> = {
  fn: 'bg-slate-900/[0.04] text-violet-800 border-slate-900/10 text-[12px]',
  num: 'bg-white text-slate-900 border-slate-900/10 text-[15px]',
  op: 'bg-violet-500/10 text-violet-800 border-violet-500/20 text-[15px]',
  clear: 'bg-rose-500/10 text-rose-700 border-rose-500/20 text-[12px]',
  eq: 'bg-gradient-to-br from-violet-500 to-violet-600 text-white border-violet-600 text-[16px] shadow-md shadow-violet-500/30',
};

/** An operator continues the previous answer (`5+3=` then `×2` → `Ans×2`);
 *  anything else after `=` starts a fresh expression. Casio behaviour. */
const continuesAns = (ins: string) => /^[+\-*/^!]/.test(ins);

const PANEL_W = 300;
// Only the seed for the first clamp — the real height is measured on mount,
// which is what the resize/drag clamps use.
const PANEL_H_SEED = 470;
const POS_KEY = 'mathup.calc.pos';

export default function Calculator() {
  const [open, setOpen] = useState(false);
  // Parts, not one string: DEL then removes a whole token (`sin(`, `^2`)
  // instead of leaving `sin` or `^` behind as a parse error.
  const [parts, setParts] = useState<string[]>([]);
  const [out, setOut] = useState<{ text: string; err: boolean } | null>(null);
  const [mode, setMode] = useState<AngleMode>('deg');
  const [ans, setAns] = useState<unknown>(0);
  const [justEval, setJustEval] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const fit = useCallback((p: { x: number; y: number }) => {
    const h = panelRef.current?.offsetHeight || PANEL_H_SEED;
    return clampToViewport(p, { w: PANEL_W, h }, { w: window.innerWidth, h: window.innerHeight });
  }, []);

  // Opening position: where the student last parked it, else a default that
  // depends on whether the viewport has a free margin at all.
  const openPanel = () => {
    let saved: { x: number; y: number } | null = null;
    try {
      const raw = localStorage.getItem(POS_KEY);
      const p = raw ? JSON.parse(raw) : null;
      if (p && typeof p.x === 'number' && typeof p.y === 'number') saved = p;
    } catch {
      // private mode / blocked storage — fall through to the default corner
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const fallback =
      w < 640
        ? // A phone has no free margin beside the exercise, so dock it low like
          // an on-screen keyboard — the student scrolls the question above it
          // instead of it hiding the question. 88px clears the bottom nav.
          { x: (w - PANEL_W) / 2, y: h - PANEL_H_SEED - 88 }
        : // Desktop: the free margin on the trigger's own side, vertically
          // centred — clear of the answer inputs and the check button, which
          // sit at the bottom of the exercise card.
          { x: w - PANEL_W - 16, y: (h - PANEL_H_SEED) / 2 };
    setPos(clampToViewport(saved ?? fallback, { w: PANEL_W, h: PANEL_H_SEED }, { w, h }));
    setOpen(true);
  };

  // Re-clamp whenever the window resizes (a phone rotating, or the on-screen
  // keyboard opening). Only the FIRST placement uses PANEL_H_SEED; from here on
  // `fit` measures the mounted panel, so the seed being a few px off can never
  // accumulate.
  useEffect(() => {
    if (!open) return;
    const onResize = () => setPos((p) => (p ? fit(p) : p));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, fit]);

  const startDrag = (e: React.PointerEvent) => {
    // The header carries the DEG toggle and the close X; a press on either is
    // a click, not a drag.
    if ((e.target as HTMLElement).closest('button') || !pos) return;
    const grabX = e.clientX - pos.x;
    const grabY = e.clientY - pos.y;
    const move = (ev: PointerEvent) => setPos(fit({ x: ev.clientX - grabX, y: ev.clientY - grabY }));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const el = panelRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      try {
        localStorage.setItem(POS_KEY, JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top) }));
      } catch {
        // storage blocked — the position just won't survive a reload
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const press = async (k: Key) => {
    if (k.act === 'ac') {
      setParts([]);
      setOut(null);
      setJustEval(false);
      return;
    }
    if (k.act === 'del') {
      setParts((p) => p.slice(0, -1));
      setOut(null);
      setJustEval(false);
      return;
    }
    if (k.act === 'eq') {
      const r = await evaluateExpr(parts.join(''), mode, ans);
      if (!r) return;
      if (!r.ok) {
        setOut({ text: 'שגיאה', err: true });
        return;
      }
      setAns(r.value);
      setOut({ text: r.text, err: false });
      setJustEval(true);
      return;
    }
    const ins = k.ins!;
    if (justEval) {
      setParts(continuesAns(ins) ? ['ans', ins] : [ins]);
      setJustEval(false);
    } else {
      setParts((p) => [...p, ins]);
    }
    setOut(null);
  };

  const expr = display(parts.join(''));

  return (
    <>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label="מחשבון מדעי"
        aria-expanded={open}
        className={`w-[42px] h-[42px] rounded-2xl backdrop-blur border shadow-lg flex items-center justify-center transition-all hover:scale-[1.03] ${
          open
            ? 'bg-violet-600 border-violet-600 text-white shadow-violet-500/30'
            : 'bg-white/95 border-violet-500/25 text-violet-800 shadow-violet-500/15 hover:bg-violet-500/5'
        }`}
      >
        <CalcIcon className="w-[18px] h-[18px]" />
      </button>

      {open && pos && (
        // dir=ltr: the display and the keypad are math, and the app root is
        // dir=rtl — without this the expression renders right-to-left.
        // z-[95] clears the formula drawer (z-91) so both can be open at once.
        // onMouseDown/preventDefault is what keeps the student's answer field
        // focused while they press keys — see the note at the top of the file.
        <div
          ref={panelRef}
          dir="ltr"
          role="dialog"
          aria-label="מחשבון מדעי"
          style={{ left: pos.x, top: pos.y, width: PANEL_W }}
          onMouseDown={(e) => e.preventDefault()}
          className="fixed z-[95] rounded-2xl border border-violet-500/25 bg-white shadow-2xl shadow-slate-900/25 overflow-hidden"
        >
          <div
            onPointerDown={startDrag}
            className="flex items-center justify-between px-3 py-2 border-b border-slate-900/[0.08] bg-slate-900/[0.02] cursor-grab active:cursor-grabbing touch-none select-none"
          >
            <button
              type="button"
              onClick={() => setMode((m) => (m === 'deg' ? 'rad' : 'deg'))}
              aria-label="מעלות או רדיאנים"
              className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-800 text-[11px] font-black tracking-wide"
            >
              {mode === 'deg' ? 'DEG' : 'RAD'}
            </button>
            <GripHorizontal className="w-4 h-4 text-slate-400" aria-hidden />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגור"
              className="w-7 h-7 rounded-lg hover:bg-slate-900/5 flex items-center justify-center text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Display: expression on top, result big below (Casio layout). */}
          <div className="px-3 py-2.5 bg-slate-900/[0.03] border-b border-slate-900/[0.08]">
            <div className="h-4 text-[12px] text-slate-500 text-right truncate" title={expr}>
              {expr}
            </div>
            <div
              className={`text-right font-black tabular-nums truncate text-[22px] leading-8 ${
                out?.err ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {out ? out.text : '0'}
            </div>
          </div>

          <div className="p-2 grid grid-cols-5 gap-1.5">
            {KEYS.map((k) => (
              <button
                key={k.label}
                type="button"
                // DEL renders as an icon, so without this it is the one key
                // with no accessible name at all.
                aria-label={k.label}
                onClick={() => void press(k)}
                className={`h-[38px] rounded-xl border font-bold flex items-center justify-center active:scale-95 transition-transform ${
                  k.span ? 'col-span-2' : ''
                } ${TONE[k.tone]}`}
              >
                {k.act === 'del' ? <Delete className="w-4 h-4" /> : k.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
