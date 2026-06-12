'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Mail,
  Lock,
  ArrowLeft,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  Check,
} from 'lucide-react';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/quiz';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Live password strength feedback
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordValid = hasMinLength && hasLetter && hasNumber;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError('הסיסמה חייבת להיות לפחות 8 תווים, עם אותיות באנגלית וספרה');
      return;
    }

    if (!agreedToTerms) {
      setError('יש לאשר את תנאי השימוש ומדיניות הפרטיות');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('אימייל זה כבר רשום. נסה להתחבר במקום.');
      } else if (msg.includes('password')) {
        setError('הסיסמה לא עומדת בדרישות. נסה משהו חזק יותר.');
      } else if (msg.includes('email')) {
        setError('כתובת אימייל לא תקינה');
      } else {
        setError('שגיאה ביצירת חשבון. נסה שוב.');
      }
      setLoading(false);
      return;
    }

    // If Supabase already returned a session, the email-confirmation
    // requirement is OFF — go straight to the app. Otherwise show the
    // "check your inbox" success state.
    if (data.session) {
      router.refresh();
      router.push(next);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-indigo-500/10 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mb-5">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-black mb-3">
          <span className="font-display text-slate-100">
            כמעט שם!
          </span>
        </h1>
        <p className="text-slate-300 leading-relaxed mb-4">
          שלחנו לך מייל אישור ל-<span className="text-indigo-300 font-bold" dir="ltr">{email}</span>
        </p>
        <p className="text-slate-400 text-sm leading-relaxed">
          לחץ על הקישור במייל כדי להפעיל את החשבון.<br />
          (בדוק גם בתיקיית הספאם אם לא הגיע)
        </p>
        <Link
          href="/login"
          className="mt-7 inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200 font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          חזרה להתחברות
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-indigo-500/10"
    >
      <h1 className="font-display text-3xl sm:text-4xl font-black mb-2 text-center">
        <span className="font-display text-slate-100">
          הצטרף עכשיו ✨
        </span>
      </h1>
      <p className="text-slate-400 text-center mb-7">חינם. בלי כרטיס אשראי.</p>

      {/* Email */}
      <label className="block mb-4">
        <span className="block text-sm font-bold text-slate-300 mb-2">אימייל</span>
        <div className="relative">
          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full surface-premium rounded-xl pr-10 pl-3 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
            disabled={loading}
            dir="ltr"
          />
        </div>
      </label>

      {/* Password */}
      <label className="block mb-3">
        <span className="block text-sm font-bold text-slate-300 mb-2">סיסמה</span>
        <div className="relative">
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="לפחות 8 תווים"
            className="w-full surface-premium rounded-xl pr-10 pl-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
            disabled={loading}
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </label>

      {/* Password strength hints */}
      {password.length > 0 && (
        <ul className="text-xs space-y-1 mb-2">
          <li className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
            <Check className={`w-3 h-3 ${hasMinLength ? 'opacity-100' : 'opacity-30'}`} strokeWidth={3} />
            לפחות 8 תווים
          </li>
          <li className={`flex items-center gap-2 ${hasLetter ? 'text-emerald-400' : 'text-slate-500'}`}>
            <Check className={`w-3 h-3 ${hasLetter ? 'opacity-100' : 'opacity-30'}`} strokeWidth={3} />
            אות באנגלית
          </li>
          <li className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
            <Check className={`w-3 h-3 ${hasNumber ? 'opacity-100' : 'opacity-30'}`} strokeWidth={3} />
            ספרה
          </li>
        </ul>
      )}

      {/* Terms agreement */}
      <label className="flex items-start gap-2 mt-4 cursor-pointer group">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          disabled={loading}
          className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/50 cursor-pointer flex-shrink-0"
        />
        <span className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
          קראתי ואני מאשר את{' '}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 hover:text-indigo-200 font-bold underline-offset-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            תנאי השימוש
          </Link>
          {' '}ואת{' '}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 hover:text-indigo-200 font-bold underline-offset-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            מדיניות הפרטיות
          </Link>
          .
        </span>
      </label>

      {error && (
        <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !agreedToTerms}
        className="group mt-5 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3.5 rounded-xl font-bold text-white shadow-xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:-translate-y-0.5 transition-all"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>צור חשבון</span>
          </>
        )}
      </button>

      <div className="mt-6 text-center text-sm text-slate-400">
        כבר יש לך חשבון?{' '}
        <Link
          href={`/login${next !== '/quiz' ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="text-indigo-300 hover:text-indigo-200 font-bold underline-offset-2 hover:underline"
        >
          התחבר כאן
        </Link>
      </div>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen text-slate-50 relative overflow-x-hidden" style={{ fontFamily: 'var(--font-heebo), sans-serif' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/30 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/25 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      <nav className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-500 to-amber-400 flex items-center justify-center shadow-xl shadow-indigo-500/50 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white drop-shadow-md">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-xl sm:text-2xl font-black font-display text-slate-100">
            בגרות בכיס
          </span>
        </Link>
      </nav>

      <main className="relative z-10 max-w-md mx-auto px-4 sm:px-6 pt-8 pb-16">
        <Suspense fallback={<div className="text-slate-400 text-center">טוען…</div>}>
          <SignupForm />
        </Suspense>
      </main>
    </div>
  );
}
