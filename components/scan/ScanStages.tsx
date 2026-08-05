'use client';

// ============================================================
// components/scan/ScanStages.tsx — the live pipeline trace.
// ============================================================
//
// Two jobs, and the second is the interesting one.
//
//   1. Occupy the wait. Preprocessing plus local OCR takes 1-4 seconds on a
//      phone, and a bare spinner makes that feel broken. Naming the stage
//      makes the same wait feel like work.
//   2. Make the cost architecture VISIBLE. Every stage carries a "חינם" or a
//      price. A student watching "זיהוי מקומי · חינם" → "חיפוש במאגר · חינם"
//      → "פתרון במכשיר · חינם" learns, without being told, that the app is
//      not phoning a server for every photo. When a stage IS paid, it says
//      so before it runs.
//
// The labels are the only place stage names become Hebrew. `ScanStageName`
// stays machine-readable everywhere else.

import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import type { ScanStageName, ScanTrace } from '@/lib/mathscan';

const STAGE_LABELS: Record<ScanStageName, { title: string; paid: boolean }> = {
  preprocess: { title: 'מיישרים וחותכים את התמונה', paid: false },
  'ocr-local': { title: 'קוראים את השאלה במכשיר שלך', paid: false },
  validate: { title: 'בודקים שהקריאה הגיונית', paid: false },
  'library-match': { title: 'מחפשים במאגר הפתרונות המאומתים', paid: false },
  cache: { title: 'בודקים אם השאלה נפתרה כבר', paid: false },
  'solve-local': { title: 'פותרים על המכשיר', paid: false },
  'explain-local': { title: 'מנסחים הסבר בעברית', paid: false },
  'fallback-vision': { title: 'זיהוי מתקדם בענן', paid: true },
  'fallback-solve': { title: 'פתרון מתקדם בענן', paid: true },
};

/** The order shown while running. Stages that never fire are simply never
 *  appended — we don't render a checklist of things that didn't happen. */
export type LiveStage = {
  name: ScanStageName;
  status: 'running' | 'done';
  detail?: string;
};

export function ScanStages({ stages }: { stages: LiveStage[] }) {
  if (stages.length === 0) return null;

  return (
    <ol className="space-y-1.5" aria-label="שלבי העיבוד">
      {stages.map((stage, index) => {
        const label = STAGE_LABELS[stage.name];
        if (!label) return null;
        return (
          <motion.li
            key={`${stage.name}-${index}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="flex items-center gap-3 text-sm"
          >
            <span className="w-5 h-5 flex items-center justify-center shrink-0" aria-hidden>
              {stage.status === 'done' ? (
                <Check className="w-4 h-4" style={{ color: 'var(--scan-success)' }} />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--scan-primary)' }} />
              )}
            </span>
            <span className="flex-1 min-w-0 truncate">{label.title}</span>
            <span className={`scan-chip ${label.paid ? 'scan-chip-warn' : 'scan-chip-success'}`}>
              {label.paid ? 'בתשלום' : 'חינם'}
            </span>
          </motion.li>
        );
      })}
    </ol>
  );
}

/**
 * The after-the-fact summary: what ran, how long it took, and what it cost.
 *
 * The cost figure is a SUM OVER MEASURED STAGES, not an estimate — each stage
 * recorded the usage the API actually reported. This repo has been wrong by
 * 2.5× on an estimated per-request cost before, which is why the number
 * shown here is the one that was measured.
 */
export function ScanTraceSummary({ trace }: { trace: ScanTrace }) {
  const ran = trace.stages.filter((stage) => stage.outcome !== 'skip');
  const seconds = (trace.totalDurationMs / 1000).toFixed(1);

  return (
    <details className="scan-card-flat px-4 py-3">
      <summary className="text-xs font-black cursor-pointer select-none flex items-center gap-2">
        <span>איך פתרנו את זה</span>
        <span className={`scan-chip ${trace.usedPaidPath ? 'scan-chip-warn' : 'scan-chip-success'}`}>
          {trace.usedPaidPath ? 'כלל שלב בתשלום' : 'הכול חינם'}
        </span>
        <span className="scan-faint font-bold" dir="ltr">
          {seconds}s
        </span>
      </summary>

      <ul className="mt-3 space-y-1.5">
        {ran.map((stage, index) => {
          const label = STAGE_LABELS[stage.name];
          return (
            <li key={`${stage.name}-${index}`} className="flex items-baseline gap-2 text-xs">
              <span className="flex-1 min-w-0 scan-muted truncate">
                {label?.title ?? stage.name}
                {stage.detail ? <span className="scan-faint"> · {stage.detail}</span> : null}
              </span>
              <span className="scan-faint tabular-nums shrink-0" dir="ltr">
                {stage.durationMs}ms
              </span>
              <span
                className="shrink-0 font-bold tabular-nums"
                style={{ color: stage.paid ? 'var(--scan-warn)' : 'var(--scan-success)' }}
                dir="ltr"
              >
                {stage.costUsd > 0 ? `$${stage.costUsd.toFixed(4)}` : '$0'}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px] scan-faint leading-relaxed">
        העלות מחושבת מדיווח השימוש האמיתי של כל קריאה — לא מהערכה.
      </p>
    </details>
  );
}
