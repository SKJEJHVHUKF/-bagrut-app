import { PencilLine } from 'lucide-react';
import type { WorkedExample } from '@/content/topics/types';
import { SectionShell } from './shared';
import { WorkedExampleCard } from './WorkedExampleCard';

// Worked examples, rendered in the order authored (intended: rising difficulty).
export function WorkedExamplesSection({ examples }: { examples: WorkedExample[] }) {
  return (
    <SectionShell
      icon={<PencilLine className="w-5 h-5" />}
      title="דוגמאות פתורות"
      accent="text-violet-300"
    >
      <div className="space-y-4">
        {examples.map((ex, i) => (
          <WorkedExampleCard key={ex.id} example={ex} index={i} />
        ))}
      </div>
    </SectionShell>
  );
}
