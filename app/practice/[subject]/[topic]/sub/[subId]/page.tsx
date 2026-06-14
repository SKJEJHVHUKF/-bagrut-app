import { notFound } from 'next/navigation';
import { getSubTopic, getNextSubTopic } from '@/content/lessons';
import { SubTopicLanding } from '@/components/practice/SubTopicLanding';
import { PracticeShell } from '@/components/practice/PracticeShell';

export default async function SubTopicLandingPage({
  params,
}: {
  params: Promise<{ subject: string; topic: string; subId: string }>;
}) {
  const { subject, topic: rawTopic, subId } = await params;
  const topic = decodeURIComponent(rawTopic);
  const subTopic = getSubTopic(subject, topic, subId);

  if (!subTopic) {
    notFound();
  }

  const nextSubTopic = getNextSubTopic(subject, topic, subId);

  return (
    <PracticeShell
      subtitle={`תת-נושא · ${topic}`}
      backHref={`/practice/${subject}/${encodeURIComponent(topic)}`}
      backLabel="חזרה לנושא"
    >
      <SubTopicLanding
        subject={subject}
        topic={topic}
        subTopic={subTopic}
        nextSubTopic={nextSubTopic}
      />
    </PracticeShell>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic?: string; subId?: string }>;
}) {
  const { topic, subId } = await params;
  const topicLabel = topic ? decodeURIComponent(topic) : '';
  return {
    title: `${subId} — ${topicLabel} — בגרות בכיס`,
    description: `תת-נושא ייעודי בנושא ${topicLabel}`,
  };
}
