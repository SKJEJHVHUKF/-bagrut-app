'use client';

// /roadmap/[lessonId] — the level ladder for one sub-topic.
// Client-side resolution (getSubTopic reads static content) avoids any
// server→client serialization boundary for diagram specs.
//
// Navigation context: the student normally arrives from a track-topic page
// (/roadmap/track/571/probability) and the tile link carries `?ctx=571:probability`.
// "Back" and "המשך לשלב הבא" then stay inside THAT topic — a sub-topic can be
// listed in two track topics (identities appear under טריגונומטריה and again,
// as review, under פונקציות טריגונומטריות), and its neighbours differ in each.
// Without ctx (old deep links, the resume card, search) we look the sub-topic
// up in the active paper's track; if it is in neither track we fall back to the
// lesson-file order and the hub, exactly as before.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { SubTopicLadder } from '@/components/roadmap/SubTopicLadder';
import { resolveRoadmapNode } from '@/constants/roadmapData';
import { getSubTopic } from '@/content/lessons';
import { getPaper } from '@/lib/study-plan';
import { ladderHref, locateInTrack, parseCtx } from '@/lib/track';
import type { BagrutPaper } from '@/content/bagrut-curriculum';

export default function RoadmapLessonPage() {
  const params = useParams();
  const raw = params?.lessonId;
  const lessonId = decodeURIComponent(Array.isArray(raw) ? raw[0] : raw ?? '');

  // Both read after mount: `?ctx=` from window.location rather than
  // useSearchParams() (which forces a Suspense boundary at build time — same
  // choice as app/teach/page.tsx), and the active paper from localStorage.
  const [ctx, setCtx] = useState<ReturnType<typeof parseCtx>>(null);
  const [activePaper, setActivePaper] = useState<BagrutPaper | null>(null);
  useEffect(() => {
    setCtx(parseCtx(new URLSearchParams(window.location.search).get('ctx')));
    setActivePaper(getPaper());
  }, []);

  const resolved = lessonId ? resolveRoadmapNode(lessonId) : null;
  const subTopic = resolved ? getSubTopic('math5', resolved.topic, lessonId) : null;

  if (!resolved || !subTopic) {
    return (
      <PracticeShell subtitle="מסלול הלמידה" backHref="/roadmap" backLabel="למפה">
        <div className="text-center py-16 space-y-3">
          <div className="text-4xl">🤔</div>
          <p className="text-slate-600">השלב הזה לא נמצא במסלול.</p>
          <Link href="/roadmap" className="text-violet-700 font-bold hover:text-violet-900">
            חזרה למפת הלמידה
          </Link>
        </div>
      </PracticeShell>
    );
  }

  // Track context: explicit ctx → active paper → the other paper → none.
  const location =
    (ctx && locateInTrack(ctx.paper, lessonId, ctx.topicId)) ||
    (activePaper && locateInTrack(activePaper, lessonId)) ||
    locateInTrack('571', lessonId) ||
    locateInTrack('572', lessonId) ||
    null;

  const nextSubId = location ? location.nextSubId : resolved.nextSubId;
  const nextTitle = location
    ? (location.nextTitle ?? undefined)
    : resolved.nextSubId
      ? resolveRoadmapNode(resolved.nextSubId)?.node.title
      : undefined;
  const nextHref = nextSubId
    ? ladderHref(nextSubId, location ? { paper: location.paper, topicId: location.topic.id } : null)
    : undefined;
  const mapHref = location?.topicHref ?? '/roadmap';

  return (
    <PracticeShell
      subtitle={location ? location.topic.title : resolved.topic}
      backHref={mapHref}
      backLabel={location ? 'לנושא' : 'למפה'}
    >
      <SubTopicLadder
        subject="math5"
        topic={resolved.topic}
        subTopic={subTopic}
        nextSubId={nextSubId}
        nextTitle={nextTitle}
        nextHref={nextHref}
        mapHref={mapHref}
        mapLabel={location ? `חזרה לנושא: ${location.topic.title}` : 'חזרה למפת הלמידה'}
      />
    </PracticeShell>
  );
}
