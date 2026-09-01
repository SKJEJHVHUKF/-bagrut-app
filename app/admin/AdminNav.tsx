'use client';

// AdminNav — the admin area's own navigation.
//
// The console used to be one screen holding an add-account form, a teacher
// panel with three nested forms, and an accounts table with expandable rows.
// Everything was reachable and nothing was findable. Each of those is now its
// own screen, and this is how you move between them.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, LayoutDashboard, Users, Wallet } from 'lucide-react';

const LINKS = [
  { href: '/admin', label: 'סקירה', icon: LayoutDashboard, hint: 'מה מוגדר ומה חסר' },
  { href: '/admin/teachers', label: 'מורים', icon: GraduationCap, hint: 'תנאים ותלמידים' },
  { href: '/admin/pay', label: 'שכר', icon: Wallet, hint: 'כמה מגיע החודש' },
  { href: '/admin/accounts', label: 'חשבונות', icon: Users, hint: 'כל הנרשמים ופעילותם' },
] as const;

export default function AdminNav() {
  const pathname = usePathname() ?? '/admin';

  return (
    <nav aria-label="ניווט ניהול" className="md:w-52 md:shrink-0">
      <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
        {LINKS.map(({ href, label, icon: Icon, hint }) => {
          // /admin is a prefix of every other link, so it matches exactly;
          // the rest also light up on their own sub-pages (a teacher's page).
          const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors ${
                  active
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-600 hover:bg-slate-900/[0.04] hover:text-slate-900'
                }`}
              >
                <Icon aria-hidden="true" className="w-4 h-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-black leading-tight">{label}</span>
                  <span
                    className={`hidden md:block text-[11px] leading-tight ${
                      active ? 'text-violet-100' : 'text-slate-400'
                    }`}
                  >
                    {hint}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
