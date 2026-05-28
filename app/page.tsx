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
  Infinity as InfinityIcon,
  Gift,
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  PencilLine,
  ShieldCheck,
} from 'lucide-react';
import {
  totalQuestions as bagruyotTotal,
  availableYears as bagruyotYears,
  availableTopics as bagruyotTopics,
} from '@/content/past-bagruyot';

// Custom Logo Component
function BagrutLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { box: 'w-8 h-8', icon: 'w-4 h-4', radius: 'rounded-xl' },
    md: { box: 'w-10 h-10', icon: 'w-5 h-5', radius: 'rounded-2xl' },
    lg: { box: 'w-16 h-16', icon: 'w-9 h-9', radius: 'rounded-3xl' },
  };
  const s = sizes[size];

  return (
    <div className={`relative ${s.box} ${s.radius} bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-xl shadow-purple-500/50 ring-1 ring-white/20`}>
      <svg viewBox="0 0 24 24" fill="none" className={`${s.icon} text-white drop-shadow-md`}>
        {/* Main 4-point star (representing knowledge/brilliance) */}
        <path
          d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
          fill="currentColor"
        />
        {/* Inner highlight for depth */}
        <path
          d="M12 8L13 11L16 12L13 13L12 16L11 13L8 12L11 11L12 8Z"
          fill="rgba(255,255,255,0.5)"
        />
      </svg>
      {/* Small glow accent in corner */}
      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-200 rounded-full blur-[2px] opacity-80" />
    </div>
  );
}

const SUBJECTS = [
  { name: 'מתמטיקה 5 יח׳', emoji: '📐', topics: 12, color: 'from-purple-500/20 to-fuchsia-500/20', glow: 'shadow-purple-500/30' },
  { name: 'מתמטיקה 4 יח׳', emoji: '🔢', topics: 11, color: 'from-violet-500/20 to-purple-500/20', glow: 'shadow-violet-500/30' },
  { name: 'פיזיקה', emoji: '⚛️', topics: 6, color: 'from-sky-500/20 to-blue-500/20', glow: 'shadow-sky-500/30' },
  { name: 'אנגלית', emoji: '🇬🇧', topics: 4, color: 'from-orange-500/20 to-amber-500/20', glow: 'shadow-orange-500/30' },
  { name: 'היסטוריה', emoji: '📜', topics: 5, color: 'from-amber-500/20 to-yellow-500/20', glow: 'shadow-amber-500/30' },
  { name: 'תנ"ך', emoji: '📕', topics: 5, color: 'from-emerald-500/20 to-green-500/20', glow: 'shadow-emerald-500/30' },
  { name: 'כימיה', emoji: '🧪', topics: 5, color: 'from-pink-500/20 to-rose-500/20', glow: 'shadow-pink-500/30' },
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
    <div className="min-h-screen bg-slate-950 text-slate-50 relative overflow-x-hidden" style={{ fontFamily: 'var(--font-heebo), sans-serif' }}>
      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/30 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-pink-600/25 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-slate-950/60 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BagrutLogo size="md" />
            <span className="text-xl sm:text-2xl font-black bg-gradient-to-l from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">
              בגרות בכיס
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/practice"
              className="group flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all"
              title="תרגול מודרך"
            >
              <span>🎯</span>
              <span className="hidden sm:inline">תרגול מודרך</span>
            </Link>
            <Link
              href="/chat"
              className="group flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all"
              title="צ'אט עם המורה הפרטי"
            >
              <span>💬</span>
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
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-20 sm:pb-28 text-center"
      >
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-purple-500/30 rounded-full px-4 py-1.5 mb-6 sm:mb-8"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs sm:text-sm font-bold text-purple-200">מבוסס AI של Anthropic · Claude</span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-4xl sm:text-6xl md:text-7xl font-black leading-tight mb-6 sm:mb-8"
        >
          <span className="block bg-gradient-to-l from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            הבגרות שלך,
          </span>
          <span className="block bg-gradient-to-l from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            בכיס שלך
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed"
        >
          תרגול חכם של שאלות בגרות אמיתיות, נוצרות בזמן אמת ע&quot;י בינה מלאכותית.
          <br className="hidden sm:block" />
          הסבר מיידי לכל תשובה. בעברית. בחינם.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16"
        >
          <PrimaryCTA />
          <motion.a
            {...buttonTap}
            href="#how-it-works"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 px-6 py-4 rounded-2xl font-bold text-slate-200 transition-all"
          >
            <span>איך זה עובד?</span>
            <ChevronDown className="w-5 h-5" />
          </motion.a>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto"
        >
          {[
            { icon: BookOpen, value: '7', label: 'מקצועות' },
            { icon: InfinityIcon, value: '∞', label: 'שאלות' },
            { icon: Gift, value: '100%', label: 'חינם' },
          ].map((s, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              whileHover={{ y: -3 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/40 transition-all"
            >
              <s.icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl sm:text-4xl font-black bg-gradient-to-l from-white to-purple-300 bg-clip-text text-transparent">{s.value}</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1 font-semibold">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Three modes — quiz / practice / chat */}
      <motion.section
        {...inViewProps}
        variants={staggerContainer}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16"
      >
        <motion.div variants={fadeUp} className="text-center mb-8 sm:mb-12">
          <div className="inline-block text-xs sm:text-sm font-bold text-purple-400 uppercase tracking-widest mb-3">
            3 דרכים ללמוד
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mb-3">
            <span className="bg-gradient-to-l from-white to-purple-200 bg-clip-text text-transparent">
              בחר את הדרך שמתאימה לך
            </span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            כל מצב פותר בעיה שונה. אפשר לשלב ביניהם — ולעבור בין מצב לאחר תוך כדי לימוד.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-4 perspective-1500">
          {/* Quiz */}
          <motion.div variants={fadeUp} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
          <Link
            href="/quiz"
            className="card-3d-strong group bg-gradient-to-br from-purple-600/15 to-pink-600/15 backdrop-blur-md border border-purple-500/30 hover:border-purple-500/60 rounded-3xl p-6 block h-full"
          >
            <div className="icon-3d w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/40">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black mb-2">בחינה מהירה</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              5 שאלות רב-ברירה עם הסבר מלא לכל תשובה. מצב אידיאלי לבדיקה מהירה של ידע ולסקירה לפני מבחן.
            </p>
            <div className="text-xs text-purple-300 font-bold flex items-center gap-1.5">
              התחל בחינה
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </Link>
          </motion.div>

          {/* Practice — guided */}
          <motion.div variants={fadeUp} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
          <Link
            href="/practice"
            className="card-3d-strong group bg-gradient-to-br from-amber-500/15 to-orange-500/15 backdrop-blur-md border border-amber-500/30 hover:border-amber-500/60 rounded-3xl p-6 relative block h-full"
          >
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-200 uppercase tracking-wider">
              חדש
            </div>
            <div className="icon-3d w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/40">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-black mb-2">תרגול מודרך</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              תרגיל אחד מעמיק עם רמזים פרוגרסיביים ופתרון צעד-אחר-צעד. מתאים ללמידה לעומק של נושא חדש או למי שתקוע.
            </p>
            <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
              קבל תרגיל
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </Link>
          </motion.div>

          {/* Chat */}
          <motion.div variants={fadeUp} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
          <Link
            href="/chat"
            className="card-3d-strong group bg-gradient-to-br from-emerald-500/15 to-teal-500/15 backdrop-blur-md border border-emerald-500/30 hover:border-emerald-500/60 rounded-3xl p-6 block h-full"
          >
            <div className="icon-3d w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/40">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-xl font-black mb-2">המורה הפרטי</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              צ&apos;אט חופשי עם AI. שאל כל שאלה, בקש הסבר, פתח דיאלוג על נושא. כמו מורה פרטי שתמיד זמין.
            </p>
            <div className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
              התחל לדבר
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </Link>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Past Bagruyot Archive — dedicated landing section */}
      <motion.section
        {...inViewProps}
        variants={staggerContainer}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24"
      >
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 mb-4">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-300">חדש · ללא AI</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black mb-4">
            <span className="bg-gradient-to-l from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent">
              מאגר בגרויות עם רמזים
            </span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            שאלות בגרות <strong className="text-emerald-200">אמיתיות</strong> מהשאלון של משרד החינוך.
            תפתור לבד, תקבל רמזים מדורגים כשנתקעת, ותראה את הפתרון רק כשאתה מוכן.
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-600/10 via-teal-600/8 to-cyan-600/5 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-6 sm:p-10">
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
              className="group inline-flex items-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-white shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              <span>כניסה למאגר</span>
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/bagruyot"
              className="text-sm text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5"
            >
              <span>איך זה עובד?</span>
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </Link>
          </div>

          {/* Trust line */}
          <div className="mt-6 pt-6 border-t border-white/5 flex gap-2 items-start max-w-2xl mx-auto">
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
          <div className="inline-block text-xs sm:text-sm font-bold text-pink-400 uppercase tracking-widest mb-3">הבעיה</div>
          <h2 className="text-3xl sm:text-5xl font-black mb-4">
            <span className="bg-gradient-to-l from-white to-pink-200 bg-clip-text text-transparent">
              כל תלמיד מכיר את זה
            </span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
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
              className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-purple-500/50 hover:bg-white/[0.07] transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <p.icon className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">{p.title}</h3>
                  <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{p.desc}</p>
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
          <div className="inline-block text-xs sm:text-sm font-bold text-purple-400 uppercase tracking-widest mb-3">הפתרון</div>
          <h2 className="text-3xl sm:text-5xl font-black mb-4">
            <span className="bg-gradient-to-l from-white to-purple-200 bg-clip-text text-transparent">
              3 שלבים. ככה זה עובד.
            </span>
          </h2>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-purple-500/50 hover:bg-white/[0.07] transition-colors overflow-hidden"
            >
              <div className="absolute top-2 left-4 text-7xl sm:text-8xl font-black text-white/[0.04] select-none">
                {s.num}
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-5 shadow-lg shadow-purple-500/40 group-hover:scale-110 transition-transform">
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-slate-400 leading-relaxed">{s.desc}</p>
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
          <div className="inline-block text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-widest mb-3">מקצועות</div>
          <h2 className="text-3xl sm:text-5xl font-black mb-4">
            <span className="bg-gradient-to-l from-white to-amber-200 bg-clip-text text-transparent">
              7 מקצועות בגרות, מקום אחד
            </span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            מכל המקצועות העיקריים, ברמת 5 יחידות. בקרוב יתווספו עוד.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 perspective-1500"
        >
          {SUBJECTS.map((s, i) => (
            <motion.div key={i} variants={scaleIn} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Link
                href="/quiz"
                className={`card-3d group relative bg-gradient-to-br ${s.color} backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-6 text-center hover:border-white/30 ${s.glow} block h-full`}
              >
                <div className="icon-3d text-4xl sm:text-5xl mb-3 inline-block">{s.emoji}</div>
                <div className="font-bold text-sm sm:text-base mb-1">{s.name}</div>
                <div className="text-xs text-slate-400">{s.topics} נושאים</div>
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
          <div className="inline-block text-xs sm:text-sm font-bold text-emerald-400 uppercase tracking-widest mb-3">מחיר</div>
          <h2 className="text-3xl sm:text-5xl font-black mb-4">
            <span className="bg-gradient-to-l from-white to-emerald-200 bg-clip-text text-transparent">
              חינם להתחיל. תמיד.
            </span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            בחר את המסלול שמתאים לך. ה-Free תמיד יישאר חינם.
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:border-emerald-500/40 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-bold text-sm uppercase tracking-wider">חינמי</span>
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-black">₪0</span>
              <span className="text-slate-400">לתמיד</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'כל 7 המקצועות',
                'שאלות AI אינסופיות',
                'הסברים מפורטים בעברית',
                'תוצאות וסטטיסטיקות',
                'גישה ממכל מכשיר',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" strokeWidth={3} />
                  </div>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/quiz"
              className="block w-full text-center bg-white/10 hover:bg-white/15 border border-white/20 px-6 py-3.5 rounded-xl font-bold transition-all"
            >
              התחל עכשיו - חינם
            </Link>
          </motion.div>

          {/* Pro Tier */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="relative bg-gradient-to-br from-purple-600/20 via-pink-600/15 to-amber-500/10 backdrop-blur-md border-2 border-purple-500/40 rounded-3xl p-8 shadow-2xl shadow-purple-500/20"
          >
            <div className="absolute -top-3 right-6 bg-gradient-to-l from-purple-600 to-pink-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
              בקרוב
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="w-5 h-5 text-purple-300" />
              <span className="text-purple-300 font-bold text-sm uppercase tracking-wider">Pro</span>
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-black bg-gradient-to-l from-purple-300 to-pink-300 bg-clip-text text-transparent">בהשקה</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'כל מה שכלול בחינמי',
                'שמירת היסטוריית תרגול',
                'מבחני סימולציה מלאים',
                'סטטיסטיקות וגרפי שיפור',
                'צ\'אט עם AI לעזרה אישית',
                'דוחות התקדמות שבועיים',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-purple-200" strokeWidth={3} />
                  </div>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="block w-full text-center bg-white/5 border border-purple-500/30 px-6 py-3.5 rounded-xl font-bold text-purple-200 cursor-not-allowed opacity-80"
              disabled
            >
              בקרוב · רשימת המתנה
            </button>
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
          <div className="inline-block text-xs sm:text-sm font-bold text-blue-400 uppercase tracking-widest mb-3">שאלות נפוצות</div>
          <h2 className="text-3xl sm:text-5xl font-black mb-4">
            <span className="bg-gradient-to-l from-white to-blue-200 bg-clip-text text-transparent">
              שאלות לפני שמתחילים?
            </span>
          </h2>
        </motion.div>

        <motion.div variants={staggerContainer} className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between gap-4 text-right hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-base sm:text-lg font-bold">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-purple-400 flex-shrink-0 transition-transform ${
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
                    <div className="px-6 pb-5 text-slate-300 leading-relaxed border-t border-white/5 pt-4">
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
          className="relative bg-gradient-to-br from-purple-600/30 via-pink-600/20 to-amber-500/20 backdrop-blur-md border border-purple-500/30 rounded-3xl p-8 sm:p-16 text-center overflow-hidden"
        >
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />

          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block"
            >
              <Sparkles className="w-12 h-12 text-purple-300 mx-auto mb-6" />
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-5xl font-black mb-4">
              <span className="bg-gradient-to-l from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                מוכן להפוך את הבגרות לקלה?
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-300 text-base sm:text-xl max-w-2xl mx-auto mb-8">
              לחיצה אחת. בלי רישום. בלי כסף. בלי תירוצים.
            </motion.p>
            <motion.div variants={fadeUp}>
              <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <Link
                  href="/quiz"
                  className="group inline-flex items-center gap-3 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-white text-lg shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all"
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
      <footer className="relative z-10 border-t border-white/10 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BagrutLogo size="sm" />
            <span className="text-sm font-bold text-slate-300">בגרות בכיס</span>
          </div>
          <div className="text-xs text-slate-500 text-center sm:text-left">
            © 2026 בגרות בכיס · נוצר עם Claude AI של Anthropic
          </div>
        </div>
      </footer>
    </div>
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
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center sm:text-right">
      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 mb-2 mx-auto sm:mx-0">
        {icon}
      </div>
      <div className="font-bold text-sm text-white mb-1">{title}</div>
      <div className="text-xs text-slate-400 leading-relaxed">{body}</div>
    </div>
  );
}

/** Stat tile inside the bagruyot showcase. */
function BagruyotStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 text-center">
      <div className="text-2xl sm:text-3xl font-black bg-gradient-to-l from-emerald-300 to-teal-300 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{label}</div>
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

  // SSR / first paint: render an opaque placeholder identical in size.
  if (planExists === null) {
    return (
      <Link
        href="/onboarding"
        className="group relative inline-flex items-center gap-3 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-4 rounded-2xl font-bold text-white shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:-translate-y-1 transition-all"
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-lg">צור תוכנית אישית</span>
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      </Link>
    );
  }

  return (
    <Link
      href={planExists ? '/my-plan' : '/onboarding'}
      className="group relative inline-flex items-center gap-3 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-4 rounded-2xl font-bold text-white shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:-translate-y-1 transition-all"
    >
      <Sparkles className="w-5 h-5" />
      <span className="text-lg">{planExists ? 'המשך לתוכנית שלי' : 'צור תוכנית אישית'}</span>
      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
    </Link>
  );
}
