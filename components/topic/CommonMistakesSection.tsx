import { AlertTriangle, X, Check } from 'lucide-react';
import type { CommonMistake } from '@/content/topics/types';
import { Prose, SectionShell } from './shared';

// Each card pairs the wrong move (red) with the correction (green).
export function CommonMistakesSection({ mistakes }: { mistakes: CommonMistake[] }) {
  return (
    <SectionShell
      icon={<AlertTriangle className="w-5 h-5" />}
      title="טעויות נפוצות"
      accent="text-violet-300"
    >
      <div className="space-y-3">
        {mistakes.map((m, i) => (
          <div
            key={i}
            className="surface-premium rounded-2xl overflow-hidden"
          >
            <div className="flex gap-2.5 p-3.5 border-b border-white/5 bg-violet-500/5">
              <X className="w-4 h-4 text-violet-400 flex-shrink-0 mt-1" />
              <Prose className="text-violet-50/90">{m.mistake}</Prose>
            </div>
            <div className="flex gap-2.5 p-3.5 bg-emerald-500/5">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
              <Prose className="text-emerald-50/90">{m.fix}</Prose>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
