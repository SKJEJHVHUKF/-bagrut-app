'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Route, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import type { QuestionPattern } from '@/content/advanced-courses/types';
import { MathText } from '@/components/practice/MathText';

/**
 * PatternMapView — the bagrut question-pattern map (§2). Each pattern:
 * how to RECOGNIZE it from the wording, the general strategy, where it
 * appears in the exams, and an optional collapsed mini-example.
 * Cards carry #pattern-<id> anchors for "go back to pattern X" links.
 */
export function PatternMapView({ patterns }: { patterns: QuestionPattern[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 leading-relaxed">
        אלה התבניות שחוזרות בבגרויות בנושא הזה. המיומנות: לזהות מתוך הנוסח איזו תבנית מולך — עוד
        לפני שמתחילים לחשב.
      </p>
      {patterns.map((p, i) => (
        <PatternCard key={p.id} pattern={p} index={i} />
      ))}
    </div>
  );
}

function PatternCard({ pattern, index }: { pattern: QuestionPattern; index: number }) {
  const [exampleOpen, setExampleOpen] = useState(false);

  return (
    <div
      id={`pattern-${pattern.id}`}
      className="scroll-mt-24 bg-white/[0.03] border border-indigo-500/20 rounded-2xl overflow-hidden"
    >
      <div className="bg-gradient-to-l from-indigo-600/15 to-indigo-600/10 border-b border-white/10 px-4 py-2.5 flex items-center gap-2.5">
        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-[11px] font-black text-indigo-100">
          {index + 1}
        </span>
        <div className="font-black text-sm text-indigo-100 chat-md flex-1">
          <MathText inline>{pattern.name}</MathText>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Recognition */}
        <div>
          <div className="text-[10px] font-black tracking-widest text-sky-300 uppercase flex items-center gap-1.5 mb-1.5">
            <Search className="w-3 h-3" />
            <span>איך מזהים מהנוסח</span>
          </div>
          <ul className="space-y-1.5">
            {pattern.recognition.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-200 leading-relaxed">
                <span className="text-sky-300 flex-shrink-0 mt-0.5">◂</span>
                <div className="chat-md flex-1">
                  <MathText>{r}</MathText>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Strategy */}
        <div>
          <div className="text-[10px] font-black tracking-widest text-emerald-300 uppercase flex items-center gap-1.5 mb-1.5">
            <Route className="w-3 h-3" />
            <span>אסטרטגיית הפתרון</span>
          </div>
          <ol className="space-y-1.5">
            {pattern.strategy.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-200 leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-[10px] font-black text-emerald-100 mt-0.5">
                  {i + 1}
                </span>
                <div className="chat-md flex-1">
                  <MathText>{s}</MathText>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Where it appears */}
        <div className="flex items-start gap-2 surface-premium rounded-xl px-3 py-2">
          <MapPin className="w-3.5 h-3.5 text-amber-300 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-50/90 chat-md leading-relaxed flex-1">
            <MathText inline>{pattern.whereItAppears}</MathText>
          </div>
        </div>

        {/* Mini example (collapsed) */}
        {pattern.example && (
          <div className="bg-slate-950/40 border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setExampleOpen((o) => !o)}
              className="w-full px-3 py-2 flex items-center gap-2 text-right hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-[10px] font-black tracking-widest text-indigo-300 uppercase flex-1">
                דוגמה מהירה
              </span>
              {exampleOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {exampleOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="px-3 pb-3 space-y-2">
                    <div className="chat-md text-sm text-white leading-relaxed">
                      <MathText>{pattern.example.problem}</MathText>
                    </div>
                    <div className="chat-md text-sm text-emerald-50/90 leading-relaxed border-t border-white/5 pt-2">
                      <MathText>{pattern.example.solution}</MathText>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
