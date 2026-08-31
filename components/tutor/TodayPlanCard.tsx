'use client';

import Link from 'next/link';
import { ArrowLeft, CalendarCheck, Wrench, RotateCcw, TrendingUp, Target } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import type { TodayBrief } from '@/lib/tutor-greeting';
import type { DailyTaskKind } from '@/lib/daily-plan';

/**
 * "התוכנית להיום" — the first thing the tutor shows, and the only card in the
 * drawer a student is meant to ACT on.
 *
 * ============================================================
 * WHAT IT IS SAYING, IN THE ORDER IT SAYS IT
 * ============================================================
 * A teacher opening a session names three things and then stops: what today
 * costs, how far you are from the target, and the ONE move to start with. The
 * card is laid out in that order and nothing competes with the move.
 *
 * ⚠️ THE KIND IS A BADGE, NOT A PREFIX. `lib/daily-plan` builds titles like
 * "מסלול תיקון: מחשב שליפה עם החזרה…" — the type of work glued to the front of
 * the sentence, where it costs a line of the title and reads as boilerplate.
 * The badge carries it instead, with its own colour and icon, and `stripKind`
 * takes the duplicate out of the title. The data model is untouched: /my-plan
 * still renders the same strings it always did.
 */

const KIND: Record<
  DailyTaskKind,
  { label: string; Icon: typeof Wrench; ring: string; chip: string; bar: string }
> = {
  // Amber: a repair. The one task that names a mistake, so it must not look
  // like an alarm — a student who broke something is already uncomfortable.
  fix: {
    label: 'מסלול תיקון',
    Icon: Wrench,
    ring: 'ring-amber-500/25',
    chip: 'bg-amber-100 text-amber-800 border-amber-300/60',
    bar: 'bg-amber-400',
  },
  // Sky: memory. Nothing is wrong here, something is simply going cold.
  review: {
    label: 'חזרה',
    Icon: RotateCcw,
    ring: 'ring-sky-500/25',
    chip: 'bg-sky-100 text-sky-800 border-sky-300/60',
    bar: 'bg-sky-400',
  },
  // Violet: the brand colour, saved for the task that is actual progress.
  climb: {
    label: 'שלב חדש',
    Icon: TrendingUp,
    ring: 'ring-violet-500/25',
    chip: 'bg-violet-100 text-violet-800 border-violet-300/60',
    bar: 'bg-violet-400',
  },
  drill: {
    label: 'תרגול ממוקד',
    Icon: Target,
    ring: 'ring-emerald-500/25',
    chip: 'bg-emerald-100 text-emerald-800 border-emerald-300/60',
    bar: 'bg-emerald-400',
  },
};

/**
 * Drop the kind from the front of the title when the badge already says it.
 *
 * Conservative on purpose: it removes the label only when the title genuinely
 * opens with it, so a title that never had the prefix is returned untouched and
 * a future wording change degrades to a slightly redundant card rather than a
 * truncated sentence.
 */
export function stripKind(kind: DailyTaskKind, title: string): string {
  const label = KIND[kind]?.label;
  if (!label) return title;
  const t = title.trim();
  for (const sep of [': ', ' — ', ' - ', ':']) {
    const head = label + sep;
    if (t.startsWith(head)) return t.slice(head.length).trim();
  }
  return t;
}

export default function TodayPlanCard({
  today,
  onNavigate,
}: {
  today: TodayBrief;
  onNavigate: () => void;
}) {
  const k = KIND[today.first.kind] ?? KIND.drill;
  const { Icon } = k;
  const title = stripKind(today.first.kind, today.first.title);

  return (
    <div
      className={`mb-4 overflow-hidden rounded-2xl bg-gradient-to-b from-white to-violet-50/70 ring-1 ${k.ring} shadow-sm`}
    >
      {/* ---- the commitment, before it is asked for ---- */}
      <div className="flex items-center gap-2 px-3.5 pt-3 pb-2">
        <CalendarCheck className="w-4 h-4 text-violet-700 flex-shrink-0" aria-hidden />
        <span className="text-xs font-black text-slate-900">התוכנית להיום</span>
        <span className="mr-auto text-[11px] font-bold text-violet-700/80 tabular-nums">
          {today.summary}
        </span>
      </div>

      {today.goalLine && (
        <p className="px-3.5 pb-2.5 text-[11px] leading-snug text-slate-600">{today.goalLine}</p>
      )}

      {/* ---- the one move ---- */}
      <Link
        href={today.first.href}
        onClick={onNavigate}
        className="group relative mx-2.5 mb-2.5 block overflow-hidden rounded-xl border border-slate-200/80 bg-white px-3 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
      >
        {/* The accent sits on the RIGHT: the panel is RTL, so this is the edge
            the eye starts from, not a decoration on the far side. */}
        <span className={`absolute inset-y-0 right-0 w-1 ${k.bar}`} aria-hidden />

        <span className="flex items-start gap-2.5 pr-2">
          <span className="flex-1 min-w-0">
            <span className="mb-1.5 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-black ${k.chip}`}
              >
                <Icon className="h-3 w-3" aria-hidden />
                {k.label}
              </span>
              <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                ~{today.first.minutes} דק׳
              </span>
            </span>

            {/* MathText: a repair task's title is the misconception's own
                title, which carries $…$ islands. */}
            <span className="block text-sm font-bold leading-snug text-slate-900">
              <MathText inline>{title}</MathText>
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-slate-600">
              <MathText inline>{today.first.why}</MathText>
            </span>
          </span>

          <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-all group-hover:bg-violet-600 group-hover:text-white">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          </span>
        </span>
      </Link>

      {today.more > 0 && (
        <p className="px-3.5 pb-3 text-[11px] text-slate-500">
          ואחר כך עוד {today.more}, נעבור אחת-אחת.
        </p>
      )}
    </div>
  );
}
