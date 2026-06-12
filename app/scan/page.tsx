'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle, Sparkles, BookOpen, ArrowLeft, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isProUser } from '@/lib/access';
import { MathText } from '@/components/practice/MathText';
import { saveScan, compressToThumbnail, type Scan } from '@/lib/scans';

type SolveResult = {
  subject: string;
  topic: string;
  transcribedQuestion: string;
  steps: { title: string; content: string }[];
  finalAnswer: string;
};

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'free' }
  | { status: 'pro' };

export default function ScanPage() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [solving, setSolving] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Scan | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setSaved(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleSolve = async () => {
    if (!file) return;
    setSolving(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/solve-photo', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה בפתרון השאלה');
        return;
      }
      if (data.error) {
        setError(data.error);
        return;
      }
      setResult(data as SolveResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה');
    } finally {
      setSolving(false);
    }
  };

  const handleSave = async () => {
    if (!result || !file) return;
    try {
      const thumb = await compressToThumbnail(file);
      const scan = saveScan({
        subject: result.subject,
        topic: result.topic,
        transcribedQuestion: result.transcribedQuestion,
        steps: result.steps,
        finalAnswer: result.finalAnswer,
        thumbnail: thumb.base64,
        thumbnailMime: thumb.mime,
      });
      setSaved(scan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setResult(null);
    setError(null);
    setSaved(null);
  };

  // ----- Auth gates -----

  if (auth.status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </main>
    );
  }

  if (auth.status === 'unauthenticated') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="surface-premium rounded-2xl p-8 max-w-md text-center space-y-4">
          <Camera className="w-12 h-12 text-indigo-400 mx-auto" />
          <h1 className="font-display text-2xl font-black">צלמי שאלה וקבלי פתרון</h1>
          <p className="text-slate-300">יש להתחבר כדי להשתמש בפיצ׳ר.</p>
          <Link
            href={`/login?next=${encodeURIComponent('/scan')}`}
            className="inline-flex items-center gap-2 bg-gradient-to-l from-indigo-600 to-indigo-600 px-6 py-3 rounded-2xl font-bold"
          >
            התחברות
          </Link>
        </div>
      </main>
    );
  }

  if (auth.status === 'free') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="surface-premium rounded-2xl p-8 max-w-md text-center space-y-4">
          <Sparkles className="w-12 h-12 text-amber-400 mx-auto" />
          <h1 className="font-display text-2xl font-black">פיצ׳ר Pro</h1>
          <p className="text-slate-300 leading-relaxed">
            צילום שאלה והסבר מ-AI הוא חלק מ-Pro. שדרגי כדי לקבל גישה.
          </p>
          <Link
            href="/my-plan"
            className="inline-flex items-center gap-2 bg-gradient-to-l from-amber-500 to-orange-500 px-6 py-3 rounded-2xl font-bold"
          >
            פרטים על Pro
          </Link>
        </div>
      </main>
    );
  }

  // ----- Main UI (Pro user) -----

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <header className="space-y-2 mb-6">
        <div className="text-xs font-black tracking-widest text-indigo-300 uppercase flex items-center gap-2">
          <Camera className="w-3.5 h-3.5" />
          <span>צילום וניתוח</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-black leading-tight">
          <span className="font-display text-slate-100">
            צלמי שאלה. קבלי הסבר מלא.
          </span>
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          העלי תמונה של שאלת בגרות במתמטיקה, ו-AI יזהה את הנושא, יתמלל את השאלה ויפתור אותה צעד-אחר-צעד.
        </p>
      </header>

      {/* Upload area — visible only before the user picks a file */}
      {!preview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="group flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-indigo-600/20 to-indigo-600/20 border-2 border-dashed border-indigo-400/40 hover:border-indigo-400/80 rounded-2xl py-10 px-6 transition-all"
          >
            <Camera className="w-10 h-10 text-indigo-300 group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <div className="font-black text-base">צלמי עכשיו</div>
              <div className="text-xs text-slate-400 mt-1">פתיחת המצלמה</div>
            </div>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group flex flex-col items-center justify-center gap-3 bg-white/[0.03] border-2 border-dashed border-white/15 hover:border-white/30 rounded-2xl py-10 px-6 transition-all"
          >
            <Upload className="w-10 h-10 text-slate-300 group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <div className="font-black text-base">העלי מהגלריה</div>
              <div className="text-xs text-slate-400 mt-1">בחירת קובץ</div>
            </div>
          </button>
        </div>
      )}

      {/* Preview + solve button */}
      {preview && !result && (
        <div className="space-y-4 mb-6">
          <div className="relative surface-premium rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="שאלה שצולמה" className="w-full max-h-[400px] object-contain" />
            <button
              onClick={reset}
              className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 rounded-full p-2"
              aria-label="הסר"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleSolve}
            disabled={solving}
            className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/40 transition-all"
          >
            {solving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>פותר... (10-30 שניות)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>פתור את השאלה</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-100">{error}</div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-5">
          {/* Topic + subject chips */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="bg-indigo-500/15 border border-indigo-500/30 rounded-full px-3 py-1 text-xs font-bold text-indigo-200">
              📐 {result.subject === 'math5' ? 'מתמטיקה 5 יח׳' : result.subject}
            </span>
            <span className="bg-indigo-500/15 border border-indigo-500/30 rounded-full px-3 py-1 text-xs font-bold text-indigo-200">
              {result.topic}
            </span>
          </div>

          {/* Transcribed question */}
          <section className="surface-premium rounded-2xl p-5">
            <div className="text-xs font-black tracking-widest text-indigo-300 uppercase mb-2 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>השאלה</span>
            </div>
            <div className="chat-md text-sm sm:text-base leading-relaxed text-slate-100">
              <MathText>{result.transcribedQuestion}</MathText>
            </div>
          </section>

          {/* Steps */}
          <section>
            <div className="text-xs font-black tracking-widest text-emerald-300 uppercase mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>פתרון צעד-אחר-צעד</span>
            </div>
            <ol className="space-y-2">
              {result.steps.map((step, i) => (
                <li
                  key={i}
                  className="surface-premium rounded-2xl p-4 flex gap-3"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-black text-emerald-200">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-emerald-200 mb-1.5 chat-md">
                      <MathText inline>{step.title}</MathText>
                    </div>
                    <div className="chat-md text-sm text-slate-200 leading-relaxed">
                      <MathText>{step.content}</MathText>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Final answer */}
          <section className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-5">
            <div className="text-xs font-black tracking-widest text-emerald-300 uppercase mb-2 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>תשובה סופית</span>
            </div>
            <div className="chat-md text-base sm:text-lg font-bold leading-relaxed text-emerald-50">
              <MathText>{result.finalAnswer}</MathText>
            </div>
          </section>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {saved ? (
              <Link
                href="/library"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600/30 border border-emerald-500/40 rounded-2xl px-6 py-4 font-bold"
              >
                <CheckCircle className="w-5 h-5" />
                נשמר! לספרייה
                <ArrowLeft className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={handleSave}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-4 rounded-2xl font-bold transition-all"
              >
                <BookOpen className="w-5 h-5" />
                שמרי לספרייה
              </button>
            )}
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/15 px-6 py-4 rounded-2xl font-bold transition-all"
            >
              <Camera className="w-5 h-5" />
              שאלה חדשה
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav helpers when no result yet */}
      {!result && !solving && (
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-3 text-sm">
          <Link href="/library" className="text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            הספרייה שלי
          </Link>
          <Link href="/my-plan" className="text-slate-400 hover:text-slate-200 inline-flex items-center gap-1">
            חזרה לתוכנית
          </Link>
        </div>
      )}
    </main>
  );
}
