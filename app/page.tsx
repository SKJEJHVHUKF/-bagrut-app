'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { hasPlan } from '@/lib/study-plan';
import {
  fadeUp,
  heroStagger,
  staggerContainer,
  scaleIn,
  inViewProps,
  cardHover,
  buttonTap,
} from '@/lib/animations';
import {
  Sparkles,
  BookOpen,
  Brain,
  Trophy,
  Clock,
  BookX,
  HelpCircle,
  Zap,
  Check,
  ChevronDown,
  Rocket,
  Gift,
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  PencilLine,
  ShieldCheck,
  Target,
  MessageSquare,
} from 'lucide-react';
import {
  totalQuestions as bagruyotTotal,
  availableYears as bagruyotYears,
  availableTopics as bagruyotTopics,
} from '@/content/past-bagruyot';

// Custom Logo Component — single indigo brand mark (no rainbow gradient).
function BagrutLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { box: 'w-8 h-8', icon: 'w-4 h-4', radius: 'rounded-xl' },
    md: { box: 'w-10 h-10', icon: 'w-5 h-5', radius: 'rounded-2xl' },
    lg: { box: 'w-16 h-16', icon: 'w-9 h-9', radius: 'rounded-3xl' },
  };
  const s = sizes[size];

  return (
    <div className={`relative ${s.box} ${s.radius} bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-600/40 ring-1 ring-slate-900/10`}>
      <svg viewBox="0 0 24 24" fill="none" className={`${s.icon} text-white`}>
        <path
          d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
          fill="currentColor"
        />
        <path
          d="M12 8L13 11L16 12L13 13L12 16L11 13L8 12L11 11L12 8Z"
          fill="rgba(255,255,255,0.45)"
        />
      </svg>
      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-300 rounded-full blur-[2px] opacity-70" />
    </div>
  );
}

/** Small section eyebrow label — muted indigo, calm. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-4">
      <span className="h-px w-7 bg-gradient-to-l from-indigo-400/50 to-transparent" />
      <span className="text-[11px] sm:text-xs font-semibold text-indigo-800 tracking-[0.22em]">
        {children}
      </span>
      <span className="h-px w-7 bg-gradient-to-r from-indigo-400/50 to-transparent" />
    </div>
  );
}

/** Section heading — serif display face (Frank Ruhl Libre), solid near-white. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 text-slate-800 leading-[1.2]">
      {children}
    </h2>
  );
}

const SUBJECTS = [
  { name: 'מתמטיקה 5 יח׳', emoji: '📐', topics: 12 },
  { name: 'מתמטיקה 4 יח׳', emoji: '🔢', topics: 11 },
  { name: 'פיזיקה', emoji: '⚛️', topics: 6 },
  { name: 'אנגלית', emoji: '🇬🇧', topics: 4 },
  { name: 'היסטוריה', emoji: '📜', topics: 5 },
  { name: 'תנ"ך', emoji: '📕', topics: 5 },
  { name: 'כימיה', emoji: '🧪', topics: 5 },
];

const PAIN_POINTS = [
  { icon: Clock, title: 'אין זמן לבזבז', desc: 'חיפוש שאלות בגרות באינטרנט לוקח שעות. אצלנו - לחיצה אחת.' },
  { icon: BookX, title: 'ספרי לימוד יקרים ומעייפים', desc: 'במקום מאות שקלים על ספרים, קבל שאלות מותאמות בחינם.' },
  { icon: HelpCircle, title: 'אין למי לשאול', desc: 'כל שאלה מגיעה עם הסבר מלא ומפורט בעברית.' },
  { icon: Zap, title: 'שעמום הורג את הריכוז', desc: 'אינטראקטיבי, מהיר וממכר - כמו משחק בטלפון.' },
];

const STEPS = [
  { num: '01', icon: BookOpen, title: 'בחר מקצוע ונושא', desc: '7 מקצועות בגרות, עשרות נושאים. בחר את מה שצריך לתרגל עכשיו.' },
  { num: '02', icon: Brain, title: 'ה-AI יוצר שאלות במיוחד בשבילך', desc: 'מנוע Claude של Anthropic מייצר שאלות ברמת בגרות אמיתית.' },
  { num: '03', icon: Trophy, title: 'תרגל, קבל הסברים ושפר את הציון', desc: 'תשובה מיידית, הסבר מפורט, וסטטיסטיקות התקדמות.' },
];

const FAQ_ITEMS = [
  { q: 'האם זה באמת חינם?', a: 'כן, לחלוטין! כל התכונות הנוכחיות חינמיות. בעתיד נשיק חבילת Pro עם תכונות מתקדמות, אבל הליבה תישאר חינם תמיד.' },
  { q: 'מאיפה השאלות?', a: 'מנוע הבינה המלאכותית של Anthropic (Claude) מייצר את השאלות ברמת בגרות ישראלית אמיתית. הוא מאומן על תכנים אקדמיים ויודע איך נראית שאלת בגרות.' },
  { q: 'האם זה יעזור לי להשתפר בבגרות?', a: 'תרגול קבוע = שיפור מובטח. ככל שתתרגל יותר שאלות, תכיר יותר דפוסים, ותרגיש בטוח יותר ביום הבגרות עצמו.' },
  { q: 'אני צריך להירשם?', a: 'לא! פשוט לחץ על "צור שאלות לבגרות", בחר מקצוע ונושא, ותתחיל לתרגל מיידית. אין רישום, אין סיסמה, אין חיכוך.' },
  { q: 'מה קורה אם אני טועה בשאלה?', a: 'תקבל הסבר מלא בעברית - למה התשובה הנכונה היא הנכונה, ולמה התשובה שבחרת לא נכונה. כך באמת לומדים.' },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div
      className="min-h-screen text-slate-800 relative overflow-x-hidden"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      {/* Hero glow accent — the global grain, vignette & depth come from body */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-12%] left-1/2 -translate-x-1/2 w-[860px] h-[520px] rounded-full bg-indigo-600/[0.08] blur-[160px]" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-[#FDFDFB]/80 border-b border-slate-900/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BagrutLogo size="md" />
            <span className="font-display text-xl sm:text-2xl font-black text-slate-800">
              בגרות בכיס
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/practice"
              className="group flex items-center gap-1.5 bg-slate-900/[0.03] hover:bg-slate-900/[0.05] border border-slate-900/10 hover:border-indigo-500/40 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-800 transition-all"
              title="תרגול מודרך"
            >
              <Target className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">תרגול מודרך</span>
            </Link>
            <Link
              href="/chat"
              className="group flex items-center gap-1.5 bg-slate-900/[0.03] hover:bg-slate-900/[0.05] border border-slate-900/10 hover:border-indigo-500/40 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-800 transition-all"
              title="צ'אט עם המורה הפרטי"
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">המורה הפרטי</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        variants={heroStagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-32 pb-24 sm:pb-32 text-center"
      >
        {/* Signature math motif — graph-paper grid + an elegant function curve */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(129,140,248,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.07) 1px, transparent 1px)',
              backgroundSize: '46px 46px',
              maskImage: 'radial-gradient(ellipse 78% 62% at 50% 30%, #000 22%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse 78% 62% at 50% 30%, #000 22%, transparent 70%)',
            }}
          />
          <svg
            className="absolute left-1/2 top-[15%] -translate-x-1/2 w-[720px] max-w-none opacity-20"
            viewBox="0 0 720 260"
            fill="none"
            aria-hidden="true"
          >
            <path d="M0 210 C 160 210, 200 50, 360 50 S 560 210, 720 50" stroke="url(#heroCurve)" strokeWidth="1.5" />
            <defs>
              <linearGradient id="heroCurve" x1="0" y1="0" x2="720" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#818CF8" stopOpacity="0" />
                <stop offset="0.5" stopColor="#A5B4FC" />
                <stop offset="1" stopColor="#818CF8" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <motion.div variants={fadeUp} className="mb-7">
          <span className="inline-flex items-center gap-2 surface-premium rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-700 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
            תרגול חכם לבגרות · בעברית · בחינם
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="font-display text-5xl sm:text-7xl md:text-8xl font-black leading-[1.05] mb-7 sm:mb-9 text-slate-900"
        >
          <span className="block">הבגרות שלך,</span>
          <span className="block text-indigo-700">בכיס שלך</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-lg sm:text-xl text-slate-600 max-w-xl mx-auto mb-9 sm:mb-12 leading-relaxed"
        >
          תרגול חכם של שאלות בגרות אמיתיות, נוצרות בזמן אמת ע&quot;י בינה מלאכותית.
          <br className="hidden sm:block" />
          הסבר מיידי לכל תשובה. בעברית. בחינם.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14 sm:mb-20"
        >
          <PrimaryCTA />
          <motion.a
            {...buttonTap}
            href="#how-it-works"
            className="inline-flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/[0.05] border border-slate-900/10 hover:border-slate-900/20 px-6 py-4 rounded-2xl font-bold text-slate-800 transition-all"
          >
            <span>איך זה עובד?</span>
            <ChevronDown className="w-5 h-5" />
          </motion.a>
        </motion.div>

        {/* Slim trust strip */}
        <motion.div
          variants={fadeUp}
          className="flex items-center justify-center gap-3 sm:gap-5 mt-12 sm:mt-14 text-sm text-slate-500"
        >
          <span><strong className="text-slate-700 font-bold">7</strong> מקצועות</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span><strong className="text-slate-700 font-bold">∞</strong> שאלות</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span><strong className="text-slate-700 font-bold">100%</strong> חינם</span>
        </motion.div>
      </motion.section>

      {/* Three modes — quiz / practice / chat */}
      <motion.section
        {...inViewProps}
        variants={staggerContainer}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20"
      >
        <motion.div variants={fadeUp} className="text-center mb-10 sm:mb-14">
          <Eyebrow>3 דרכים ללמוד</Eyebrow>
          <SectionTitle>בחר את הדרך שמתאימה לך</SectionTitle>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            כל מצב פותר בעיה שונה. אפשר לשלב ביניהם — ולעבור בין מצב לאחר תוך כדי לימוד.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <ModeCard
            href="/quiz"
            tone="indigo"
            icon={<Sparkles className="w-6 h-6" />}
            title="בחינה מהירה"
            desc="5 שאלות רב-ברירה עם הסבר מלא לכל תשובה. מצב אידיאלי לבדיקה מהירה של ידע ולסקירה לפני מבחן."
            cta="התחל בחינה"
          />
          <ModeCard
            href="/practice"
            tone="amber"
            badge="חדש"
            icon={<Target className="w-6 h-6" />}
            title="תרגול מודרך"
            desc="תרגיל אחד מעמיק עם רמזים פרוגרסיביים ופתרון צעד-אחר-צעד. מתאים ללמידה לעומק של נושא חדש או למי שתקוע."
            cta="קבל תרגיל"
          />
          <ModeCard
            href="/chat"
            tone="teal"
            icon={<MessageSquare className="w-6 h-6" />}
            title="המורה הפרטי"
            desc="צ'אט חופשי עם AI. שאל כל שאלה, בקש הסבר, פתח דיאלוג על נושא. כמו מורה פרטי שתמיד זמין."
            cta="התחל לדבר"
          />
        </motion.div>
      </motion.section>

      {/* Past Bagruyot Archive — dedicated landing section */}
      <motion.section
        {...inViewProps}
        variants={staggerContainer}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24"
      >
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/25 rounded-full px-3 py-1 mb-4">
            <span className="text-[10px] sm:text-xs font-bold tracking-wide text-amber-700">חדש · ללא AI</span>
          </div>
          <SectionTitle>מאגר בגרויות עם רמזים</SectionTitle>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            שאלות בגרות <strong className="text-slate-800 font-bold">אמיתיות</strong> מהשאלון של משרד החינוך.
            תפתור לבד, תקבל רמזים מדורגים כשנתקעת, ותראה את הפתרון רק כשאתה מוכן.
          </p>
        </div>

        <div className="surface-premium rounded-3xl p-6 sm:p-10">
          {/* Three mini-features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
            <BagruyotFeature
              icon={<PencilLine className="w-5 h-5" />}
              title="כתוב לבד"
              body="תיבת תשובה חופשית לכל סעיף — ביטוי, מספר או הוכחה."
            />
            <BagruyotFeature
              icon={<Lightbulb className="w-5 h-5" />}
              title="רמזים מדורגים"
              body="2-3 רמזים לכל סעיף. אתה בוחר עד כמה עזרה לקבל."
            />
            <BagruyotFeature
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="פתרון מלא"
              body="צעד אחר צעד, רק כשתחליט שאתה מוכן לראות."
            />
          </div>

          {/* Stats from the actual repository */}
          {bagruyotTotal() > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
              <BagruyotStat value={bagruyotTotal()} label={bagruyotTotal() === 1 ? 'שאלה' : 'שאלות'} />
              <BagruyotStat value={bagruyotYears().length} label={bagruyotYears().length === 1 ? 'שאלון' : 'שאלונים'} />
              <BagruyotStat value={bagruyotTopics().length} label={bagruyotTopics().length === 1 ? 'נושא' : 'נושאים'} />
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
            <Link
              href="/bagruyot"
              className="group inline-flex items-center gap-2 btn-primary px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-white hover:-translate-y-0.5"
            >
              <BookOpen className="w-5 h-5" />
              <span>כניסה למאגר</span>
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/bagruyot"
              className="text-sm text-slate-600 hover:text-slate-800 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>איך זה עובד?</span>
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </Link>
          </div>

          {/* Trust line */}
          <div className="mt-6 pt-6 border-t border-slate-900/[0.06] flex gap-2 items-start max-w-2xl mx-auto">
            <ShieldCheck className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
              השאלות מתועתקות מהשאלונים הרשמיים של משרד החינוך. הפתרונות והרמזים נכתבים בסגנון האפליקציה.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Pain Points */}
      <motion.section
        {...inViewProps}
        variants={staggerContainer}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24"
      >
        <motion.div variants={fadeUp} className="text-center mb-12 sm:mb-16">
          <Eyebrow>הבעיה</Eyebrow>
          <SectionTitle>כל תלמיד מכיר את זה</SectionTitle>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
            בגרות זה לחץ. מצאנו דרך להפוך את התרגול לפשוט, מהיר ואפילו מהנה.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {PAIN_POINTS.map((p, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="group surface-premium rounded-2xl p-6 sm:p-8 hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/12 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold mb-2 text-slate-800">{p.title}</h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* How it works */}
      <motion.section
        id="how-it-works"
        {...inViewProps}
        variants={staggerContainer}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24"
      >
        <motion.div variants={fadeUp} className="text-center mb-12 sm:mb-16">
          <Eyebrow>הפתרון</Eyebrow>
          <SectionTitle>3 שלבים. ככה זה עובד.</SectionTitle>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className="group relative surface-premium rounded-2xl p-6 sm:p-8 hover:border-indigo-500/40 transition-colors overflow-hidden"
            >
              <div className="absolute top-2 left-4 font-display text-7xl sm:text-8xl font-black text-slate-900/[0.04] select-none">
                {s.num}
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/12 border border-indigo-500/25 flex items-center justify-center mb-5">
                  <s.icon className="w-7 h-7 text-indigo-700" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3 text-slate-800">{s.title}</h3>
                <p className="text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Subjects */}
      <motion.section
        {...inViewProps}
        variants={staggerContainer}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24"
      >
        <motion.div variants={fadeUp} className="text-center mb-12 sm:mb-16">
          <Eyebrow>מקצועות</Eyebrow>
          <SectionTitle>7 מקצועות בגרות, מקום אחד</SectionTitle>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
            מכל המקצועות העיקריים, ברמת 5 יחידות. בקרוב יתווספו עוד.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
        >
          {SUBJECTS.map((s, i) => (
            <motion.div key={i} variants={scaleIn} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Link
                href="/quiz"
                className="card-3d group relative surface-premium rounded-2xl p-5 sm:p-6 text-center hover:border-indigo-500/40 block h-full"
              >
                <div className="icon-3d text-4xl sm:text-5xl mb-3 inline-block">{s.emoji}</div>
                <div className="font-bold text-sm sm:text-base mb-1 text-slate-800">{s.name}</div>
                <div className="text-xs text-slate-500">{s.topics} נושאים</div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Pricing */}
      <motion.section
        {...inViewProps}
        variants={staggerContainer}
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24"
      >
        <motion.div variants={fadeUp} className="text-center mb-12 sm:mb-16">
          <Eyebrow>מחיר</Eyebrow>
          <SectionTitle>חינם להתחיל. תמיד.</SectionTitle>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
            בחר את המסלול שמתאים לך. ה-Free תמיד יישאר חינם.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="relative surface-premium rounded-3xl p-8 hover:border-indigo-500/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-indigo-600" />
              <span className="text-indigo-700 font-bold text-sm tracking-wide">חינמי</span>
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="font-display text-5xl font-black text-slate-800">₪0</span>
              <span className="text-slate-500">לתמיד</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'כל 7 המקצועות',
                'שאלות AI אינסופיות',
                'הסברים מפורטים בעברית',
                'תוצאות וסטטיסטיקות',
                'גישה ממכל מכשיר',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/15 border border-indigo-500/35 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-indigo-700" strokeWidth={3} />
                  </div>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/quiz"
              className="block w-full text-center bg-slate-900/[0.04] hover:bg-slate-900/5 border border-slate-900/[0.12] px-6 py-3.5 rounded-xl font-bold text-slate-800 transition-all"
            >
              התחל עכשיו - חינם
            </Link>
          </motion.div>

          {/* Pro Tier — featured */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="relative bg-indigo-600/[0.08] border-2 border-indigo-500/40 rounded-3xl p-8 shadow-xl shadow-indigo-600/15"
          >
            <div className="absolute -top-3 right-6 bg-amber-400 px-3 py-1 rounded-full text-xs font-black tracking-wide text-amber-950 shadow-lg">
              למי שרוצה 100
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="w-5 h-5 text-indigo-700" />
              <span className="text-indigo-700 font-bold text-sm tracking-wide">Pro</span>
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="font-display text-5xl font-black text-indigo-800">₪129</span>
              <span className="text-sm text-slate-500">חצי שנה · כמו שיעור אחד</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'כל הלימוד והתרגול — חינם, תמיד',
                'הקורס המתקדם ברמת בגרות',
                'מאגר בגרויות אמיתיות + פתרונות',
                'סימולציית בגרות מלאה בזמן אמת',
                'צ\'אט ועזרת-AI ללא הגבלה',
                'מחברת טעויות ואנליטיקה מתקדמת',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-800">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/30 border border-indigo-400/50 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-indigo-800" strokeWidth={3} />
                  </div>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="block w-full text-center btn-primary px-6 py-3.5 rounded-xl font-bold text-white"
            >
              לפרטים ולמסלולים
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* FAQ */}
      <motion.section
        {...inViewProps}
        variants={staggerContainer}
        className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24"
      >
        <motion.div variants={fadeUp} className="text-center mb-12 sm:mb-16">
          <Eyebrow>שאלות נפוצות</Eyebrow>
          <SectionTitle>שאלות לפני שמתחילים?</SectionTitle>
        </motion.div>

        <motion.div variants={staggerContainer} className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="surface-premium rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between gap-4 text-right hover:bg-slate-900/[0.02] transition-colors"
              >
                <span className="text-base sm:text-lg font-bold text-slate-800">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-indigo-600 flex-shrink-0 transition-transform ${
                    openFaq === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="px-6 pb-5 text-slate-600 leading-relaxed border-t border-slate-900/[0.06] pt-4">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Final CTA */}
      <motion.section
        {...inViewProps}
        variants={staggerContainer}
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24"
      >
        <motion.div
          variants={scaleIn}
          className="relative bg-indigo-600/[0.09] border border-indigo-500/25 rounded-3xl p-8 sm:p-16 text-center overflow-hidden"
        >
          <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[400px] h-[260px] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 items-center justify-center mb-6">
              <Sparkles className="w-7 h-7 text-indigo-700" />
            </div>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-5xl font-bold mb-4 text-slate-800 leading-[1.2]">
              מוכן להפוך את הבגרות לקלה?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-600 text-base sm:text-xl max-w-2xl mx-auto mb-8">
              לחיצה אחת. בלי רישום. בלי כסף. בלי תירוצים.
            </motion.p>
            <motion.div variants={fadeUp}>
              <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <Link
                  href="/quiz"
                  className="group inline-flex items-center gap-3 btn-primary px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-white text-lg"
                >
                  <Sparkles className="w-6 h-6" />
                  <span>צור שאלות לבגרות</span>
                  <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900/[0.06] mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BagrutLogo size="sm" />
            <span className="font-display text-sm font-bold text-slate-800">בגרות בכיס</span>
          </div>
          <nav className="flex items-center gap-3 text-xs text-slate-600">
            <Link href="/privacy" className="hover:text-slate-800 underline-offset-2 hover:underline transition-colors">
              מדיניות פרטיות
            </Link>
            <span className="text-slate-600">·</span>
            <Link href="/terms" className="hover:text-slate-800 underline-offset-2 hover:underline transition-colors">
              תנאי שימוש
            </Link>
          </nav>
          <div className="text-xs text-slate-500 text-center sm:text-left">
            © 2026 בגרות בכיס · נוצר עם Claude AI של Anthropic
          </div>
        </div>
      </footer>
    </div>
  );
}

/** One of the three "ways to learn" cards — calm neutral surface with a
 *  muted, distinct accent per mode (indigo / gold / teal) for scanning. */
function ModeCard({
  href,
  tone,
  icon,
  title,
  desc,
  cta,
  badge,
}: {
  href: string;
  tone: 'indigo' | 'amber' | 'teal';
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  badge?: string;
}) {
  const tones = {
    indigo: { chip: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-700', cta: 'text-indigo-700' },
    amber: { chip: 'bg-amber-400/15 border-amber-400/30 text-amber-700', cta: 'text-amber-700' },
    teal: { chip: 'bg-teal-500/15 border-teal-500/30 text-teal-300', cta: 'text-teal-300' },
  }[tone];

  return (
    <motion.div variants={fadeUp} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className="card-3d-strong group relative surface-premium hover:border-indigo-500/40 rounded-3xl p-6 block h-full"
      >
        {badge && (
          <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-[10px] font-black tracking-wide text-amber-700">
            {badge}
          </div>
        )}
        <div className={`icon-3d w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${tones.chip}`}>
          {icon}
        </div>
        <h3 className="font-display text-xl font-bold mb-2 text-slate-800">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{desc}</p>
        <div className={`text-xs font-bold flex items-center gap-1.5 ${tones.cta}`}>
          {cta}
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        </div>
      </Link>
    </motion.div>
  );
}

/** Mini feature card inside the bagruyot showcase. */
function BagruyotFeature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="surface-premium rounded-2xl p-4 text-center sm:text-right">
      <div className="w-9 h-9 rounded-xl bg-indigo-500/12 border border-indigo-500/25 flex items-center justify-center text-indigo-700 mb-2 mx-auto sm:mx-0">
        {icon}
      </div>
      <div className="font-bold text-sm text-slate-800 mb-1">{title}</div>
      <div className="text-xs text-slate-600 leading-relaxed">{body}</div>
    </div>
  );
}

/** Stat tile inside the bagruyot showcase. */
function BagruyotStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="surface-premium rounded-xl p-3 text-center">
      <div className="font-display text-2xl sm:text-3xl font-black text-slate-800">
        {value}
      </div>
      <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

/**
 * Hero CTA — adapts to whether the visitor has a saved study plan.
 * - With plan: deep-link to /my-plan and label "המשך לתוכנית".
 * - Without plan: link to /onboarding and label "צור תוכנית אישית".
 * Renders an empty placeholder on first paint to keep the markup stable
 * for SSR; the localStorage check runs after mount.
 */
function PrimaryCTA() {
  const [planExists, setPlanExists] = useState<boolean | null>(null);

  useEffect(() => {
    setPlanExists(hasPlan());
  }, []);

  const className =
    'group relative inline-flex items-center gap-3 btn-primary px-8 py-4 rounded-2xl font-bold text-white hover:-translate-y-1';

  // SSR / first paint: render an identical-size placeholder.
  if (planExists === null) {
    return (
      <Link href="/onboarding" className={className}>
        <Sparkles className="w-5 h-5" />
        <span className="text-lg">צור תוכנית אישית</span>
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      </Link>
    );
  }

  return (
    <Link href={planExists ? '/my-plan' : '/onboarding'} className={className}>
      <Sparkles className="w-5 h-5" />
      <span className="text-lg">{planExists ? 'המשך לתוכנית שלי' : 'צור תוכנית אישית'}</span>
      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
    </Link>
  );
}

