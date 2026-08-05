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

/**
 * "פתרון מאומת" is reserved.
 *
 * It belongs to the hand-authored corpus and to answers the local CAS proved
 * by substitution — nothing else. A solution the AI wrote and nobody checked
 * gets its own, plainly weaker wording, and no green: green means verified in
 * this app, and a badge that overstates confidence is how a wrong answer
 * becomes a wrong answer the student trusts. That has already happened twice
 * here (`x²` read as `x°`; `sin(x)=0.5` matched to a complex-numbers answer).
 */
const SOURCE_BADGE: Record<
  ScanResult['source'],
  { label: string; chip: string; Icon: typeof ShieldCheck }
> = {
  library: { label: 'פתרון מאומת מהמאגר · חינם', chip: 'scan-chip-success', Icon: ShieldCheck },
  bank: { label: 'פתרון מהמאגר · חינם', chip: 'scan-chip-primary', Icon: Zap },
  cache: { label: 'נפתר כבר בעבר · חינם', chip: 'scan-chip-primary', Icon: Zap },
  'local-cas': { label: 'נפתר על המכשיר שלך · חינם', chip: 'scan-chip-success', Icon: Zap },
  ai: { label: 'נפתר עכשיו ע״י AI', chip: 'scan-chip-warn', Icon: Sparkles },
};

/** A bank hit's badge is decided by how checked it is, not by where it came
 *  from — the tier is the honest signal and it overrides the source label. */
const TIER_BADGE: Record<
  NonNullable<ScanResult['qualityTier']>,
  { label: string; chip: string; Icon: typeof ShieldCheck; caveat?: string }
> = {
  verified: {
    label: 'פתרון שנבדק אוטומטית · חינם',
    chip: 'scan-chip-success',
    Icon: CheckCircle2,
  },
  corroborated: {
    label: 'נפתר, ואומת מול סריקה נוספת · חינם',
    chip: 'scan-chip-primary',
    Icon: Zap,
  },
  new: {
    label: 'פתרון מהמאגר · חינם',
    chip: 'scan-chip',
    Icon: Sparkles,
    caveat: 'נפתר בעבר ע״י AI ועדיין לא אומת מול מקור נוסף.',
  },
};

const DEPTH_ORDER: ExplanationDepth[] = ['hint', 'partial', 'full'];


/**
 * The only ground-truth signal that reaches the bank without a reviewer.
 *
 * Two reports demote the row's quality claim, three retire it from search —
 * enforced in the SQL function, so a retired row cannot be served even by a
 * stale client. Deliberately understated: it is a correction, not a rating,
 * and a prominent control invites idle clicking.
 */
function ReportWrong({ bankId }: { bankId?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'authRequired' | 'failed'>('idle');
  if (!bankId) return null;
  if (state === 'done') return <span className="font-bold">תודה — נבדוק את זה.</span>;
  // Reporting requires an account (an anonymous report is unattributable and
  // would make the only human signal here trivially spammable), so anonymous
  // students hit a 401. Saying "תודה" to a report that was rejected is worse
  // than saying nothing: the student believes it was recorded and does not
  // report it again from an account, so the signal is lost twice.
  if (state === 'authRequired') {
    return (
      <a href="/login" className="underline underline-offset-2 font-bold">
        כדי לדווח צריך להתחבר
      </a>
    );
  }
  if (state === 'failed') return <span className="font-bold">הדיווח לא נשלח. נסה שוב.</span>;
  return (
    <button
      type="button"
      disabled={state === 'sending'}
      onClick={async () => {
        setState('sending');
        try {
          const res = await fetch('/api/scan-solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'report', bankId }),
          });
          if (res.status === 401) setState('authRequired');
          else if (!res.ok) setState('failed');
          else setState('done');
        } catch {
          // A failed report must not become an error the student has to
          // handle — the solution is still on screen and still readable.
          setState('failed');
        }
      }}
      className="underline underline-offset-2 hover:opacity-80 font-bold"
    >
      דווח שהפתרון שגוי
    </button>
  );
}

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

export function SolutionPanel({
  result,
  blocked,
}: {
  result: ScanResult;
  /** Why there is no solution, when there is none. See the empty state. */
  blocked?: { message: string; status: number } | null;
}) {
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
    /**
     * The empty state must say WHY, and it must offer the actual next step.
     *
     * It used to say one thing always: "תקן את הטקסט למעלה אם משהו בו לא
     * מדויק, או צלם שוב". For a signed-out student that advice is simply
     * false — the solve path is closed regardless of how clean the text is,
     * so they edit, retry, fail, and conclude the app is broken. That is the
     * failure that was reported, reproduced on a real photograph.
     */
    if (blocked?.status === 401) {
      return (
        <section
          className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--scan-primary-soft)', border: '1px solid var(--scan-primary)' }}
        >
          <h3 className="font-black flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--scan-primary)' }} aria-hidden />
            השאלה הזאת עוד לא במאגר — נפתור אותה עכשיו
          </h3>
          <p className="text-sm scan-muted leading-relaxed">{blocked.message}</p>
          <a href="/login" className="scan-btn scan-btn-primary inline-flex !py-2.5 !px-5 !text-sm">
            התחבר וקבל את הפתרון
          </a>
        </section>
      );
    }

    return (
      <section className="scan-card p-5 space-y-2">
        <h3 className="font-black">עוד לא פתרנו את השאלה הזאת</h3>
        <p className="text-sm scan-muted leading-relaxed">
          {blocked?.message ??
            'תקן את הטקסט למעלה אם משהו בו לא מדויק, או צלם שוב באור טוב יותר.'}
        </p>
      </section>
    );
  }

  // The tier wins when there is one: it says how CHECKED the solution is,
  // which is what the student needs, where the source only says where it was
  // stored.
  const badge = result.qualityTier ? TIER_BADGE[result.qualityTier] : SOURCE_BADGE[result.source];
  const caveat = result.qualityTier ? TIER_BADGE[result.qualityTier].caveat : undefined;
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

      {caveat && (
        <p className="text-[11px] scan-faint leading-relaxed">
          {caveat} משהו נראה לך שגוי?{' '}
          <ReportWrong bankId={result.bankId} />
        </p>
      )}

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
  // A whole-document solution renders as ONE flowing card.
  //
  // The numbered-card layout is right for a short exact solve (5 steps, each
  // a single move). Past that it becomes visual noise: a three-section bagrut
  // question turned into forty bordered boxes with no sense of where one
  // section ended and the next began, which is what the owner saw and called
  // מסורבל. Prose with `## סעיף א` headings carries that structure natively.
  if (explanation.markdown) {
    return (
      <section className="scan-card p-5">
        <div className="chat-md math-content scan-solution text-sm sm:text-base leading-relaxed">
          <MathText>{explanation.markdown}</MathText>
        </div>
      </section>
    );
  }

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
