import { redirect } from 'next/navigation';

// The old per-sub-topic landing is now folded into the roadmap ladder (the
// single guided spine). Any legacy /practice/.../sub/[subId] URL redirects to
// the sub-topic's level ladder at /roadmap/[subId].
export default async function SubTopicLandingRedirect({
  params,
}: {
  params: Promise<{ subId: string }>;
}) {
  const { subId } = await params;
  redirect(`/roadmap/${encodeURIComponent(subId)}`);
}
