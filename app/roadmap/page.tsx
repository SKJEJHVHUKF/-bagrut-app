'use client';

// /roadmap — the learning-path HUB: two tiles, שאלון 571 and שאלון 572. Each
// shows the track's topics, the student's progress on it and a one-line
// "continue" so a returning student is one tap from where they stopped.
// Tapping a tile makes that paper the active one (the profile switcher, quiz
// filter and formula sheet follow it) and opens /roadmap/track/[paper].
//
// The dashboard that used to live here (action cards, status strip, the topic
// list) moved one level down to the track page — the hub stays a clean choice.
// All progress is client-side (localStorage) → render after mount.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Play } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { MathText } from '@/components/practice/MathText';
import { getTrack, TRACK_PAPERS } from '@/content/tracks';
import { paperLabel, type BagrutPaper } from '@/content/bagrut-curriculum';
import { levelsForNodes, trackMainTopics, trackNodes } from '@/lib/track';
import { getPaper, setPaper } from '@/lib/study-plan';
import { countCompleted, nodeLevelSummary } from '@/lib/roadmap-progress';
import { getResumePoint } from '@/lib/roadmap-resume';

const PAPER_BLURB: Record<BagrutPaper, string> = {
  '571': 'סדרות, הסתברות, גאומטריה, טריגונומטריה, חקירת פונקציות ובעיות קיצון',
  '572': 'מעריכית, ln, גאומטריה אנליטית, וקטורים ומספרים מרוכבים — עם יסודות החדו"א',
};

export default function RoadmapHubPage() {
  // Everything content-derived is pure → build once.
  const tracks = useMemo(
    () =>
      TRACK_PAPERS.map((paper) => {
        const tree = getTrack(paper);
        return { paper, tree, groups: trackMainTopics(tree), nodes: trackNodes(tree) };
      }),
    [],
  );
  const levelsBySub = useMemo(() => levelsForNodes(tracks.flatMap((t) => t.nodes)), [tracks]);

  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<BagrutPaper | null>(null);
  const [syncTick, setSyncTick] = useState(0);
  useEffect(() => {
    setReady(true);
    setActive(getPaper());
    const onPaperChange = () => setActive(getPaper());
    const onSynced = () => {
      setActive(getPaper());
      setSyncTick((t) => t + 1);
    };
    window.addEventListener('bagrut-paper-changed', onPaperChange);
    window.addEventListener('bagrut-state-synced', onSynced);
    return () => {
      window.removeEventListener('bagrut-paper-changed', onPaperChange);
      window.removeEventListener('bagrut-state-synced', onSynced);
    };
  }, []);

  // Per-paper progress + resume point (localStorage-derived).
  const stats = useMemo(
    () =>
      tracks.map(({ paper, tree, groups, nodes }) => {
        if (!ready) return { paper, tree, done: 0, total: nodes.length, pct: 0, mastered: 0, resume: null };
        const done = countCompleted(nodes);
        const mastered = nodes.filter((n) => nodeLevelSummary(n.topic, n.subId, levelsBySub[n.subId] ?? []).mastered).length;
        return {
          paper,
          tree,
          done,
          total: nodes.length,
          pct: nodes.length ? Math.round((done / nodes.length) * 100) : 0,
          mastered,
          resume: getResumePoint(groups, levelsBySub),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, tracks, levelsBySub, syncTick],
  );

  const choose = (paper: BagrutPaper) => {
    setPaper(paper);
    setActive(paper);
    // Let paper-aware surfaces (profile drawer, quiz, formulas) follow the choice.
    window.dispatchEvent(new Event('bagrut-paper-changed'));
  };

  return (
    <PracticeShell subtitle="מסלול הלמידה" backHref="/" backLabel="בית">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-black text-slate-900">מסלול הלמידה שלי</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            בחר את השאלון שאתה מתכונן אליו. כל שאלון הוא מסלול מסודר — נושא אחרי נושא, שלב אחרי שלב, מ״לומדים״ ועד רמת בגרות. אפשר לעבור בין השאלונים בכל רגע.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-4 perspective-1500">
          {stats.map(({ paper, tree, done, total, pct, mastered, resume }, i) => {
            const isActive = active === paper;
            const complete = total > 0 && done === total;
            return (
              <motion.div
                key={paper}
                className="h-full"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.06 }}
              >
                <Link
                  href={`/roadmap/track/${paper}`}
                  onClick={() => choose(paper)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`card-3d-strong glass-card group flex h-full flex-col rounded-3xl p-5 text-right transition-colors ${
                    isActive ? 'ring-2 ring-violet-500/40 border-violet-500/50' : 'hover:border-violet-500/40'
                  }`}
                >
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black tracking-widest text-violet-700 uppercase">מסלול</div>
                      <h2 className="font-display text-2xl font-black text-slate-900 leading-tight">{paperLabel(paper)}</h2>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">{PAPER_BLURB[paper]}</p>
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-violet-600 text-white shrink-0">פעיל</span>
                    )}
                  </div>

                  {/* Topics of the track */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {tree.topics.map((t) => (
                      <span key={t.id} className="chip-primary inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5">
                        <span aria-hidden="true">{t.emoji}</span>
                        {t.title}
                      </span>
                    ))}
                  </div>

                  {/* Progress — pinned to the bottom so both tiles line up */}
                  <div className="mt-auto pt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-slate-900">
                        {pct}%
                        <span className="font-normal text-slate-600"> · {done} מתוך {total} שלבים</span>
                      </span>
                      {mastered > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-bold">
                          <Crown aria-hidden="true" className="w-3.5 h-3.5" />
                          {mastered}
                        </span>
                      )}
                    </div>
                    <div
                      className="h-1.5 bg-slate-900/[0.06] rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                      aria-label={`התקדמות ב${paperLabel(paper)}`}
                    >
                      <div
                        className={`h-full transition-all duration-500 ${
                          complete ? 'bg-gradient-to-l from-emerald-500 to-teal-500' : 'bg-gradient-to-l from-cyan-700 to-violet-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Where you are — its own row, never truncated */}
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/70 border border-slate-900/[0.05] px-3 py-2 text-xs text-slate-700">
                    <Play aria-hidden="true" className="w-3.5 h-3.5 text-violet-700 shrink-0 mt-0.5" />
                    {resume ? (
                      <span className="chat-md min-w-0 leading-snug">
                        <span className="font-bold text-slate-900">
                          {resume.reason === 'in-progress' ? 'המשך: ' : resume.reason === 'mastery' ? 'להשלמת שליטה: ' : 'מתחילים: '}
                        </span>
                        <MathText inline>{resume.title}</MathText>
                        <span className="text-slate-500"> · רמת {resume.levelTitle} {resume.levelEmoji}</span>
                      </span>
                    ) : (
                      <span>{ready && complete ? 'המסלול הושלם — כל הכבוד! 👑' : 'מתחילים מהנושא הראשון'}</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-violet-500/25 group-hover:bg-violet-500 transition-colors">
                      כניסה למסלול
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-slate-500 leading-relaxed">
          נושאים משותפים (פונקציות, טריגונומטריה, חדו״א) נספרים בשני המסלולים — ההתקדמות בהם משותפת. כל שלב הוא סולם של רמות, מ״לומדים״ ועד ״בגרות״.
        </p>
      </div>
    </PracticeShell>
  );
}
