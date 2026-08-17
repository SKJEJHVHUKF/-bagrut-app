'use client';

// /roadmap/track/[paper]/[topic] — one topic of the study track as tiles: every
// sub-topic in the syllabus order (content/tracks), each opening its level
// ladder; syllabus items with no content yet sit in place as "בקרוב"; screens
// that already exist (mixed bagrut practice, quick quiz) are link tiles.
// Sequential unlock runs inside the topic (a tile opens when the previous
// LADDER tile is core-done). All progress is client-side → render after mount.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { MathText } from '@/components/practice/MathText';
import { SubTopicTile } from '@/components/roadmap/SubTopicTile';
import { getTrack, isTrackPaper } from '@/content/tracks';
import { paperLabel, type BagrutPaper } from '@/content/bagrut-curriculum';
import { ladderHref, levelsForNodes, topicNodes, trackEntries, trackMainTopics, trackTileStatus } from '@/lib/track';
import { countCompleted, nodeLevelSummary, type NodeLevelSummary } from '@/lib/roadmap-progress';
import { getResumePoint } from '@/lib/roadmap-resume';
import { dueCountBySubTopic } from '@/lib/review';
import type { StepStatus } from '@/types/roadmap';

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

  return <TopicTiles paper={paper} topicId={topic.id} />;
}

function TopicTiles({ paper, topicId }: { paper: BagrutPaper; topicId: string }) {
  const tree = useMemo(() => getTrack(paper), [paper]);
  const topic = tree.topics.find((t) => t.id === topicId)!;
  const index = tree.topics.indexOf(topic);
  const nextTopic = tree.topics[index + 1] ?? null;
  const entries = useMemo(() => trackEntries(topic), [topic]);
  const nodes = useMemo(() => topicNodes(topic), [topic]);
  const levelsBySub = useMemo(() => levelsForNodes(nodes), [nodes]);

  const [ready, setReady] = useState(false);
  const [syncTick, setSyncTick] = useState(0);
  useEffect(() => {
    setReady(true);
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
  // restricted to one group) — a one-tap "continue" above the grid.
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

  return (
    <PracticeShell subtitle={paperLabel(paper)} backHref={`/roadmap/track/${paper}`} backLabel="לנושאים">
      <div className="space-y-5">
        {/* Topic header */}
        <div className="surface-premium rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${
                complete ? 'bg-emerald-500/15' : 'chip-primary'
              }`}
            >
              {topic.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                נושא {index + 1} מתוך {tree.topics.length}
              </div>
              <h1 className="font-display text-xl font-black text-slate-900 leading-tight chat-md">
                <MathText inline>{topic.title}</MathText>
              </h1>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {done}/{nodes.length} שלבים הושלמו
                {soonCount > 0 && <span className="text-slate-400"> · {soonCount} בקרוב</span>}
              </div>
            </div>
            <span className="text-lg font-black text-violet-700 shrink-0">{pct}%</span>
          </div>
          <div
            className="h-2 bg-slate-900/[0.04] rounded-full overflow-hidden"
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
              className={`h-full ${complete ? 'bg-gradient-to-l from-emerald-500 to-teal-500' : 'bg-gradient-to-l from-violet-500 to-violet-600'}`}
            />
          </div>
          {topic.note && (
            <a
              href={topic.note.href}
              target={topic.note.href.startsWith('http') ? '_blank' : undefined}
              rel={topic.note.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700 hover:text-violet-900"
            >
              <ExternalLink aria-hidden="true" className="w-3.5 h-3.5" />
              {topic.note.label}
            </a>
          )}
        </div>

        {/* Continue inside this topic */}
        {resume && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
            <Link
              href={ladderHref(resume.subId, ctx, resume.levelKind)}
              className="group flex items-center gap-3 rounded-2xl p-3.5 bg-gradient-to-l from-cyan-700 to-violet-600 shadow-lg shadow-violet-500/25 hover:from-cyan-700 hover:to-violet-500 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl">{resume.levelEmoji}</div>
              <div className="flex-1 min-w-0 text-white">
                <div className="text-[10px] font-black tracking-widest uppercase text-white/70">
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

        {/* Sub-topic tiles, in syllabus order. `auto-rows-fr` + h-full tiles =
            every tile the same size, whatever it holds (owner's request). */}
        <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-3.5 perspective-1500">
          {entries.map((entry, i) => {
            const delay = Math.min(i * 0.04, 0.35);
            if (entry.kind !== 'ladder') {
              return (
                <motion.div key={`${entry.kind}-${entry.step}`} className="h-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay }}>
                  <SubTopicTile entry={entry} />
                </motion.div>
              );
            }
            const status: StepStatus = ready
              ? trackTileStatus(entry.node, entry.prev)
              : entry.prev
                ? 'LOCKED'
                : 'UNLOCKED';
            return (
              <motion.div key={`${entry.node.subId}-${entry.step}`} className="h-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay }}>
                <SubTopicTile
                  entry={entry}
                  status={status}
                  summary={ready ? summaries[entry.node.subId] : null}
                  levelCount={levelsBySub[entry.node.subId]?.length ?? 0}
                  prevTitle={entry.prev?.title}
                  reviewDue={dueBySub[entry.node.subId] ?? 0}
                  href={ladderHref(entry.node.subId, ctx)}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Next topic + reference material */}
        <div className="space-y-2">
          {nextTopic && (
            <Link
              href={`/roadmap/track/${paper}/${encodeURIComponent(nextTopic.id)}`}
              className="group flex items-center justify-between gap-3 rounded-2xl p-3.5 surface-premium hover:border-violet-500/40 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <span aria-hidden="true" className="text-lg">{nextTopic.emoji}</span>
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
              className="block text-center text-[11px] text-slate-500 hover:text-violet-700 transition-colors pt-1"
            >
              📚 חומרי עזר וקורס מתקדם בנושא
            </Link>
          )}
        </div>
      </div>
    </PracticeShell>
  );
}
