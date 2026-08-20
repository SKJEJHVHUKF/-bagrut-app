'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import MathUpLogo from '@/components/MathUpLogo';
import {
  Mail,
  Lock,
  ArrowLeft,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/roadmap';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      // Map common errors to friendlier Hebrew messages
      const code = signInError.message.toLowerCase();
      if (code.includes('invalid login') || code.includes('invalid credentials')) {
        setError('אימייל או סיסמה לא נכונים');
      } else if (code.includes('email not confirmed')) {
        setError('עדיין לא אישרת את האימייל. בדוק את תיבת הדואר.');
      } else {
        setError('שגיאה בהתחברות. נסה שוב.');
      }
      setLoading(false);
      return;
    }

    // Success — redirect. router.refresh() ensures the new auth cookie
    // is picked up by Server Components on the destination page.
    router.refresh();
    router.push(next);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900/[0.03] backdrop-blur-md border border-slate-900/10 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-violet-500/10"
    >
      <h1 className="font-display text-3xl sm:text-4xl font-black mb-2 text-center text-ink">
        ברוך שובך
      </h1>
      <p className="text-slate-600 text-center mb-7">התחבר כדי להתחיל לתרגל</p>

      {/* Email */}
      <label className="block mb-4">
        <span className="block text-sm font-bold text-slate-700 mb-2">אימייל</span>
        <div className="relative">
          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full surface-premium rounded-xl pr-10 pl-3 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:bg-slate-900/[0.04] transition-all"
            disabled={loading}
            dir="ltr"
          />
        </div>
      </label>

      {/* Password */}
      <label className="block mb-2">
        <span className="block text-sm font-bold text-slate-700 mb-2">סיסמה</span>
        <div className="relative">
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full surface-premium rounded-xl pr-10 pl-10 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:bg-slate-900/[0.04] transition-all"
            disabled={loading}
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </label>

      {error && (
        <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="group mt-6 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-[#241E7A] to-[#1E1B4B] border border-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3.5 rounded-xl font-bold text-white shadow-xl shadow-indigo-950/25 hover:shadow-2xl hover:shadow-indigo-950/30 hover:-translate-y-0.5 transition-all"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-cyan-300" />
            <span>התחבר</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <div className="mt-6 text-center text-sm text-slate-600">
        עדיין אין לך חשבון?{' '}
        <Link
          href={`/signup${next !== '/roadmap' ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="text-violet-700 hover:text-violet-800 font-bold underline-offset-2 hover:underline"
        >
          הירשם עכשיו
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen text-slate-900 relative overflow-x-hidden" style={{ fontFamily: 'var(--font-heebo), sans-serif' }}>
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-400/[0.07] blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-400/[0.06] blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      {/* Top bar */}
      <nav className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <MathUpLogo size="md" />
          <span className="text-xl sm:text-2xl font-black font-display text-ink">MathUp</span>
        </Link>
      </nav>

      <main className="relative z-10 max-w-md mx-auto px-4 sm:px-6 pt-8 pb-16">
        <Suspense fallback={<div className="text-slate-600 text-center">טוען…</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
