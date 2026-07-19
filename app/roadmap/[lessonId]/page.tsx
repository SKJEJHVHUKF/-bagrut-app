'use client';

// /roadmap/[lessonId] — the lesson viewer for one sub-topic milestone.
// Client-side resolution (getSubTopic reads static content) avoids any
// server→client serialization boundary for diagram specs.

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { SubTopicLadder } from '@/components/roadmap/SubTopicLadder';
import { resolveRoadmapNode } from '@/constants/roadmapData';
import { getSubTopic } from '@/content/lessons';

export default function RoadmapLessonPage() {
  const params = useParams();
  const raw = params?.lessonId;
  const lessonId = decodeURIComponent(Array.isArray(raw) ? raw[0] : raw ?? '');

  const resolved = lessonId ? resolveRoadmapNode(lessonId) : null;
  const subTopic = resolved ? getSubTopic('math5', resolved.topic, lessonId) : null;

  if (!resolved || !subTopic) {
    return (
      <PracticeShell subtitle="מסלול הלמידה" backHref="/roadmap" backLabel="למפה">
        <div className="text-center py-16 space-y-3">
          <div className="text-4xl">🤔</div>
          <p className="text-slate-600">השלב הזה לא נמצא במסלול.</p>
          <Link href="/roadmap" className="text-indigo-700 font-bold hover:text-indigo-900">
            חזרה למפת הלמידה
          </Link>
        </div>
      </PracticeShell>
    );
  }

  const nextTitle = resolved.nextSubId
    ? resolveRoadmapNode(resolved.nextSubId)?.node.title
    : undefined;

  return (
    <PracticeShell subtitle={resolved.topic} backHref="/roadmap" backLabel="למפה">
      <SubTopicLadder
        subject="math5"
        topic={resolved.topic}
        subTopic={subTopic}
        nextSubId={resolved.nextSubId}
        nextTitle={nextTitle}
      />
    </PracticeShell>
  );
}
