/**
 * /p/[token] — the weekly parent link. Public, and the token IS the permission.
 *
 * Order matters: the HMAC is verified (parseParentToken) before any database
 * call, so a guessed or edited URL costs one hash and zero queries. Then the
 * student must still exist and the token's version must be the one stored in
 * app_metadata — a revoked link fails here.
 *
 * ⚠️ EVERY failure renders the same neutral page, with the same status: a
 * forged token, a revoked one, a deleted user and a database error must be
 * indistinguishable from outside, or the page becomes a way to test tokens.
 *
 * Reads with the service-role client because a parent has no session; the
 * token is scoped to exactly one user id, and that id is the only one queried.
 */

import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseParentToken, parentLinkVersion } from '@/lib/parent-link';
import { ATTEMPT_COLUMNS, WEEK_MS, buildParentWeek, toBoardAttempt, type ParentWeek } from '@/lib/parent-report';
import { WeeklyParentReport } from '@/components/parent/WeeklyParentReport';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'הדוח השבועי',
  robots: { index: false, follow: false },
  // The token is in the path; no outgoing request may carry it as a Referer.
  referrer: 'no-referrer',
};

/** A ceiling, not an expectation: two weeks (this one and the one it is
 *  compared with) would need ~140 answers a day to reach it. */
const ROW_LIMIT = 2000;

async function loadWeek(token: string): Promise<ParentWeek | null> {
  const parsed = parseParentToken(token);
  if (!parsed) return null;

  const db = createAdminClient();
  if (!db) return null;

  const { data, error } = await db.auth.admin.getUserById(parsed.userId);
  const user = data?.user;
  if (error || !user || parsed.version !== parentLinkVersion(user.app_metadata)) return null;

  const { data: rows, error: rowsError } = await db
    .from('attempts')
    .select(ATTEMPT_COLUMNS)
    .eq('user_id', user.id)
    .gte('created_at', new Date(Date.now() - 2 * WEEK_MS).toISOString())
    .order('created_at', { ascending: false })
    .limit(ROW_LIMIT);
  if (rowsError) return null;

  let name = String(user.user_metadata?.name ?? '').trim();
  if (!name) {
    const { data: member } = await db
      .from('class_members')
      .select('name')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    name = String(member?.name ?? '').trim();
  }

  return buildParentWeek({
    name: name || 'התלמיד',
    attempts: ((rows ?? []) as unknown as Record<string, unknown>[]).map(toBoardAttempt),
    // Read after the query, so no row can sit in the future of the week.
    now: Date.now(),
  });
}

export default async function ParentWeekPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const week = await loadWeek(token).catch(() => null);
  if (week) return <WeeklyParentReport week={week} />;

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="surface-premium space-y-2 rounded-2xl p-6 text-center">
        <h1 className="font-display text-2xl font-black text-ink">הקישור אינו פעיל</h1>
        <p className="text-base text-slate-700">
          ייתכן שנוצר במקומו קישור חדש. אפשר לבקש את הקישור העדכני ממי ששלח אותו.
        </p>
      </div>
    </main>
  );
}
