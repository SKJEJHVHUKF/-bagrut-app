import { redirect } from 'next/navigation';
import { topicHref } from '@/lib/track';

/**
 * /practice/<subject>/<topic> — retired.
 *
 * This is the screen the owner landed on when he tapped the task his teacher
 * had sent him, and recognised it as one the product stopped using months ago
 * ("מסלול ישן שכבר לא בשימוש"). Every link to it was rewritten to the roadmap;
 * this redirect is for what links cannot reach — a bookmark, a URL a teacher
 * sent a class last term, a browser autocompleting an address.
 *
 * It lands on the topic's own page in the study track, not on a generic list,
 * so the arrival is still an answer to what the URL asked for. topicHref falls
 * back to the topic's first station for the five lesson topics that predate the
 * 571/572 tracks, and to /roadmap for a topic it cannot place at all.
 *
 * ⚠️ The child route /exercise is NOT retired and is unaffected by this: a
 * page-level redirect does not apply to a nested route. The mixed bagrut run
 * and the quick quiz are the roadmap's own gate stations and content/tracks
 * links to them on purpose.
 */
export default async function RetiredTopicScreen({
  params,
}: {
  params: Promise<{ subject: string; topic: string }>;
}) {
  const { topic: rawTopic } = await params;
  redirect(topicHref(decodeURIComponent(rawTopic)));
}
