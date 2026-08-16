import { GraduationCap } from 'lucide-react';
import type { ExamConnection } from '@/content/topics/types';
import { Prose, SectionShell } from './shared';

// How this topic actually shows up on the exam, plus the wording that signals it.
export function ExamConnectionSection({ connection }: { connection: ExamConnection }) {
  return (
    <SectionShell
      icon={<GraduationCap className="w-5 h-5" />}
      title="הקשר לבגרות"
      accent="text-emerald-300"
    >
      <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
        <Prose className="text-slate-100">{connection.text}</Prose>

        {connection.triggerWords.length > 0 && (
          <div>
            <div className="text-[10px] font-black tracking-widest text-emerald-300 uppercase mb-2">
              מילות מפתח בשאלה
            </div>
            <ul className="flex flex-wrap gap-2">
              {connection.triggerWords.map((w, i) => (
                <li
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 text-xs font-semibold"
                >
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
