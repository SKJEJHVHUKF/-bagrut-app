'use client';

/**
 * The report section, on the sample class — the real page, wrapped.
 *
 * Wrapped rather than bare re-exported because the report reads
 * useSearchParams (?student=), and Next refuses that on a statically rendered
 * route unless a Suspense boundary sits above it. The real report lives under a
 * dynamic [id] route and never hits this; the demo is static and does.
 */

import { Suspense } from 'react';
import Report from '@/app/console/class/[id]/report/page';

export default function DemoReportPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">טוען…</p>}>
      <Report />
    </Suspense>
  );
}
