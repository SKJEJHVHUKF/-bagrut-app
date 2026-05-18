import { notFound } from 'next/navigation';
import { getLesson } from '@/content/lessons';
import { LessonView } from '@/components/practice/LessonView';
import { PracticeShell } from '@/components/practice/PracticeShell';

// Server component: loads the static lesson and hands it to the client view.
// If the topic doesn't have a lesson yet we fall back to 404 — the picker
// only routes here when a lesson exists.
export default async function LessonPage({
  params,
}: {
  params: Promise<{ subject: string; topic: string }>;
}) {
  const { subject, topic: rawTopic } = await params;
  const topic = decodeURIComponent(rawTopic);
  const lesson = getLesson(subject, topic);

  if (!lesson) {
    notFound();
  }

  return (
    <PracticeShell subtitle="סיכום ותרגול" backHref="/practice" backLabel="בחר נושא אחר">
      <LessonView lesson={lesson} />
    </PracticeShell>
  );
}

export function generateMetadata({ params }: { params: { topic?: string } }) {
  const topic = params.topic ? decodeURIComponent(params.topic) : '';
  return {
    title: `${topic} — בגרות בכיס`,
    description: `סיכום ותרגול בנושא ${topic}`,
  };
}
