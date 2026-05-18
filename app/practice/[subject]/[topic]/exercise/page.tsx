import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { BagrutQuestionView } from '@/components/practice/BagrutQuestionView';
import { QuickExerciseView } from '@/components/practice/QuickExerciseView';
import { hasLesson } from '@/content/lessons';

// Subject labels — duplicated minimally from the picker to keep this
// route self-contained. If the subject key isn't recognised we still
// render but show a generic label.
const SUBJECT_LABELS: Record<string, string> = {
  math5: '📐 מתמטיקה 5 יח׳',
  math4: '🔢 מתמטיקה 4 יח׳',
  physics: '⚛️ פיזיקה',
  english: '🇬🇧 אנגלית',
  history: '📜 היסטוריה',
  bible: '📕 תנ"ך',
  chem: '🧪 כימיה',
};

export default async function ExercisePage({
  params,
  searchParams,
}: {
  params: Promise<{ subject: string; topic: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { subject, topic: rawTopic } = await params;
  const { mode: rawMode } = await searchParams;
  const topic = decodeURIComponent(rawTopic);
  const mode = rawMode === 'quick' ? 'quick' : 'bagrut';
  const subjectLabel = SUBJECT_LABELS[subject] ?? subject;
  const lessonExists = hasLesson(subject, topic);

  const backHref = lessonExists
    ? `/practice/${subject}/${encodeURIComponent(topic)}`
    : '/practice';
  const backLabel = lessonExists ? 'חזרה לסיכום' : 'בחר נושא אחר';

  return (
    <PracticeShell
      subtitle={mode === 'bagrut' ? 'תרגול בגרות' : 'תרגול מהיר'}
      backHref={backHref}
      backLabel={backLabel}
    >
      <div className="space-y-4">
        <header className="space-y-2">
          <div className="text-xs font-black tracking-widest text-purple-300 uppercase flex items-center gap-2">
            <span>{mode === 'bagrut' ? '🎯 בגרות מלאה' : '⚡ תרגול מהיר'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">
            <span className="bg-gradient-to-l from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              {topic}
            </span>
          </h1>
          {lessonExists && (
            <Link
              href={`/practice/${subject}/${encodeURIComponent(topic)}`}
              className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>חזור לסיכום הלימודי</span>
            </Link>
          )}
        </header>

        {mode === 'bagrut' ? (
          <BagrutQuestionView subject={subject} topic={topic} subjectLabel={subjectLabel} />
        ) : (
          <QuickExerciseView subject={subject} topic={topic} subjectLabel={subjectLabel} />
        )}
      </div>
    </PracticeShell>
  );
}

export function generateMetadata({ params }: { params: { topic?: string } }) {
  const topic = params.topic ? decodeURIComponent(params.topic) : '';
  return {
    title: `תרגול ${topic} — בגרות בכיס`,
  };
}
