import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Trophy,
  Target,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

// User-specific data — never cache the response.
export const dynamic = 'force-dynamic';

// Hebrew time-ago formatter using Intl. Returns strings like "לפני שעה",
// "לפני 3 ימים", "אתמול", "עכשיו".
function timeAgoHebrew(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((then - now) / 1000); // negative = past

  const rtf = new Intl.RelativeTimeFormat('he', { numeric: 'auto' });

  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(Math.round(diffSec), 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), 'day');
  if (abs < 2592000) return rtf.format(Math.round(diffSec / 604800), 'week');
  return rtf.format(Math.round(diffSec / 2592000), 'month');
}

function scoreClass(pct: number): {
  ringText: string;
  ringBg: string;
  label: string;
} {
  if (pct >= 80) {
    return {
      ringText: 'text-emerald-700',
      ringBg: 'bg-emerald-500/10 border-emerald-500/40',
      label: 'מצוין',
    };
  }
  if (pct >= 60) {
    return {
      ringText: 'text-amber-400',
      ringBg: 'bg-amber-500/10 border-amber-500/40',
      label: 'בסדר',
    };
  }
  return {
    ringText: 'text-indigo-600',
    ringBg: 'bg-indigo-500/10 border-indigo-500/40',
    label: 'יש מה לשפר',
  };
}

function BagrutLogo() {
  return (
    <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-500 to-amber-400 flex items-center justify-center shadow-xl shadow-indigo-500/50 ring-1 ring-slate-900/10">
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white drop-shadow-md">
        <path
          d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

type Session = {
  id: string;
  subject_key: string;
  subject_name: string;
  subject_emoji: string;
  topic: string;
  score: number;
  total: number;
  completed_at: string;
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware should already redirect — belt and suspenders.
  if (!user) redirect('/login?next=/history');

  const { data: sessions, error } = await supabase
    .from('practice_sessions')
    .select('id, subject_key, subject_name, subject_emoji, topic, score, total, completed_at')
    .order('completed_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[history] load failed:', error);
  }

  const list: Session[] = sessions ?? [];

  // ===== Summary stats (calculated server-side from the same dataset) =====
  const totalSessions = list.length;
  const totalQuestions = list.reduce((acc, s) => acc + s.total, 0);
  const totalCorrect = list.reduce((acc, s) => acc + s.score, 0);
  const overallPct =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <div
      className="min-h-screen text-slate-50 relative overflow-x-hidden"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/30 blur-[120px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/25 blur-[120px] animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
      </div>

      {/* Top bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-[#FDFDFB]/80 border-b border-slate-900/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <BagrutLogo />
            <div>
              <div className="text-base font-black font-display text-slate-800">
                בגרות בכיס
              </div>
              <div className="text-[10px] text-slate-600 -mt-0.5">ההיסטוריה שלי</div>
            </div>
          </Link>
          <Link
            href="/quiz"
            className="group flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-indigo-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          >
            <span>לתרגול</span>
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Heading */}
        <div className="mb-7">
          <h1 className="font-display text-3xl sm:text-4xl font-black mb-2">
            <span className="font-display text-slate-800">
              ההיסטוריה שלי 📊
            </span>
          </h1>
          <p className="text-slate-600 text-sm">כל התרגולים שעשית, מסודרים מהחדש לישן.</p>
        </div>

        {/* Summary stats */}
        {totalSessions > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-7">
            <StatCard icon={Trophy} label="תרגולים" value={String(totalSessions)} accent="from-indigo-500/15 to-indigo-500/15 border-indigo-500/30" />
            <StatCard icon={Target} label="שאלות" value={String(totalQuestions)} accent="from-amber-500/15 to-orange-500/15 border-amber-500/30" />
            <StatCard icon={TrendingUp} label="ממוצע" value={`${overallPct}%`} accent="from-emerald-500/15 to-green-500/15 border-emerald-500/30" />
          </div>
        )}

        {/* Sessions list */}
        {totalSessions === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2.5">
            {list.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
            {list.length === 50 && (
              <div className="text-center text-xs text-slate-500 pt-3">
                מציג 50 תרגולים אחרונים
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${accent} backdrop-blur-md border rounded-2xl p-4 text-center`}
    >
      <Icon className="w-4 h-4 mx-auto mb-1.5 text-slate-500" />
      <div className="text-2xl font-black mb-0.5 font-display text-slate-800">
        {value}
      </div>
      <div className="text-[11px] text-slate-700 font-bold tracking-wide">
        {label}
      </div>
    </div>
  );
}

function SessionRow({ session }: { session: Session }) {
  const pct = Math.round((session.score / session.total) * 100);
  const sc = scoreClass(pct);
  return (
    <div className="bg-slate-900/[0.03] hover:bg-slate-900/[0.04] backdrop-blur-md border border-slate-900/10 hover:border-indigo-500/40 rounded-2xl p-4 flex items-center gap-4 transition-all">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-2xl">
        {session.subject_emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-slate-800 text-sm sm:text-base truncate">
          {session.subject_name}
        </div>
        <div className="text-xs text-slate-600 truncate">{session.topic}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          {timeAgoHebrew(session.completed_at)}
        </div>
      </div>
      <div className={`text-center px-3 py-2 rounded-xl border ${sc.ringBg} min-w-[80px]`}>
        <div className={`text-xl sm:text-2xl font-black ${sc.ringText}`}>
          {session.score}/{session.total}
        </div>
        <div className={`text-[10px] font-bold ${sc.ringText} mt-0.5`}>{pct}%</div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-slate-900/[0.03] backdrop-blur-md border border-slate-900/10 rounded-3xl p-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-5 mx-auto">
        <BookOpen className="w-8 h-8 text-indigo-700" />
      </div>
      <h2 className="font-display text-xl sm:text-2xl font-black mb-2">
        <span className="font-display text-slate-800">
          עוד לא תרגלת
        </span>
      </h2>
      <p className="text-slate-600 mb-6 text-sm">
        כל תרגול שתעשה יישמר פה אוטומטית. כך תוכל לעקוב אחרי ההתקדמות שלך.
      </p>
      <Link
        href="/quiz"
        className="group inline-flex items-center gap-2 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 px-6 py-3 rounded-xl font-bold text-white shadow-xl shadow-indigo-500/40 transition-all"
      >
        <Sparkles className="w-4 h-4" />
        <span>התחל לתרגל</span>
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
