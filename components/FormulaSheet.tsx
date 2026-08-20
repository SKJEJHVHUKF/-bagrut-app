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

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sigma, X, ChevronDown, ExternalLink } from 'lucide-react';
import { MathText } from './practice/MathText';
import type { Formula } from '@/content/lessons/types';
// NO static import of @/content/lessons. This drawer is mounted by the root
// layout on every page, and a static ESM import is resolved at build time — so
// the whole lesson corpus shipped in the first-load JS of every route,
// including /login, for a drawer most sessions never open. It is fetched when
// the drawer opens instead.
import type { getLesson as GetLesson, allLessonKeys as AllLessonKeys } from '@/content/lessons';
import type { sheetFormulas as SheetFormulas } from '@/content/formula-sheet';
import type { TrackTile } from '@/content/tracks';
import { getPaper } from '@/lib/study-plan';

// Study surfaces where the formula sheet is useful. Hidden everywhere else
// (marketing, auth, chat — the chat has its own tutor).
const SHOW_PREFIXES = ['/practice', '/learn', '/quiz', '/bagruyot', '/roadmap'];
function shouldShow(path: string): boolean {
  return SHOW_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

const isLadder = (t: TrackTile): t is Extract<TrackTile, { kind: 'ladder' }> =>
  t.kind === 'ladder';

/** Resolve the topic the student is currently on from the URL.
 *  /practice and /learn carry the (Hebrew) topic in the path. /roadmap pages
 *  carry only a sub-topic id (`/roadmap/ar-general-term`) or a track topic id
 *  (`/roadmap/track/571/sequences`), so those resolve through the roadmap
 *  content — dynamically imported, since this runs only when the drawer opens. */
async function resolveCurrentTopic(path: string): Promise<string | null> {
  const segs = path.split('/').filter(Boolean);
  const dec = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  if ((segs[0] === 'practice' || segs[0] === 'learn') && segs[1] && segs[2]) {
    return dec(segs[2]);
  }
  if (segs[0] !== 'roadmap' || !segs[1]) return null;
  // Failing to resolve just loses the highlight — the drawer still opens
  // with every topic, so this never takes the whole sheet down with it.
  try {
    const { resolveRoadmapNode } = await import('@/constants/roadmapData');
    if (segs[1] === 'track') {
      // /roadmap/track/<paper>/<topicId> — highlight the lesson topic of the
      // first ladder tile (a track topic can chain sub-topics from several
      // lessons; the first one is the topic the page opens on).
      const paper = segs[2];
      const topicId = segs[3] ? dec(segs[3]) : null;
      if (!topicId || (paper !== '571' && paper !== '572')) return null;
      const { getTrack } = await import('@/content/tracks');
      const tile = getTrack(paper)
        .topics.find((t) => t.id === topicId)
        ?.tiles.find(isLadder);
      return tile ? (resolveRoadmapNode(tile.subId)?.topic ?? null) : null;
    }
    if (segs[1] === 'review') return null;
    // /roadmap/<subTopicId> — the level ladder where practice actually happens.
    return resolveRoadmapNode(dec(segs[1]))?.topic ?? null;
  } catch {
    return null;
  }
}

/** The sheet's formulas for a topic — curated + ordered by content/formula-sheet. */
function formulasForTopic(
  getLesson: typeof GetLesson,
  sheetFormulas: typeof SheetFormulas,
  subject: string,
  topic: string,
): Formula[] {
  return sheetFormulas(getLesson(subject, topic), topic);
}

type TopicFormulas = { topic: string; emoji: string; formulas: Formula[] };

export default function FormulaSheet() {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);

  const show = shouldShow(pathname);

  // Open via a global event too (so any button can trigger it).
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('open-formula-sheet', onOpen);
    return () => window.removeEventListener('open-formula-sheet', onOpen);
  }, []);

  // Everything the drawer shows loads when it opens: the active paper
  // (localStorage), the resolved current topic (may need roadmap content),
  // and the topic → formulas list. Filter to the active paper, but always
  // keep the topic the student is currently on even if it's the other paper.
  // `topics === null` means "not loaded yet" — the drawer mounts only once
  // loading finishes, so its expand-the-current-topic initializer never sees
  // half-loaded data. Closing resets to null so a later open on another page
  // can't flash the previous page's list.
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicFormulas[] | null>(null);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const paper = getPaper();
    void Promise.all([
      import('@/content/lessons'),
      import('@/content/bagrut-curriculum'),
      resolveCurrentTopic(pathname),
      import('@/content/formula-sheet'),
    ]).then(([lessons, curriculum, topicName, sheet]) => {
      if (cancelled) return;
      const { allLessonKeys, getLesson } = lessons;
      const { curriculumIndex, isTopicInActivePaper, getTopicMapping } = curriculum;
      const { sheetFormulas } = sheet;
      const built = (allLessonKeys as typeof AllLessonKeys)()
        .filter((k) => k.subject === 'math5')
        .filter(
          (k) =>
            !paper ||
            isTopicInActivePaper(k.topic, paper) ||
            (topicName != null && k.topic === topicName)
        )
        .sort((a, b) => curriculumIndex(a.topic) - curriculumIndex(b.topic))
        .map((k) => ({
          topic: k.topic,
          emoji: getTopicMapping(k.topic)?.emoji ?? '📐',
          formulas: formulasForTopic(getLesson, sheetFormulas, k.subject, k.topic),
        }))
        .filter((t) => t.formulas.length > 0);
      setCurrentTopic(topicName);
      setTopics(built);
    }).catch(() => {
      // Chunk load failed (offline / deploy in progress). Open the drawer
      // with its empty state rather than leaving the button silently dead.
      if (!cancelled) setTopics([]);
    });
    return () => {
      cancelled = true;
    };
  }, [open, pathname]);

  // Every close path funnels here — the loaded list is dropped so the next
  // open (possibly on another page) re-resolves instead of flashing stale data.
  const closeDrawer = () => {
    setOpen(false);
    setTopics(null);
  };

  // ESC to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setTopics(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!show) return null;

  return (
    <>
      {/* Floating trigger — bottom-right, same side the drawer slides in from
          (in RTL the scrollbar sits on the left, so the right edge is clear). */}
      <button
        onClick={() => setOpen(true)}
        aria-label="דף הנוסחאות"
        className="formula-fab fixed bottom-4 right-4 z-[55] inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur border border-violet-500/25 shadow-lg shadow-violet-500/15 px-3.5 py-2.5 text-violet-800 font-bold text-sm hover:bg-violet-500/5 hover:scale-[1.03] transition-all"
      >
        <Sigma className="w-4 h-4" />
        <span className="hidden sm:inline">נוסחאות</span>
      </button>

      <AnimatePresence>
        {open && topics && (
          <FormulaDrawer
            topics={topics}
            currentTopic={currentTopic}
            onClose={closeDrawer}
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
  // The initializer is reliable because FormulaSheet mounts this drawer only
  // after the topic list has finished loading.
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
      {/* No backdrop by design: the sheet is a non-modal side panel, so the
          exercise stays visible AND interactive while formulas are open.
          Closing is via the X button or ESC — an outside click must NOT close,
          because clicking the exercise to keep solving is the whole point. */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        dir="rtl"
        // z-[91] tops AppHeader's z-[90]: both are top-0, and with no backdrop
        // the X in this drawer's header is the main way to close — under the
        // navbar it was unreachable and the drawer looked impossible to close.
        className="fixed top-0 bottom-0 right-0 z-[91] w-[380px] max-w-[92vw] bg-[var(--background)] border-r border-slate-900/10 shadow-2xl shadow-slate-900/20 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-900/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
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
                    ? 'rounded-2xl border border-violet-500/40 bg-violet-500/[0.05] overflow-hidden'
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
                      <div className="text-[10px] font-black text-violet-700">הנושא הנוכחי שלך</div>
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
      <div className="text-xs font-bold text-violet-800 chat-md mb-2">
        <MathText inline>{formula.name}</MathText>
      </div>
      <div className="bg-slate-900/[0.04] border border-slate-900/10 rounded-lg px-3 py-2.5 chat-md text-center">
        <MathText>{`$$${formula.latex}$$`}</MathText>
      </div>

      {hasHow && (
        <>
          <button
            onClick={() => setShowHow((v) => !v)}
            className="mt-2 text-[11px] font-bold text-violet-700 hover:text-violet-900 transition-colors"
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
                    // Kept in sync with FormulaCard's variables row.
                    <div key={i} className="grid grid-cols-[minmax(2rem,auto)_1fr] gap-x-2 items-start text-xs">
                      <div className="chat-md text-amber-800 font-bold">
                        <MathText inline>{`$${v.sym}$`}</MathText>
                      </div>
                      <div className="text-slate-700 chat-md min-w-0">
                        <span className="text-slate-400 select-none">— </span>
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
