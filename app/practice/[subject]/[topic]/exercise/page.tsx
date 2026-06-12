import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { BagrutQuestionView } from '@/components/practice/BagrutQuestionView';
import { QuickExerciseView } from '@/components/practice/QuickExerciseView';
import { StaticBagrutExerciseView } from '@/components/practice/StaticBagrutExerciseView';
import { hasLesson, getBagrutQuestions, hasBagrutBank } from '@/content/lessons';
import { poolHas } from '@/lib/pool-availability';

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

  // ===== STATIC-FIRST MODE SELECTION =====
  //
  // Priority order:
  //  1) Static bagrut bank exists → render it (zero API call, multi-part,
  //     hints + solutions per part). Works for BOTH ?mode=quick and
  //     ?mode=bagrut because the static experience IS the bagrut-style
  //     practice the owner wants — no separate "quick" path needed.
  //  2) Old pool in Supabase for bagrut mode → keep existing fallback.
  //  3) Quick API fallback for everything else.
  const requestedMode = rawMode === 'quick' ? 'quick' : 'bagrut';

  const hasStaticBagrut = hasBagrutBank(subject, topic);
  const staticBagrutQuestions = hasStaticBagrut ? getBagrutQuestions(subject, topic) : [];

  // Effective mode: if we have a static bank, always serve it.
  //                 Otherwise, downgrade bagrut→quick when no pool exists.
  let effectiveMode: 'static-bagrut' | 'bagrut' | 'quick';
  if (hasStaticBagrut) {
    effectiveMode = 'static-bagrut';
  } else if (requestedMode === 'bagrut' && poolHas(subject, topic, 'bagrut')) {
    effectiveMode = 'bagrut';
  } else {
    effectiveMode = 'quick';
  }

  const subjectLabel = SUBJECT_LABELS[subject] ?? subject;
  const lessonExists = hasLesson(subject, topic);

  const backHref = lessonExists
    ? `/practice/${subject}/${encodeURIComponent(topic)}`
    : '/practice';
  const backLabel = lessonExists ? 'חזרה לסיכום' : 'בחר נושא אחר';

  // Subtitle + header reflect what the student is actually getting.
  const isBagrutLike = effectiveMode === 'static-bagrut' || effectiveMode === 'bagrut';
  const subtitle = isBagrutLike ? 'תרגול בגרות' : 'תרגול מהיר';
  const headerLabel = isBagrutLike ? '🎯 בגרות מלאה' : '⚡ תרגול מהיר';

  return (
    <PracticeShell subtitle={subtitle} backHref={backHref} backLabel={backLabel}>
      <div className="space-y-4">
        <header className="space-y-2">
          <div className="text-xs font-black tracking-widest text-indigo-300 uppercase flex items-center gap-2">
            <span>{headerLabel}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black leading-tight">
            <span className="font-display text-slate-100">
              {topic}
            </span>
          </h1>
          {lessonExists && (
            <Link
              href={`/practice/${subject}/${encodeURIComponent(topic)}`}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>חזור לסיכום הלימודי</span>
            </Link>
          )}
        </header>

        {effectiveMode === 'static-bagrut' ? (
          <StaticBagrutExerciseView
            subject={subject}
            topic={topic}
            subjectLabel={subjectLabel}
            questions={staticBagrutQuestions}
          />
        ) : effectiveMode === 'bagrut' ? (
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
