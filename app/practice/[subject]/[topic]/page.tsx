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

// `params` is a PROMISE in Next 16 — awaiting it is not optional.
//
// This was typed as a plain object and read synchronously, so `params.topic`
// was `undefined` and every lesson and practice page shipped a title of just
// " — MathUp": in the browser tab, in history, in a WhatsApp preview, and in
// Google. It passed `tsc` because Next's generated page contract ends in
// `& any` (see .next/types/validator.ts), which swallows a narrower hand-written
// annotation. The type below is the framework's real shape, so the next person
// to touch it gets a compile error instead of a silent blank.
export async function generateMetadata({ params }: { params: Promise<{ topic?: string }> }) {
  const { topic: raw } = await params;
  const topic = raw ? decodeURIComponent(raw) : '';
  return {
    title: `${topic} — MathUp`,
    description: `סיכום ותרגול בנושא ${topic}`,
  };
}
