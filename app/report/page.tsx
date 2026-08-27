'use client';

// "דוח המעקב" — the screen that answers one question: where do my mistakes
// keep coming back?
//
// This is deliberately NOT /insights. That page answers "how am I doing" with
// accuracy per topic and a predicted grade — a snapshot. This one answers "what
// keeps happening to me", which is a claim over TIME and across topics, and the
// two need different evidence and different guard rails.
//
// Everything rendered here comes from lib/report.buildReport, which is pure and
// tested (scripts/test-patterns.ts). The page does no aggregation of its own on
// purpose: a report is a set of claims about a person, and a number computed
// inline in JSX is a number nothing can test.
//
// Three rules the layout enforces:
//   · every percentage is shown NEXT TO its denominator
//   · below the evidence floor the page says "עדיין נמדד", never 0
//   · a repair is called successful only against evidence gathered after it
//
// Client-side only (localStorage), so it renders after mount to avoid a
// hydration mismatch — same as /insights.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Minus,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { MathText } from '@/components/practice/MathText';
import { TAG_INFO, type PatternFinding, type Trend } from '@/lib/patterns';
import { getReport, type ReportData, type RepairOutcome } from '@/lib/report';
import { subjectsWithResults } from '@/lib/results';

const DEFAULT_SUBJECT = 'math5';

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

function daysAgo(ts: number, now: number): string {
  const d = Math.floor((now - ts) / (24 * 60 * 60 * 1000));
  if (d <= 0) return 'היום';
  if (d === 1) return 'אתמול';
  if (d < 30) return `לפני ${d} ימים`;
  const m = Math.round(d / 30);
  return m === 1 ? 'לפני חודש' : `לפני ${m} חודשים`;
}

const TREND_UI: Record<Trend, { label: string; className: string; Icon: typeof TrendingUp }> = {
  improving: { label: 'משתפר', className: 'text-emerald-700 bg-emerald-50', Icon: TrendingDown },
  worsening: { label: 'מחמיר', className: 'text-rose-700 bg-rose-50', Icon: TrendingUp },
  steady: { label: 'ללא שינוי', className: 'text-slate-600 bg-slate-100', Icon: Minus },
  unknown: { label: 'אין עדיין השוואה', className: 'text-slate-500 bg-slate-50', Icon: CircleDashed },
};

// ---------------------------------------------------------------------------

function PatternCard({ finding, total }: { finding: PatternFinding; total: number }) {
  const info = TAG_INFO[finding.tag];
  const trend = TREND_UI[finding.trend];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-black text-slate-900">{info.label}</h3>
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${trend.className}`}
        >
          <trend.Icon aria-hidden="true" className="w-3.5 h-3.5" />
          {trend.label}
        </span>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed">
        <MathText>{info.detail}</MathText>
      </p>

      {/* The claim, with its denominator attached. A bare percentage here would
          be a decoration; the student has no other way to check it. */}
      <p className="text-sm text-slate-600">
        קרה <strong className="text-slate-900">{finding.hits}</strong> פעמים, שהן{' '}
        <strong className="text-slate-900">{pct(finding.share)}</strong> מתוך {total} הטעויות
        שזוהו אצלך. הופיע ב-{finding.spread} תתי-נושא, בנושאים:{' '}
        {finding.topics.map((t) => `${t.topic} (${t.hits})`).join(', ')}.
        {finding.hitsInRepair > 0 && (
          <> מתוכן {finding.hitsInRepair} בתוך מסלולי תיקון.</>
        )}
      </p>

      <div className="rounded-xl bg-violet-50 border border-violet-100 p-3">
        <p className="text-xs font-black text-violet-900 mb-1">מה לעשות עם זה</p>
        <p className="text-sm text-violet-900 leading-relaxed">
          <MathText>{info.fix}</MathText>
        </p>
      </div>

      <p className="text-xs text-slate-500">
        לאחרונה {daysAgo(finding.lastTs, Date.now())}
      </p>
    </article>
  );
}

const REPAIR_UI: Record<
  RepairOutcome['status'],
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  held: { label: 'החזיק', className: 'text-emerald-700 bg-emerald-50 border-emerald-200', Icon: CheckCircle2 },
  relapsed: { label: 'חזר', className: 'text-rose-700 bg-rose-50 border-rose-200', Icon: RotateCcw },
  untested: { label: 'טרם נבדק', className: 'text-slate-600 bg-slate-50 border-slate-200', Icon: CircleDashed },
};

function RepairRow({ repair, now }: { repair: RepairOutcome; now: number }) {
  const ui = REPAIR_UI[repair.status];
  return (
    <li className={`rounded-xl border p-4 ${ui.className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-slate-900 truncate">{repair.title}</p>
          <p className="text-xs text-slate-600">
            {repair.topic} · תוקן {daysAgo(repair.healedAt, now)}
            {repair.repairs > 1 && ` · תוקן ${repair.repairs} פעמים`}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold">
          <ui.Icon aria-hidden="true" className="w-4 h-4" />
          {ui.label}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-700">
        {repair.since.attempts === 0
          ? 'לא פתרת כאן שאלות מאז התיקון, ולכן אין עדיין על מה לשפוט אותו.'
          : `מאז התיקון פתרת כאן ${repair.since.attempts} שאלות, ${repair.since.correct} מהן נכון.`}
      </p>
    </li>
  );
}

/**
 * The activity chart. Bars, not a line — a line implies a value between two
 * weeks, and a week with no practice has no value at all. A gap week renders as
 * an empty track, which is what actually happened.
 */
function WeeksChart({ data }: { data: ReportData }) {
  const max = Math.max(1, ...data.weeks.map((w) => w.answered));
  return (
    <div className="flex items-end gap-1.5 h-28" role="img" aria-label="פעילות שבועית">
      {data.weeks.map((w) => (
        <div key={w.ts} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex-1 flex items-end">
            {w.answered > 0 ? (
              <div
                className="w-full rounded-t bg-violet-500"
                style={{ height: `${Math.max(6, (w.answered / max) * 100)}%` }}
                title={`${w.answered} שאלות, ${pct(w.accuracy ?? 0)} נכון`}
              />
            ) : (
              <div className="w-full h-1 rounded bg-slate-200" title="לא תרגלת בשבוע הזה" />
            )}
          </div>
          <span className="text-[10px] text-slate-400">
            {w.answered || '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    // math5 is the flagship — first when present, same rule /insights applies.
    // A bare `subjects[0]` would show a math5 student their מתמטיקה 4 יח"ל
    // report purely because of which subject they happened to answer first.
    const subjects = subjectsWithResults();
    subjects.sort((a, b) => (a === DEFAULT_SUBJECT ? -1 : b === DEFAULT_SUBJECT ? 1 : 0));
    setData(getReport(subjects[0] ?? DEFAULT_SUBJECT));
  }, []);

  if (!data) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <PageHeader title="דוח המעקב" />
        <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
      </main>
    );
  }

  const { profile } = data;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <PageHeader
        title="דוח המעקב"
        description="מה חוזר על עצמו אצלך, ומה שתיקנת — האם החזיק"
      />

      {data.earlyDays ? (
        // Not an error state and not an empty state: a HONEST state. The page
        // says what it is waiting for, so the student knows it is working.
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-3">
          <Activity aria-hidden="true" className="w-10 h-10 mx-auto text-violet-500" />
          <h2 className="text-xl font-black text-slate-900">עדיין אוספים נתונים</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            פתרת עד עכשיו {data.totalAnswered} שאלות. הדוח הזה מזהה טעויות שחוזרות על עצמן בכמה
            נושאים, וכדי לומר משהו כזה בביטחון הוא צריך עוד קצת תרגול. תמשיך לתרגל והוא ימלא את עצמו
            לבד — אתה לא צריך לדווח כאן על כלום.
          </p>
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white"
          >
            למסלול הלמידה
            <ArrowLeft aria-hidden="true" className="w-4 h-4" />
          </Link>
        </section>
      ) : (
        <>
          {/* --- 1. the recurring patterns ------------------------------- */}
          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">טעויות שחוזרות אצלך</h2>
              <p className="text-sm text-slate-600">
                טעויות שהופיעו ביותר מתת-נושא אחד. זוהו אוטומטית מהתשובות עצמן.
              </p>
            </div>

            {profile.patterns.length > 0 ? (
              <div className="space-y-3">
                {profile.patterns.map((f) => (
                  <PatternCard key={f.tag} finding={f} total={profile.totalTagged} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 leading-relaxed">
                {profile.totalTagged === 0
                  ? 'עוד לא זוהתה אצלך אף טעות חוזרת. זה לא אומר שאין — זה אומר שעדיין אין מספיק תשובות כדי לקבוע.'
                  : `זוהו ${profile.totalTagged} טעויות, אבל אף אחת מהן לא חזרה על עצמה ביותר מתת-נושא אחד. זה סימן טוב: הטעויות שלך מקומיות ולא דפוס.`}
              </p>
            )}

            {profile.local.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-900 mb-1">ממוקד לתת-נושא אחד</p>
                <p className="text-sm text-slate-600">
                  {profile.local.map((f) => TAG_INFO[f.tag].label).join(', ')} — אלה חוזרות, אבל רק
                  במקום אחד. הן מטופלות דרך מסלול התיקון של אותו תת-נושא ולא כדפוס רוחבי.
                </p>
              </div>
            )}
          </section>

          {/* --- 2. weaknesses that came back ---------------------------- */}
          {data.chronic.length > 0 && (
            <section className="space-y-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">חזרו אחרי שתוקנו</h2>
                <p className="text-sm text-slate-600">
                  אלה כבר עברו מסלול תיקון, ומאז חזרו. הן מקבלות עדיפות גבוהה יותר.
                </p>
              </div>
              <ul className="space-y-2">
                {data.chronic.map((w) => (
                  <li key={w.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900">{w.title}</p>
                        <p className="text-xs text-slate-600">{w.topic}</p>
                      </div>
                      <Link
                        href={`/fix/${encodeURIComponent(w.id)}`}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <Wrench aria-hidden="true" className="w-3.5 h-3.5" />
                        תקן שוב
                      </Link>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      <MathText>{w.detail}</MathText>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* --- 3. did the repairs hold? -------------------------------- */}
          {data.repairs.length > 0 && (
            <section className="space-y-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">מה שתיקנת</h2>
                <p className="text-sm text-slate-600">
                  כל תיקון נשפט רק לפי מה שפתרת אחריו.
                </p>
              </div>
              <ul className="space-y-2">
                {data.repairs.map((r) => (
                  <RepairRow key={r.targetId} repair={r} now={data.now} />
                ))}
              </ul>
            </section>
          )}

          {/* --- 4. activity + movement ---------------------------------- */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900">הפעילות שלך</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
              <p className="text-sm text-slate-600">
                שאלות שפתרת בשמונת השבועות האחרונים. שבוע ריק הוא שבוע שלא תרגלת בו, לא ציון נמוך.
              </p>
              <WeeksChart data={data} />
            </div>

            {data.movement.some((m) => m.delta !== null) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-black text-slate-900 mb-3">
                  שינוי בדיוק — שבועיים אחרונים מול השבועיים שלפניהם
                </p>
                <ul className="space-y-2">
                  {data.movement
                    .filter((m) => m.delta !== null)
                    .map((m) => (
                      <li key={m.topic} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-700">{m.topic}</span>
                        <span className="flex items-center gap-2 text-slate-600">
                          <span className="text-xs text-slate-500">
                            {pct(m.prior!.accuracy)} ← {pct(m.recent!.accuracy)}
                          </span>
                          <strong
                            className={
                              m.delta! > 0.02
                                ? 'text-emerald-700'
                                : m.delta! < -0.02
                                  ? 'text-rose-700'
                                  : 'text-slate-500'
                            }
                          >
                            {m.delta! > 0 ? '+' : ''}
                            {Math.round(m.delta! * 100)}
                          </strong>
                        </span>
                      </li>
                    ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  מוצגים רק נושאים עם לפחות 3 שאלות בכל אחת מהתקופות.
                </p>
              </div>
            )}
          </section>

          <p className="text-xs text-slate-400 text-center">
            הדוח נבנה מ-{data.totalAnswered} תשובות שלך. לא דיווחת עליו כלום — הכול זוהה
            מהתשובות עצמן.
          </p>
        </>
      )}
    </main>
  );
}
