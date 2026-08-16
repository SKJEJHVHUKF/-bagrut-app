import { KeyRound } from 'lucide-react';
import type { KeyConcept } from '@/content/topics/types';
import { Prose, SectionShell } from './shared';

// The handful of terms the student must own, each with a "why it matters".
export function KeyConceptsSection({ concepts }: { concepts: KeyConcept[] }) {
  return (
    <SectionShell
      icon={<KeyRound className="w-5 h-5" />}
      title="מושגי מפתח"
      accent="text-violet-300"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {concepts.map((c) => (
          <div
            key={c.id}
            className="surface-premium rounded-2xl p-4 space-y-2"
          >
            <h3 className="font-display text-base font-black text-violet-200">{c.term}</h3>
            <Prose className="text-slate-200 text-sm">{c.explanation}</Prose>
            <div className="flex gap-2 bg-violet-500/5 border border-violet-500/20 rounded-xl p-2.5">
              <span className="text-[10px] font-black tracking-widest text-violet-300 uppercase flex-shrink-0 mt-0.5">
                למה חשוב
              </span>
              <Prose className="text-violet-50/85 text-sm">{c.whyItMatters}</Prose>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
