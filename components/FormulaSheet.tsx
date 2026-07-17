'use client';

// FormulaSheet — a global, context-aware formula drawer. A floating button
// on study pages opens a side drawer that aggregates every topic's formulas
// (lesson-level + sub-topic-level, de-duped). The topic the student is
// currently practicing is auto-expanded, highlighted, and scrolled to;
// other topics sit collapsed below for quick reference. Each formula has a
// click-to-reveal "איך משתמשים?" with its variables + usage note.
//
// Mirrors the AppChrome drawer pattern (framer-motion slide-in + backdrop +
// ESC + a global 'open-formula-sheet' event) so behaviour is consistent.

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sigma, X, ChevronDown, ExternalLink } from 'lucide-react';
import { MathText } from './practice/MathText';
import type { Formula } from '@/content/lessons/types';
import { getLesson, allLessonKeys } from '@/content/lessons';
import {
  curriculumIndex,
  isTopicInActivePaper,
  getTopicMapping,
  type BagrutPaper,
} from '@/content/bagrut-curriculum';
import { getPaper } from '@/lib/study-plan';

// Study surfaces where the formula sheet is useful. Hidden everywhere else
// (marketing, auth, chat — the chat has its own tutor).
const SHOW_PREFIXES = ['/practice', '/learn', '/quiz', '/bagruyot'];
function shouldShow(path: string): boolean {
  return SHOW_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

/** Parse `/practice/<subject>/<topic>/…` or `/learn/…` → the active topic. */
function currentTopicFromPath(path: string): { subject: string; topic: string } | null {
  const segs = path.split('/').filter(Boolean);
  if ((segs[0] === 'practice' || segs[0] === 'learn') && segs[1] && segs[2]) {
    try {
      return { subject: segs[1], topic: decodeURIComponent(segs[2]) };
    } catch {
      return { subject: segs[1], topic: segs[2] };
    }
  }
  return null;
}

/** Lesson-level + sub-topic-level formulas for a topic, de-duped by latex. */
function formulasForTopic(subject: string, topic: string): Formula[] {
  const lesson = getLesson(subject, topic);
  if (!lesson) return [];
  const seen = new Set<string>();
  const out: Formula[] = [];
  const push = (f: Formula) => {
    const key = f.latex.trim();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(f);
  };
  lesson.formulas?.forEach(push);
  lesson.subTopics?.forEach((st) => st.formulas?.forEach(push));
  return out;
}

type TopicFormulas = { topic: string; emoji: string; formulas: Formula[] };

export default function FormulaSheet() {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const [paper, setPaperState] = useState<BagrutPaper | null>(null);

  const current = currentTopicFromPath(pathname);
  const show = shouldShow(pathname);

  // Read the active paper when opening (localStorage — client only).
  useEffect(() => {
    if (open) setPaperState(getPaper());
  }, [open]);

  // Open via a global event too (so any button can trigger it).
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('open-formula-sheet', onOpen);
    return () => window.removeEventListener('open-formula-sheet', onOpen);
  }, []);

  // ESC to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Build the topic → formulas list. Filter to the active paper, but always
  // keep the topic the student is currently on even if it's the other paper.
  const topics = useMemo<TopicFormulas[]>(() => {
    if (!open) return [];
    return allLessonKeys()
      .filter((k) => k.subject === 'math5')
      .filter(
        (k) =>
          !paper ||
          isTopicInActivePaper(k.topic, paper) ||
          (current != null && k.topic === current.topic)
      )
      .sort((a, b) => curriculumIndex(a.topic) - curriculumIndex(b.topic))
      .map((k) => ({
        topic: k.topic,
        emoji: getTopicMapping(k.topic)?.emoji ?? '📐',
        formulas: formulasForTopic(k.subject, k.topic),
      }))
      .filter((t) => t.formulas.length > 0);
  }, [open, paper, current]);

  if (!show) return null;

  return (
    <>
      {/* Floating trigger — bottom-left, opposite the top-left profile avatar. */}
      <button
        onClick={() => setOpen(true)}
        aria-label="דף הנוסחאות"
        className="fixed bottom-4 left-4 z-[55] inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur border border-indigo-500/25 shadow-lg shadow-indigo-500/15 px-3.5 py-2.5 text-indigo-800 font-bold text-sm hover:bg-indigo-500/5 hover:scale-[1.03] transition-all"
      >
        <Sigma className="w-4 h-4" />
        <span className="hidden sm:inline">נוסחאות</span>
      </button>

      <AnimatePresence>
        {open && (
          <FormulaDrawer
            topics={topics}
            currentTopic={current?.topic ?? null}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function FormulaDrawer({
  topics,
  currentTopic,
  onClose,
}: {
  topics: TopicFormulas[];
  currentTopic: string | null;
  onClose: () => void;
}) {
  // Which topic sections are expanded. The current topic starts open; if
  // there's no current topic, open the first one so the drawer isn't blank.
  const [openTopics, setOpenTopics] = useState<Set<string>>(() => {
    if (currentTopic && topics.some((t) => t.topic === currentTopic)) {
      return new Set([currentTopic]);
    }
    return new Set(topics.length ? [topics[0].topic] : []);
  });
  const currentRef = useRef<HTMLDivElement | null>(null);

  // Scroll the current topic into view once the drawer has animated in.
  useEffect(() => {
    if (!currentTopic) return;
    const t = setTimeout(() => {
      currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 320);
    return () => clearTimeout(t);
  }, [currentTopic]);

  const toggle = (topic: string) =>
    setOpenTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-slate-900/30 backdrop-blur-[2px]"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        dir="rtl"
        className="fixed top-0 bottom-0 right-0 z-[71] w-[380px] max-w-[92vw] bg-[#FDFDFB] border-r border-slate-900/10 shadow-2xl shadow-slate-900/20 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-900/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sigma className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="font-black text-slate-900">דף הנוסחאות</div>
              <div className="text-[11px] text-slate-500">
                {currentTopic ? `מודגש: ${currentTopic}` : 'כל הנוסחאות לפי נושא'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="סגור"
            className="w-8 h-8 rounded-lg hover:bg-slate-900/5 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Topic accordions */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {topics.length === 0 && (
            <div className="text-center text-sm text-slate-500 py-8">
              אין נוסחאות להצגה כאן.
            </div>
          )}
          {topics.map((t) => {
            const isCurrent = t.topic === currentTopic;
            const isOpen = openTopics.has(t.topic);
            return (
              <div
                key={t.topic}
                ref={isCurrent ? currentRef : undefined}
                className={
                  isCurrent
                    ? 'rounded-2xl border border-indigo-500/40 bg-indigo-500/[0.05] overflow-hidden'
                    : 'rounded-2xl border border-slate-900/10 bg-white overflow-hidden'
                }
              >
                <button
                  onClick={() => toggle(t.topic)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-3 text-right hover:bg-slate-900/[0.02] transition-colors"
                >
                  <span className="text-lg flex-shrink-0">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900">{t.topic}</div>
                    {isCurrent && (
                      <div className="text-[10px] font-black text-indigo-700">הנושא הנוכחי שלך</div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 flex-shrink-0">
                    {t.formulas.length} נוסחאות
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="px-3 pb-3 space-y-2">
                        {t.formulas.map((f, i) => (
                          <DrawerFormula key={i} formula={f} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Footer — link to the full printable sheet */}
        <div className="p-3 border-t border-slate-900/[0.08]">
          <Link
            href="/formulas"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 text-slate-700 text-sm font-bold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>לכל הנוסחאות והדפסה</span>
          </Link>
        </div>
      </motion.aside>
    </>
  );
}

/** A single formula: name + latex always visible, variables + usage note
 *  behind a click-to-reveal "איך משתמשים?" toggle. */
function DrawerFormula({ formula }: { formula: Formula }) {
  const [showHow, setShowHow] = useState(false);
  const hasHow = formula.variables.length > 0 || !!formula.note;

  return (
    <div className="formula-surface rounded-xl p-3">
      <div className="text-xs font-bold text-indigo-800 chat-md mb-2">
        <MathText inline>{formula.name}</MathText>
      </div>
      <div className="bg-slate-900/[0.04] border border-slate-900/10 rounded-lg px-3 py-2.5 chat-md text-center">
        <MathText>{`$$${formula.latex}$$`}</MathText>
      </div>

      {hasHow && (
        <>
          <button
            onClick={() => setShowHow((v) => !v)}
            className="mt-2 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
          >
            {showHow ? 'הסתר ▲' : 'איך משתמשים? ▼'}
          </button>
          <AnimatePresence initial={false}>
            {showHow && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="mt-2 space-y-1.5">
                  {formula.variables.map((v, i) => (
                    <div key={i} className="flex gap-2 items-start text-xs">
                      <div className="flex-shrink-0 chat-md text-amber-800 font-bold min-w-[2rem]">
                        <MathText inline>{`$${v.sym}$`}</MathText>
                      </div>
                      <div className="text-slate-400">—</div>
                      <div className="text-slate-700 chat-md flex-1">
                        <MathText inline>{v.meaning}</MathText>
                      </div>
                    </div>
                  ))}
                  {formula.note && (
                    <div className="text-xs text-slate-600 chat-md border-t border-slate-900/[0.06] pt-2 mt-1">
                      <MathText>{formula.note}</MathText>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
