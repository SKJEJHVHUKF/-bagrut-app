// Stage-A demo route: renders the topic-schema components against the sample
// data (חקירת פונקציה פולינומית) so the infrastructure can be reviewed before
// any ln content is authored. Public route (not under the protected prefixes
// in lib/supabase/middleware.ts), so it needs no login.

import type { Metadata } from 'next';
import { TopicView } from '@/components/topic/TopicView';
import { polynomialFunctionInvestigation } from '@/content/topics';

export const metadata: Metadata = {
  title: 'תצוגת נושא (דמו) — MathUp',
};

export default function TopicDemoPage() {
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <TopicView content={polynomialFunctionInvestigation} />
      </div>
    </main>
  );
}
