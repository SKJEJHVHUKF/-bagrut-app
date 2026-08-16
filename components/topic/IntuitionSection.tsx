import { Lightbulb, Sparkles } from 'lucide-react';
import type { Intuition } from '@/content/topics/types';
import { Prose, SectionShell } from './shared';

// Plain-language "why this works", with an optional tangible analogy.
export function IntuitionSection({ intuition }: { intuition: Intuition }) {
  return (
    <SectionShell
      icon={<Lightbulb className="w-5 h-5" />}
      title="האינטואיציה"
      accent="text-amber-300"
    >
      <div className="surface-premium rounded-2xl p-4 sm:p-5 space-y-3">
        <Prose className="text-slate-100">{intuition.text}</Prose>

        {intuition.analogy && (
          <div className="flex gap-2.5 bg-amber-500/5 border border-amber-500/25 rounded-xl p-3">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 mt-1" />
            <Prose className="text-amber-50/90 italic">{intuition.analogy}</Prose>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
