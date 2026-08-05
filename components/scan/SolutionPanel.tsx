'use client';

// ============================================================
// components/scan/SolutionPanel.tsx — the result screen.
// ============================================================
//
// The full worked solution, on screen the moment the scan finishes.
//
// Nothing is gated. The student photographed a question from a מתכונת they
// couldn't solve — they have already done the trying, and asking them to
// choose a "help level" before showing anything is friction dressed up as
// pedagogy. The optional extra is the tutor underneath (QuestionTutor), which
// they open only if something still doesn't land.
//
// A "רוצה לנסות לבד?" link swaps to the hint for whoever wants one. It is a
// secondary control and it hides nothing: the full solution is one press
// away, and it was the default.
//
// Every depth is already in memory when this renders — the pipeline built
// them from templates in microseconds for $0 (`lib/mathscan/explain.ts`), so
// switching is a state change, never a fetch.
//
// Rendering rules inherited from the rest of the app:
//   · every Hebrew+LaTeX string goes through `MathText` with `math-content`,
//     or an un-isolated formula inherits dir=rtl and renders REVERSED
//   · `.chat-md` sits on an inner div, never on a flex container, because
//     every `.chat-md` rule is a descendant combinator

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { domainLabel, isSafeToRenderAsMath } from '@/lib/mathscan';
import type { Explanation, ExplanationDepth, ScanResult } from '@/lib/mathscan';

const SOURCE_BADGE: Record<
  ScanResult['source'],
  { label: string; chip: string; Icon: typeof ShieldCheck }
> = {
  library: { label: 'פתרון מאומת מהמאגר · חינם', chip: 'scan-chip-success', Icon: ShieldCheck },
  cache: { label: 'נפתר כבר בעבר · חינם', chip: 'scan-chip-primary', Icon: Zap },
  'local-cas': { label: 'נפתר על המכשיר שלך · חינם', chip: 'scan-chip-success', Icon: Zap },
  ai: { label: 'נפתר עכשיו ע״י AI', chip: 'scan-chip-warn', Icon: Sparkles },
};

const DEPTH_ORDER: ExplanationDepth[] = ['hint', 'partial', 'full'];


/** Render a Hebrew+LaTeX string, degrading to plain text when the delimiters
 *  are not safe to hand to KaTeX. */
function Rich({ children }: { children: string }) {
  if (!isSafeToRenderAsMath(children)) {
    return (
      <p dir="rtl" className="whitespace-pre-wrap">
        {children}
      </p>
    );
  }
  return (
    <div className="chat-md math-content">
      <MathText>{children}</MathText>
    </div>
  );
}

export function SolutionPanel({ result }: { result: ScanResult }) {
  const available = DEPTH_ORDER.filter((depth) => result.explanations[depth]);

  /**
   * The FULL solution is the default, and it is on screen the moment the scan
   * finishes. No selector, no "how much help do you want", nothing to press.
   *
   * An earlier version gated it behind a three-way choice and showed nothing
   * until the student picked. That was a pedagogy argument — reading a
   * solution feels like learning and isn't — applied to the wrong screen. A
   * student photographs a question from a מתכונת *because they already tried
   * and failed*; making them ask for the answer again is friction, not
   * teaching. The place to make someone work is practice, not the moment
   * they're stuck at 11pm with an exam paper in front of them.
   *
   * The hint stays reachable for whoever wants to try once more first, as a
   * small secondary control that hides nothing.
   */
  const [depth, setDepth] = useState<ExplanationDepth>('full');
  const shown: ExplanationDepth = result.explanations[depth]
    ? depth
    : (available[available.length - 1] ?? 'full');
  const canHint = Boolean(result.explanations.hint) && Boolean(result.explanations.full);

  if (available.length === 0) {
    return (
      <section className="scan-card p-5 space-y-2">
        <h3 className="font-black">עוד לא פתרנו את השאלה הזאת</h3>
        <p className="text-sm scan-muted leading-relaxed">
          תקן את הטקסט למעלה אם משהו בו לא מדויק, או צלם שוב באור טוב יותר.
        </p>
      </section>
    );
  }

  const badge = SOURCE_BADGE[result.source];
  const explanation = result.explanations[shown] ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`scan-chip ${badge.chip}`}>
          <badge.Icon className="w-3.5 h-3.5" aria-hidden />
          <span>{badge.label}</span>
        </span>
        {/* Topic OR domain, never both. They name the same thing at different
            resolutions ("חשבון דיפרנציאלי" vs "חשבון דיפרנציאלי ואינטגרלי"),
            and two chips saying almost the same words read as a bug. The
            topic is the one the student can act on — it matches a lesson. */}
        {result.topic ? (
          <span className="scan-chip scan-chip-primary">{result.topic}</span>
        ) : (
          result.domain !== 'unknown' && (
            <span className="scan-chip">{domainLabel(result.domain)}</span>
          )
        )}
        <span className="scan-chip">{result.unitLevel} יח״ל</span>
      </div>

      {/* Secondary, and only when a hint actually exists. One line, clearly
          labelled, and it never hides the solution behind a decision. */}
      {canHint && (
        <div className="flex items-center gap-2 text-xs">
          {shown === 'full' ? (
            <button
              type="button"
              onClick={() => setDepth('hint')}
              className="scan-muted underline underline-offset-2 hover:opacity-80"
            >
              <Lightbulb className="w-3.5 h-3.5 inline-block ms-1" aria-hidden />
              רוצה לנסות לבד? הצג רמז בלבד
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDepth('full')}
              className="scan-btn scan-btn-primary !py-2 !px-4 !text-xs"
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden />
              <span>חזור לפתרון המלא</span>
            </button>
          )}
        </div>
      )}

      {explanation && (
        // A plain keyed motion.div with an ENTRANCE-ONLY animation — no
        // AnimatePresence, no exit.
        //
        // This is not a style preference, it is a correctness fix. Wrapped in
        // AnimatePresence, switching depth left the previous panel mounted:
        // its exit never completed, so pressing "רמז" rendered the hint
        // BELOW the full solution and the answer stayed on screen. That makes
        // the hint worthless, which is the one thing the three depths exist
        // to prevent. The repo has hit this exact stall twice before (see
        // SubTopicLadder); React remounting on a key change is enough.
        <motion.div
          key={explanation.depth}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ExplanationView explanation={explanation} />
        </motion.div>
      )}
    </div>
  );
}

function ExplanationView({ explanation }: { explanation: Explanation }) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-bold scan-muted">{explanation.headline}</p>

      <ol className="space-y-2">
        {explanation.steps.map((step, index) => (
          <li key={`${step.title}-${index}`} className="scan-card p-4 flex gap-3">
            <span
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
              style={{ background: 'var(--scan-primary-soft)', color: 'var(--scan-primary)' }}
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black mb-1.5" style={{ color: 'var(--scan-primary)' }}>
                {step.title}
              </div>
              <div className="text-sm leading-relaxed">
                <Rich>{step.content}</Rich>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {explanation.finalAnswer && (
        <section
          className="rounded-2xl p-5"
          style={{
            background: 'var(--scan-success-soft)',
            border: '1px solid var(--scan-success)',
          }}
        >
          <div
            className="text-xs font-black tracking-widest uppercase mb-2 flex items-center gap-2"
            style={{ color: 'var(--scan-success)' }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
            <span>תשובה סופית</span>
          </div>
          <div className="text-base sm:text-lg font-bold leading-relaxed">
            <Rich>{explanation.finalAnswer}</Rich>
          </div>
        </section>
      )}
    </div>
  );
}
