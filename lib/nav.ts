// lib/nav.ts — the app's information architecture, in one place.
//
// Before this, the same destinations were hard-coded three times: four tabs in
// BottomNav, an eleven-item FLAT list in the AppChrome drawer, and nothing at
// all on desktop. Nothing told a student what the app contains — /roadmap (the
// product) sat at the same visual weight as /history.
//
// The grouping is by INTENT — what the student is trying to do right now — not
// by feature type. "אני רוצה עזרה עכשיו" is a different state of mind from
// "אני רוצה לראות איפה אני עומד", and a menu that mirrors those states is
// readable at a glance in a way an alphabetised list never is.
//
// To re-group the app, edit this file. AppHeader, AppChrome and BottomNav all
// read from it, so they cannot drift apart again.

import {
  Map as MapIcon,
  Target,
  
  MessageCircle,
  ScanLine,
  ScrollText,
  School,
  Sigma,
  Library,
  BookOpen,
  BarChart3,
  NotebookPen,
  History,
  Activity,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: typeof MapIcon;
  /** One line, shown in the desktop menu. Says what the student GETS, not what
   *  the screen is called — "מסלול הלמידה" means nothing on its own. */
  blurb: string;
  /** Extra path prefixes that count as "you are here", beyond href itself. */
  match?: string[];
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'learn',
    label: 'ללמוד',
    items: [
      {
        href: '/roadmap',
        label: 'מסלול הלמידה',
        icon: MapIcon,
        blurb: 'הדרך המסודרת מהנושא הראשון עד הבגרות',
        match: ['/roadmap', '/practice', '/learn'],
      },
      {
        href: '/quiz',
        label: 'בוחן מהיר',
        icon: Target,
        blurb: 'חמש שאלות, בדיקה מיידית איפה אתה עומד',
      },
    ],
  },
  {
    id: 'help',
    label: 'עזרה עכשיו',
    items: [
      {
        href: '/chat',
        label: 'מורה AI',
        icon: MessageCircle,
        blurb: 'שאלה חופשית, תשובה בעברית, מקורקע בנושא שלך',
      },
      {
        href: '/scan',
        label: 'סריקת שאלה',
        icon: ScanLine,
        blurb: 'צלם שאלה שנתקעת בה וקבל את הפתרון המוסבר',
      },
    ],
  },
  {
    id: 'material',
    label: 'חומרי בגרות',
    items: [
      {
        href: '/bagruyot',
        label: 'בגרויות קודמות',
        icon: ScrollText,
        blurb: 'שאלות אמיתיות ממועדים קודמים, לפי שאלון',
      },
      {
        href: '/formulas',
        label: 'דף נוסחאות',
        icon: Sigma,
        blurb: 'הדף הרשמי, מסודר לפי נושא',
      },
      {
        href: '/library',
        label: 'הספרייה שלי',
        icon: Library,
        blurb: 'כל השיעורים והסיכומים במקום אחד',
      },
    ],
  },
  {
    id: 'progress',
    label: 'ההתקדמות שלי',
    items: [
      {
        href: '/my-plan',
        label: 'התוכנית שלי',
        icon: BookOpen,
        blurb: 'מה ללמוד היום, ולמה דווקא את זה',
      },
      {
        href: '/insights',
        label: 'התמונה שלי',
        icon: BarChart3,
        blurb: 'החוזקות, החולשות והציון החזוי',
      },
      {
        href: '/report',
        label: 'דוח המעקב',
        icon: Activity,
        blurb: 'איפה הטעויות שלך חוזרות, ומה שתיקנת החזיק',
      },
      {
        href: '/errors',
        label: 'מחברת הטעויות',
        icon: NotebookPen,
        blurb: 'כל מה שטעית בו, מקובץ לפי סוג הטעות',
      },
      {
        href: '/history',
        label: 'ההיסטוריה שלי',
        icon: History,
        blurb: 'כל מה שפתרת, לפי תאריך',
      },
    ],
  },
  {
    id: 'class',
    label: 'כיתה',
    items: [
      {
        // ⚠️ THE ONLY WAY A STUDENT FINDS THE CLASS. A teacher reads out a
        // six-character code in a lesson; without a menu entry the student has
        // the code and nowhere to type it, and "go to slash school" is not an
        // instruction a fifteen-year-old follows. One entry serves both sides:
        // a teacher lands on his classes, a student on the join box.
        href: '/school',
        label: 'הכיתה שלי',
        icon: School,
        blurb: 'הצטרפות עם קוד מהמורה, ומה שהמורה ביקש לתרגל',
        match: ['/school'],
      },
    ],
  },
];

/** Flat list — for anything that needs every destination without the grouping. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** The four thumb-reachable destinations on a phone. Deliberately a SUBSET,
 *  not its own list: a fifth "עוד" tab opens the drawer, which carries the
 *  full grouped menu. Kept as hrefs so the labels and icons stay in one place. */
const PRIMARY_HREFS = ['/roadmap', '/quiz', '/scan', '/chat'];

export const PRIMARY_ITEMS: NavItem[] = PRIMARY_HREFS.map(
  (href) => NAV_ITEMS.find((i) => i.href === href)!,
);

/** Does `pathname` sit inside this item's area? */
export function isActive(item: NavItem, pathname: string): boolean {
  const prefixes = item.match ?? [item.href];
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/** The group + item the student is currently in, for "you are here" labelling.
 *  Longest match wins so /practice/... resolves to מסלול הלמידה and not to a
 *  shorter prefix that happens to also match. */
export function locate(pathname: string): { group: NavGroup; item: NavItem } | null {
  let best: { group: NavGroup; item: NavItem; len: number } | null = null;
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      for (const p of item.match ?? [item.href]) {
        if (pathname === p || pathname.startsWith(p + '/')) {
          if (!best || p.length > best.len) best = { group, item, len: p.length };
        }
      }
    }
  }
  return best ? { group: best.group, item: best.item } : null;
}

/**
 * The staff consoles: /admin (the owner's) and /teacher (a private tutor's).
 *
 * They are not the student app and must carry NONE of its chrome — no top
 * nav, no bottom tab bar, no floating avatar, no tutor bubble. Each of those
 * components keeps its own list of auth-flow exceptions, and before this
 * existed the staff screens rendered underneath all four of them at once,
 * which is exactly what made the admin area feel like a settings page taped
 * onto the product. One list, so the fifth component cannot forget.
 */
const STAFF_PREFIXES = ['/admin', '/teacher'];

export function isStaffPath(pathname: string): boolean {
  return STAFF_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}
