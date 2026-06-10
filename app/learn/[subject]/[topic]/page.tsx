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

export function generateMetadata({ params }: { params: { topic?: string } }) {
  const topic = params.topic ? decodeURIComponent(params.topic) : '';
  return {
    title: `${topic} — לימוד מ-0 · בגרות בכיס`,
    description: `מסלול לימוד מלא בנושא ${topic}: מאפס ועד שאלת בגרות`,
  };
}
