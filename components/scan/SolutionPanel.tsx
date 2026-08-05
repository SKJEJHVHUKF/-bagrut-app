'use client';

// ============================================================
// components/scan/SolutionPanel.tsx — the result screen.
// ============================================================
//
// Three depths behind three buttons — רמז → פתרון חלקי → פתרון מלא — and the
// order is the product, not decoration. A student who can be unstuck by one
// sentence should not be handed the answer, because reading a full solution
// feels exactly like learning and isn't. So the answer is never on screen
// until it is explicitly asked for, and the cheapest help is the default.
//
// All three depths are already in memory when this renders: the pipeline
// generated them from templates in microseconds for $0 (see
// `lib/mathscan/explain.ts`). Pressing "רמז" is a state change, not a fetch.
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
  ListOrdered,
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

const DEPTH_BUTTONS: Record<
  ExplanationDepth,
  { label: string; Icon: typeof Lightbulb; note: string }
> = {
  hint: { label: 'רמז', Icon: Lightbulb, note: 'כיוון בלבד — בלי התשובה' },
  partial: { label: 'פתרון חלקי', Icon: ListOrdered, note: 'כל השלבים חוץ מהאחרון' },
  full: { label: 'פתרון מלא', Icon: BookOpen, note: 'כולל התשובה הסופית' },
};

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
  // A library or AI solution arrives as one finished piece — there is no
  // structured hint to derive from someone else's prose, so the panel shows
  // what exists rather than inventing intermediate depths.
  const [depth, setDepth] = useState<ExplanationDepth | null>(
    available.length === 1 ? available[0] : null
  );

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
  const explanation = depth ? result.explanations[depth] : null;

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

      {available.length > 1 && (
        <section className="scan-card p-4 space-y-3">
          <div>
            <h3 className="text-sm font-black">כמה עזרה אתה רוצה?</h3>
            <p className="text-xs scan-muted mt-0.5">
              התחל מהרמז. אם עדיין לא הסתדר — תמיד אפשר לפתוח את הפתרון המלא.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DEPTH_ORDER.map((option) => {
              if (!result.explanations[option]) return null;
              const config = DEPTH_BUTTONS[option];
              const active = depth === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDepth(active ? null : option)}
                  aria-pressed={active}
                  className={`scan-btn flex-col !items-start gap-0.5 !py-3 text-right ${
                    active ? 'scan-btn-primary' : ''
                  }`}
                >
                  <span className="flex items-center gap-2 font-black">
                    <config.Icon className="w-4 h-4" aria-hidden />
                    {config.label}
                  </span>
                  <span
                    className="text-[11px] font-medium"
                    style={{ opacity: active ? 0.85 : 0.7 }}
                  >
                    {config.note}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
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
