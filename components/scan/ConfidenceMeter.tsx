'use client';

// ============================================================
// components/scan/ConfidenceMeter.tsx — "ביטחון זיהוי", stated honestly.
// ============================================================
//
// Two rules this component exists to enforce:
//
//   1. The number is never dressed up. If the pipeline scored 0.58 the
//      student sees 58% and the word "בינוני", not a green tick. A scanner
//      that always looks confident teaches students to trust it when it is
//      wrong, which is the failure mode that matters.
//   2. Low confidence always comes with the FIX. Every band below routes to
//      the same action — read the recognised text and correct it — because
//      that action costs nothing and resolves the doubt completely.
//
// Colour is never the only signal: each band also has its own label and its
// own icon, so it survives greyscale, colour-blindness, and a dark theme.

import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { ACCEPT_THRESHOLD, REJECT_THRESHOLD } from '@/lib/mathscan';
import type { ValidationIssue } from '@/lib/mathscan';

type Band = {
  label: string;
  chip: string;
  Icon: typeof CheckCircle2;
  hint: string;
};

function bandFor(confidence: number): Band {
  if (confidence >= ACCEPT_THRESHOLD) {
    return {
      label: 'זיהוי ברור',
      chip: 'scan-chip-success',
      Icon: CheckCircle2,
      hint: 'קראנו את השאלה במלואה. אם משהו לא מדויק — אפשר לתקן.',
    };
  }
  if (confidence >= REJECT_THRESHOLD) {
    return {
      label: 'זיהוי חלקי',
      chip: 'scan-chip-warn',
      Icon: HelpCircle,
      hint: 'חלק מהשאלה לא נקרא בוודאות. כדאי לעבור על הטקסט ולתקן לפני שממשיכים.',
    };
  }
  return {
    label: 'זיהוי חלש',
    chip: 'scan-chip-danger',
    Icon: AlertTriangle,
    hint: 'לא הצלחנו לקרוא את התמונה. תקן את הטקסט ידנית או צלם שוב באור טוב יותר.',
  };
}

export function ConfidenceMeter({
  confidence,
  issues,
  compact = false,
}: {
  confidence: number;
  issues?: ValidationIssue[];
  compact?: boolean;
}) {
  const percent = Math.round(confidence * 100);
  const band = bandFor(confidence);
  const { Icon } = band;

  // Only the issues that actually moved the number are worth a student's
  // attention; a 2% informational note is noise on a result screen.
  const meaningful = (issues ?? []).filter((issue) => issue.penalty >= 0.1).slice(0, 2);

  if (compact) {
    return (
      <span className={`scan-chip ${band.chip}`}>
        <Icon className="w-3.5 h-3.5" aria-hidden />
        <span>
          {band.label} · {percent}%
        </span>
      </span>
    );
  }

  return (
    <section className="scan-card p-4 space-y-3" aria-label="ביטחון זיהוי">
      <div className="flex items-center justify-between gap-3">
        <span className={`scan-chip ${band.chip}`}>
          <Icon className="w-3.5 h-3.5" aria-hidden />
          <span>{band.label}</span>
        </span>
        <span className="text-sm font-black tabular-nums" dir="ltr">
          {percent}%
        </span>
      </div>

      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--scan-line)' }}
        role="meter"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="ביטחון זיהוי"
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${Math.max(3, percent)}%`,
            background:
              confidence >= ACCEPT_THRESHOLD
                ? 'var(--scan-success)'
                : confidence >= REJECT_THRESHOLD
                  ? 'var(--scan-warn)'
                  : 'var(--scan-danger)',
          }}
        />
      </div>

      <p className="text-xs leading-relaxed scan-muted">{band.hint}</p>

      {meaningful.length > 0 && (
        <ul className="space-y-1">
          {meaningful.map((issue) => (
            <li key={issue.code} className="text-xs scan-faint flex gap-2">
              <span aria-hidden>•</span>
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
