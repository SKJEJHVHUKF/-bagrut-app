'use client';

// BottomNav — the global mobile navigation bar (Lumina).
//
// Mounted once in the root layout, next to AppChrome. It is the phone-first
// counterpart to the profile drawer: five destinations always one thumb-tap
// away, instead of drawer → scan the list → tap.
//
// Deliberate scoping decisions:
//   * MOBILE ONLY (`md:hidden`). On desktop the sticky top navs plus the side
//     drawer already cover navigation, and a fixed bottom bar on a 1280px
//     window reads as a mistake.
//   * SIGNED-IN ONLY, mirroring AppChrome. Three of the five destinations sit
//     behind PROTECTED_PREFIXES in lib/supabase/middleware.ts, so showing this
//     to a logged-out visitor would be a row of buttons that bounce to /login.
//   * HIDDEN on focused flows (see HIDDEN_PREFIXES): /chat owns the bottom of
//     the screen with its composer, and /quiz is a timed exam — nudging a
//     student out of a question they are mid-way through is a UX bug, not a
//     convenience.
//
// Body padding is handled by the `has-bottom-nav` class this component puts on
// <body>, so only the routes that actually render the bar reserve space for it
// (see app/globals.css).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Map as MapIcon, Target, ScanLine, MessageCircle, Menu } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Routes where the bar must not appear at all.
//   /login,/signup,/auth,/onboarding — pre-app flows, same as AppChrome.
//   /chat                           — has its own fixed composer at bottom-0.
//   /quiz                           — self-contained exam island; don't offer
//                                     an exit ramp mid-question.
const HIDDEN_PREFIXES = ['/login', '/signup', '/auth', '/onboarding', '/chat', '/quiz'];

function isHiddenPath(path: string): boolean {
  return HIDDEN_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

type Item = {
  href: string;
  icon: typeof MapIcon;
  label: string;
  /** Prefixes that should light this tab up, beyond `href` itself. */
  match?: string[];
};

const ITEMS: Item[] = [
  { href: '/roadmap', icon: MapIcon, label: 'מסלול', match: ['/roadmap', '/practice', '/learn'] },
  { href: '/quiz', icon: Target, label: 'בוחן' },
  { href: '/scan', icon: ScanLine, label: 'סריקה' },
  { href: '/chat', icon: MessageCircle, label: 'מורה' },
];

export default function BottomNav() {
  const pathname = usePathname() ?? '/';
  const hidden = isHiddenPath(pathname);
  const [signedIn, setSignedIn] = useState(false);

  // Same auth handshake AppChrome uses: cached session for an instant answer,
  // getUser to confirm, and a subscription so the bar appears the moment a
  // student finishes signing in rather than on the next navigation.
  useEffect(() => {
    if (hidden) return;
    let cancelled = false;
    const supabase = createClient();
    const apply = (user: unknown) => {
      if (!cancelled) setSignedIn(!!user);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session?.user));
    supabase.auth.getUser().then(({ data }) => apply(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => apply(session?.user));
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [hidden, pathname]);

  const visible = !hidden && signedIn;

  // Reserve space for the bar only while it is actually mounted, so routes
  // without it (and desktop, via the media query on the class) keep their
  // original spacing. Cleaning up on unmount is what makes navigating from
  // /roadmap into /chat not leave a dead 68px gap under the composer.
  useEffect(() => {
    if (!visible) return;
    document.body.classList.add('has-bottom-nav');
    return () => document.body.classList.remove('has-bottom-nav');
  }, [visible]);

  if (!visible) return null;

  const isActive = (it: Item) =>
    (it.match ?? [it.href]).some((p) => pathname === p || pathname.startsWith(p + '/'));

  return (
    <nav
      dir="rtl"
      aria-label="ניווט ראשי"
      className="md:hidden fixed bottom-0 inset-x-0 z-[55] glass-card border-x-0 border-b-0 rounded-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex items-stretch justify-around px-1">
        {ITEMS.map((it) => {
          const active = isActive(it);
          const Icon = it.icon;
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center gap-0.5 pt-2 pb-1.5 group"
              >
                <span className="relative inline-flex items-center justify-center w-11 h-7 rounded-full">
                  {active && (
                    <motion.span
                      layoutId="bottomnav-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-full bg-[var(--primary-container)]"
                    />
                  )}
                  <Icon
                    className={`relative w-[18px] h-[18px] transition-colors ${
                      active ? 'text-[var(--on-primary-container)]' : 'text-slate-600'
                    }`}
                    strokeWidth={active ? 2.4 : 2}
                  />
                </span>
                <span
                  className={`text-[10px] leading-none transition-colors ${
                    active ? 'font-black text-[var(--on-primary-container)]' : 'font-bold text-slate-600'
                  }`}
                >
                  {it.label}
                </span>
              </Link>
            </li>
          );
        })}

        {/* Fifth slot opens the existing profile drawer rather than duplicating
            it — AppChrome listens for this event (same pattern as the Ctrl+K
            'open-global-search' event it already handles). */}
        <li className="flex-1">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('open-profile-drawer'))}
            aria-label="תפריט ופרופיל"
            className="w-full relative flex flex-col items-center gap-0.5 pt-2 pb-1.5"
          >
            <span className="relative inline-flex items-center justify-center w-11 h-7 rounded-full">
              <Menu className="relative w-[18px] h-[18px] text-slate-600" strokeWidth={2} />
            </span>
            <span className="text-[10px] leading-none font-bold text-slate-600">עוד</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
