import Link from 'next/link';
import { BookOpen, MessageCircle } from 'lucide-react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { QuickExerciseView } from '@/components/practice/QuickExerciseView';
import { StaticBagrutExerciseView } from '@/components/practice/StaticBagrutExerciseView';
import { hasLesson, getBagrutQuestions, hasBagrutBank } from '@/content/lessons';

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
  const topic = decodeURIComponent(rawTopic);

  // ===== STATIC-FIRST MODE SELECTION =====
  //
  //  1) Static bagrut bank exists → render it (zero API call, multi-part,
  //     hints + solutions per part). Works for BOTH ?mode=quick and
  //     ?mode=bagrut because the static experience IS the bagrut-style
  //     practice the owner wants — no separate "quick" path needed.
  //  2) Otherwise the quick API fallback.
  //
  // There used to be a third mode: an AI-generated bagrut question served when
  // a Supabase pool existed for the topic. Its gate (`poolHas(…, 'bagrut')`)
  // read a hand-maintained table that never had a single `bagrut: true` entry,
  // so the branch could not fire. `?mode` no longer selects anything — the
  // links that carry it still work, they just land on the static bank.

  const hasStaticBagrut = hasBagrutBank(subject, topic);
  const staticBagrutQuestions = hasStaticBagrut ? getBagrutQuestions(subject, topic) : [];

  // Effective mode: if we have a static bank, always serve it.
  //                 Otherwise, downgrade bagrut→quick when no pool exists.
  const effectiveMode: 'static-bagrut' | 'quick' = hasStaticBagrut ? 'static-bagrut' : 'quick';

  const subjectLabel = SUBJECT_LABELS[subject] ?? subject;
  const lessonExists = hasLesson(subject, topic);

  const backHref = lessonExists
    ? `/practice/${subject}/${encodeURIComponent(topic)}`
    : '/practice';
  const backLabel = lessonExists ? 'חזרה לסיכום' : 'בחר נושא אחר';

  // Subtitle + header reflect what the student is actually getting.
  const isBagrutLike = effectiveMode === 'static-bagrut';
  const subtitle = isBagrutLike ? 'תרגול בגרות' : 'תרגול מהיר';
  const headerLabel = isBagrutLike ? '🎯 בגרות מלאה' : '⚡ תרגול מהיר';

  return (
    <PracticeShell subtitle={subtitle} backHref={backHref} backLabel={backLabel}>
      <div className="space-y-4">
        <header className="space-y-2">
          <div className="text-xs font-black tracking-widest text-violet-700 uppercase flex items-center gap-2">
            <span>{headerLabel}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black leading-tight">
            <span className="font-display text-slate-800">
              {topic}
            </span>
          </h1>
          {lessonExists && (
            <Link
              href={`/practice/${subject}/${encodeURIComponent(topic)}`}
              className="inline-flex items-center gap-1.5 text-xs text-violet-700 hover:text-violet-800 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>חזור לסיכום הלימודי</span>
            </Link>
          )}
          <div>
            <Link
              href={`/chat?topic=${encodeURIComponent(topic)}`}
              className="inline-flex items-center gap-1.5 text-xs text-violet-700 hover:text-violet-800 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>שאל את המורה על הנושא</span>
            </Link>
          </div>
        </header>

        {effectiveMode === 'static-bagrut' ? (
          <StaticBagrutExerciseView
            subject={subject}
            topic={topic}
            subjectLabel={subjectLabel}
            questions={staticBagrutQuestions}
          />
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
    title: `תרגול ${topic} — MathUp`,
  };
}
