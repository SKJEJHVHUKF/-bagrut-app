'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileSearch, Brain, Link2, Award, CheckCircle } from 'lucide-react';
import type { WorkedExam, WorkedExamPart } from '@/content/advanced-courses/types';
import { MathText } from '@/components/practice/MathText';
import { DiagramRenderer } from '@/components/practice/DiagramRenderer';
import { buttonTap } from '@/lib/animations';

/**
 * WorkedExamView — a full bagrut question decomposed "thinking aloud" (§4).
 * Every part shows: what it REALLY asks, how earlier parts feed it, which
 * pattern it is, the reasoned steps (revealed one-by-one), and what the
 * grader wants to see for full credit.
 */
export function WorkedExamView({ exam, index }: { exam: WorkedExam; index: number }) {
  return (
    <div className="bg-white/[0.03] border border-violet-500/20 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-l from-violet-600/15 to-fuchsia-600/10 border-b border-white/10 px-4 py-3 flex items-center gap-2.5">
        <FileSearch className="w-4 h-4 text-violet-200 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-[10px] font-black tracking-widest text-violet-300 uppercase">
            בגרות מפורקת {index + 1}
          </div>
          <div className="text-sm font-bold text-white">{exam.title}</div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 chat-md text-sm text-white leading-relaxed">
          <MathText>{exam.context}</MathText>
        </div>

        {exam.diagrams && exam.diagrams.length > 0 && <DiagramRenderer diagrams={exam.diagrams} />}

        <div className="space-y-2.5">
          {exam.parts.map((part) => (
            <WorkedPartCard key={part.label} part={part} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkedPartCard({ part }: { part: WorkedExamPart }) {
  const [stepsShown, setStepsShown] = useState(0);
  const total = part.steps.length;
  const allShown = stepsShown >= total;

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 space-y-3">
      {/* Label + prompt */}
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-violet-500/30">
          {part.label}
        </div>
        <div className="flex-1 chat-md text-sm sm:text-base text-white leading-relaxed pt-0.5">
          <MathText>{part.prompt}</MathText>
        </div>
      </div>

      {/* Decoding: what it really asks */}
      <div className="bg-sky-500/5 border border-sky-500/30 rounded-xl px-3 py-2.5">
        <div className="text-[10px] font-black tracking-widest text-sky-300 uppercase flex items-center gap-1.5 mb-1">
          <Brain className="w-3 h-3" />
          <span>מה הסעיף באמת שואל</span>
        </div>
        <div className="chat-md text-sm text-sky-50/95 leading-relaxed">
          <MathText>{part.whatItReallyAsks}</MathText>
        </div>
      </div>

      {/* How it builds on earlier parts */}
      {part.buildsOn && (
        <div className="flex items-start gap-2 border-r-2 border-violet-500/40 pr-3">
          <Link2 className="w-3.5 h-3.5 text-violet-300 flex-shrink-0 mt-0.5" />
          <div className="chat-md text-xs text-slate-300 leading-relaxed flex-1">
            <span className="font-bold text-violet-200">הקשר לסעיפים הקודמים: </span>
            <MathText inline>{part.buildsOn}</MathText>
          </div>
        </div>
      )}

      {/* Pattern chip */}
      {part.patternId && (
        <a
          href={`#pattern-${part.patternId}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-fuchsia-500/15 border border-fuchsia-500/40 text-fuchsia-200 px-2.5 py-1 rounded-full hover:bg-fuchsia-500/25 transition-colors"
        >
          <span>🗺️ זו התבנית — לחץ לרענון</span>
        </a>
      )}

      {/* Steps revealed one-by-one */}
      <ol className="space-y-2">
        {part.steps.slice(0, stepsShown).map((step, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex gap-2.5"
          >
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/25 border border-violet-400/40 flex items-center justify-center text-[11px] font-black text-violet-100">
              {i + 1}
            </div>
            <div className="flex-1 chat-md text-sm text-slate-100 pt-0.5">
              <MathText>{step}</MathText>
            </div>
          </motion.li>
        ))}
      </ol>

      {!allShown ? (
        <motion.button
          {...buttonTap}
          onClick={() => setStepsShown((n) => n + 1)}
          className="w-full inline-flex items-center justify-center gap-2 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/40 px-4 py-2 rounded-lg font-bold text-violet-100 text-sm transition-colors"
        >
          {stepsShown === 0 ? 'פתח את הפתרון צעד-צעד' : `הצעד הבא (${stepsShown + 1}/${total})`}
        </motion.button>
      ) : (
        <>
          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-lg px-3 py-2.5">
            <div className="text-[10px] font-black tracking-widest text-emerald-300 mb-1 uppercase flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3" />
              <span>תשובה סופית</span>
            </div>
            <div className="text-sm font-bold text-emerald-50 chat-md">
              <MathText inline>{part.finalAnswer}</MathText>
            </div>
          </div>

          {/* Grader notes — what earns full credit */}
          <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-black tracking-widest text-amber-300 uppercase flex items-center gap-1.5 mb-1">
              <Award className="w-3 h-3" />
              <span>מה הבודק מחפש</span>
            </div>
            <div className="chat-md text-sm text-amber-50/95 leading-relaxed">
              <MathText>{part.graderNotes}</MathText>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
