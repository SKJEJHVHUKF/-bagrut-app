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
  GraduationCap,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/quiz';

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
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-purple-500/10"
    >
      <h1 className="text-3xl sm:text-4xl font-black mb-2 text-center">
        <span className="bg-gradient-to-l from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
          ברוך שובך 👋
        </span>
      </h1>
      <p className="text-slate-400 text-center mb-7">התחבר כדי להתחיל לתרגל</p>

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
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-3 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all"
            disabled={loading}
            dir="ltr"
          />
        </div>
      </label>

      {/* Password */}
      <label className="block mb-2">
        <span className="block text-sm font-bold text-slate-300 mb-2">סיסמה</span>
        <div className="relative">
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all"
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

      {error && (
        <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="group mt-6 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3.5 rounded-xl font-bold text-white shadow-xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:-translate-y-0.5 transition-all"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>התחבר</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <div className="mt-6 text-center text-sm text-slate-400">
        עדיין אין לך חשבון?{' '}
        <Link
          href={`/signup${next !== '/quiz' ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="text-purple-300 hover:text-purple-200 font-bold underline-offset-2 hover:underline"
        >
          הירשם עכשיו
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative overflow-x-hidden" style={{ fontFamily: 'var(--font-heebo), sans-serif' }}>
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/30 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-pink-600/25 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      {/* Top bar */}
      <nav className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-xl shadow-purple-500/50 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white drop-shadow-md">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-xl sm:text-2xl font-black bg-gradient-to-l from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">
            בגרות בכיס
          </span>
        </Link>
      </nav>

      <main className="relative z-10 max-w-md mx-auto px-4 sm:px-6 pt-8 pb-16">
        <Suspense fallback={<div className="text-slate-400 text-center">טוען…</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
