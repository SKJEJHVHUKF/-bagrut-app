import { notFound } from 'next/navigation';
import { getAdvancedCourse } from '@/content/advanced-courses';
import { AdvancedCourseView } from '@/components/advanced/AdvancedCourseView';
import { PracticeShell } from '@/components/practice/PracticeShell';

// Server component: loads the static advanced course and hands it to the
// client view. Data is JSON-serialisable (no closures) so it crosses the
// server→client boundary safely. Route is under /learn — already in the
// middleware's PROTECTED_PREFIXES.
export default async function AdvancedCoursePage({
  params,
}: {
  params: Promise<{ subject: string; topic: string }>;
}) {
  const { subject, topic: rawTopic } = await params;
  const topic = decodeURIComponent(rawTopic);
  const course = getAdvancedCourse(subject, topic);

  if (!course) {
    notFound();
  }

  return (
    <PracticeShell
      subtitle="קורס מתקדם · רמת בגרות"
      backHref={`/learn/${subject}/${encodeURIComponent(topic)}`}
      backLabel="לקורס הבסיס"
    >
      <AdvancedCourseView course={course} />
    </PracticeShell>
  );
}

export function generateMetadata({ params }: { params: { topic?: string } }) {
  const topic = params.topic ? decodeURIComponent(params.topic) : '';
  return {
    title: `${topic} — קורס מתקדם · בגרות בכיס`,
    description: `קורס מתקדם ברמת בגרות בנושא ${topic}: תבניות, טכניקות, מחוון וסימולציה`,
  };
}
