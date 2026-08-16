import type { TopicContent } from '@/content/topics/types';
import { IntuitionSection } from './IntuitionSection';
import { FormalDefinitionSection } from './FormalDefinitionSection';
import { KeyConceptsSection } from './KeyConceptsSection';
import { WorkedExamplesSection } from './WorkedExamplesSection';
import { CommonMistakesSection } from './CommonMistakesSection';
import { ExamConnectionSection } from './ExamConnectionSection';
import { PracticeSection } from './PracticeSection';

const SUBJECT_LABELS: Record<string, string> = {
  'math-5units': 'מתמטיקה · 5 יח״ל',
};

// Top-level renderer for one topic in the JSON "topic-schema" format. Composes
// every section in a fixed pedagogical order: orient (header + prerequisites),
// build intuition, formalize, name the key concepts, model with worked
// examples, warn about pitfalls, connect to the exam, then practise.
export function TopicView({ content }: { content: TopicContent }) {
  return (
    <article className="space-y-8">
      <TopicHeader content={content} />
      <IntuitionSection intuition={content.intuition} />
      <FormalDefinitionSection def={content.formalDefinition} />
      <KeyConceptsSection concepts={content.keyConcepts} />
      <WorkedExamplesSection examples={content.workedExamples} />
      <CommonMistakesSection mistakes={content.commonMistakes} />
      <ExamConnectionSection connection={content.examConnection} />
      <PracticeSection practice={content.practice} />
    </article>
  );
}

function TopicHeader({ content }: { content: TopicContent }) {
  const { title, subject, examForm, estimatedMinutes, prerequisites } = content;
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-200">
          {SUBJECT_LABELS[subject] ?? subject}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-200">
          שאלון {examForm}
        </span>
        <span className="px-2.5 py-1 rounded-full surface-premium text-slate-300">
          ⌀ {estimatedMinutes} דקות
        </span>
      </div>

      <h1 className="font-display text-3xl sm:text-4xl font-black gradient-text leading-tight">{title}</h1>

      {prerequisites.length > 0 && (
        <div className="surface-premium rounded-2xl p-4">
          <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">
            ידע קודם נדרש
          </div>
          <ul className="flex flex-wrap gap-2">
            {prerequisites.map((p) => (
              <li
                key={p.topicId}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-100 text-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                {p.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
