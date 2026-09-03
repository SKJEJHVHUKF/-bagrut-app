'use client';

/**
 * /console/class/[id]/focus — every focus the class has been given, and the
 * button that creates one.
 */

import { Target } from 'lucide-react';
import { useClass } from '@/components/console/ClassContext';
import { PageHeader } from '@/components/PageHeader';
import { Btn } from '@/components/console/ui';
import FocusList from '@/components/console/FocusList';

export default function FocusPage() {
  const { openFocus, isDemo } = useClass();
  return (
    <>
      <PageHeader
        title="תרגולים"
        description="הצבעה על תוכן קיים — נושא, תת-נושא, שלב — למי שצריך, עד מתי."
        actions={
          !isDemo && (
            <Btn kind="primary" onClick={() => openFocus('class')}>
              <Target className="h-4 w-4" aria-hidden />
              שלח תרגול
            </Btn>
          )
        }
      />
      <FocusList />
    </>
  );
}
