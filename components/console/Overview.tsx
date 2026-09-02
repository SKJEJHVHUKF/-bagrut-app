'use client';

/**
 * Overview — the class's first screen, composed from the panels.
 *
 * Fixed order, on purpose: a teacher with ninety seconds between lessons gets
 * the four numbers, then who needs him, then what to re-teach, then the focus
 * loop, and only then the full map. Shared by the real class route and the
 * demo, so the two cannot drift.
 */

import Link from 'next/link';
import { useClass } from '@/components/console/ClassContext';
import {
  KpiStrip,
  AttentionPanel,
  ReteachPanel,
  FocusListPanel,
  HeatmapPanel,
  PanelLink,
} from '@/components/console/panels';

export default function Overview() {
  const { board, focuses, data, classId, isDemo } = useClass();
  const base = isDemo ? '/console-demo' : `/console/class/${classId}`;

  return (
    <div className="flex flex-col gap-4">
      <KpiStrip board={board} />
      <AttentionPanel rows={board.needsAttention} />
      <ReteachPanel rows={board.reteach} />
      <FocusListPanel
        rows={focuses.slice(0, 5)}
        actions={
          !isDemo && (
            <PanelLink href={`${base}/focus`}>כל המיקודים ←</PanelLink>
          )
        }
      />
      <HeatmapPanel board={board} windowDays={data.windowDays} />
      {!isDemo && (
        <p className="text-xs text-slate-400">
          הרשימה המלאה, ממוינת ועם חיפוש:{' '}
          <Link href={`${base}/students`} className="underline underline-offset-4 hover:text-slate-700">
            תלמידים
          </Link>
        </p>
      )}
    </div>
  );
}
