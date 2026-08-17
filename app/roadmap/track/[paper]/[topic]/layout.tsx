// Server layout for /roadmap/track/[paper]/[topic] — document title from the
// track topic; the page is a client component. `params` is a Promise in Next 16.

import type { ReactNode } from 'react';
import { paperLabel } from '@/content/bagrut-curriculum';
import { getTrack, isTrackPaper } from '@/content/tracks';

export async function generateMetadata({ params }: { params: Promise<{ paper?: string; topic?: string }> }) {
  const { paper, topic: rawTopic } = await params;
  if (!isTrackPaper(paper)) return { title: 'מסלול הלמידה · MathUp' };
  const topic = getTrack(paper).topics.find((t) => t.id === decodeURIComponent(rawTopic ?? ''));
  const label = paperLabel(paper);
  if (!topic) return { title: `מסלול הלמידה — ${label} · MathUp` };
  // Titles may carry LaTeX in the derived 572 track — strip the $ for the <title>.
  const plain = topic.title.replace(/\$/g, '');
  return {
    title: `${plain} — ${label} · MathUp`,
    description: `${plain} ב${label}: כל תתי-הנושאים בסדר הלימוד, כל אחד עם סולם רמות מלומדים ועד בגרות.`,
  };
}

export default function TrackTopicLayout({ children }: { children: ReactNode }) {
  return children;
}
