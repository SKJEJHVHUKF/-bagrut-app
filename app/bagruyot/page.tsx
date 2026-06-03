'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, scaleIn, inViewProps, heroStagger } from '@/lib/animations';
import {
  BookOpen,
  Loader2,
  Crown,
  Lightbulb,
  CheckCircle2,
  PencilLine,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isProUser } from '@/lib/access';
import {
  ALL_PAST_BAGRUYOT,
  availableYears,
  availableTopics,
  totalQuestions,
} from '@/content/past-bagruyot';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'free' }
  | { status: 'pro' };

export default function BagruyotLandingPage() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setAuth({ status: 'unauthenticated' });
        return;
      }
      setAuth({ status: isProUser(user) ? 'pro' : 'free' });
    });
  }, []);

  if (auth.status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </main>
    );
  }

  const total = totalQuestions();
  const years = availableYears();
  const topics = availableTopics();

  const isPro = auth.status === 'pro';
  const isLoggedIn = auth.status !== 'unauthenticated';

  const sampleQuestion = ALL_PAST_BAGRUYOT[0];
  const samplePart = sampleQuestion?.parts[0];
  const extraHintsCount = samplePart?.hints ? Math.max(samplePart.hints.length - 1, 0) : 0;

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/my-plan"
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 mb-6"
      >
        ← חזרה לתוכנית הלימוד
      </Link>

      {/* Hero */}
      <motion.header
        variants={heroStagger}
        initial="hidden"
        animate="visible"
        className="space-y-3 mb-8 text-center sm:text-right"
      >
        <motion.div
          variants={fadeUp}
          className="text-xs font-black tracking-widest text-emerald-300 uppercase flex items-center gap-2 justify-center sm:justify-start"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>מאגר בגרויות</span>
        </motion.div>
        <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl font-black leading-tight">
          <span className="bg-gradient-to-l from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent">
            תרגל מבגרויות אמיתיות
          </span>
        </motion.h1>
        <motion.p variants={fadeUp} className="text-base text-slate-300 leading-relaxed max-w-2xl">
          שאלות מבגרויות עבר — מתועתקות מילה במילה מהשאלון של משרד החינוך. תפתור לבד,
          תקבל רמזים מדורגים כשתיתקע, ותראה את הפתרון המלא רק כשאתה מוכן.{' '}
          <strong className="text-white">ללא AI.</strong>
        </motion.p>
      </motion.header>

      {/* Stats strip */}
      {total > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-2 sm:gap-3 mb-8"
        >
          <motion.div variants={scaleIn}>
            <Stat value={total} label={total === 1 ? 'שאלה' : 'שאלות'} />
          </motion.div>
          <motion.div variants={scaleIn}>
            <Stat value={years.length} label={years.length === 1 ? 'שאלון' : 'שאלונים'} />
          </motion.div>
          <motion.div variants={scaleIn}>
            <Stat value={topics.length} label={topics.length === 1 ? 'נושא' : 'נושאים'} />
          </motion.div>
        </motion.div>
      )}

      {/* Feature cards — איך זה עובד */}
      <motion.section
        {...inViewProps}
        variants={staggerContainer}
        className="space-y-3 mb-8"
      >
        <motion.h2
          variants={fadeUp}
          className="text-xs font-black tracking-widest text-slate-400 uppercase"
        >
          איך זה עובד
        </motion.h2>
        <motion.div variants={fadeUp} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <FeatureCard
            icon={<PencilLine className="w-5 h-5" />}
            color="purple"
            title="כתוב את התשובה שלך"
            body="לכל סעיף — תיבת תשובה חופשית. ביטוי, מספר, או הוכחה — אתה כותב, לא מציץ."
          />
        </motion.div>
        <motion.div variants={fadeUp} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <FeatureCard
            icon={<Lightbulb className="w-5 h-5" />}
            color="amber"
            title="רמזים כשנתקעת"
            body="2-3 רמזים מדורגים לכל סעיף: הראשון עדין, האחרון כמעט מוסר את הפתרון. אתה בוחר עד כמה עזרה לקבל."
          />
        </motion.div>
        <motion.div variants={fadeUp} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <FeatureCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="emerald"
            title="פתרון מלא — מתי שאתה מוכן"
            body="צעד אחר צעד, עם הסבר ובדיקות. כשתחליט שהבנת — סגור וחזור לפתור עוד שאלה."
          />
        </motion.div>
      </motion.section>

      {/* Sample preview */}
      {samplePart && sampleQuestion && (
        <motion.section {...inViewProps} variants={staggerContainer} className="mb-8">
          <motion.h2
            variants={fadeUp}
            className="text-xs font-black tracking-widest text-slate-400 uppercase mb-3"
          >
            דוגמית
          </motion.h2>
          <motion.div
            variants={scaleIn}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                שאלון {sampleQuestion.paper}
              </span>
              <span className="bg-pink-500/15 border border-pink-500/30 rounded-full px-2 py-0.5 text-[10px] font-bold text-pink-200">
                {sampleQuestion.topic}
              </span>
              <span className="text-[10px] text-slate-400">
                {sampleQuestion.season === 'summer' ? 'קיץ' : 'חורף'} {sampleQuestion.year}
                {sampleQuestion.moed === 'a'
                  ? ' מועד א\''
                  : sampleQuestion.moed === 'b'
                    ? ' מועד ב\''
                    : sampleQuestion.moed === 'special'
                      ? ' מועד מיוחד'
                      : ''}
                {' • סעיף '}{samplePart.label}
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed line-clamp-3">{stripMath(samplePart.prompt)}</p>
            {samplePart.hints && samplePart.hints.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 flex gap-2 items-start">
                <Lightbulb className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-[10px] font-black tracking-widest text-amber-300 uppercase mb-0.5">
                    רמז 1 — לפתיחה
                  </div>
                  <p className="text-xs text-amber-50 leading-relaxed line-clamp-2">
                    {stripMath(samplePart.hints[0])}
                  </p>
                </div>
              </div>
            )}
            {extraHintsCount > 0 && (
              <div className="text-[10px] text-slate-500">+ עוד {extraHintsCount} רמזים ופתרון מלא במאגר</div>
            )}
          </motion.div>
        </motion.section>
      )}

      {/* CTA */}
      <motion.section {...inViewProps} variants={staggerContainer} className="mb-6">
        {!isLoggedIn ? (
          <motion.div variants={scaleIn} whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.2 }}>
            <Link
              href={`/login?next=${encodeURIComponent('/bagruyot/archive')}`}
              className="card-3d block bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/50 hover:border-purple-400 rounded-2xl p-5 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base sm:text-lg font-black text-white">התחבר כדי להיכנס</div>
                  <div className="text-xs text-slate-300 mt-0.5">דרושה התחברות כדי לתרגל מהמאגר</div>
                </div>
                <ArrowLeft className="w-5 h-5 text-purple-300 flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        ) : !isPro ? (
          <motion.div
            variants={scaleIn}
            className="card-3d bg-gradient-to-br from-amber-600/15 to-orange-600/15 border border-amber-500/40 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3 mb-3">
              <Crown className="w-6 h-6 text-amber-300 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-base sm:text-lg font-black text-white">מאגר בגרויות — פיצ׳ר Pro</div>
                <div className="text-xs text-slate-300 mt-0.5">
                  תרגול מהבגרויות עם רמזים ופתרונות הוא חלק מהמנוי Pro.
                </div>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
              <Link
                href="/my-plan"
                className="inline-flex items-center gap-2 bg-gradient-to-l from-amber-500 to-orange-500 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              >
                שדרג ל-Pro
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div variants={scaleIn} whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.2 }}>
            <Link
              href="/bagruyot/archive"
              className="card-3d block bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/50 hover:border-emerald-400 rounded-2xl p-5 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base sm:text-lg font-black text-white">כניסה למאגר</div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {total > 0
                      ? `${total} ${total === 1 ? 'שאלה זמינה' : 'שאלות זמינות'} עכשיו`
                      : 'המאגר עוד מתמלא'}
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-emerald-300 flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        )}
      </motion.section>

      {/* Trust line */}
      <motion.div
        {...inViewProps}
        variants={fadeUp}
        className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex gap-2.5 items-start"
      >
        <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <div className="text-[11px] text-slate-400 leading-relaxed">
          כל השאלות מתועתקות מהשאלונים הרשמיים של משרד החינוך (
          <code className="text-[10px] bg-white/5 px-1 rounded">meyda.education.gov.il</code>).
          הפתרונות והרמזים נכתבים בסגנון האפליקציה — לא מועתקים מספרי לימוד.
        </div>
      </motion.div>
    </main>
  );
}

// ============================================================
// Helpers
// ============================================================

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 text-center">
      <div className="text-2xl sm:text-3xl font-black bg-gradient-to-l from-emerald-300 to-teal-300 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  color,
  title,
  body,
}: {
  icon: React.ReactNode;
  color: 'purple' | 'amber' | 'emerald';
  title: string;
  body: string;
}) {
  const colorClasses = {
    purple: 'from-purple-600/10 to-pink-600/10 border-purple-500/30 text-purple-300',
    amber: 'from-amber-600/10 to-orange-600/10 border-amber-500/30 text-amber-300',
    emerald: 'from-emerald-600/10 to-teal-600/10 border-emerald-500/30 text-emerald-300',
  }[color];
  return (
    <div className={`bg-gradient-to-br ${colorClasses} border rounded-2xl p-4 flex gap-3`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-white">{title}</div>
        <div className="text-xs text-slate-300 mt-1 leading-relaxed">{body}</div>
      </div>
    </div>
  );
}

/** Strip LaTeX delimiters for preview text (rough — fine for short snippets). */
function stripMath(text: string): string {
  return text
    .replace(/\$\$([^$]+)\$\$/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .trim();
}
