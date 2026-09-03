'use client';

/**
 * Overview — the class's first screen.
 *
 * Fixed order, on purpose: the sentence that says what to do, then the
 * students in three groups, then the topics as three words. That is the whole
 * screen. No tiles, no table, no heatmap — every one of those made a teacher
 * interpret a number, and the screen should have interpreted it already.
 *
 * Shared by the real class route and the demo, so the two cannot drift.
 */

import NextStep from '@/components/console/NextStep';
import StudentGroups from '@/components/console/StudentGroups';
import TopicLights from '@/components/console/TopicLights';

export default function Overview() {
  return (
    <div className="flex flex-col gap-8">
      <NextStep />
      <StudentGroups cap={6} />
      <TopicLights />
    </div>
  );
}
