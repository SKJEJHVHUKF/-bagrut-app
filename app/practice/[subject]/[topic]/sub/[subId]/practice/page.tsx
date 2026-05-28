import { notFound } from 'next/navigation';
import { getSubTopic } from '@/content/lessons';
import { SubTopicPractice } from '@/components/practice/SubTopicPractice';
import { PracticeShell } from '@/components/practice/PracticeShell';

export default async function SubTopicPracticePage({
  params,
}: {
  params: Promise<{ subject: string; topic: string; subId: string }>;
}) {
  const { subject, topic: rawTopic, subId } = await params;
  const topic = decodeURIComponent(rawTopic);
  const subTopic = getSubTopic(subject, topic, subId);

  if (!subTopic || subTopic.questions.length === 0) {
    notFound();
  }

  return (
    <PracticeShell
      subtitle={`תרגול · ${subTopic.title}`}
      backHref={`/practice/${subject}/${encodeURIComponent(topic)}/sub/${subId}`}
      backLabel="חזרה לסיכום"
    >
      <SubTopicPractice subject={subject} topic={topic} subTopic={subTopic} />
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
    title: `תרגול ${subId} — ${topicLabel} — בגרות בכיס`,
    description: `תרגול ייעודי בתת-נושא בתוך ${topicLabel}`,
  };
}
