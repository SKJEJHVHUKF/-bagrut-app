'use client';

// /roadmap/track/[paper] — the study track of one שאלון: the student's action
// cards (repair / next step / daily review / resume), one status strip, and
// then every TOPIC of the track as a tile → /roadmap/track/[paper]/[topic].
//
// This is the old /roadmap dashboard with the paper taken from the URL instead
// of localStorage and the topic accordion replaced by tiles; the tree it walks
// is the study track (content/tracks), not the lesson files, so 571 follows the
// owner's syllabus order and grouping. All progress is client-side
// (localStorage) → render after mount.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarClock, Crown, Gauge, RotateCcw, Sparkles } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { MathText } from '@/components/practice/MathText';
import { NextStepCard } from '@/components/roadmap/NextStepCard';
import { getTrack, isTrackPaper } from '@/content/tracks';
import { paperLabel, type BagrutPaper } from '@/content/bagrut-curriculum';
import { ladderHref, levelsForNodes, trackMainTopics, trackNodes } from '@/lib/track';
import { getPaper, getPlan, type StudyPlan } from '@/lib/study-plan';
import { countCompleted, nodeLevelSummary, type NodeLevelSummary } from '@/lib/roadmap-progress';
import { getResumePoint } from '@/lib/roadmap-resume';
import { computePacing } from '@/lib/pacing';
import { dueCount } from '@/lib/review';
import { backfillFromMistakes } from '@/lib/review-resolve';
import { getTopWeakness } from '@/lib/remediation';
import { getCognitiveState } from '@/lib/cognition';
import { createClient } from '@/lib/supabase/client';

const SUBJECT = 'math5';

export default function TrackPage() {
  const params = useParams();
  const rawPaper = Array.isArray(params?.paper) ? params?.paper[0] : params?.paper;
  const paper: BagrutPaper | null = isTrackPaper(rawPaper) ? rawPaper : null;

  if (!paper) return <TrackNotFound />;
  return <Track paper={paper} />;
}

function TrackNotFound() {
  return (
    <PracticeShell subtitle="מסלול הלמידה" backHref="/roadmap" backLabel="שאלונים">
      <div className="text-center py-16 space-y-3">
        <div className="text-4xl">🤔</div>
        <p className="text-slate-600">המסלול הזה לא קיים. יש שאלון 571 ושאלון 572.</p>
        <Link href="/roadmap" className="text-violet-700 font-bold hover:text-violet-900">
          לבחירת שאלון
        </Link>
      </div>
    </PracticeShell>
  );
}

function Track({ paper }: { paper: BagrutPaper }) {
  const router = useRouter();
  const tree = useMemo(() => getTrack(paper), [paper]);
  const groups = useMemo(() => trackMainTopics(tree), [tree]);
  const allNodes = useMemo(() => trackNodes(tree), [tree]);
  // Levels per node are pure (content-derived) → build once per paper.
  const levelsBySub = useMemo(() => levelsForNodes(allNodes), [allNodes]);

  // localStorage read only after mount (avoids hydration mismatch).
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [ready, setReady] = useState(false);
  const [syncTick, setSyncTick] = useState(0);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    backfillFromMistakes(); // seed the review queue from past mistakes (once)
    setReady(true);
    setPlan(getPlan());
    // The profile-drawer paper switcher dispatches this; the track lives in the
    // URL, so follow the switch by navigating to the other paper's track.
    const onPaperChange = () => {
      const p = getPaper();
      if (p && p !== paper) router.replace(`/roadmap/track/${p}`);
    };
    // A cross-device pull just merged new progress into localStorage → re-read.
    const onSynced = () => {
      setPlan(getPlan());
      setSyncTick((t) => t + 1);
    };
    window.addEventListener('bagrut-paper-changed', onPaperChange);
    window.addEventListener('bagrut-state-synced', onSynced);
    createClient()
      .auth.getUser()
      .then(({ data }) => setSignedIn(!!data.user))
      .catch(() => setSignedIn(false));
    return () => {
      window.removeEventListener('bagrut-paper-changed', onPaperChange);
      window.removeEventListener('bagrut-state-synced', onSynced);
    };
  }, [paper, router]);

  // Per-node ladder summaries (depend on stored progress).
  const summaries = useMemo(() => {
    const map: Record<string, NodeLevelSummary> = {};
    if (!ready) return map;
    for (const n of allNodes) {
      map[n.subId] = nodeLevelSummary(n.topic, n.subId, levelsBySub[n.subId] ?? []);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, allNodes, levelsBySub, syncTick]);

  const overallDone = ready ? countCompleted(allNodes) : 0;
  const overallPct = allNodes.length ? Math.round((overallDone / allNodes.length) * 100) : 0;
  const totalXp = ready ? Object.values(summaries).reduce((s, x) => s + x.xp, 0) : 0;
  const masteredCount = ready ? Object.values(summaries).filter((x) => x.mastered).length : 0;

  // "Continue where you left off" + exam-date pacing (both localStorage-derived).
  const resume = useMemo(
    () => (ready ? getResumePoint(groups, levelsBySub) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, groups, levelsBySub, summaries],
  );
  // The track topic the resume point sits in — for the tile marker and so the
  // resume link keeps its ?ctx (a sub-topic can appear in two track topics).
  const resumeTopicId = useMemo(
    () => (resume ? groups.find((g) => g.nodes.some((n) => n.subId === resume.subId))?.topic ?? null : null),
    [resume, groups],
  );
  const resumeHref = resume
    ? ladderHref(resume.subId, resumeTopicId ? { paper, topicId: resumeTopicId } : null, resume.levelKind)
    : null;
  const pacing = useMemo(
    () => (ready ? computePacing(groups, levelsBySub, plan) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, groups, levelsBySub, plan, summaries],
  );

  // Spaced-repetition: how many questions are due for review today.
  const reviewDue = useMemo(() => (ready ? dueCount() : 0), [ready, syncTick]);

  // The diagnostic engine's single recommendation, for the lesson topic the
  // student is actually in. It already weighs resume, review and weakness
  // against each other, so when it speaks it REPLACES those two cards rather
  // than adding a third — the whole reason lib/cognition/next-step.ts exists.
  // It speaks only when it has something the plain cards CANNOT say ('start'
  // = no evidence yet; 'continue-ladder' = the resume card says it better).
  const guidance = useMemo(() => {
    if (!ready || !resume?.topic) return null;
    const state = getCognitiveState(SUBJECT, resume.topic);
    if (!state) return null;
    const kind = state.nextStep.kind;
    return kind !== 'start' && kind !== 'continue-ladder' ? state : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, resume?.topic, syncTick, summaries]);

  // The single most worthwhile repair, when there is enough evidence for one.
  const fixTarget = useMemo(
    () => (ready ? getTopWeakness(SUBJECT) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, syncTick, summaries],
  );

  return (
    <PracticeShell subtitle="מסלול הלמידה" backHref="/roadmap" backLabel="שאלונים">
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-3">
          <h1 className="font-display text-xl font-black text-slate-900">
            מסלול הלמידה
            <span className="font-normal text-sm text-slate-600"> · {paperLabel(paper)}</span>
          </h1>
          <Link href="/roadmap" className="text-[11px] font-bold text-violet-700 hover:text-violet-900 shrink-0">
            החלף שאלון
          </Link>
        </div>

        {/* Repair first — a broken idea outranks retention (lib/cognition/next-step
            ordering: repair 100 > review 60). The review card drops its "הכי
            חשוב היום" label whenever this one is showing. */}
        {fixTarget && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <Link
              href={`/fix/${encodeURIComponent(fixTarget.id)}`}
              className="group flex items-center gap-3 rounded-3xl p-4 bg-gradient-to-l from-rose-600 to-orange-500 shadow-lg shadow-rose-500/25 hover:from-rose-500 hover:to-orange-400 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">🛠️</div>
              <div className="flex-1 min-w-0 text-white">
                <div className="text-[10px] font-black tracking-widest uppercase text-white/70">הכי חשוב היום</div>
                <div className="text-sm font-black leading-tight mt-0.5 truncate">{`מסלול תיקון · ${fixTarget.title}`}</div>
                <div className="text-[11px] text-white/80 mt-0.5 truncate">{`${fixTarget.topic} — ${fixTarget.detail}`}</div>
              </div>
              <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            </Link>
          </motion.div>
        )}

        {/* The diagnostic engine's single recommendation — replaces the two cards below. */}
        {guidance && <NextStepCard state={guidance} />}

        {/* Daily spaced-repetition review — retention, once nothing is broken */}
        {!guidance && reviewDue > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <Link
              href="/roadmap/review"
              className="group flex items-center gap-3 rounded-3xl p-4 bg-gradient-to-l from-rose-500 to-orange-500 shadow-lg shadow-rose-500/25 hover:from-rose-400 hover:to-orange-400 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">🔁</div>
              <div className="flex-1 min-w-0 text-white">
                <div className="text-[10px] font-black tracking-widest uppercase text-white/70">
                  {fixTarget ? 'ואחר כך' : 'הכי חשוב היום'}
                </div>
                <div className="text-sm font-black leading-tight mt-0.5">חזרה יומית · {reviewDue} שאלות</div>
                <div className="text-[11px] text-white/80 mt-0.5">מחזק את מה שכבר למדת כדי שלא יישכח</div>
              </div>
              <RotateCcw className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-500 flex-shrink-0" />
            </Link>
          </motion.div>
        )}

        {/* Anonymous students: nudge to sign in so progress isn't device-bound */}
        {signedIn === false && overallDone > 0 && (
          <Link
            href={`/signup?next=${encodeURIComponent(`/roadmap/track/${paper}`)}`}
            className="flex items-center gap-2.5 rounded-2xl p-3.5 bg-amber-500/[0.08] border border-amber-500/30 hover:bg-amber-500/[0.12] transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-[12px] text-amber-900 leading-snug flex-1">
              ההתקדמות שלך שמורה רק במכשיר הזה — <span className="font-black underline">התחבר</span> כדי לא לאבד אותה ולגשת מכל מכשיר.
            </span>
          </Link>
        )}

        {/* Continue where you left off — only when the engine stayed silent */}
        {!guidance && resume && resumeHref && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            {/* -600 not -500: white 10-14px labels need ≥4.5:1; violet-600 gives 6.3:1. */}
            <Link
              href={resumeHref}
              className="group flex items-center gap-3 rounded-3xl p-4 bg-gradient-to-l from-cyan-700 to-violet-600 shadow-lg shadow-violet-500/30 hover:from-cyan-700 hover:to-violet-500 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">{resume.levelEmoji}</div>
              <div className="flex-1 min-w-0 text-white">
                <div className="text-[10px] font-black tracking-widest uppercase text-white/70">
                  {resume.reason === 'in-progress' ? 'המשך מאיפה שהפסקת' : resume.reason === 'mastery' ? 'להשלמת שליטה' : 'הצעד הבא שלך'}
                </div>
                <div className="text-sm font-black leading-tight mt-0.5 truncate">
                  <MathText inline>{resume.title}</MathText>
                </div>
                <div className="text-[11px] text-white/80 mt-0.5">
                  רמת {resume.levelTitle} {resume.levelEmoji}
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            </Link>
          </motion.div>
        )}

        {/* ===== Status strip — "how am I doing", one quiet row under the action ===== */}
        <div className="surface-premium rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-black text-slate-900">
              {overallPct}%
              <span className="font-normal text-slate-600"> · {overallDone} מתוך {allNodes.length} שלבים</span>
            </span>
            <span className="flex items-center gap-3 text-xs text-slate-600 shrink-0">
              <span className="flex items-center gap-1">
                <Sparkles aria-hidden="true" className="w-3.5 h-3.5 text-violet-700" />
                {totalXp} XP
              </span>
              <span className="flex items-center gap-1">
                <Crown aria-hidden="true" className="w-3.5 h-3.5 text-amber-600" />
                {masteredCount}/{allNodes.length}
              </span>
            </span>
          </div>
          <div
            className="h-1.5 bg-slate-900/[0.06] rounded-full overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={overallPct}
            aria-label="התקדמות במסלול"
          >
            <div className="h-full bg-gradient-to-l from-cyan-700 to-violet-600 transition-all duration-500" style={{ width: `${overallPct}%` }} />
          </div>
          {pacing && pacing.status !== 'no-date' && (
            <div className="flex items-start gap-2 pt-0.5">
              {pacing.status === 'behind' ? (
                <Gauge aria-hidden="true" className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CalendarClock aria-hidden="true" className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              )}
              <p className="text-xs text-slate-600 leading-relaxed">
                {pacing.daysLeft > 0 && pacing.status !== 'done' && (
                  <span className="font-bold text-slate-800">
                    {pacing.daysLeft} ימים לבגרות · יעד היום: {pacing.todayTarget} שאלות.{' '}
                  </span>
                )}
                {pacing.message}
              </p>
            </div>
          )}
        </div>

        {/* ===== Topic tiles — the track, in syllabus order =====
            One frame for every topic, all the same size (`auto-rows-fr` +
            h-full): emoji · number · title · what's inside · progress pinned
            to the bottom. Content is clamped, never allowed to resize the tile. */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-black tracking-widest text-slate-500 uppercase">הנושאים במסלול</h2>
            <span className="text-[11px] text-slate-500">{tree.topics.length} נושאים · לפי סדר הלימוד</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-3.5 perspective-1500">
            {tree.topics.map((t, i) => {
              const nodes = groups[i]?.nodes ?? [];
              const done = ready ? countCompleted(nodes) : 0;
              const pct = nodes.length ? Math.round((done / nodes.length) * 100) : 0;
              const soon = t.tiles.filter((tl) => tl.kind === 'soon').length;
              const isHere = resumeTopicId === t.id;
              const complete = nodes.length > 0 && done === nodes.length;
              // A grouped topic (סדרות) lists its sub-tracks, not every stage.
              const ungrouped = new Set(t.tiles.flatMap((tl) => (tl.kind === 'ladder' && !tl.group ? [tl.subId] : [])));
              const inside = t.groups?.length
                ? [...t.groups.map((g) => g.title), ...nodes.filter((n) => ungrouped.has(n.subId)).map((n) => n.title)].join(' · ')
                : nodes.map((n) => n.title).join(' · ');
              return (
                <motion.div
                  key={t.id}
                  className="h-full"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut', delay: Math.min(i * 0.04, 0.3) }}
                >
                  <Link
                    href={`/roadmap/track/${paper}/${encodeURIComponent(t.id)}`}
                    className={`card-3d group flex h-full min-h-[9.5rem] flex-col text-right rounded-2xl p-4 surface-premium transition-colors hover:border-violet-500/40 ${
                      isHere ? 'ring-2 ring-violet-500/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={`icon-3d w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                          complete ? 'bg-emerald-500/15' : 'chip-primary'
                        }`}
                      >
                        {t.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase">נושא {i + 1}</div>
                          {isHere ? (
                            <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-violet-600 text-white shrink-0">כאן אתה</span>
                          ) : complete ? (
                            <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-emerald-500/10 text-emerald-800 border border-emerald-500/25 shrink-0">הושלם</span>
                          ) : null}
                        </div>
                        <div className="text-[15px] font-black text-slate-900 leading-snug line-clamp-1">{t.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {done}/{nodes.length} שלבים
                          {soon > 0 && <span className="text-slate-400"> · {soon} בקרוב</span>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-600 leading-snug line-clamp-2 chat-md flex-1">
                      <MathText inline>{inside}</MathText>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-slate-900/[0.05] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            complete ? 'bg-gradient-to-l from-emerald-500 to-teal-500' : 'bg-gradient-to-l from-violet-500 to-violet-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-violet-700 shrink-0 w-9 text-left">{pct}%</span>
                      <ArrowLeft aria-hidden="true" className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 leading-relaxed pt-1">
          {signedIn
            ? 'ההתקדמות שלך מסתנכרנת לחשבון וזמינה בכל מכשיר. כל שלב הוא סולם של רמות — מ"לומדים" ועד "בגרות".'
            : 'ההתקדמות נשמרת במכשיר הזה. התחבר כדי לשמור אותה בכל מכשיר. כל שלב הוא סולם של רמות — מ"לומדים" ועד "בגרות".'}
        </p>
      </div>
    </PracticeShell>
  );
}
