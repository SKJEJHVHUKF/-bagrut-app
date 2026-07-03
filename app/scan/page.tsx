'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle, Sparkles, BookOpen, ArrowLeft, X, ShieldCheck, Zap, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isProUser } from '@/lib/access';
import { MathText } from '@/components/practice/MathText';
import { saveScan, compressToThumbnail, type Scan } from '@/lib/scans';

type SolveSource = 'library' | 'cache' | 'ai';

type SolveResult = {
  subject: string;
  topic: string;
  transcribedQuestion: string;
  steps: { title: string; content: string }[];
  finalAnswer: string;
  source?: SolveSource;
};

// The upsell shown to free users when a scan needs a NEW AI solution (not
// in the verified library or the shared cache). Carries the transcription so
// they can see we read their question.
type ProUpsell = { transcribedQuestion: string; topic: string };

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
  const [upsell, setUpsell] = useState<ProUpsell | null>(null);
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
    setUpsell(null);
    setSaved(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleSolve = async () => {
    if (!file) return;
    setSolving(true);
    setError(null);
    setResult(null);
    setUpsell(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/solve-photo', { method: 'POST', body: formData });
      const data = await res.json();
      // Free user hit a NEW question that needs an AI solve → soft upsell,
      // not a hard error. We still show them the transcription we read.
      if (res.status === 402 && data.proRequired) {
        setUpsell({ transcribedQuestion: data.transcribedQuestion ?? '', topic: data.topic ?? '' });
        return;
      }
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
    setUpsell(null);
    setSaved(null);
  };

  // ----- Auth gates -----

  if (auth.status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </main>
    );
  }

  if (auth.status === 'unauthenticated') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="surface-premium rounded-2xl p-8 max-w-md text-center space-y-4">
          <Camera className="w-12 h-12 text-indigo-600 mx-auto" />
          <h1 className="font-display text-2xl font-black">צלמי שאלה וקבלי פתרון</h1>
          <p className="text-slate-700">יש להתחבר כדי להשתמש בפיצ׳ר.</p>
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

  // ----- Main UI (any logged-in user; free users get library/cache hits
  //       for free, and a soft upsell only when a NEW AI solve is needed) -----

  const isPro = auth.status === 'pro';

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      {/* ===== INTRO / LANDING — shown before a photo is picked ===== */}
      {!preview && !result && (
        <section className="mb-8 space-y-5">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-1.5 text-xs font-bold text-indigo-800">
              <Camera className="w-3.5 h-3.5" />
              <span>צילום שאלה → פתרון מלא</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black leading-tight">
              <span className="gradient-text">תקוע בשאלה? צלם אותה.</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg mx-auto">
              מצלמים כל שאלת מתמטיקה — מהמחברת, מספר הלימוד או ממבחן — ומקבלים
              פתרון מלא צעד-אחר-שלב, בעברית, עם התשובה הסופית המדויקת.
            </p>
          </div>

          {/* Trust badge — the free verified-library corpus */}
          <div className="surface-premium rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="text-sm text-slate-700 leading-snug">
              <b className="text-slate-900">מאות שאלות בגרות כבר פתורות במערכת.</b> אם צילמת
              שאלה מוכרת — מקבלים את הפתרון המאומת מיידית ו<b>בחינם</b>.
            </div>
          </div>

          {/* How it works — 3 numbered steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { n: 1, t: 'מצלמים', d: 'שאלה מהמחברת או מהספר' },
              { n: 2, t: 'מזהים', d: 'המערכת קוראת ומחפשת במאגר' },
              { n: 3, t: 'פותרים', d: 'פתרון מלא צעד-אחר-שלב' },
            ].map((s) => (
              <div key={s.n} className="surface-premium rounded-2xl p-4 text-center">
                <div className="w-7 h-7 mx-auto rounded-lg bg-indigo-500/12 border border-indigo-500/30 text-indigo-800 text-sm font-black flex items-center justify-center mb-2">
                  {s.n}
                </div>
                <div className="text-sm font-black text-slate-900">{s.t}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">{s.d}</div>
              </div>
            ))}
          </div>

          {/* Before → after mini-example */}
          <div className="surface-premium rounded-2xl p-4">
            <div className="text-[11px] font-black tracking-widest text-slate-500 uppercase mb-3">
              דוגמה
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="rounded-xl bg-slate-900/[0.03] border border-slate-900/[0.08] p-3 text-center">
                <div className="text-[10px] text-slate-500 mb-1">מה שצילמת</div>
                <div className="chat-md text-slate-800">
                  <MathText inline>{'$x^2 - 5x + 6 = 0$'}</MathText>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-indigo-600 mx-auto rotate-180 sm:rotate-0" />
              <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/25 p-3 text-center">
                <div className="text-[10px] text-emerald-700 mb-1">מה שתקבל</div>
                <div className="chat-md text-emerald-900 font-bold">
                  <MathText inline>{'$x_1 = 2,\\ x_2 = 3$'}</MathText>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">+ כל הצעדים בדרך</div>
              </div>
            </div>
          </div>

          {!isPro && (
            <div className="text-center text-[11px] text-slate-500">
              שאלה חדשה שלא במאגר ודורשת פתרון AI חדש — פיצ׳ר Pro.
            </div>
          )}
        </section>
      )}

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
            <Camera className="w-10 h-10 text-indigo-700 group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <div className="font-black text-base">צלמי עכשיו</div>
              <div className="text-xs text-slate-600 mt-1">פתיחת המצלמה</div>
            </div>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group flex flex-col items-center justify-center gap-3 bg-slate-900/[0.02] border-2 border-dashed border-slate-900/[0.12] hover:border-slate-900/20 rounded-2xl py-10 px-6 transition-all"
          >
            <Upload className="w-10 h-10 text-slate-700 group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <div className="font-black text-base">העלי מהגלריה</div>
              <div className="text-xs text-slate-600 mt-1">בחירת קובץ</div>
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
              className="absolute top-2 left-2 bg-slate-900/60 hover:bg-slate-900/80 text-white rounded-full p-2"
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
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Pro upsell — free user scanned a NEW question needing an AI solve.
          We show the transcription we read so they know the scan worked. */}
      {upsell && (
        <div className="space-y-4 mb-6">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-700" />
              <div className="font-black text-slate-900">זו שאלה חדשה — פתרון AI הוא פיצ׳ר Pro</div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              קראנו את השאלה שלך, אבל היא עדיין לא במאגר הפתרונות המאומתים. פתרון חדש
              נוצר על-ידי ה-AI וזמין למנויי Pro. שאלות שכבר במאגר — תמיד חינם.
            </p>
            {upsell.transcribedQuestion && (
              <div className="rounded-xl bg-white/60 border border-slate-900/[0.08] p-3">
                <div className="text-[10px] text-slate-500 mb-1">השאלה שזיהינו{upsell.topic ? ` · ${upsell.topic}` : ''}</div>
                <div className="chat-md text-sm text-slate-800">
                  <MathText>{upsell.transcribedQuestion}</MathText>
                </div>
              </div>
            )}
            <Link
              href="/my-plan"
              className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-white w-full sm:w-auto"
            >
              <Crown className="w-4 h-4" />
              <span>שדרג ל-Pro</span>
            </Link>
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <Camera className="w-4 h-4" />
            נסה שאלה אחרת
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-5">
          {/* Source badge — shows WHERE the solution came from (trust + it
              also makes the free caching visible). */}
          {result.source === 'library' && (
            <div className="inline-flex items-center gap-2 bg-emerald-500/12 border border-emerald-500/35 rounded-full px-3 py-1.5 text-xs font-bold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>פתרון מאומת מהמאגר — חינם</span>
            </div>
          )}
          {result.source === 'cache' && (
            <div className="inline-flex items-center gap-2 bg-indigo-500/12 border border-indigo-500/35 rounded-full px-3 py-1.5 text-xs font-bold text-indigo-800">
              <Zap className="w-3.5 h-3.5" />
              <span>נפתר כבר בעבר — חינם</span>
            </div>
          )}
          {result.source === 'ai' && (
            <div className="inline-flex items-center gap-2 bg-amber-500/12 border border-amber-500/35 rounded-full px-3 py-1.5 text-xs font-bold text-amber-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>נפתר עכשיו ע״י AI</span>
            </div>
          )}

          {/* Topic + subject chips */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="bg-indigo-500/15 border border-indigo-500/30 rounded-full px-3 py-1 text-xs font-bold text-indigo-800">
              📐 {result.subject === 'math5' ? 'מתמטיקה 5 יח׳' : result.subject}
            </span>
            <span className="bg-indigo-500/15 border border-indigo-500/30 rounded-full px-3 py-1 text-xs font-bold text-indigo-800">
              {result.topic}
            </span>
          </div>

          {/* Transcribed question */}
          <section className="surface-premium rounded-2xl p-5">
            <div className="text-xs font-black tracking-widest text-indigo-700 uppercase mb-2 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>השאלה</span>
            </div>
            <div className="chat-md text-sm sm:text-base leading-relaxed text-slate-800">
              <MathText>{result.transcribedQuestion}</MathText>
            </div>
          </section>

          {/* Steps */}
          <section>
            <div className="text-xs font-black tracking-widest text-emerald-700 uppercase mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>פתרון צעד-אחר-צעד</span>
            </div>
            <ol className="space-y-2">
              {result.steps.map((step, i) => (
                <li
                  key={i}
                  className="surface-premium rounded-2xl p-4 flex gap-3"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-black text-emerald-800">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-emerald-800 mb-1.5 chat-md">
                      <MathText inline>{step.title}</MathText>
                    </div>
                    <div className="chat-md text-sm text-slate-800 leading-relaxed">
                      <MathText>{step.content}</MathText>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Final answer */}
          <section className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-5">
            <div className="text-xs font-black tracking-widest text-emerald-700 uppercase mb-2 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>תשובה סופית</span>
            </div>
            <div className="chat-md text-base sm:text-lg font-bold leading-relaxed text-emerald-900">
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
              className="inline-flex items-center justify-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/[0.05] border border-slate-900/[0.12] px-6 py-4 rounded-2xl font-bold transition-all"
            >
              <Camera className="w-5 h-5" />
              שאלה חדשה
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav helpers when no result yet */}
      {!result && !solving && (
        <div className="mt-8 pt-6 border-t border-slate-900/10 flex flex-wrap gap-3 text-sm">
          <Link href="/library" className="text-indigo-700 hover:text-indigo-800 inline-flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            הספרייה שלי
          </Link>
          <Link href="/my-plan" className="text-slate-600 hover:text-slate-800 inline-flex items-center gap-1">
            חזרה לתוכנית
          </Link>
        </div>
      )}
    </main>
  );
}
