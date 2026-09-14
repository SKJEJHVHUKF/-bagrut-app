'use client';

// AppHeader — the persistent desktop navigation.
//
// The first version of this bar grouped all twelve destinations into four
// dropdown menus. It was tidy and it was wrong: every destination cost a click
// to open a menu, a read, and a second click. A student does not arrive
// wanting to browse a taxonomy of the product — they arrive wanting to get to
// one of four places. A menu that hides those four behind a category name is
// filing, not navigation.
//
// So: the four primary destinations sit on the bar, one click each, exactly
// the ones BottomNav puts under a thumb on a phone. Everything else lives in
// the profile drawer behind "עוד" — the same drawer, the same grouping, the
// same second click, on both form factors. One model, not two.
//
// Desktop only (`hidden md:block`); phones keep BottomNav. Both read
// lib/nav.ts, so the two can never describe the app differently.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search } from 'lucide-react';
import MathUpLogo from '@/components/MathUpLogo';
import { PRIMARY_ITEMS, isActive, isStaffPath } from '@/lib/nav';

// Pre-app flows own the whole viewport; the landing page ships its own nav.
const HIDDEN_PREFIXES = ['/login', '/signup', '/auth', '/onboarding'];
// isStaffPath below: /admin and /teacher have their own header.

function isHidden(path: string): boolean {
  if (path === '/') return true;
  return isStaffPath(path) || HIDDEN_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

export default function AppHeader() {
  const pathname = usePathname() ?? '/';
  if (isHidden(pathname)) return null;

  return (
    <header className="hidden md:block sticky top-0 z-[90] border-b border-slate-900/[0.07] bg-white/75 backdrop-blur-xl">
      {/* pl-16 is PHYSICAL left padding, reserving the corner for AppChrome's
          floating avatar (fixed at top-3 left-3). */}
      <div className="max-w-6xl mx-auto px-6 pl-16 h-16 flex items-center gap-2">
        <Link
          href="/roadmap"
          className="flex items-center gap-2.5 shrink-0 rounded-lg ml-4"
          aria-label="MathUp — למסלול הלמידה"
        >
          <MathUpLogo size="sm" />
          <span className="font-display text-base font-black text-ink">MathUp</span>
        </Link>

        <nav aria-label="ניווט ראשי" className="flex items-center gap-1">
          {PRIMARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const here = isActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={here ? 'page' : undefined}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                  here
                    ? 'text-violet-800 bg-violet-500/10'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-900/[0.04]'
                }`}
              >
                <Icon aria-hidden="true" className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          {/* Everything else, in the drawer that already carries the full
              grouped menu — rather than a second copy of it up here. */}
          <button
            onClick={() => window.dispatchEvent(new Event('open-profile-drawer'))}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-900/[0.04] transition-colors"
          >
            <Menu aria-hidden="true" className="w-4 h-4" />
            עוד
          </button>
        </nav>

        {/* The command palette was reachable only by knowing Ctrl+K existed. */}
        <button
          onClick={() => window.dispatchEvent(new Event('open-global-search'))}
          className="mr-auto flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-900/[0.10] text-slate-600 hover:text-slate-900 hover:border-slate-900/20 transition-colors"
        >
          <Search aria-hidden="true" className="w-4 h-4" />
          <span className="text-sm">חיפוש</span>
          <kbd className="text-[10px] font-mono bg-slate-900/[0.05] rounded px-1.5 py-0.5" dir="ltr">
            Ctrl K
          </kbd>
        </button>
      </div>
    </header>
  );
}
