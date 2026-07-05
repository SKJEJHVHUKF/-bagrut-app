import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdvancedCourse } from '@/content/advanced-courses';
import { AdvancedCourseView } from '@/components/advanced/AdvancedCourseView';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { createClient } from '@/lib/supabase/server';
import { isProUser } from '@/lib/access';

// Server component: loads the static advanced course and hands it to the
// client view. Data is JSON-serialisable (no closures) so it crosses the
// server→client boundary safely. Route is under /learn — already in the
// middleware's PROTECTED_PREFIXES.
//
// PRO GATE: the advanced (bagrut-mastery) course is the premium anchor —
// the base learning path stays free for everyone, but the mastery course
// is Pro. Free users see a targeted paywall instead.
export default async function AdvancedCoursePage({
  params,
}: {
  params: Promise<{ subject: string; topic: string }>;
}) {
  const { subject, topic: rawTopic } = await params;
  const topic = decodeURIComponent(rawTopic);
  const course = getAdvancedCourse(subject, topic);

  if (!course) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isProUser(user)) {
    return (
      <PracticeShell
        subtitle="קורס מתקדם · רמת בגרות"
        backHref={`/learn/${subject}/${encodeURIComponent(topic)}`}
        backLabel="לקורס הבסיס"
      >
        <div className="max-w-lg mx-auto surface-premium rounded-3xl p-8 text-center space-y-4">
          <div className="text-4xl">👑</div>
          <h1 className="font-display text-2xl font-black text-slate-900">
            הקורס המתקדם — פיצ׳ר Pro
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            קורס הבסיס בנושא <b>{topic}</b> נשאר חינם ופתוח. הקורס המתקדם ברמת בגרות —
            תבניות השאלות, טכניקות מתקדמות, בגרויות מפורקות עם מחוון, מלכודות וסימולציה
            מתוזמנת — פתוח למנויי Pro.
          </p>
          <Link
            href="/pricing"
            className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-white"
          >
            לפרטים ולמסלולים
          </Link>
          <div className="pt-1">
            <Link
              href={`/learn/${subject}/${encodeURIComponent(topic)}`}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              → חזרה לקורס הבסיס (חינם)
            </Link>
          </div>
        </div>
      </PracticeShell>
    );
  }

  return (
    <PracticeShell
      subtitle="קורס מתקדם · רמת בגרות"
      backHref={`/learn/${subject}/${encodeURIComponent(topic)}`}
      backLabel="לקורס הבסיס"
    >
      <AdvancedCourseView course={course} />
    </PracticeShell>
  );
}

export function generateMetadata({ params }: { params: { topic?: string } }) {
  const topic = params.topic ? decodeURIComponent(params.topic) : '';
  return {
    title: `${topic} — קורס מתקדם · בגרות בכיס`,
    description: `קורס מתקדם ברמת בגרות בנושא ${topic}: תבניות, טכניקות, מחוון וסימולציה`,
  };
}
