'use client';

/**
 * Panel — the console's one container.
 *
 * A management system is legible because every block is built the same way:
 * a header row with a title, a count, and the actions that belong to it; a
 * body that is usually a table. The student app's rounded, padded, shadowed
 * cards are the wrong instrument here — a teacher scanning thirty rows wants
 * rules and alignment, not softness.
 */

import type { LucideIcon } from 'lucide-react';

export function Panel({
  icon: Icon,
  title,
  blurb,
  count,
  actions,
  flush = false,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  /** One line saying what the panel is FOR. */
  blurb?: string;
  count?: number;
  actions?: React.ReactNode;
  /** No body padding — for tables that want to run edge to edge. */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex min-w-0 items-start gap-2.5">
          {Icon && (
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          )}
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
              {title}
              {typeof count === 'number' && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {count}
                </span>
              )}
            </h2>
            {blurb && (
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {blurb}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className={flush ? '' : 'px-4 py-3'}>{children}</div>
    </section>
  );
}

/** A table-body empty state that lines up with the rows it replaces. */
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">{children}</p>
  );
}

/** The console's button vocabulary. Three weights, no more. */
export function Btn({
  kind = 'secondary',
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'primary' | 'secondary' | 'ghost' }) {
  const base =
    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-40';
  const look =
    kind === 'primary'
      ? 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
      : kind === 'ghost'
        ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
        : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300';
  return <button className={`${base} ${look} ${className}`} {...rest} />;
}

export const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50';
