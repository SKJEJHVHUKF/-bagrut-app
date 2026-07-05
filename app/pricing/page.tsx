'use client';

// /pricing — the conversion page. Free base vs Pro depth, three plans with
// the semi-annual "like one private lesson" anchor, and an honest feature
// comparison. Checkout wiring is deferred until a payment provider is
// chosen — CTAs currently open a waitlist (toast) so the page is live and
// sells from day one.

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check, X, Crown, Sparkles, ArrowLeft } from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  price: string;
  per: string;
  sub?: string;
  highlight?: boolean;
  badge?: string;
};

// Placeholder pricing — anchored to "≈ one private lesson". Adjust freely.
const PLANS: Plan[] = [
  { id: 'monthly', name: 'חודשי', price: '₪34.90', per: 'לחודש', sub: 'ביטול בכל עת' },
  {
    id: 'semi',
    name: 'חצי-שנתי',
    price: '₪129',
    per: 'לחצי שנה',
    sub: '≈ ₪21 לחודש · כמו שיעור פרטי אחד',
    highlight: true,
    badge: 'הכי משתלם',
  },
  { id: 'yearly', name: 'שנתי', price: '₪199', per: 'לשנה', sub: '≈ ₪17 לחודש' },
];

type Row = { label: string; free: boolean | string; pro: boolean | string };
const COMPARISON: Row[] = [
  { label: 'לימוד מודרך בכל הנושאים', free: true, pro: true },
  { label: 'תרגול מדורג + מבחן מהיר', free: true, pro: true },
  { label: 'תחזית ציון בגרות + "התמונה שלי"', free: true, pro: true },
  { label: 'צילום שאלה → פתרון מהמאגר', free: true, pro: true },
  { label: 'צ׳אט עם המורה הפרטי', free: '10 ביום', pro: 'ללא הגבלה' },
  { label: 'הקורס המתקדם ברמת בגרות', free: false, pro: true },
  { label: 'מאגר בגרויות אמיתיות + פתרונות', free: false, pro: true },
  { label: 'סימולציית בגרות מלאה בזמן אמת', free: false, pro: true },
  { label: 'עזרת-AI: "למה טעיתי", הסבר פשוט יותר', free: false, pro: true },
  { label: 'פתרון-AI לשאלה חדשה בצילום', free: false, pro: true },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Check className="w-4 h-4 text-emerald-600 mx-auto" />;
  if (v === false) return <X className="w-4 h-4 text-slate-300 mx-auto" />;
  return <span className="text-[11px] font-bold text-indigo-700">{v}</span>;
}

export default function PricingPage() {
  const [selected, setSelected] = useState('semi');

  const waitlist = () =>
    toast.success('נרשמת לרשימת ההמתנה של Pro! נעדכן אותך ברגע שייפתח 🎉', { duration: 3500 });

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-800 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-800 transition-colors">
            → חזרה הביתה
          </Link>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-[var(--accent)]/12 border border-[var(--accent)]/30 rounded-full px-4 py-1.5 text-xs font-bold text-[var(--accent)]">
            <Crown className="w-3.5 h-3.5" />
            <span>בגרות בכיס Pro</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black gradient-text">
            הלימוד תמיד חינם.
            <br />
            המאסטרי — בתשלום.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            כל השיעורים והתרגול פתוחים לכולם, בחינם, לתמיד. Pro פותח את מה שמעלה
            ציון באמת: הקורס המתקדם ברמת בגרות, מאגר הבגרויות, סימולציות ועזרת-AI
            ללא הגבלה.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`relative text-right rounded-2xl p-5 border transition-all ${
                selected === p.id
                  ? 'border-indigo-500 bg-indigo-500/[0.06] shadow-lg shadow-indigo-500/10'
                  : 'border-slate-900/10 bg-white hover:border-indigo-500/40'
              }`}
            >
              {p.badge && (
                <span className="absolute -top-2.5 right-4 bg-[var(--accent)] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  {p.badge}
                </span>
              )}
              <div className="text-sm font-black text-slate-900">{p.name}</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">{p.price}</span>
                <span className="text-[11px] text-slate-500">{p.per}</span>
              </div>
              {p.sub && <div className="text-[11px] text-indigo-700 font-bold mt-1 leading-snug">{p.sub}</div>}
            </button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={waitlist}
          className="btn-primary w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-white text-base"
        >
          <Sparkles className="w-5 h-5" />
          <span>שדרג ל-Pro — {PLANS.find((p) => p.id === selected)?.price}</span>
        </motion.button>
        <p className="text-center text-[11px] text-slate-500 -mt-4">
          התשלום ייפתח בקרוב — לחיצה תרשום אותך לרשימת ההמתנה
        </p>

        {/* Comparison */}
        <div className="surface-premium rounded-3xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] items-center px-4 py-3 border-b border-slate-900/[0.08] text-[11px] font-black text-slate-500">
            <div>מה מקבלים</div>
            <div className="w-16 text-center">חינם</div>
            <div className="w-16 text-center text-indigo-700">Pro</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-[1fr_auto_auto] items-center px-4 py-2.5 ${
                i % 2 ? 'bg-slate-900/[0.015]' : ''
              }`}
            >
              <div className="text-sm text-slate-800">{row.label}</div>
              <div className="w-16 text-center">
                <Cell v={row.free} />
              </div>
              <div className="w-16 text-center">
                <Cell v={row.pro} />
              </div>
            </div>
          ))}
        </div>

        {/* Anchor / reassurance */}
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            מורה פרטי עולה ₪120–200 לשעה. מנוי חצי-שנתי של Pro עולה כמו שיעור אחד —
            ומלווה אותך עד הבגרות, מתי שבא לך.
          </p>
          <Link
            href="/quiz"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 hover:text-indigo-800"
          >
            <span>עדיין לא בטוח? התחל בחינם</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
