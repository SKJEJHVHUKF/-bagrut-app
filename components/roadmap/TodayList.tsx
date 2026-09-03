'use client';

/**
 * TodayList — the ONE "what do I do now" list.
 *
 * Renders lib/daily-plan's ordered tasks (repair → review → climb → drill),
 * each with the sentence that ties it to the goal. Shared by the track page
 * and /my-plan so the student reads the same answer wherever he lands.
 *
 * Before 2026-09-03 the track page stacked four separate cards — repair,
 * the cognition NextStepCard, daily review, resume — computed by different
 * engines and not always agreeing. This list is the daily plan's order, which
 * already weighs all of them.
 */

import Link from 'next/link';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import type { DailyPlan } from '@/lib/daily-plan';

export function TodayList({
  daily,
  insight,
  title = 'היום',
}: {
  daily: DailyPlan;
  /** One sentence from the cognition layer about the current topic, if any. */
  insight?: string | null;
  title?: string;
}) {
  if (daily.tasks.length === 0) return null;

  return (
    <div className="surface-premium rounded-3xl p-5 space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="text-[11px] font-black tracking-widest text-violet-700 uppercase">{title}</div>
        <span className="text-[11px] font-bold text-slate-500">{`כ-${daily.totalMinutes} דק׳`}</span>
      </div>

      {daily.goal.headline && (
        <p className="text-sm text-slate-700 leading-relaxed">{daily.goal.headline}</p>
      )}

      {daily.tasks.map((task, i) => (
        <Link
          key={task.href}
          href={task.href}
          className="flex items-start gap-3 rounded-2xl border border-slate-900/10 bg-slate-900/[0.02] hover:bg-slate-900/[0.05] px-3.5 py-3 transition-colors"
        >
          <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-400/30 flex items-center justify-center text-[11px] font-black text-violet-800">
            {i + 1}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-black text-slate-900 leading-tight">
              <MathText inline>{task.title}</MathText>
            </span>
            <span className="block text-[11px] text-slate-600 leading-snug mt-0.5">
              <MathText inline>{task.why}</MathText>
            </span>
          </span>
          <ArrowLeft className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        </Link>
      ))}

      {daily.deferred > 0 && (
        <p className="text-[11px] text-slate-500">
          {daily.deferred === 1
            ? 'עוד משימה אחת מחכה — היא תיכנס כשיתפנה זמן.'
            : `עוד ${daily.deferred} משימות מחכות — הן ייכנסו כשיתפנה זמן.`}
        </p>
      )}

      {insight && (
        <p className="flex items-start gap-2 text-[11px] text-slate-600 leading-snug pt-1 border-t border-slate-900/[0.06]">
          <Lightbulb aria-hidden="true" className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span className="chat-md flex-1 min-w-0">
            <MathText inline>{insight}</MathText>
          </span>
        </p>
      )}
    </div>
  );
}
