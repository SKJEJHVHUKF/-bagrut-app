'use client';

/**
 * ui.tsx — the console's small vocabulary of controls, in MathUp's own language.
 *
 * Every class string here comes from app/globals.css ("LUMINA"): `.btn-primary`,
 * `.surface-premium`, `--ink`, `.font-display`. Nothing is invented; the
 * console is a sibling of /teacher, not a generic dashboard and not a skin of
 * the student app.
 *
 * There is deliberately no <Card> component. The card is one class string —
 * `surface-premium rounded-2xl p-4` — and a component that only wraps a class
 * string is a name people have to learn for nothing.
 */

import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Clock, UserPlus, CheckCircle2 } from 'lucide-react';
import type { StudentState } from '@/lib/class-board';
import { STATE_WORD } from '@/components/console/copy';

// ---- buttons ----------------------------------------------------------------

// 48px is the floor, not the look. These are pressed by teachers in their
// fifties and sixties, often on a laptop trackpad, and the previous 36px
// button with 14px text was the single most-repeated control on the screen.
// The border is 2px for the same reason: a 1px slate-200 outline on an ivory
// canvas is invisible to anyone who is not looking for it, so a secondary
// button did not read as a button at all.
const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl min-h-[48px] px-5 py-2.5 text-base font-bold transition disabled:opacity-40 disabled:pointer-events-none';

/** For <Link>s that should look like the secondary button. */
export const btnSecondary = `${BTN_BASE} border-2 border-slate-300 bg-white text-slate-800 hover:border-violet-400 hover:text-violet-800`;
export const btnPrimary = `${BTN_BASE} btn-primary text-white`;
const btnGhost = `${BTN_BASE} text-slate-800 hover:bg-slate-900/[0.06] hover:text-ink`;

export function Btn({
  kind = 'secondary',
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'primary' | 'secondary' | 'ghost' }) {
  const look = kind === 'primary' ? btnPrimary : kind === 'ghost' ? btnGhost : btnSecondary;
  return <button className={`${look} ${className}`} {...rest} />;
}

export const inputCls =
  'w-full rounded-xl border-2 border-slate-300 bg-white min-h-[48px] px-4 py-3 text-base text-ink outline-none transition focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-300';

// ---- avatar -----------------------------------------------------------------

/** Two initials, or the first letter. Replicates components/AppChrome.tsx:96 —
 *  that file is a chokepoint every session edits, so it is not imported. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

/** The app's avatar recipe (AppChrome.tsx:276 / :305). */
export function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'lg' }) {
  const box =
    size === 'lg'
      ? 'h-14 w-14 rounded-2xl text-xl'
      : 'h-11 w-11 rounded-full text-base';
  return (
    <span
      aria-hidden
      className={`${box} inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-violet-500 to-violet-600 font-black text-white shadow-lg shadow-violet-500/30 ring-2 ring-white`}
    >
      {initialsOf(name)}
    </span>
  );
}

// ---- status chip ------------------------------------------------------------

const STATE_LOOK: Record<StudentState, { cls: string; Icon: LucideIcon }> = {
  stuck: { cls: 'bg-orange-500/10 border-orange-500/25 text-orange-800', Icon: AlertTriangle },
  away: { cls: 'bg-amber-500/10 border-amber-500/25 text-amber-800', Icon: Clock },
  'no-data': { cls: 'bg-slate-500/10 border-slate-500/30 text-slate-700', Icon: UserPlus },
  active: { cls: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800', Icon: CheckCircle2 },
};

/** One word, one colour, one icon — the AppChrome pill recipe. */
export function StateChip({ state }: { state: StudentState }) {
  const s = STATE_LOOK[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-black ${s.cls}`}
    >
      <s.Icon className="h-4 w-4" aria-hidden />
      {STATE_WORD[state]}
    </span>
  );
}

// ---- section head -----------------------------------------------------------

/** The /teacher header idiom: a violet icon and a short black title. */
export function SectionHead({
  icon: Icon,
  title,
  hint,
  count,
  actions,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
  count?: number;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-violet-700" aria-hidden />}
        <h2 className="font-display text-lg font-black text-ink">
          {title}
          {typeof count === 'number' && (
            <span className="ms-2 text-base font-bold text-slate-700 tabular-nums">{count}</span>
          )}
        </h2>
        {hint && <span className="text-base text-slate-700">{hint}</span>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
