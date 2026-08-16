import { BookOpen } from 'lucide-react';
import type { FormalDefinition } from '@/content/topics/types';
import { Prose, SectionShell } from './shared';

// The precise definition plus named formulas. Each formula's `latex` is RAW
// (no $...$ delimiters), so we wrap it as display math ($$...$$) ourselves.
export function FormalDefinitionSection({ def }: { def: FormalDefinition }) {
  return (
    <SectionShell
      icon={<BookOpen className="w-5 h-5" />}
      title="הגדרה פורמלית"
      accent="text-sky-300"
    >
      <div className="surface-premium rounded-2xl p-4 sm:p-5 space-y-4">
        <Prose className="text-slate-100">{def.text}</Prose>

        <div className="space-y-3">
          {def.formulas.map((f, i) => (
            <div
              key={i}
              className="bg-sky-500/5 border border-sky-500/25 rounded-xl p-3.5 space-y-1.5"
            >
              {/* Pure-Hebrew label → plain text (full styling control). */}
              <div className="text-xs font-black tracking-wide text-sky-300">{f.name}</div>
              {/* RAW latex → render as centered display math. */}
              <Prose className="text-white">{`$$${f.latex}$$`}</Prose>
              <Prose className="text-slate-300 text-sm">{f.explanation}</Prose>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
