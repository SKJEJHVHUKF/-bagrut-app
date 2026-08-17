// Server layout for /roadmap/track/[paper] — the page itself is a client
// component (localStorage progress), so the document title lives here.
// `params` is a Promise in Next 16 — await it (see CLAUDE.md, A14).

import type { ReactNode } from 'react';
import { paperLabel } from '@/content/bagrut-curriculum';
import { isTrackPaper } from '@/content/tracks';

export async function generateMetadata({ params }: { params: Promise<{ paper?: string }> }) {
  const { paper } = await params;
  if (!isTrackPaper(paper)) return { title: 'מסלול הלמידה · MathUp' };
  const label = paperLabel(paper);
  return {
    title: `מסלול הלמידה — ${label} · MathUp`,
    description: `כל הנושאים של ${label} כמסלול מסודר — נושא אחרי נושא, שלב אחרי שלב, מלומדים ועד רמת בגרות.`,
  };
}

export default function TrackLayout({ children }: { children: ReactNode }) {
  return children;
}
