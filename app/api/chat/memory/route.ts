/**
 * /api/chat/memory — the student's side of the tutor's memory.
 *
 * The tutor writes facts about the student during /api/chat. This route is the
 * reason that is acceptable: GET shows him everything that was written, DELETE
 * removes one fact or all of them. A model keeping durable notes on a teenager
 * that the teenager cannot read is not a feature.
 *
 * No AI call, no quota, no cost. RLS does the authorisation — every query is
 * scoped to `auth.uid()` by policy, and we scope by user_id as well so a policy
 * regression can't turn this into a read of someone else's profile.
 */

import { createClient } from '@/lib/supabase/server';
import { readFacts, writeFacts } from '@/lib/tutor-memory';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'לא מחובר' }, { status: 401 });

  return Response.json({ facts: await readFacts(supabase, user.id) });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'לא מחובר' }, { status: 401 });

  // ?text=... removes one fact; no param clears the lot. Matching on the text
  // rather than an index: the list is re-ordered on every write, so an index
  // the client read a minute ago can point at a different fact by now.
  const text = new URL(request.url).searchParams.get('text');
  const facts = await readFacts(supabase, user.id);
  const next = text ? facts.filter((f) => f.text !== text) : [];

  if (!(await writeFacts(supabase, user.id, next))) {
    return Response.json({ error: 'לא הצלחנו למחוק. נסה שוב.' }, { status: 500 });
  }
  return Response.json({ facts: next });
}
