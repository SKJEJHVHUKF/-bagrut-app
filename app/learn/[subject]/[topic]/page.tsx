import { notFound } from 'next/navigation';
import { getLearningPath } from '@/content/learning-paths';
import { LearningPathView } from '@/components/learn/LearningPathView';
import { PracticeShell } from '@/components/practice/PracticeShell';

// Server component: loads the static learning path and hands it to the
// client view. The path contains only JSON-serialisable data (no function
// closures), so it crosses the server→client boundary safely.
export default async function LearnPage({
  params,
}: {
  params: Promise<{ subject: string; topic: string }>;
}) {
  const { subject, topic: rawTopic } = await params;
  const topic = decodeURIComponent(rawTopic);
  const path = getLearningPath(subject, topic);

  if (!path) {
    notFound();
  }

  return (
    <PracticeShell
      subtitle="לימוד מ-0"
      backHref={`/practice/${subject}/${encodeURIComponent(topic)}`}
      backLabel="לדף הנושא"
    >
      <LearningPathView path={path} />
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
    title: `${topic} — לימוד מ-0 · MathUp`,
    description: `מסלול לימוד מלא בנושא ${topic}: מאפס ועד שאלת בגרות`,
  };
}
