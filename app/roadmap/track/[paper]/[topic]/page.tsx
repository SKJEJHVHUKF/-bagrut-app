'use client';

// /roadmap/track/[paper]/[topic] — one topic of the study track as a JOURNEY:
// every sub-topic in the syllabus order (content/tracks) is a station on a
// vertical rail, each opening its level ladder; syllabus items with no
// authored content yet sit in place as "בקרוב"; screens that already exist
// (mixed bagrut practice, quick quiz) are gate stations at the end.
// Every station is open — the syllabus order is the recommended order, not a
// lock (owner, 2026-08-18). All progress is client-side → render after mount.
//
// The rail replaces the earlier uniform tile grid (owner rejected it,
// 2026-08-20): a grid of same-icon cards read as a catalog; the product's own
// word is מסלול, so the screen now draws one — a single gradient rail with
// numbered stations, the first unfinished one marked "אתה כאן".
//
// A topic with `groups` (סדרות: חשבוניות / הנדסיות, owner 2026-08-19) opens
// with a segmented chooser: two tabs, one per sub-track, and the journey of
// the chosen one below. The choice lives in `?group=` so "back" from a ladder
// (whose topicHref carries the group) and a reload land on the same sub-track.
// Tiles with no group ("עוד בנושא") are listed under the chosen sub-track.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpenCheck, Check, ExternalLink, GraduationCap, Lock, RotateCcw, Star, Zap } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { MathText } from '@/components/practice/MathText';
import { TopicIcon, groupIconFor, levelIconFor } from '@/components/roadmap/TopicIcon';
import { getTrack, isTrackPaper } from '@/content/tracks';
import { paperLabel, type BagrutPaper } from '@/content/bagrut-curriculum';
import { ladderHref, levelsForNodes, topicGroups, topicNodes, trackEntries, trackMainTopics, trackTileStatus, type TrackEntry } from '@/lib/track';
import { countCompleted, nodeLevelSummary, type NodeLevelSummary } from '@/lib/roadmap-progress';
import { getResumePoint } from '@/lib/roadmap-resume';
import { dueCountBySubTopic } from '@/lib/review';

const SUBJECT = 'math5';

export default function TrackTopicPage() {
  const params = useParams();
  const rawPaper = Array.isArray(params?.paper) ? params?.paper[0] : params?.paper;
  const rawTopic = Array.isArray(params?.topic) ? params?.topic[0] : params?.topic;
  const paper: BagrutPaper | null = isTrackPaper(rawPaper) ? rawPaper : null;
  const topicId = decodeURIComponent(rawTopic ?? '');
  const topic = paper ? getTrack(paper).topics.find((t) => t.id === topicId) ?? null : null;

  if (!paper || !topic) {
    return (
      <PracticeShell subtitle="מסלול הלמידה" backHref={paper ? `/roadmap/track/${paper}` : '/roadmap'} backLabel="למסלול">
        <div className="text-center py-16 space-y-3">
          <div className="text-4xl">🤔</div>
          <p className="text-slate-600">הנושא הזה לא נמצא במסלול.</p>
          <Link href={paper ? `/roadmap/track/${paper}` : '/roadmap'} className="text-violet-700 font-bold hover:text-violet-900">
            חזרה למסלול
          </Link>
        </div>
      </PracticeShell>
    );
  }

  return <TopicJourneyPage paper={paper} topicId={topic.id} />;
}

function TopicJourneyPage({ paper, topicId }: { paper: BagrutPaper; topicId: string }) {
  const tree = useMemo(() => getTrack(paper), [paper]);
  const topic = tree.topics.find((t) => t.id === topicId)!;
  const index = tree.topics.indexOf(topic);
  const nextTopic = tree.topics[index + 1] ?? null;
  const entries = useMemo(() => trackEntries(topic), [topic]);
  const nodes = useMemo(() => topicNodes(topic), [topic]);
  const levelsBySub = useMemo(() => levelsForNodes(nodes), [nodes]);

  const groups = useMemo(() => topicGroups(topic), [topic]);

  const [ready, setReady] = useState(false);
  const [syncTick, setSyncTick] = useState(0);
  // The chosen sub-track: `?group=` on mount (read from window.location rather
  // than useSearchParams, which forces a Suspense boundary at build time).
  const [groupFromUrl, setGroupFromUrl] = useState<string | null>(null);
  const [chosenGroup, setChosenGroup] = useState<string | null>(null);
  useEffect(() => {
    setReady(true);
    setGroupFromUrl(new URLSearchParams(window.location.search).get('group'));
    const onSynced = () => setSyncTick((t) => t + 1);
    window.addEventListener('bagrut-state-synced', onSynced);
    return () => window.removeEventListener('bagrut-state-synced', onSynced);
  }, []);

  const summaries = useMemo(() => {
    const map: Record<string, NodeLevelSummary> = {};
    if (!ready) return map;
    for (const n of nodes) map[n.subId] = nodeLevelSummary(n.topic, n.subId, levelsBySub[n.subId] ?? []);
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, nodes, levelsBySub, syncTick]);
  const dueBySub = useMemo(() => (ready ? dueCountBySubTopic() : {}), [ready, syncTick]);

  const done = ready ? countCompleted(nodes) : 0;
  const pct = nodes.length ? Math.round((done / nodes.length) * 100) : 0;
  const complete = nodes.length > 0 && done === nodes.length;

  // The resume point INSIDE this topic (the same rule the track page uses,
  // restricted to one group) — a one-tap "continue" above the journey.
  const resume = useMemo(
    () => (ready ? getResumePoint(trackMainTopics({ paper, topics: [topic] }), levelsBySub) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, topic, levelsBySub, summaries],
  );

  const ctx = { paper, topicId: topic.id };
  // The lesson-topic reference page (formulas, worked examples, Pro course) of
  // the first ladder in this topic — the classic "חומרי עזר" link.
  const firstLessonTopic = nodes[0]?.topic ?? null;
  const soonCount = topic.tiles.filter((t) => t.kind === 'soon').length;

  // Which sub-track is open: the student's explicit choice, else the URL, else
  // the group the resume point sits in, else the first group.
  const resumeGroup = useMemo(() => {
    if (!groups || !resume) return null;
    return entries.find((e) => e.kind === 'ladder' && e.node.subId === resume.subId)?.group ?? null;
  }, [groups, resume, entries]);
  const activeGroupId = groups
    ? [chosenGroup, groupFromUrl, resumeGroup].find((g) => g && groups.some((x) => x.id === g)) ?? groups[0].id
    : null;
  const chooseGroup = (id: string) => {
    setChosenGroup(id);
    const url = new URL(window.location.href);
    url.searchParams.set('group', id);
    window.history.replaceState(window.history.state, '', url.toString());
  };
  const inGroup = (e: TrackEntry, id: string | null) => (e.group ?? null) === id;
  const groupProgress = (id: string) => {
    const groupNodes = entries.flatMap((e) => (e.kind === 'ladder' && e.group === id ? [e.node] : []));
    const groupDone = ready ? countCompleted(groupNodes) : 0;
    return { total: groupNodes.length, done: groupDone };
  };

  const journey = (list: TrackEntry[], markCurrent = true) => (
    <Journey
      list={list}
      ready={ready}
      summaries={summaries}
      levelsBySub={levelsBySub}
      dueBySub={dueBySub}
      ctx={ctx}
      markCurrent={markCurrent}
    />
  );

  return (
    <PracticeShell subtitle={paperLabel(paper)} backHref={`/roadmap/track/${paper}`} backLabel="לנושאים">
      <div className="space-y-6">
        {/* Topic header — type on the canvas, no box. The one saturated moment
            on this screen is the rail below, so the header stays quiet. */}
        <div>
          <div className="flex items-center gap-3.5">
            <span
              aria-hidden="true"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                complete
                  ? 'bg-emerald-500/15 text-emerald-700'
                  : 'bg-ink text-cyan-300 shadow-lg shadow-indigo-950/25 ring-1 ring-violet-500/20'
              }`}
            >
              <TopicIcon id={topic.id} className="w-6 h-6" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-black tracking-[0.14em] text-violet-700 uppercase">
                נושא {index + 1} מתוך {tree.topics.length}
              </div>
              <h1 className="font-display text-2xl font-black text-ink leading-tight chat-md">
                <MathText inline>{topic.title}</MathText>
              </h1>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 bg-slate-900/[0.05] rounded-full overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label="התקדמות בנושא"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full ${complete ? 'bg-gradient-to-l from-emerald-500 to-teal-500' : 'bg-gradient-to-l from-cyan-700 to-violet-600'}`}
              />
            </div>
            <span className="text-xs font-black text-slate-700 tabular-nums shrink-0">
              {done}/{nodes.length} שלבים
              {soonCount > 0 && <span className="font-normal text-slate-400"> · {soonCount} בקרוב</span>}
            </span>
          </div>
          {topic.note && (
            <a
              href={topic.note.href}
              target={topic.note.href.startsWith('http') ? '_blank' : undefined}
              rel={topic.note.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700 hover:text-violet-900"
            >
              <ExternalLink aria-hidden="true" className="w-3.5 h-3.5" />
              {topic.note.label}
            </a>
          )}
        </div>

        {/* Continue inside this topic */}
        {resume && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
            {/* The one dark moment on the screen — the logo's own aesthetic:
                a deep-indigo object with a neon cyan glow. */}
            <Link
              href={ladderHref(resume.subId, ctx, resume.levelKind)}
              className="group flex items-center gap-3 rounded-2xl p-3.5 bg-gradient-to-l from-[#241E7A] to-[#1E1B4B] border border-violet-500/25 shadow-xl shadow-indigo-950/25 transition-all hover:shadow-2xl hover:shadow-indigo-950/30 hover:-translate-y-0.5"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/[0.08] border border-cyan-400/25 flex items-center justify-center text-cyan-300">
                {(() => {
                  const LevelIcon = levelIconFor(resume.levelKind);
                  return <LevelIcon aria-hidden="true" className="w-5 h-5" strokeWidth={1.75} />;
                })()}
              </div>
              <div className="flex-1 min-w-0 text-white">
                <div className="text-[10px] font-black tracking-widest uppercase text-cyan-200/90">
                  {resume.reason === 'in-progress' ? 'המשך מאיפה שהפסקת' : resume.reason === 'mastery' ? 'להשלמת שליטה' : 'הצעד הבא בנושא'}
                </div>
                <div className="text-sm font-black leading-tight mt-0.5 truncate">
                  <MathText inline>{resume.title}</MathText>
                  <span className="font-normal text-white/80"> · רמת {resume.levelTitle}</span>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            </Link>
          </motion.div>
        )}

        {/* The journey. With groups: a segmented chooser first, then the chosen
            sub-track's rail, then whatever sits outside the groups. */}
        {groups ? (
          <>
            <div role="tablist" aria-label="מסלולים בנושא" className="surface-premium rounded-2xl p-1.5 flex gap-1.5">
              {groups.map((g) => {
                const active = g.id === activeGroupId;
                const { total, done: gDone } = groupProgress(g.id);
                const GroupIcon = groupIconFor(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`group-panel-${g.id}`}
                    onClick={() => chooseGroup(g.id)}
                    className={`flex-1 min-w-0 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all ${
                      active
                        ? 'bg-ink text-white shadow-md shadow-indigo-950/25'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/[0.03]'
                    }`}
                  >
                    <GroupIcon aria-hidden="true" className={`w-4 h-4 shrink-0 ${active ? 'text-cyan-300' : 'text-slate-400'}`} strokeWidth={2} />
                    <span className="truncate">{g.title}</span>
                    <span className={`text-[11px] font-black tabular-nums shrink-0 ${active ? 'text-cyan-200/90' : 'text-slate-400'}`}>
                      {gDone}/{total}
                    </span>
                  </button>
                );
              })}
            </div>

            {groups.map((g) =>
              g.id === activeGroupId ? (
                <div key={g.id} id={`group-panel-${g.id}`} role="tabpanel">
                  {g.tagline && <p className="text-xs text-slate-500 leading-relaxed mb-4 pr-1">{g.tagline}</p>}
                  {journey(entries.filter((e) => inGroup(e, g.id)))}
                </div>
              ) : null,
            )}

            {entries.some((e) => inGroup(e, null)) && (
              <div className="space-y-3 pt-1">
                <h2 className="text-[11px] font-black tracking-[0.14em] text-slate-500 uppercase">עוד בנושא</h2>
                {/* One "אתה כאן" per page — it lives on the main journey above. */}
                {journey(entries.filter((e) => inGroup(e, null)), false)}
              </div>
            )}
          </>
        ) : (
          journey(entries)
        )}

        {/* Next topic + reference material */}
        <div className="space-y-2 pt-2">
          {nextTopic && (
            <Link
              href={`/roadmap/track/${paper}/${encodeURIComponent(nextTopic.id)}`}
              className="group flex items-center justify-between gap-3 rounded-2xl p-3.5 surface-premium hover:border-violet-500/40 transition-colors"
            >
              <span className="flex items-center gap-2.5 text-sm text-slate-700">
                <span aria-hidden="true" className="w-8 h-8 rounded-lg chip-primary flex items-center justify-center shrink-0">
                  <TopicIcon id={nextTopic.id} className="w-4 h-4" />
                </span>
                <span>
                  הנושא הבא: <span className="font-black text-slate-900">{nextTopic.title}</span>
                </span>
              </span>
              <ArrowLeft className="w-4 h-4 text-violet-700 group-hover:-translate-x-1 transition-transform" />
            </Link>
          )}
          {firstLessonTopic && (
            <Link
              href={`/practice/${SUBJECT}/${encodeURIComponent(firstLessonTopic)}`}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-700 transition-colors pt-1"
            >
              <BookOpenCheck aria-hidden="true" className="w-3.5 h-3.5" />
              חומרי עזר וקורס מתקדם בנושא
            </Link>
          )}
        </div>
      </div>
    </PracticeShell>
  );
}

/* ---------- the journey rail --------------------------------------------- */

const NODE = 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10';

function Journey({
  list,
  ready,
  summaries,
  levelsBySub,
  dueBySub,
  ctx,
  markCurrent,
}: {
  list: TrackEntry[];
  ready: boolean;
  summaries: Record<string, NodeLevelSummary>;
  levelsBySub: Record<string, { kind: string }[]>;
  dueBySub: Record<string, number>;
  ctx: { paper: BagrutPaper; topicId: string };
  markCurrent: boolean;
}) {
  // "אתה כאן" — the first station that isn't finished yet. A recommendation
  // marker only: nothing on the rail is locked.
  const currentIdx = markCurrent
    ? list.findIndex((e) => e.kind === 'ladder' && (!ready || trackTileStatus(e.node) !== 'COMPLETED'))
    : -1;

  return (
    <div className="relative">
      {/* The rail — one continuous line behind the station nodes. Physical
          right-4.75rem…: the node column is w-10 (2.5rem) → its center sits
          1.25rem from the column's right edge. */}
      <div
        aria-hidden="true"
        className="absolute top-4 bottom-4 right-[1.22rem] w-[3px] rounded-full bg-gradient-to-b from-violet-500/45 via-violet-400/25 to-cyan-600/20"
      />
      <ol className="space-y-3.5">
        {list.map((entry, i) => (
          <motion.li
            key={`${entry.kind}-${'node' in entry ? entry.node.subId : ''}-${entry.group ?? ''}-${entry.step}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: Math.min(i * 0.06, 0.4) }}
          >
            {entry.kind === 'ladder' ? (
              <StageStation
                entry={entry}
                isCurrent={i === currentIdx}
                ready={ready}
                summary={ready ? summaries[entry.node.subId] : null}
                levelCount={levelsBySub[entry.node.subId]?.length ?? 0}
                reviewDue={dueBySub[entry.node.subId] ?? 0}
                href={ladderHref(entry.node.subId, ctx)}
              />
            ) : entry.kind === 'soon' ? (
              <SoonStation entry={entry} />
            ) : (
              <GateStation entry={entry} />
            )}
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

/** One regular stage on the rail. */
function StageStation({
  entry,
  isCurrent,
  ready,
  summary,
  levelCount,
  reviewDue,
  href,
}: {
  entry: Extract<TrackEntry, { kind: 'ladder' }>;
  isCurrent: boolean;
  ready: boolean;
  summary: NodeLevelSummary | null;
  levelCount: number;
  reviewDue: number;
  href: string;
}) {
  const { node, tile } = entry;
  const status = ready ? trackTileStatus(node) : 'UNLOCKED';
  const mastered = !!summary?.mastered;
  const done = status === 'COMPLETED';
  const cleared = summary?.clearedCount ?? 0;
  const total = summary?.totalLevels ?? levelCount;
  const inProgress = !done && cleared > 0;

  const nodeCls = mastered
    ? `${NODE} bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30`
    : done
      ? `${NODE} bg-emerald-500 text-white shadow-md shadow-emerald-500/25`
      : isCurrent
        ? `${NODE} bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/40`
        : `${NODE} bg-white border-2 border-slate-200 text-slate-500`;

  return (
    <Link href={href} className="group flex items-start gap-3.5">
      <span className={nodeCls} aria-hidden="true">
        {isCurrent && (
          <span className="absolute inset-0 rounded-full ring-4 ring-violet-500/20 animate-pulse motion-reduce:animate-none" />
        )}
        {mastered ? (
          <Star className="w-4.5 h-4.5 fill-white/90" strokeWidth={1.5} />
        ) : done ? (
          <Check className="w-5 h-5" strokeWidth={3} />
        ) : (
          <span className="font-display text-[15px] font-black tabular-nums">{entry.step}</span>
        )}
      </span>

      <div
        className={`flex-1 min-w-0 rounded-2xl p-4 transition-all group-hover:-translate-y-0.5 ${
          isCurrent
            ? 'bg-white border border-violet-500/40 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/15'
            : done || mastered
              ? 'surface-premium'
              : 'bg-white/70 border border-slate-900/[0.05]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] font-black tracking-[0.14em] uppercase text-slate-400">שלב {entry.step}</div>
          <div className="flex items-center gap-1.5">
            {reviewDue > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-500/10 border border-rose-500/25 rounded-full px-1.5 py-px">
                <RotateCcw aria-hidden="true" className="w-2.5 h-2.5" />
                {reviewDue}
              </span>
            )}
            {isCurrent && !inProgress && (
              <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-violet-600 text-white">אתה כאן</span>
            )}
            {inProgress && (
              <span className="text-[10px] font-bold rounded-full px-2 py-0.5 chip-primary">בתהליך</span>
            )}
            {mastered ? (
              <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-amber-500/10 text-amber-800 border border-amber-500/25">שליטה</span>
            ) : done ? (
              <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-emerald-500/10 text-emerald-800 border border-emerald-500/25">הושלם</span>
            ) : null}
          </div>
        </div>

        <div className="text-[15px] font-black text-ink leading-snug mt-1 chat-md">
          <MathText inline>{node.title}</MathText>
        </div>
        <div className="text-xs text-slate-500 leading-snug mt-1 line-clamp-1 chat-md">
          <MathText inline>{tile.bullets?.length ? tile.bullets.join(' · ') : node.tagline}</MathText>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {total > 0 && (
            <span className="flex items-center gap-1" aria-label={`${cleared} מתוך ${total} רמות`}>
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i < cleared ? (mastered ? 'bg-amber-500 w-4' : 'bg-violet-500 w-4') : 'bg-slate-900/10 w-1.5'
                  }`}
                />
              ))}
            </span>
          )}
          <span className="text-[11px] text-slate-500 flex-1 min-w-0 truncate">
            {total > 0 ? `${cleared}/${total} רמות · מלומדים ועד בגרות` : ''}
          </span>
          <ArrowLeft
            aria-hidden="true"
            className={`w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-1 ${isCurrent ? 'text-violet-700' : 'text-slate-400'}`}
          />
        </div>
      </div>
    </Link>
  );
}

/** A syllabus item whose content is still being written. */
function SoonStation({ entry }: { entry: Extract<TrackEntry, { kind: 'soon' }> }) {
  return (
    <div className="flex items-start gap-3.5" aria-disabled="true">
      <span className={`${NODE} bg-white border-2 border-dashed border-slate-300 text-slate-400`} aria-hidden="true">
        <Lock className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0 rounded-2xl p-4 border border-dashed border-slate-900/15 bg-white/40">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] font-black tracking-[0.14em] uppercase text-slate-400">שלב {entry.step}</div>
          <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-slate-900/[0.04] text-slate-500 border border-slate-900/10">בקרוב</span>
        </div>
        <div className="text-[15px] font-black text-slate-600 leading-snug mt-1 chat-md">
          <MathText inline>{entry.tile.title}</MathText>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">התוכן לשלב הזה בכתיבה — הסדר כבר במקום</div>
      </div>
    </div>
  );
}

/** A gate at the journey's end — a screen that already exists (mixed bagrut
 *  practice, quick quiz). */
function GateStation({ entry }: { entry: Extract<TrackEntry, { kind: 'link' }> }) {
  const { tile } = entry;
  const isQuiz = tile.href.startsWith('/quiz');
  const GateIcon = isQuiz ? Zap : GraduationCap;
  const chip = isQuiz ? 'בוחן מהיר' : tile.href.includes('mode=bagrut') ? 'תרגול בגרות' : 'מסך תרגול';
  return (
    <Link href={tile.href} className="group flex items-start gap-3.5">
      <span className={`${NODE} bg-ink text-cyan-300 shadow-md shadow-indigo-950/25 ring-1 ring-violet-500/25`} aria-hidden="true">
        <GateIcon className="w-4.5 h-4.5" strokeWidth={1.75} />
      </span>
      <div className="flex-1 min-w-0 rounded-2xl p-4 border border-slate-900/[0.07] bg-white/70 transition-all group-hover:-translate-y-0.5 group-hover:border-violet-500/40">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] font-black tracking-[0.14em] uppercase text-slate-400">שלב {entry.step}</div>
          <span className="text-[10px] font-bold rounded-full px-2 py-0.5 chip-primary">{chip}</span>
        </div>
        <div className="text-[15px] font-black text-ink leading-snug mt-1 chat-md">
          <MathText inline>{tile.title}</MathText>
        </div>
        {tile.bullets?.length ? (
          <div className="text-xs text-slate-500 leading-snug mt-1 line-clamp-1 chat-md">
            <MathText inline>{tile.bullets.join(' · ')}</MathText>
          </div>
        ) : null}
        <div className="mt-2.5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-violet-700">
            פתיחה
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}
