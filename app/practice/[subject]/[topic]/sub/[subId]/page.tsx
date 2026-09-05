import { redirect } from 'next/navigation';
import { subTopicHref } from '@/lib/track';

// The old per-sub-topic landing is now folded into the roadmap ladder (the
// single guided spine). Any legacy /practice/.../sub/[subId] URL redirects to
// the sub-topic's level ladder at /roadmap/[subId].
export default async function SubTopicLandingRedirect({
  params,
}: {
  params: Promise<{ subId: string }>;
}) {
  const { subId } = await params;
  // subTopicHref rather than a hand-built path: it adds the track context,
  // which is what makes "back" from the ladder return to the topic's journey
  // instead of dead-ending. Same resolution the teacher's task link uses.
  redirect(subTopicHref(subId));
}
