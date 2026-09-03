'use client';

/**
 * /console/class/[id] — סקירה. The data and the overlays come from the layout.
 */

import Overview from '@/components/console/Overview';
import { PageHeader } from '@/components/PageHeader';
import { useClass } from '@/components/console/ClassContext';

export default function ClassOverviewPage() {
  const { data, board } = useClass();
  return (
    <>
      <PageHeader
        title={data.class.name}
        description={`${board.studentCount} תלמידים${data.class.units ? ` · ${data.class.units} יח״ל` : ''} · ${data.class.schoolYear}`}
      />
      <Overview />
    </>
  );
}
