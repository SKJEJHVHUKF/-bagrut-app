'use client';

// /roadmap/track/[paper] — the study track of one שאלון: ONE "today" list
// (lib/daily-plan — repair / review / climb / drill in its order), one status
// strip, and then every TOPIC of the track as a tile → /roadmap/track/[paper]/[topic].
//
// Until 2026-09-03 this page stacked four action cards (repair, cognition
// NextStepCard, daily review, resume) from four engines that did not always
// agree, while the daily plan — the only engine that knows the goal — lived on
// /my-plan behind the "עוד" drawer. Now the plan is the arbiter here too.
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
import { ArrowLeft, ArrowLeftRight, CalendarClock, Crown, Flame, Gauge, Sparkles, Target } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { MathText } from '@/components/practice/MathText';
import { TodayList } from '@/components/roadmap/TodayList';
import { TopicIcon } from '@/components/roadmap/TopicIcon';
import { getTrack, isTrackPaper } from '@/content/tracks';
import { paperLabel, type BagrutPaper } from '@/content/bagrut-curriculum';
import { levelsForNodes, trackMainTopics, trackNodes } from '@/lib/track';
import { getPaper, getPlan, type StudyPlan } from '@/lib/study-plan';
import { countCompleted, nodeLevelSummary, type NodeLevelSummary } from '@/lib/roadmap-progress';
import { getResumePoint } from '@/lib/roadmap-resume';
import { computePacing } from '@/lib/pacing';
import { backfillFromMistakes } from '@/lib/review-resolve';
import { buildTodayPlan } from '@/lib/daily-plan-client';
import { currentStreak, getDailyGoal, todayCount } from '@/lib/results';
import { getCognitiveState } from '@/lib/cognition';
import { createClient } from '@/lib/supabase/client';
import { useClientState, useHydrated } from '@/lib/use-client-value';

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

  // localStorage is read at hydration, not during the server render.
  const [plan, setPlan] = useClientState<StudyPlan | null>(getPlan, null);
  const ready = useHydrated();
  const [syncTick, setSyncTick] = useState(0);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    backfillFromMistakes(); // seed the review queue from past mistakes (once)
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
  }, [setPlan, paper, router]);

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

  // The resume point — only for the "כאן אתה" tile marker now; the list below
  // carries the actual "continue" link.
  const resume = useMemo(
    () => (ready ? getResumePoint(groups, levelsBySub) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, groups, levelsBySub, summaries],
  );
  const resumeTopicId = useMemo(
    () => (resume ? groups.find((g) => g.nodes.some((n) => n.subId === resume.subId))?.topic ?? null : null),
    [resume, groups],
  );
  const pacing = useMemo(
    () => (ready ? computePacing(groups, levelsBySub, plan) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, groups, levelsBySub, plan, summaries],
  );

  // THE list. `syncTick`/`summaries` are recompute triggers, not inputs: every
  // value comes from localStorage, which React cannot see changing.
  const daily = useMemo(
    () => (ready ? buildTodayPlan({ paper, withoutPlan: true }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, paper, plan, syncTick, summaries],
  );

  // One sentence from the diagnostic layer about the topic the student is in.
  // The card it used to render is gone — the list already orders repair/review/
  // climb the way next-step does — but the insight is the one thing the list
  // cannot say ("your sign errors come from the conjugate rule").
  const insight = useMemo(() => {
    if (!ready || !resume?.topic) return null;
    return getCognitiveState(SUBJECT, resume.topic)?.insight ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, resume?.topic, syncTick, summaries]);

  // Habit signals, on the page where the habit happens (they used to live only
  // on /insights). The goal is the exam-date pace when there is a date, else
  // the manual daily goal.
  const habit = useMemo(() => {
    if (!ready) return null;
    const goal =
      pacing && pacing.status !== 'no-date' && pacing.status !== 'done' && pacing.todayTarget > 0
        ? pacing.todayTarget
        : getDailyGoal();
    return { streak: currentStreak(SUBJECT), today: todayCount(SUBJECT), goal };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pacing, syncTick, summaries]);

  return (
    <PracticeShell subtitle="מסלול הלמידה" backHref="/roadmap" backLabel="שאלונים" wide>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.14em] text-violet-700 uppercase mb-1">מסלול הלמידה</div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-ink leading-tight">{paperLabel(paper)}</h1>
          </div>
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/70 border border-slate-900/[0.08] hover:border-violet-500/40 hover:bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all shrink-0"
          >
            <ArrowLeftRight aria-hidden="true" className="w-3.5 h-3.5 text-violet-600" />
            החלף שאלון
          </Link>
        </div>

        {/* The one "what now" — repair → review → climb → drill, with the why. */}
        {daily && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <TodayList daily={daily} insight={insight} />
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

        {/* ===== Status strip — "how am I doing", one quiet row under the action ===== */}
        <div className="surface-premium rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="flex items-baseline gap-2 min-w-0">
              <span className="font-display text-2xl font-black text-ink tabular-nums">{overallPct}%</span>
              <span className="text-xs text-slate-600 truncate">{overallDone} מתוך {allNodes.length} שלבים</span>
            </span>
            {/* NOT shrink-0: a flex item's basis is its max-content width, so with
                four chips (streak day) the row was 56px wider than a 360px phone
                and clipped off the edge — its own flex-wrap never got a chance.
                Let it shrink, and the chips wrap inside. */}
            <span className="flex items-center justify-end gap-2 flex-wrap min-w-0">
              {habit && (
                <>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums border ${
                      habit.today >= habit.goal
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800'
                        : 'bg-slate-900/[0.04] border-slate-900/10 text-slate-700'
                    }`}
                    title="שאלות שענית היום מול היעד היומי"
                  >
                    <Target aria-hidden="true" className="w-3.5 h-3.5" />
                    היום {habit.today}/{habit.goal}
                  </span>
                  {habit.streak > 0 && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-800 px-2.5 py-1 text-[11px] font-bold tabular-nums"
                      title="ימים ברצף עם תרגול"
                    >
                      <Flame aria-hidden="true" className="w-3.5 h-3.5 text-orange-600" />
                      {habit.streak === 1 ? 'יום אחד ברצף' : `${habit.streak} ימים ברצף`}
                    </span>
                  )}
                </>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full chip-primary px-2.5 py-1 text-[11px] font-bold tabular-nums">
                <Sparkles aria-hidden="true" className="w-3.5 h-3.5" />
                {totalXp} XP
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-800 px-2.5 py-1 text-[11px] font-bold tabular-nums">
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
          <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-1 mb-3">
            <h2 className="text-[11px] font-black tracking-[0.14em] text-slate-500 uppercase">הנושאים במסלול</h2>
            <span className="text-[11px] text-slate-500">{tree.topics.length} נושאים · לפי סדר הלימוד</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-3.5 perspective-1500">
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
                        className={`icon-3d w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          complete ? 'bg-emerald-500/15 text-emerald-700' : 'chip-primary'
                        }`}
                      >
                        <TopicIcon id={t.id} className="w-6 h-6" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[10px] font-black tracking-[0.14em] text-slate-500 uppercase">נושא {i + 1}</div>
                          {isHere ? (
                            <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-violet-600 text-white shrink-0">כאן אתה</span>
                          ) : complete ? (
                            <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-emerald-500/10 text-emerald-800 border border-emerald-500/25 shrink-0">הושלם</span>
                          ) : null}
                        </div>
                        <div className="text-[15px] font-black text-ink leading-snug line-clamp-1">{t.title}</div>
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
