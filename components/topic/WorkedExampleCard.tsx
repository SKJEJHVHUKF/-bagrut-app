import { CheckCircle2 } from 'lucide-react';
import type { WorkedExample } from '@/content/topics/types';
import { Prose, DifficultyDots } from './shared';

// One fully worked example. Every step shows WHAT we do (`action`, prominent)
// and directly beneath it WHY (`why`, muted) — the pedagogy the schema asks for.
export function WorkedExampleCard({
  example,
  index,
}: {
  example: WorkedExample;
  index: number;
}) {
  return (
    <div className="surface-premium rounded-2xl overflow-hidden">
      {/* header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-500 flex items-center justify-center font-black text-white text-sm">
          {index + 1}
        </div>
        <div className="flex-1 text-[10px] font-black tracking-widest text-violet-300 uppercase">
          דוגמה פתורה
        </div>
        <DifficultyDots level={example.difficulty} />
      </div>

      <div className="p-4 space-y-4">
        {/* the problem */}
        <Prose className="text-white font-semibold">{example.problem}</Prose>

        {/* steps: action + why */}
        <ol className="space-y-3">
          {example.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/25 border border-violet-400/40 flex items-center justify-center text-[11px] font-black text-violet-100">
                {i + 1}
              </div>
              <div className="flex-1 space-y-1">
                <Prose className="text-slate-100">{s.action}</Prose>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-emerald-300/80 uppercase flex-shrink-0 mt-1">
                    למה
                  </span>
                  <Prose className="text-slate-400 text-sm">{s.why}</Prose>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* final answer */}
        <div className="flex gap-2 items-start bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <div className="text-[10px] font-black tracking-widest text-emerald-300 uppercase mb-0.5">
              תשובה
            </div>
            <Prose className="text-emerald-50 font-semibold">{example.answer}</Prose>
          </div>
        </div>
      </div>
    </div>
  );
}
