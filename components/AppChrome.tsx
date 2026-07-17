'use client';

// AppChrome — a single global client component mounted once in the root
// layout. It renders a floating profile avatar on every authenticated app
// page (hidden on public/auth routes) that opens a side drawer with the
// user's identity, plan, learning streak, quick links, and sign-out.
//
// Deliberately self-contained: no route restructuring, no shared shell —
// it gates itself by pathname + auth so it can live above every page.

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Crown,
  Flame,
  BookOpen,
  BarChart3,
  History,
  Library,
  Check,
  Pencil,
  LogOut,
  ChevronLeft,
  Search as SearchIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isProUser } from '@/lib/access';
import { currentStreak } from '@/lib/results';
import {
  getUnitLevel,
  setUnitLevel,
  getPaper,
  setPaper as persistPaper,
  hasPlan,
  type UnitLevel,
} from '@/lib/study-plan';
import { paperLabel, type BagrutPaper } from '@/content/bagrut-curriculum';

// Public / auth routes where the floating avatar must NOT appear.
// Hide only on the auth/onboarding flows. On the landing ("/") the avatar
// shows for LOGGED-IN users (the component renders null when there's no
// user, so logged-out marketing visitors never see it).
const HIDDEN_PREFIXES = ['/login', '/signup', '/auth', '/onboarding'];
function isHiddenPath(path: string): boolean {
  return HIDDEN_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

type Profile = {
  email: string;
  name: string;
  pro: boolean;
};

function initialsOf(name: string, email: string): string {
  const src = name.trim() || email;
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (src[0] ?? '?').toUpperCase();
}

export default function AppChrome() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  // Editable name
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);

  const hidden = isHiddenPath(pathname ?? '/');

  // Load the current user whenever we're on a page that shows the chrome.
  // Robust to a session that hydrates slightly after mount: we read the
  // cached session immediately, confirm with getUser, AND subscribe to auth
  // changes so the avatar appears the moment the user is known.
  useEffect(() => {
    if (hidden) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    const supabase = createClient();

    type AuthUser = {
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    } | null | undefined;

    const apply = (user: AuthUser) => {
      if (cancelled) return;
      if (!user) {
        setProfile(null);
        return;
      }
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const name = (meta.name as string) || (meta.full_name as string) || '';
      setProfile({ email: user.email ?? '', name, pro: isProUser(user) });
    };

    // 1) Cached session — instant, no network round-trip.
    supabase.auth.getSession().then(({ data }) => apply(data.session?.user));
    // 2) Authoritative check.
    supabase.auth.getUser().then(({ data }) => apply(data.user));
    // 3) Keep in sync if auth resolves/changes later.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      apply(session?.user);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [hidden, pathname]);

  // Streak + unit level + active paper are client-only (localStorage) —
  // read on drawer open.
  const [units, setUnits] = useState<UnitLevel | null>(null);
  const [paper, setPaperState] = useState<BagrutPaper | null>(null);
  useEffect(() => {
    if (open) {
      setStreak(currentStreak());
      const planned = hasPlan();
      setUnits(planned ? getUnitLevel() : null);
      setPaperState(planned ? getPaper() : null);
    }
  }, [open]);

  const changeUnits = (u: UnitLevel) => {
    setUnitLevel(u);
    setUnits(u);
  };

  const changePaper = (p: BagrutPaper) => {
    persistPaper(p);
    setPaperState(p);
  };

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const saveName = useCallback(async () => {
    if (!profile) return;
    const next = draftName.trim();
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { name: next } });
      setProfile({ ...profile, name: next });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [draftName, profile]);

  if (hidden || !profile) return null;

  const initials = initialsOf(profile.name, profile.email);
  const displayName = profile.name || 'תלמיד/ה';

  return (
    <>
      {/* Floating avatar — top-left (opposite the page logo which sits right). */}
      <button
        onClick={() => setOpen(true)}
        aria-label="הפרופיל שלי"
        className="fixed top-3 left-3 z-[60] w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-2 ring-white hover:scale-105 transition-transform"
      >
        {initials}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[70] bg-slate-900/30 backdrop-blur-[2px]"
            />
            {/* Drawer — slides in from the physical left edge. */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
              dir="rtl"
              className="fixed top-0 bottom-0 left-0 z-[71] w-[300px] max-w-[85vw] bg-[#FDFDFB] border-l border-slate-900/10 shadow-2xl shadow-slate-900/20 flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-900/[0.08]">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    {initials}
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="סגור"
                    className="w-8 h-8 rounded-lg hover:bg-slate-900/5 flex items-center justify-center text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Name (editable) */}
                <div className="mt-3">
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        placeholder="השם שלך"
                        autoFocus
                        maxLength={40}
                        className="flex-1 min-w-0 bg-white border border-slate-900/15 focus:border-indigo-500/60 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveName();
                          if (e.key === 'Escape') setEditing(false);
                        }}
                      />
                      <button
                        onClick={saveName}
                        disabled={saving}
                        aria-label="שמור"
                        className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center disabled:opacity-60"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setDraftName(profile.name);
                        setEditing(true);
                      }}
                      className="group flex items-center gap-1.5 text-right"
                    >
                      <span className="font-black text-lg text-slate-900">{displayName}</span>
                      <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </button>
                  )}
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{profile.email}</div>
                </div>

                {/* Plan + streak chips */}
                <div className="flex items-center gap-2 mt-3">
                  {profile.pro ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black bg-[var(--accent)]/12 border border-[var(--accent)]/30 text-[var(--accent)] rounded-full px-2.5 py-1">
                      <Crown className="w-3 h-3" /> Pro
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[11px] font-black bg-slate-900/5 border border-slate-900/10 text-slate-600 rounded-full px-2.5 py-1">
                      חשבון חינם
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] font-black bg-orange-500/10 border border-orange-500/25 text-orange-700 rounded-full px-2.5 py-1">
                    <Flame className="w-3 h-3" /> {streak} ימי רצף
                  </span>
                </div>

                {/* Unit level — every question in the app adapts to this. */}
                {units !== null && (
                  <div className="mt-3">
                    <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-1.5">
                      רמת לימוד
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([3, 4, 5] as UnitLevel[]).map((u) => (
                        <button
                          key={u}
                          onClick={() => changeUnits(u)}
                          className={
                            units === u
                              ? 'rounded-lg py-1.5 text-xs font-black bg-indigo-600 text-white border border-indigo-600'
                              : 'rounded-lg py-1.5 text-xs font-bold bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 text-slate-600'
                          }
                        >
                          {u} יח׳
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active bagrut paper — filters topic lists across the app. */}
                {units !== null && (
                  <div className="mt-3">
                    <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-1.5">
                      שאלון פעיל
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['581', '582'] as BagrutPaper[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => changePaper(p)}
                          className={
                            paper === p
                              ? 'rounded-lg py-1.5 text-xs font-black bg-indigo-600 text-white border border-indigo-600'
                              : 'rounded-lg py-1.5 text-xs font-bold bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 text-slate-600'
                          }
                        >
                          {paperLabel(p)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick links */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                <button
                  onClick={() => {
                    setOpen(false);
                    window.dispatchEvent(new Event('open-global-search'));
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900/[0.04] text-slate-700 hover:text-slate-900 transition-colors group"
                >
                  <SearchIcon className="w-4.5 h-4.5 text-indigo-600" />
                  <span className="flex-1 text-right text-sm font-bold">חיפוש</span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl+K</span>
                </button>
                {[
                  { href: '/my-plan', icon: BookOpen, label: 'התוכנית שלי' },
                  { href: '/insights', icon: BarChart3, label: 'התמונה שלי' },
                  { href: '/history', icon: History, label: 'ההיסטוריה שלי' },
                  { href: '/library', icon: Library, label: 'הספרייה שלי' },
                ].map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900/[0.04] text-slate-700 hover:text-slate-900 transition-colors group"
                  >
                    <Icon className="w-4.5 h-4.5 text-indigo-600" />
                    <span className="flex-1 text-sm font-bold">{label}</span>
                    <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:-translate-x-0.5 transition-all" />
                  </Link>
                ))}

                {!profile.pro && (
                  <Link
                    href="/pricing"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-l from-amber-500/10 to-orange-500/10 border border-amber-500/25 text-amber-800 mt-2"
                  >
                    <Crown className="w-4.5 h-4.5 text-amber-600" />
                    <span className="flex-1 text-sm font-bold">שדרג ל-Pro</span>
                    <ChevronLeft className="w-4 h-4 text-amber-400" />
                  </Link>
                )}
              </nav>

              {/* Sign out */}
              <div className="p-3 border-t border-slate-900/[0.08]">
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/[0.03] hover:bg-red-500/10 border border-slate-900/10 hover:border-red-500/30 text-slate-700 hover:text-red-700 text-sm font-bold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>התנתקות</span>
                  </button>
                </form>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
