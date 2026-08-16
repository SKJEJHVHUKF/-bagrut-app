import { Target } from 'lucide-react';
import type { PracticeProblem } from '@/content/topics/types';
import { SectionShell } from './shared';
import { PracticeCard } from './PracticeCard';

// The practice bank — each problem is an independent interactive card.
export function PracticeSection({ practice }: { practice: PracticeProblem[] }) {
  return (
    <SectionShell
      icon={<Target className="w-5 h-5" />}
      title="תרגול"
      accent="text-teal-300"
    >
      <div className="space-y-3">
        {practice.map((p, i) => (
          <PracticeCard key={p.id} problem={p} index={i} />
        ))}
      </div>
    </SectionShell>
  );
}
