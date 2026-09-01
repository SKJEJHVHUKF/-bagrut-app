import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin, isTeacher, teacherRate, teacherWeeklyHours } from '@/lib/access';
import { roadmapTopicOrder } from '@/constants/roadmapData';
import { getTopicMapping } from '@/content/bagrut-curriculum';
import TeacherDashboard from './TeacherDashboard';

// Per-teacher, and about other people's children — never cache.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'לוח המורה — MathUp',
  robots: { index: false, follow: false },
};

/**
 * The topics a task may be given in — built on the SERVER from the curriculum,
 * for two reasons.
 *
 * 1. The assignment's `topic` is matched, string for string, against
 *    `ResultEvent.topic` on every answer the student gives. A free-text field
 *    would let one typo produce a task whose progress counter sits at 0
 *    forever, with nothing on screen to say why.
 * 2. Deriving it here keeps the whole content tree (every lesson) out of the
 *    client bundle — `roadmapTopicOrder` reaches into content/lessons.
 */
function assignableTopics(): { key: string; label: string }[] {
  const keys = [...new Set([...roadmapTopicOrder('571'), ...roadmapTopicOrder('572')])];
  return keys.map((key) => ({ key, label: getTopicMapping(key)?.displayName ?? key }));
}

export default async function TeacherPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware bounces anonymous visitors; this is the role gate. A student who
  // finds the URL lands back on the app, not on someone else's progress.
  if (!user) redirect('/login?next=/teacher');

  // `?as=<teacherId>` lets the OWNER open a teacher's board — he employs these
  // teachers and pays them, so "what does his screen actually show" has to be
  // answerable without asking for his password. Admin-only, and the board says
  // whose it is; /api/teacher/* re-checks the same rule server-side.
  const { as } = await searchParams;
  const viewingAs = as && isAdmin(user) ? as : null;

  let subject = user;
  if (viewingAs && viewingAs !== user.id) {
    const admin = createAdminClient();
    const { data } = admin ? await admin.auth.admin.getUserById(viewingAs) : { data: null };
    if (!data?.user || !isTeacher(data.user)) redirect('/admin/teachers');
    subject = data.user;
  } else if (!isTeacher(user)) {
    // The owner has no board of his own — send him to the list he picks from.
    redirect(isAdmin(user) ? '/admin/teachers' : '/');
  }

  return (
    <TeacherDashboard
      name={(subject.user_metadata?.name as string) || subject.email || ''}
      rate={teacherRate(subject)}
      weeklyHours={teacherWeeklyHours(subject)}
      topics={assignableTopics()}
      viewingAs={subject.id === user.id ? null : subject.id}
    />
  );
}
