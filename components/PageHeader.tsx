'use client';

// PageHeader — the one thing every screen says before it says anything else:
// where you are.
//
// The app has 24 routes and, until now, no screen stated its own place in the
// product. A student who tapped through three levels of the learning path saw
// a title and nothing else — no idea which area they were in, and no one-tap
// way back out. That is what makes an app feel improvised rather than built.
//
// The area name is DERIVED from lib/nav.ts rather than passed in, so a page
// cannot label itself into a section it does not belong to, and re-grouping the
// app in nav.ts relabels every page at once.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { locate } from '@/lib/nav';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  /** One line under the title. Say what the student can DO here. */
  description?: string;
  /** Right-aligned controls — a primary button, a filter, a counter. */
  actions?: React.ReactNode;
}) {
  const pathname = usePathname() ?? '/';
  const here = locate(pathname);

  // A page nested BELOW its area's landing page gets a way back up. On the
  // area's own landing page that link would point at the current page, so it
  // is omitted rather than rendered as a no-op.
  const showBackToArea = here ? pathname !== here.item.href : false;

  return (
    <header className="mb-6 space-y-2">
      {here && (
        <nav aria-label="מיקום" className="flex items-center gap-1.5 text-xs">
          <span className="font-black tracking-wide text-violet-700">{here.group.label}</span>
          <ChevronLeft aria-hidden="true" className="w-3 h-3 text-slate-400" />
          {showBackToArea ? (
            <Link
              href={here.item.href}
              className="text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
            >
              {here.item.label}
            </Link>
          ) : (
            <span className="text-slate-600">{here.item.label}</span>
          )}
        </nav>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-slate-600 leading-relaxed max-w-prose">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
