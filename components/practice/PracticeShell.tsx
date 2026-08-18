'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import MathUpLogo from '@/components/MathUpLogo';

// Ambient colour behind the glass. Kept far weaker than before (0.30 → 0.12)
// because the Lumina canvas in globals.css already lays down three colour
// fields site-wide — stacking the old orbs on top of those turned every
// practice page visibly purple.
function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-400/12 blur-[130px] animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-400/10 blur-[130px] animate-pulse"
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      />
    </div>
  );
}

export function PracticeShell({
  subtitle,
  backHref,
  backLabel,
  children,
}: {
  subtitle: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen text-slate-900 relative overflow-x-hidden">
      <BackgroundOrbs />

      {/* On phones this bar IS the header (AppHeader is desktop-only), so it
          carries the logo. On desktop the global AppHeader already shows the
          brand 64px above — a second logo directly under it read as a
          duplicated header on every learning screen. So on md+ this collapses
          to a slim context strip (where am I · back) that sticks right under
          the global bar. */}
      <nav className="sticky top-0 md:top-16 z-50 glass-card border-x-0 border-t-0 rounded-none">
        <div className="max-w-2xl mx-auto px-4 py-3 md:py-2 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 group md:hidden">
            <MathUpLogo size="md" />
            <div>
              <div className="text-base font-black font-display text-slate-900">MathUp</div>
              <div className="text-[10px] text-slate-600 -mt-0.5">{subtitle}</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-2 min-w-0 text-xs text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" aria-hidden="true" />
            <span className="font-bold text-slate-800 truncate">{subtitle}</span>
          </div>
          {backHref && (
            <Link
              href={backHref}
              className="group flex items-center gap-2 bg-white/70 hover:bg-white border border-white/60 hover:border-violet-500/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0"
            >
              <span>{backLabel ?? 'חזרה'}</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
