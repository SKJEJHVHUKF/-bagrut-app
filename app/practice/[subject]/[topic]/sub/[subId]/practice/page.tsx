import { redirect } from 'next/navigation';

// The old per-sub-topic practice runner is now the roadmap ladder's practice
// rungs (the single guided spine). Any legacy .../sub/[subId]/practice URL
// redirects to the sub-topic's level ladder at /roadmap/[subId].
export default async function SubTopicPracticeRedirect({
  params,
}: {
  params: Promise<{ subId: string }>;
}) {
  const { subId } = await params;
  redirect(`/roadmap/${encodeURIComponent(subId)}`);
}
