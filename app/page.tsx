'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { hasPlan } from '@/lib/study-plan';
import MathUpLogo from '@/components/MathUpLogo';
import TutorMascot from '@/components/tutor/TutorMascot';
import {
  fadeUp,
  heroStagger,
  staggerContainer,
  scaleIn,
  inViewProps,
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
  Route,
  Sigma,
  Calculator,
} from 'lucide-react';
import {
  totalQuestions as bagruyotTotal,
  availableYears as bagruyotYears,
  availableTopics as bagruyotTopics,
} from '@/content/past-bagruyot';

/** Small section eyebrow label — muted indigo, calm. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-4">
      <span className="h-px w-7 bg-gradient-to-l from-violet-400/50 to-transparent" />
      <span className="text-[11px] sm:text-xs font-semibold text-violet-800 tracking-[0.22em]">
        {children}
      </span>
      <span className="h-px w-7 bg-gradient-to-r from-violet-400/50 to-transparent" />
    </div>
  );
}

/** Section heading — Lumina display face (Jakarta/Heebo), near-black ink. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 text-ink leading-[1.2]">
      {children}
    </h2>
  );
}

// `key` matches the SUBJECTS keys in app/quiz/page.tsx, which reads
// ?subject= off the URL. Without it all seven tiles pointed at a bare /quiz:
// seven links to one destination, and a student who tapped פיזיקה landed on
// a maths quiz. The tiles now deliver what their label promises.
const SUBJECTS = [
  { key: 'math5', name: 'מתמטיקה 5 יח׳', icon: Sigma, topics: 12 },
  { key: 'math4', name: 'מתמטיקה 4 יח׳', icon: Calculator, topics: 11 },
];

const PAIN_POINTS = [
  { icon: Clock, title: 'אין זמן לבזבז', desc: 'חיפוש שאלות בגרות באינטרנט לוקח שעות. אצלנו - לחיצה אחת.' },
  { icon: BookX, title: 'ספרי לימוד יקרים ומעייפים', desc: 'במקום מאות שקלים על ספרים, קבל שאלות מותאמות בחינם.' },
  { icon: HelpCircle, title: 'אין למי לשאול', desc: 'כל שאלה מגיעה עם הסבר מלא ומפורט בעברית.' },
  { icon: Zap, title: 'שעמום הורג את הריכוז', desc: 'אינטראקטיבי, מהיר וממכר - כמו משחק בטלפון.' },
];

const STEPS = [
  { num: '01', icon: BookOpen, title: 'בחר נושא', desc: 'מתמטיקה 4 ו-5 יחידות, עשרות נושאים. בחר את מה שצריך לתרגל עכשיו.' },
  { num: '02', icon: Brain, title: 'תרגל עם רמזים, לא עם פתרון מוגש', desc: 'רמזים מדורגים בכל סעיף — אתה בוחר כמה עזרה לקבל לפני שרואים את הפתרון.' },
  { num: '03', icon: Trophy, title: 'תרגל, קבל הסברים ושפר את הציון', desc: 'תשובה מיידית, הסבר מפורט, וסטטיסטיקות התקדמות.' },
];

const FAQ_ITEMS = [
  { q: 'האם זה באמת חינם?', a: 'כן, לחלוטין! כל התכונות הנוכחיות חינמיות. בעתיד נשיק חבילת Pro עם תכונות מתקדמות, אבל הליבה תישאר חינם תמיד.' },
  { q: 'מאיפה השאלות?', a: 'מנוע הבינה המלאכותית של Anthropic (Claude) מייצר את השאלות ברמת בגרות ישראלית אמיתית. הוא מאומן על תכנים אקדמיים ויודע איך נראית שאלת בגרות.' },
  { q: 'האם זה יעזור לי להשתפר בבגרות?', a: 'תרגול קבוע = שיפור מובטח. ככל שתתרגל יותר שאלות, תכיר יותר דפוסים, ותרגיש בטוח יותר ביום הבגרות עצמו.' },
  { q: 'אני צריך להירשם?', a: 'לא! פשוט לחץ על "התחל במסלול הלמידה", בחר את השאלון שלך, ותתחיל לתרגל מיידית. אין רישום, אין סיסמה, אין חיכוך.' },
  { q: 'מה קורה אם אני טועה בשאלה?', a: 'תקבל הסבר מלא בעברית - למה התשובה הנכונה היא הנכונה, ולמה התשובה שבחרת לא נכונה. כך באמת לומדים.' },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen text-slate-800 relative overflow-x-hidden">
      {/* Navbar — real glass: it sits over scrolling content, so the blur
          has something to work on and the cost is one layer, not forty. */}
      <nav className="sticky top-0 z-50 glass-card border-x-0 border-t-0 rounded-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MathUpLogo size="md" />
            <span className="font-display text-xl sm:text-2xl font-black text-ink">
              MathUp
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/roadmap"
              className="group flex items-center gap-1.5 min-h-[44px] chip-primary hover:bg-violet-200/70 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all"
              title="מסלול הלמידה"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">מסלול הלמידה</span>
            </Link>
            <Link
              href="/chat"
              className="group flex items-center gap-1.5 min-h-[44px] bg-white/70 hover:bg-white border border-white/60 hover:border-violet-500/30 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-800 transition-all"
              title="צ'אט עם המורה הפרטי"
            >
              <MessageSquare className="w-4 h-4 text-violet-500" />
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
                'linear-gradient(rgba(167,139,250,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.07) 1px, transparent 1px)',
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
                {/* violet-400/300, not indigo — the hero curve and the graph
                    paper behind it were the last of the pre-rebrand palette
                    left on the landing page. */}
                <stop stopColor="#A78BFA" stopOpacity="0" />
                <stop offset="0.5" stopColor="#C4B5FD" />
                <stop offset="1" stopColor="#A78BFA" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* The tutor greets you before the headline does. Deliberately the
            same character as the launcher and the chat: the first thing a
            student meets on the home page is the one that will sit next to
            them inside an exercise, so it arrives already familiar.
            `label`, not aria-hidden — up here it is content, not decoration. */}
        <motion.div variants={fadeUp} className="mb-5 sm:mb-6 flex justify-center">
          <TutorMascot
            variant="full"
            label="המורה הפרטי של MathUp"
            className="w-32 h-32 sm:w-40 sm:h-40"
          />
        </motion.div>

        <motion.div variants={fadeUp} className="mb-7">
          <span className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            תרגול חכם לבגרות · בעברית · בחינם
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="font-display text-5xl sm:text-7xl md:text-8xl leading-[1.05] mb-7 sm:mb-9 text-ink"
        >
          <span className="block">מתרגלים חכם,</span>
          <span className="block gradient-text">מצליחים יותר</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-lg sm:text-xl text-slate-600 max-w-xl mx-auto mb-9 sm:mb-12 leading-relaxed"
        >
          מסלול למידה מלא במתמטיקה 4 ו-5 יחידות — 15 נושאים, שאלות בגרות אמיתיות
          עם רמזים מדורגים ופתרון מלא לכל צעד.{' '}
          <br className="hidden sm:block" />
          ומורה פרטי שזמין כשנתקעים. בעברית. בחינם.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14 sm:mb-20"
        >
          <PrimaryCTA />
          <motion.a
            {...buttonTap}
            href="#how-it-works"
            className="inline-flex items-center gap-2 glass-card hover:bg-white px-6 py-4 rounded-2xl font-bold text-slate-800 transition-all"
          >
            <span>איך זה עובד?</span>
            <ChevronDown className="w-5 h-5 text-violet-500" />
          </motion.a>
        </motion.div>

        {/* Slim trust strip */}
        <motion.div
          variants={fadeUp}
          className="flex items-center justify-center gap-3 sm:gap-5 mt-12 sm:mt-14 text-sm text-slate-500"
        >
          <span><strong className="text-slate-700 font-bold">4-5</strong> יחידות</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span><strong className="text-slate-700 font-bold">15</strong> נושאים</span>
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
        <motion.div variants={fadeUp} className="text-center mb-8 sm:mb-10">
          <Eyebrow>הלב של האפליקציה</Eyebrow>
          <SectionTitle>מסלול הלמידה שלך</SectionTitle>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            מפה מסודרת שמובילה אותך שלב-אחר-שלב עד הבגרות. זו נקודת ההתחלה המומלצת.
          </p>
        </motion.div>

        {/* Featured roadmap banner — the primary path / heart of the app */}
        <motion.div variants={fadeUp} className="mb-8 sm:mb-10">
          {/* The one dark moment on the page — the logo's own aesthetic: a
              deep-indigo object with a neon cyan glow. */}
          <Link
            href="/roadmap"
            className="card-3d-strong group relative block rounded-3xl p-6 sm:p-8 bg-gradient-to-l from-[#241E7A] to-[#1E1B4B] border border-violet-500/25 shadow-xl shadow-indigo-950/25 overflow-hidden"
          >
            <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-cyan-400/15 blur-[90px] pointer-events-none" />
            <div className="relative flex items-center gap-4 sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.08] border border-cyan-400/25 flex items-center justify-center flex-shrink-0">
                <Route className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-300" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="inline-block text-[10px] font-black tracking-wide bg-white/10 border border-white/15 text-cyan-200 rounded-full px-2 py-0.5 mb-1.5">
                  מומלץ · חדש
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                  מסלול הלמידה שלי — לפי השאלון שלך
                </h3>
                <p className="text-sm sm:text-base text-white/75 leading-relaxed mt-1">
                  לומדים ← חימום ← ביסוס ← אתגר ← בגרות. חמש רמות לכל תת-נושא, עם כוכבים ומעקב התקדמות מלא.
                </p>
              </div>
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </Link>
        </motion.div>

        <motion.div variants={fadeUp} className="text-center mb-5">
          <span className="text-xs font-semibold text-slate-500 tracking-wide">או בחר דרך ספציפית</span>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <ModeCard
            href="/quiz"
            tone="indigo"
            icon={<Sparkles className="w-6 h-6" />}
            title="בחינה מהירה"
            desc="5 שאלות רב-ברירה עם הסבר מלא לכל תשובה. מצב אידיאלי לבדיקה מהירה של ידע ולסקירה לפני מבחן."
            cta="התחל בחינה"
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
            {/* A second link to /bagruyot sat here labelled "איך זה עובד?" —
                same destination as the button beside it, so the label promised
                an explanation and delivered the same page. Two buttons to one
                place is not a choice, it is noise. */}
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
              className="group glass-card rounded-2xl p-6 sm:p-8 hover:border-violet-500/40 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary-container)] border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-6 h-6 text-violet-700" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold mb-2 text-ink">{p.title}</h3>
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
              className="group relative glass-card rounded-2xl p-6 sm:p-8 hover:border-violet-500/40 transition-colors overflow-hidden"
            >
              <div className="absolute top-2 left-4 font-display text-7xl sm:text-8xl font-black text-slate-900/[0.04] select-none">
                {s.num}
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[var(--primary-container)] border border-violet-500/20 flex items-center justify-center mb-5">
                  <s.icon className="w-7 h-7 text-violet-700" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3 text-ink">{s.title}</h3>
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
          <SectionTitle>מתמטיקה, לעומק</SectionTitle>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
            4 ו-5 יחידות, לפי השאלון שלך. מקצוע אחד שנעשה כמו שצריך — מאגר בגרויות
            מתועתק, פתרונות מלאים ומורה שמלווה, במקום שבעה מקצועות עם רשימת נושאים.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
        >
          {SUBJECTS.map((s, i) => (
            <motion.div key={i} variants={scaleIn} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Link
                href={`/quiz?subject=${s.key}`}
                className="card-3d group relative glass-card rounded-2xl p-5 sm:p-6 text-center hover:border-violet-500/40 block h-full"
              >
                <div className="icon-3d mb-3 inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--primary-container)]">
                  <s.icon className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--on-primary-container)]" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="font-bold text-sm sm:text-base mb-1 text-ink">{s.name}</div>
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
            className="relative glass-card rounded-3xl p-8 hover:border-violet-500/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-violet-600" />
              <span className="text-violet-700 font-bold text-sm tracking-wide">חינמי</span>
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="font-display text-5xl font-black text-ink">₪0</span>
              <span className="text-slate-500">לתמיד</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'מתמטיקה 4 ו-5 יחידות',
                'מאגר בגרויות אמיתיות + פתרונות',
                '30 שאלות AI ביום',
                'הסברים מפורטים בעברית',
                'תוצאות וסטטיסטיקות',
                'גישה ממכל מכשיר',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-violet-500/15 border border-violet-500/35 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-violet-700" strokeWidth={3} />
                  </div>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/roadmap"
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
            className="relative bg-[var(--primary-container)]/70 border-2 border-violet-500/35 rounded-3xl p-8 shadow-xl shadow-violet-500/15 backdrop-blur-[12px]"
          >
            <div className="absolute -top-3 right-6 bg-amber-400 px-3 py-1 rounded-full text-xs font-black tracking-wide text-amber-950 shadow-lg">
              למי שרוצה 100
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="w-5 h-5 text-violet-600" />
              <span className="text-violet-700 font-bold text-sm tracking-wide">Pro</span>
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="font-display text-5xl font-black text-ink">₪129</span>
              <span className="text-sm text-slate-700">חצי שנה · כמו שיעור אחד</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'כל הלימוד, התרגול ומאגר הבגרויות — חינם, תמיד',
                'הקורס המתקדם ברמת בגרות',
                'סימולציית בגרות מלאה בזמן אמת',
                'צ\'אט ועזרת-AI ללא הגבלה',
                'מחברת טעויות ואנליטיקה מתקדמת',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-800">
                  <div className="w-5 h-5 rounded-full bg-violet-500/30 border border-violet-400/50 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-violet-800" strokeWidth={3} />
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
              className="surface-premium rounded-2xl overflow-hidden hover:border-violet-500/30 transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between gap-4 text-right hover:bg-slate-900/[0.02] transition-colors"
              >
                <span className="text-base sm:text-lg font-bold text-ink">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-violet-600 flex-shrink-0 transition-transform ${
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
          className="relative glass-card rounded-3xl p-8 sm:p-16 text-center overflow-hidden"
        >
          <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full bg-violet-400/30 blur-[110px] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-[var(--primary-container)] border border-violet-500/25 items-center justify-center mb-6">
              <Sparkles className="w-7 h-7 text-violet-600" />
            </div>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-5xl font-bold mb-4 text-ink leading-[1.2]">
              מוכן להפוך את הבגרות לקלה?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-600 text-base sm:text-xl max-w-2xl mx-auto mb-8">
              לחיצה אחת. בלי רישום. בלי כסף. בלי תירוצים.
            </motion.p>
            <motion.div variants={fadeUp}>
              <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <Link
                  href="/roadmap"
                  className="group inline-flex items-center gap-3 btn-primary px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-white text-lg"
                >
                  <Route className="w-6 h-6" />
                  <span>התחל במסלול הלמידה</span>
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
            <MathUpLogo size="sm" />
            <span className="font-display text-sm font-bold text-ink">MathUp</span>
          </div>
          <nav className="flex items-center gap-3 text-xs text-slate-600">
            <Link href="/privacy" className="inline-flex items-center min-h-[44px] px-2 hover:text-slate-800 underline-offset-2 hover:underline transition-colors">
              מדיניות פרטיות
            </Link>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <Link href="/terms" className="inline-flex items-center min-h-[44px] px-2 hover:text-slate-800 underline-offset-2 hover:underline transition-colors">
              תנאי שימוש
            </Link>
          </nav>
          <div className="text-xs text-slate-500 text-center sm:text-left">
            © 2026 MathUp · נוצר עם Claude AI של Anthropic
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
  // The icon chip keeps a per-mode tint for scanning; the CTA link is the
  // brand's ONE interactive colour everywhere (three different link colours
  // in a row read as clutter, not as identity).
  const tones = {
    indigo: { chip: 'bg-[var(--primary-container)] border-violet-500/20 text-violet-700' },
    amber: { chip: 'bg-amber-100 border-amber-400/30 text-amber-700' },
    teal: { chip: 'bg-teal-100 border-teal-500/25 text-teal-700' },
  }[tone];

  return (
    <motion.div variants={fadeUp} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className="card-3d-strong group relative glass-card hover:border-violet-500/30 rounded-3xl p-6 block h-full"
      >
        {badge && (
          <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-400/35 text-[10px] font-black tracking-wide text-amber-700">
            {badge}
          </div>
        )}
        <div className={`icon-3d w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${tones.chip}`}>
          {icon}
        </div>
        <h3 className="font-display text-xl font-bold mb-2 text-ink">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{desc}</p>
        <div className="text-[13px] font-bold flex items-center gap-1.5 text-violet-700">
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
      <div className="w-9 h-9 rounded-xl bg-[var(--primary-container)] border border-violet-500/20 flex items-center justify-center text-violet-700 mb-2 mx-auto sm:mx-0">
        {icon}
      </div>
      <div className="font-bold text-sm text-ink mb-1">{title}</div>
      <div className="text-xs text-slate-600 leading-relaxed">{body}</div>
    </div>
  );
}

/** Stat tile inside the bagruyot showcase. */
function BagruyotStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="surface-premium rounded-2xl px-3 py-4 text-center">
      <div className="font-display text-3xl sm:text-4xl font-black leading-none bg-gradient-to-l from-cyan-700 to-violet-600 bg-clip-text text-transparent tabular-nums">
        {value}
      </div>
      <div className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1.5">{label}</div>
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
      <Link href="/roadmap" className={className}>
        <Sparkles className="w-5 h-5" />
        <span className="text-lg">התחל את מסלול הלמידה</span>
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      </Link>
    );
  }

  return (
    <Link href="/roadmap" className={className}>
      <Sparkles className="w-5 h-5" />
      <span className="text-lg">{planExists ? 'המשך למסלול הלמידה' : 'התחל את מסלול הלמידה'}</span>
      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
    </Link>
  );
}

