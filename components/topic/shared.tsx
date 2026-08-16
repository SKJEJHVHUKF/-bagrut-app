import { ReactNode } from 'react';
import { MathText } from '@/components/practice/MathText';

// ── Prose ───────────────────────────────────────────────────────────────────
// Renders markdown + inline LaTeX through <MathText>, wrapped in the `chat-md`
// container that the global CSS keys on to isolate each KaTeX run as an LTR
// island inside the RTL Hebrew flow (see app/globals.css). EVERY piece of
// topic text that may contain math must flow through here so the bidi stays
// correct. Pure-Hebrew labels (section titles, badges) can skip it and use
// plain Tailwind text, which keeps full styling control.
export function Prose({
  children,
  inline = false,
  className = '',
}: {
  children: string;
  inline?: boolean;
  className?: string;
}) {
  return (
    <div className={`chat-md ${className}`}>
      <MathText inline={inline}>{children}</MathText>
    </div>
  );
}

// ── SectionShell ─────────────────────────────────────────────────────────────
// A consistent section header (colored icon + Hebrew title) above its content.
export function SectionShell({
  icon,
  title,
  accent = 'text-violet-300',
  children,
}: {
  icon: ReactNode;
  title: string;
  /** Tailwind text-color class for the icon chip, e.g. "text-amber-300". */
  accent?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span className={`flex-shrink-0 ${accent}`}>{icon}</span>
        <h2 className="font-display text-lg sm:text-xl font-black text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ── DifficultyDots ───────────────────────────────────────────────────────────
// Five dots; the first `level` are lit. Communicates 1–5 difficulty at a glance.
export function DifficultyDots({ level, max = 5 }: { level: number; max?: number }) {
  return (
    <span
      className="flex items-center gap-1 flex-shrink-0"
      title={`רמת קושי ${level} מתוך ${max}`}
      aria-label={`רמת קושי ${level} מתוך ${max}`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < level ? 'bg-amber-400' : 'bg-white/15'}`}
        />
      ))}
    </span>
  );
}
