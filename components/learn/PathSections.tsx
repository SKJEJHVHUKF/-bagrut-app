'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  ArrowLeft,
  Lightbulb,
  AlertTriangle,
  BookMarked,
} from 'lucide-react';
import Link from 'next/link';
import type {
  Prerequisite,
  IntuitionSection as IntuitionData,
  ConceptAtom,
  Pitfall,
  FormulaSheet,
} from '@/content/learning-paths/types';
import { MathText } from '@/components/practice/MathText';
import { FormulaCard } from '@/components/practice/FormulaCard';
import { DiagramRenderer } from '@/components/practice/DiagramRenderer';
import { fadeUp, staggerContainer, inViewProps } from '@/lib/animations';

// ============================================================
// SectionShell — the consistent frame around every pedagogical section:
// a numbered header (emoji + title), an anchor for deep-links, and a
// "mark complete" toggle wired to the progress tracker.
// ============================================================

export function SectionShell({
  index,
  sectionId,
  title,
  emoji,
  subtitle,
  done,
  onToggle,
  children,
}: {
  index: number;
  sectionId: string;
  title: string;
  emoji: string;
  subtitle?: string;
  done: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <motion.section
      {...inViewProps}
      variants={staggerContainer}
      id={`section-${sectionId}`}
      className="scroll-mt-24"
    >
      <motion.div variants={fadeUp} className="flex items-center gap-3 mb-3">
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border transition-colors ${
            done
              ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-100'
              : 'bg-white/5 border-white/15 text-slate-200'
          }`}
        >
          {done ? <CheckCircle2 className="w-5 h-5" /> : index}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>{emoji}</span>
            <span>{title}</span>
          </div>
          {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
        </div>
        <button
          onClick={onToggle}
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
            done
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/25'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
          aria-pressed={done}
        >
          {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
          <span>{done ? 'הושלם' : 'סמן כהושלם'}</span>
        </button>
      </motion.div>
      <motion.div variants={fadeUp}>{children}</motion.div>
    </motion.section>
  );
}

// ============================================================
// §1 — Prerequisites
// ============================================================

export function PrerequisitesView({ items }: { items: Prerequisite[] }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs text-slate-400 leading-relaxed mb-1">
        לפני שמתחילים — ודא שאתה שולט בדברים הבאים. לכל אחד יש רענון קצר; אם זה עדיין לא ברור, יש קישור
        לנושא המלא.
      </p>
      {items.map((p, i) => (
        <div
          key={i}
          className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <BookMarked className="w-4 h-4 text-sky-300 flex-shrink-0" />
            <div className="font-bold text-sm text-sky-100 chat-md">
              <MathText inline>{p.title}</MathText>
            </div>
          </div>
          <div className="chat-md text-sm text-slate-200 leading-relaxed">
            <MathText>{p.refresher}</MathText>
          </div>
          {p.selfCheck && (
            <div className="mt-2 text-xs text-amber-200/90 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 chat-md">
              <span className="font-bold">בדיקה עצמית: </span>
              <MathText inline>{p.selfCheck}</MathText>
            </div>
          )}
          {p.link && (
            <Link
              href={`/practice/${p.link.subject}/${encodeURIComponent(p.link.topic)}`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-sky-200 transition-colors"
            >
              <span>{p.link.label}</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// §2 — Intuition
// ============================================================

export function IntuitionView({ data }: { data: IntuitionData }) {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 rounded-2xl px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <Lightbulb className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
          <div className="chat-md text-sm sm:text-base text-amber-50 leading-relaxed font-medium">
            <MathText>{data.hook}</MathText>
          </div>
        </div>
      </div>

      <div className="chat-md text-sm text-slate-200 leading-relaxed">
        <MathText>{data.body}</MathText>
      </div>

      {data.diagrams && data.diagrams.length > 0 && <DiagramRenderer diagrams={data.diagrams} />}

      <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-start gap-2.5">
        <span className="text-emerald-300 mt-0.5">🎯</span>
        <div className="text-sm text-emerald-50/95 leading-relaxed chat-md">
          <span className="font-bold text-emerald-200">בסוף המסלול תדע: </span>
          <MathText inline>{data.payoff}</MathText>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// §3 — Concept atoms
// ============================================================

export function ConceptsView({ atoms }: { atoms: ConceptAtom[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 leading-relaxed mb-1">
        כל מושג נבנה בארבעה צעדים: הסבר בשפה פשוטה ← הגדרה פורמלית ← הדוגמה הכי פשוטה ← למה זה עובד.
      </p>
      {atoms.map((atom, i) => (
        <div
          key={atom.id}
          id={`concept-${atom.id}`}
          className="scroll-mt-24 bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="bg-white/[0.03] border-b border-white/10 px-4 py-2.5 flex items-center gap-2.5">
            <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-purple-500/25 border border-purple-400/40 flex items-center justify-center text-[11px] font-black text-purple-100">
              {i + 1}
            </span>
            <div className="font-black text-sm text-purple-100 chat-md">
              <MathText inline>{atom.title}</MathText>
            </div>
          </div>

          <div className="px-4 py-3 space-y-3">
            {/* Plain language */}
            <div>
              <StepTag color="sky">בשפה פשוטה</StepTag>
              <div className="chat-md text-sm text-slate-100 leading-relaxed mt-1">
                <MathText>{atom.plain}</MathText>
              </div>
            </div>

            {/* Formal */}
            <div>
              <StepTag color="purple">הגדרה פורמלית</StepTag>
              <div className="chat-md text-sm text-slate-100 leading-relaxed mt-1">
                <MathText>{atom.formal}</MathText>
              </div>
            </div>

            {/* Simplest example */}
            <div className="bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2.5">
              <StepTag color="emerald">הדוגמה הכי פשוטה</StepTag>
              <div className="chat-md text-sm text-white leading-relaxed mt-1">
                <MathText>{atom.simplestExample.problem}</MathText>
              </div>
              <div className="chat-md text-sm text-emerald-50/90 leading-relaxed mt-1.5 border-t border-white/5 pt-1.5">
                <MathText>{atom.simplestExample.solution}</MathText>
              </div>
            </div>

            {/* Why it works */}
            {atom.whyItWorks && (
              <div className="text-xs text-slate-400 chat-md leading-relaxed border-r-2 border-purple-500/40 pr-3">
                <span className="font-bold text-purple-200">למה זה עובד: </span>
                <MathText inline>{atom.whyItWorks}</MathText>
              </div>
            )}

            {atom.diagrams && atom.diagrams.length > 0 && <DiagramRenderer diagrams={atom.diagrams} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function StepTag({ children, color }: { children: ReactNode; color: 'sky' | 'purple' | 'emerald' }) {
  const map = {
    sky: 'text-sky-300',
    purple: 'text-purple-300',
    emerald: 'text-emerald-300',
  };
  return (
    <span className={`text-[10px] font-black tracking-widest uppercase ${map[color]}`}>{children}</span>
  );
}

// ============================================================
// §5 — Pitfalls
// ============================================================

export function PitfallsView({ items }: { items: Pitfall[] }) {
  return (
    <div className="space-y-2">
      {items.map((p, i) => (
        <div
          key={i}
          className="bg-amber-500/5 border border-amber-500/30 rounded-2xl px-4 py-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="chat-md text-sm text-amber-50 leading-relaxed">
                <span className="font-bold text-rose-300">✗ </span>
                <MathText inline>{p.mistake}</MathText>
              </div>
              <div className="chat-md text-sm text-emerald-50/90 leading-relaxed">
                <span className="font-bold text-emerald-300">✓ </span>
                <MathText inline>{p.correction}</MathText>
              </div>
              {p.relatedConceptId && (
                <a
                  href={`#concept-${p.relatedConceptId}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300/80 hover:text-purple-200 transition-colors"
                >
                  <span>חזור למושג הרלוונטי</span>
                  <ArrowLeft className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// §7 — Formula sheet
// ============================================================

export function FormulaSheetView({ data }: { data: FormulaSheet }) {
  return (
    <div className="space-y-3">
      <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl px-4 py-3">
        <div className="text-[10px] font-black tracking-widest text-emerald-300 mb-2 uppercase">
          סקירה מהירה
        </div>
        <ul className="space-y-2">
          {data.quickReview.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-emerald-50/95 leading-relaxed">
              <span className="text-emerald-300 flex-shrink-0 mt-0.5">✓</span>
              <div className="chat-md flex-1">
                <MathText>{s}</MathText>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {data.formulas.map((f, i) => (
          <FormulaCard key={i} formula={f} />
        ))}
      </div>
    </div>
  );
}
