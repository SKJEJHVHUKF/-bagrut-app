'use client';

/**
 * panels.tsx — the class overview's building blocks, each a Panel.
 *
 * Extracted from the old single-screen board so the five console sections can
 * compose them: the overview shows all four, the focus section shows only the
 * focus list, the roster shows none of them. Every number still comes from
 * lib/class-board; nothing here decides.
 */

import Link from 'next/link';
import { AlertTriangle, Clock, UserPlus, LifeBuoy, Repeat, ClipboardCheck, Grid3x3 } from 'lucide-react';
import type { AttentionRow, ClassBoard, StudentRow } from '@/lib/class-board';
import { masteryCell, MASTERY_LEGEND } from '@/lib/mastery-scale';
import { useClass, type FocusRow } from '@/components/console/ClassContext';
import { Panel, Empty, Btn } from '@/components/console/Panel';

// ---------------------------------------------------------------- helpers

/** "2026-09-10" -> "יום ה׳, 10.9" — an ISO date inside a Hebrew sentence wraps
 *  onto two lines and reads as a serial number. */
export function hebDate(iso: string | null): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(`${iso}T12:00:00Z`);
  const day = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת'][d.getUTCDay()];
  return `יום ${day}, ${Number(m[3])}.${Number(m[2])}`;
}

export function agoLabel(days: number | null): string {
  if (days === null) return '—';
  if (days <= 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days === 2) return 'שלשום';
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 14) return 'לפני שבוע';
  return `לפני ${Math.floor(days / 7)} שבועות`;
}

/** A thin track: the value is the mark, the rail is recessive. */
export function Meter({ value, tone = 'neutral' }: { value: number; tone?: 'good' | 'bad' | 'neutral' }) {
  const cls =
    tone === 'bad'
      ? 'bg-orange-500'
      : tone === 'good'
        ? 'bg-teal-600'
        : 'bg-slate-700 dark:bg-slate-300';
  return (
    <span className="inline-block h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 align-middle dark:bg-slate-800">
      <span
        className={`block h-full rounded-full ${cls}`}
        style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }}
      />
    </span>
  );
}

export const STATE_STYLE: Record<
  StudentRow['state'],
  { label: string; cls: string; Icon: typeof Clock }
> = {
  stuck: {
    label: 'תקוע',
    cls: 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-200',
    Icon: AlertTriangle,
  },
  away: {
    label: 'לא נכנס',
    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200',
    Icon: Clock,
  },
  'no-data': {
    label: 'טרם התחיל',
    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    Icon: UserPlus,
  },
  active: {
    label: 'בסדר',
    cls: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-200',
    Icon: Clock,
  },
};

export function StateChip({ state }: { state: StudentRow['state'] }) {
  const s = STATE_STYLE[state];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${s.cls}`}
    >
      <s.Icon className="h-3 w-3" aria-hidden />
      {s.label}
    </span>
  );
}

/** The console's row-level table style: dense, ruled, hover-lit. */
export const th = 'px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400';
export const td = 'px-4 py-2.5 text-sm';

// ---------------------------------------------------------------- KPI strip

/** Four scalars with no shared axis — tiles, never a chart. The alert tone is
 *  on the one that costs the teacher time. */
export function KpiStrip({ board }: { board: ClassBoard }) {
  const scored = board.students.map((s) => s.mastery).filter((m): m is number => m !== null);
  const avg = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null;
  const tiles: { label: string; value: string; hint?: string; alert?: boolean }[] = [
    {
      label: 'צריכים אותך',
      value: String(board.needsAttention.length),
      alert: board.needsAttention.length > 0,
      hint: 'תקועים, נעלמו, או טרם התחילו',
    },
    { label: 'פעילים השבוע', value: `${board.activeThisWeek} / ${board.studentCount}` },
    {
      label: 'שליטה ממוצעת',
      value: avg === null ? '—' : `${Math.round(avg * 100)}%`,
      hint: 'ממוצע לפי תלמיד, בלי מי שלא התחיל',
    },
    { label: 'טרם התחילו', value: String(board.neverStarted) },
  ];
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-800">
      {tiles.map((t) => (
        <div
          key={t.label}
          title={t.hint}
          className={`px-4 py-3 ${
            t.alert ? 'bg-rose-50 dark:bg-rose-950/40' : 'bg-white dark:bg-slate-900'
          }`}
        >
          <div
            className={`font-mono text-2xl leading-none font-semibold tabular-nums ${
              t.alert ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-slate-50'
            }`}
          >
            {t.value}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{t.label}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- attention

export function AttentionPanel({ rows }: { rows: AttentionRow[] }) {
  const { showStudentById, openFocus, isDemo } = useClass();
  return (
    <Panel
      icon={LifeBuoy}
      title="מי צריך אותך"
      blurb="תלמידים שמשהו אצלם דורש התערבות השבוע — תקועים, נעלמו, או שעדיין לא התחילו."
      count={rows.length}
      flush
    >
      {rows.length === 0 ? (
        <Empty>אף אחד לא דורש התייחסות מיוחדת השבוע.</Empty>
      ) : (
        <table className="w-full">
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r) => (
              <tr key={r.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className={`${td} w-24`}>
                  <StateChip state={r.state} />
                </td>
                <td className={`${td} w-32`}>
                  <button
                    type="button"
                    onClick={() => showStudentById(r.studentId)}
                    className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-50"
                  >
                    {r.name}
                  </button>
                </td>
                <td className={`${td} text-slate-600 dark:text-slate-400`}>{r.reason}</td>
                <td className={`${td} w-40 text-end`}>
                  <span className="inline-flex gap-1.5">
                    <Btn kind="ghost" onClick={() => showStudentById(r.studentId)}>
                      כרטיס
                    </Btn>
                    {!isDemo && (
                      <Btn
                        kind="primary"
                        onClick={() => openFocus({ studentId: r.studentId, name: r.name })}
                      >
                        מקד
                      </Btn>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- reteach

export function ReteachPanel({ rows }: { rows: ClassBoard['reteach'] }) {
  const { openFocus, isDemo } = useClass();
  return (
    <Panel
      icon={Repeat}
      title="מה ללמד שוב"
      blurb="נושאים שרוב הכיתה נופלת בהם. כשכל הכיתה נכשלת באותו מקום, זה שיעור — לא תלמיד."
      count={rows.length}
      flush
    >
      {rows.length === 0 ? (
        <Empty>אין נושא שהכיתה כולה נופלת בו.</Empty>
      ) : (
        <table className="w-full">
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r) => (
              <tr key={r.topic} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className={`${td} w-40 font-semibold text-slate-900 dark:text-slate-50`}>
                  {r.topic}
                </td>
                <td className={`${td} w-44`}>
                  <Meter value={r.mastery} tone="bad" />
                  <span className="ms-2 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                    {Math.round(r.mastery * 100)}%
                  </span>
                </td>
                <td className={`${td} text-slate-600 dark:text-slate-400`}>
                  {r.belowHalf} מתוך {r.measuredStudents} תלמידים מתחת לחצי
                </td>
                <td className={`${td} w-32 text-end`}>
                  {!isDemo && (
                    <Btn kind="primary" onClick={() => openFocus('class')}>
                      מקד את הכיתה
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- focuses

export function FocusListPanel({
  rows,
  actions,
}: {
  rows: FocusRow[];
  actions?: React.ReactNode;
}) {
  return (
    <Panel
      icon={ClipboardCheck}
      title="מיקודים"
      blurb="מה ששלחת לתרגל, למי, וכמה באמת סגרו את זה."
      count={rows.length}
      actions={actions}
      flush
    >
      {rows.length === 0 ? (
        <Empty>עוד לא שלחת מיקוד. אפשר להתחיל מ״מי צריך אותך״.</Empty>
      ) : (
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-950/50">
            <tr>
              <th className={`${th} text-start`}>למי</th>
              <th className={`${th} text-start`}>מה</th>
              <th className={`${th} text-start`}>עד מתי</th>
              <th className={`${th} text-start`}>סגרו</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((f) => {
              const pct = f.totalCount > 0 ? f.done / f.totalCount : 0;
              return (
                <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className={`${td} w-32 font-semibold text-slate-900 dark:text-slate-50`}>
                    {f.targetedCount === null ? 'כל הכיתה' : `${f.targetedCount} תלמידים`}
                  </td>
                  <td className={`${td} text-slate-700 dark:text-slate-300`}>
                    {f.label}
                    {f.targetCount ? (
                      <span className="text-slate-400"> · {f.targetCount} תרגילים</span>
                    ) : null}
                    {f.note && (
                      <span className="block text-xs text-slate-400">{f.note}</span>
                    )}
                  </td>
                  <td className={`${td} w-36 whitespace-nowrap text-slate-600 dark:text-slate-400`}>
                    {hebDate(f.dueOn) ?? '—'}
                  </td>
                  <td className={`${td} w-44 whitespace-nowrap`}>
                    <Meter value={pct} tone={pct >= 0.75 ? 'good' : 'neutral'} />
                    <span className="ms-2 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                      {f.done}/{f.totalCount}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- heatmap

const NO_DATA_CELL =
  'border border-dashed border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600';

export function HeatmapPanel({ board, windowDays }: { board: ClassBoard; windowDays: number }) {
  const { showStudent } = useClass();
  if (board.topics.length === 0) {
    return (
      <Panel icon={Grid3x3} title="כל התלמידים">
        <Empty>אין עדיין תשובות ב-{windowDays} הימים האחרונים, אז אין מה למפות.</Empty>
      </Panel>
    );
  }
  return (
    <Panel
      icon={Grid3x3}
      title="כל התלמידים"
      blurb="אחוז השליטה של כל תלמיד בכל נושא. טור שכולו כתום — נושא ללמד מחדש; שורה שכולה כתומה — תלמיד לשיחה. לחיצה פותחת את הכרטיס."
      flush
    >
      <div className="overflow-x-auto px-4 py-3">
        <table className="mx-auto border-separate border-spacing-[3px] text-sm">
          <thead>
            <tr>
              <th className="w-28 pe-3 text-start text-xs font-medium text-slate-400">תלמיד</th>
              {board.topics.map((t) => (
                <th
                  key={t}
                  className="px-1 pb-1 text-center text-xs font-medium whitespace-nowrap text-slate-500 dark:text-slate-400"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {board.students.map((s) => (
              <tr key={s.id} className="group">
                <td className="pe-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => showStudent(s)}
                    className="text-sm font-medium text-slate-700 underline-offset-4 group-hover:text-slate-900 hover:underline dark:text-slate-300"
                  >
                    {s.name}
                  </button>
                </td>
                {board.topics.map((t) => {
                  const row = s.topics.find((x) => x.topic === t);
                  const m = row?.mastery ?? null;
                  const band = m === null ? null : masteryCell(m);
                  return (
                    <td key={t}>
                      <button
                        type="button"
                        onClick={() => showStudent(s)}
                        className={`block h-8 w-20 rounded-md text-center font-mono text-xs font-semibold tabular-nums transition hover:ring-2 hover:ring-slate-400 hover:ring-offset-1 dark:hover:ring-offset-slate-900 ${
                          band ? band.cell : NO_DATA_CELL
                        }`}
                        title={
                          m === null
                            ? `${s.name} · ${t}: אין נתונים`
                            : `${s.name} · ${t}: ${row!.correct} מתוך ${row!.measured} — ${band!.label}`
                        }
                      >
                        {m === null ? '·' : Math.round(m * 100)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          {MASTERY_LEGEND.map((b) => (
            <span key={b.label} className="flex items-center gap-1">
              <span className={`inline-block h-3 w-4 rounded ${b.cell}`} aria-hidden />
              <span className="tabular-nums">{b.label}</span>
            </span>
          ))}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-4 rounded ${NO_DATA_CELL}`} aria-hidden />
          אין נתונים — לא אפס
        </span>
        <span className="ms-auto">{windowDays} הימים האחרונים</span>
      </div>
    </Panel>
  );
}

/** A tiny link-styled action for panel headers. */
export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-xs font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline dark:text-slate-300"
    >
      {children}
    </Link>
  );
}
