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
//   * SHOWN TO EVERYONE, signed in or not. It was gated on auth at first, by
//     analogy with AppChrome, and that was wrong: /roadmap, /practice and
//     /scan are deliberately public (see the middleware note in CLAUDE.md —
//     an anonymous visitor following a link must not hit a login wall), so
//     the gate deleted the primary navigation for exactly the visitors who
//     have no other way around. /quiz and /chat still redirect to login for
//     anonymous users, which is the app's normal, expected flow.
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
import { Menu, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PRIMARY_ITEMS, isActive, isStaffPath } from '@/lib/nav';

// Routes where the bar must not appear at all.
//   /login,/signup,/auth,/onboarding — pre-app flows, same as AppChrome.
//   /chat                           — has its own fixed composer at bottom-0.
//   /quiz                           — self-contained exam island; don't offer
//                                     an exit ramp mid-question.
const HIDDEN_PREFIXES = ['/login', '/signup', '/auth', '/onboarding', '/chat', '/quiz'];

function isHiddenPath(path: string): boolean {
  // isStaffPath: the learner's tab bar does not belong on /admin or /teacher.
  return isStaffPath(path) || HIDDEN_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

// The four tabs are a SUBSET of lib/nav.ts, not a fourth hand-written list.
// They used to be declared here with their own labels, which is how the app
// ended up calling the same destination "מורה" on a phone and "מורה AI" in the
// drawer. Short tab labels are derived below rather than re-authored.
const TAB_LABELS: Record<string, string> = {
  '/roadmap': 'מסלול',
  // The nav item's full label is "כניסה לכיתה שלי" — the phrase the owner
  // asked for — and the desktop header shows it whole. At 10px on a phone it
  // wraps to two lines, so the tab keeps the short form.
  '/my-class': 'הכיתה שלי',
  '/quiz': 'בוחן',
  '/scan': 'סריקה',
  '/chat': 'מורה',
};

const ITEMS = PRIMARY_ITEMS.map((item) => ({
  ...item,
  label: TAB_LABELS[item.href] ?? item.label,
}));

export default function BottomNav() {
  const pathname = usePathname() ?? '/';
  const hidden = isHiddenPath(pathname);
  const [signedIn, setSignedIn] = useState(false);

  // Auth is read ONLY to decide what the fifth tab does — never whether the
  // bar renders. `signedIn` starting false must therefore be a safe default:
  // the worst case is that a signed-in student briefly sees "כניסה" instead of
  // "עוד" for one tick, not that navigation disappears.
  //
  // Every call is defensive. getUser() rejects with AuthSessionMissingError for
  // an anonymous visitor, and an unhandled rejection here previously had no
  // catch at all.
  useEffect(() => {
    if (hidden) return;
    let cancelled = false;
    const apply = (user: unknown) => {
      if (!cancelled) setSignedIn(!!user);
    };
    let unsubscribe = () => {};
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => apply(data.session?.user)).catch(() => {});
      supabase.auth.getUser().then(({ data }) => apply(data.user)).catch(() => apply(null));
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => apply(session?.user));
      unsubscribe = () => sub.subscription.unsubscribe();
    } catch {
      // Supabase misconfigured/unreachable — the bar still renders.
      apply(null);
    }
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [hidden, pathname]);

  const visible = !hidden;

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

  return (
    <nav
      dir="rtl"
      aria-label="ניווט ראשי"
      className="md:hidden fixed bottom-0 inset-x-0 z-[55] glass-card border-x-0 border-b-0 rounded-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex items-stretch justify-around px-1">
        {ITEMS.map((it) => {
          const active = isActive(it, pathname);
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

        {/* Fifth slot. Signed in, it opens the existing AppChrome drawer via an
            event rather than duplicating the profile UI (same pattern as the
            Ctrl+K 'open-global-search' event that drawer already handles).
            Signed OUT it must be a link to /login instead: AppChrome renders
            null without a user, so dispatching the event would do nothing at
            all and leave a button that visibly does not work. */}
        <li className="flex-1">
          {signedIn ? (
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
          ) : (
            <Link
              href="/login"
              aria-label="כניסה לחשבון"
              className="w-full relative flex flex-col items-center gap-0.5 pt-2 pb-1.5"
            >
              <span className="relative inline-flex items-center justify-center w-11 h-7 rounded-full">
                <LogIn className="relative w-[18px] h-[18px] text-slate-600" strokeWidth={2} />
              </span>
              <span className="text-[10px] leading-none font-bold text-slate-600">כניסה</span>
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
