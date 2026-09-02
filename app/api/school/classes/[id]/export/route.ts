/**
 * /api/school/classes/[id]/export — the class as a spreadsheet.
 *
 * A teacher who cannot get the numbers OUT does not fully trust them: a report
 * he can put in a folder, mail to a coordinator, or paste into whatever the
 * school already runs on is the difference between a dashboard he visits and a
 * record he keeps.
 *
 * ⚠️ THE UTF-8 BOM IS NOT OPTIONAL. Excel on Windows reads a .csv without one
 * as the system codepage, and every Hebrew name comes out as mojibake — the
 * single most common way a "working" export lands on a teacher's screen as
 * gibberish. It is three bytes and it is the whole reason this file cannot be
 * a one-liner.
 *
 * ⚠️ ZERO AI. The same buildClassBoard the screen uses, serialised.
 */

import { requireClassTeacher, classRoster, jsonError } from '@/lib/school-guard';
import { buildClassBoard, type BoardAttempt } from '@/lib/class-board';

export const dynamic = 'force-dynamic';

const WINDOW_DAYS = 120;
const MAX_ROWS = 20000;

/** RFC 4180: quote everything, double the inner quotes. Hebrew is fine
 *  unquoted, but a class named 'י"א, 5 יח"ל' is not — and that is a name a
 *  teacher will type. */
function cell(v: string | number | null): string {
  if (v === null || v === undefined) return '""';
  return `"${String(v).replace(/"/g, '""')}"`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const ctx = await requireClassTeacher(request, id, false);
  if (ctx instanceof Response) return ctx;

  const [{ data: klass }, roster] = await Promise.all([
    ctx.db.from('classes').select('name, school_year').eq('id', ctx.classId).single(),
    classRoster(ctx),
  ]);

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const ids = roster.map((s) => s.id);

  const { data } = ids.length
    ? await ctx.db
        .from('attempts')
        .select('user_id, topic, sub_topic_id, correct, is_repeat, hint_used, created_at')
        .in('user_id', ids)
        .gte('created_at', since)
        .limit(MAX_ROWS)
    : { data: [] as unknown[] };

  const attempts = ((data ?? []) as Record<string, unknown>[]).map(
    (a): BoardAttempt => ({
      user_id: String(a.user_id),
      topic: String(a.topic ?? ''),
      sub_topic_id: (a.sub_topic_id as string) ?? null,
      correct: !!a.correct,
      is_repeat: !!a.is_repeat,
      hint_used: !!a.hint_used,
      created_at: String(a.created_at),
    })
  );

  const board = buildClassBoard(roster, attempts, Date.now());

  const STATE: Record<string, string> = {
    stuck: 'תקוע',
    away: 'לא נכנס',
    'no-data': 'טרם התחיל',
    active: 'בסדר',
  };

  // One column per topic the class has touched, so the sheet is the heatmap.
  const header = [
    'תלמיד',
    'מצב',
    'שליטה כללית',
    'תרגילים',
    'נמדדו',
    'ימים מאז פעילות',
    'נושא בעייתי',
    ...board.topics,
  ];

  const rows = board.students.map((s) => [
    s.name,
    STATE[s.state] ?? s.state,
    // An empty cell, never a 0. A spreadsheet that says a student who never
    // started scored zero is the same lie as a red square on the board, except
    // it gets forwarded.
    s.mastery === null ? '' : Math.round(s.mastery * 100),
    s.attempts,
    s.measured,
    s.daysSinceActive === null ? '' : s.daysSinceActive,
    s.stuck[0]?.topic ?? '',
    ...board.topics.map((t) => {
      const row = s.topics.find((x) => x.topic === t);
      return row?.mastery === null || row === undefined ? '' : Math.round(row.mastery! * 100);
    }),
  ]);

  const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');

  const name = String(klass?.name ?? 'class').replace(/[^\p{L}\p{N}_-]+/gu, '-');
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      // filename* (RFC 5987) so the Hebrew class name survives; the plain
      // `filename` is the ASCII fallback for anything that ignores it.
      'Content-Disposition': `attachment; filename="mathup-class-${stamp}.csv"; filename*=UTF-8''${encodeURIComponent(`${name}-${stamp}.csv`)}`,
      'Cache-Control': 'no-store',
    },
  });
}

export function POST(): Response {
  return jsonError('method not allowed', 405);
}
