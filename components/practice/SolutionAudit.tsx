'use client';

// SolutionAudit — camera/upload a photo of the student's handwritten solution
// and render the step-by-step audit from /api/analyze-solution. Self-contained;
// used from /practice (on a question) and /chat (composer camera button).
// Pro-only server-side — free users get a friendly upsell.

import { useRef, useState } from 'react';
import { Camera, Upload, Loader2, X, CheckCircle, XCircle, Crown, ScanLine } from 'lucide-react';
import Link from 'next/link';
import { MathText } from './MathText';
import { recordMistake, toErrorCategory } from '@/lib/mistakes';

type AuditStep = { text: string; ok: boolean; issue?: string };
type AuditResult = {
  transcription?: string;
  topic?: string;
  isCorrect?: boolean;
  steps?: AuditStep[];
  firstErrorStep?: number;
  diagnosis?: string;
  category?: string;
  correctContinuation?: string;
  encouragement?: string;
};

export function SolutionAudit({
  questionText,
  topic,
  subject = 'math5',
  onClose,
}: {
  questionText?: string;
  topic?: string;
  subject?: string;
  onClose?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proUpsell, setProUpsell] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setProUpsell(false);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
  }

  async function analyze() {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setProUpsell(false);
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (questionText) fd.append('question', questionText);
      const res = await fetch('/api/analyze-solution', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402 && data.proRequired) {
        setProUpsell(true);
        return;
      }
      if (!res.ok || data.error) {
        setError(data.error ?? `שגיאה (${res.status})`);
        return;
      }
      setResult(data as AuditResult);
      // A wrong solution goes to the error notebook with the AI category.
      if (data.isCorrect === false) {
        recordMistake({
          subject,
          topic: topic ?? data.topic ?? '',
          questionText: questionText || data.transcription,
          correctAnswer: data.correctContinuation,
          category: toErrorCategory(data.category),
          source: 'scan',
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-premium rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-black text-indigo-800">
          <ScanLine className="w-4 h-4" />
          <span>בדיקת הפתרון שלך מצילום</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="סגור"
            className="w-7 h-7 rounded-lg hover:bg-slate-900/5 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!result && !proUpsell && (
        <>
          <p className="text-xs text-slate-600 leading-relaxed">
            פתרת על דף? צלם את הפתרון והמורה יעבור עליו צעד-אחר-צעד ויגיד לך בדיוק
            איפה טעית (אם טעית).
          </p>

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => cameraRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-2.5 rounded-xl font-bold text-indigo-800 text-sm transition-colors"
            >
              <Camera className="w-4 h-4" />
              צלם
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 px-3 py-2.5 rounded-xl font-bold text-slate-700 text-sm transition-colors"
            >
              <Upload className="w-4 h-4" />
              העלה תמונה
            </button>
          </div>

          {preview && (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="הפתרון שלך"
                className="w-full max-h-64 object-contain rounded-xl border border-slate-900/10"
              />
              <button
                onClick={analyze}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 px-4 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg shadow-indigo-500/25 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>מנתח את הפתרון שלך…</span>
                  </>
                ) : (
                  <span>בדוק את הפתרון</span>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="text-xs text-rose-700 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </>
      )}

      {proUpsell && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-gradient-to-l from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl px-4 py-3">
            <Crown className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-slate-800">
              ניתוח פתרון מצילום הוא פיצ׳ר <strong>Pro</strong>. המורה יבדוק לך את הפתרון
              ויאתר איפה טעית.
            </div>
          </div>
          <Link
            href="/pricing"
            className="w-full inline-flex items-center justify-center gap-2 btn-primary px-4 py-2.5 rounded-xl font-bold text-white text-sm"
          >
            שדרג ל-Pro
          </Link>
        </div>
      )}

      {result && <AuditResultView result={result} onReset={() => { setResult(null); setFile(null); setPreview(null); }} />}
    </div>
  );
}

function AuditResultView({ result, onReset }: { result: AuditResult; onReset: () => void }) {
  const correct = result.isCorrect;
  return (
    <div className="space-y-3">
      {/* Verdict banner */}
      <div
        className={
          correct
            ? 'flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-3 py-2.5 text-emerald-800'
            : 'flex items-center gap-2 bg-amber-500/10 border border-amber-500/40 rounded-xl px-3 py-2.5 text-amber-800'
        }
      >
        {correct ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
        <span className="font-black text-sm">
          {correct ? 'הפתרון שלך נכון! 🎉' : 'מצאתי איפה כדאי לתקן'}
        </span>
      </div>

      {/* Steps */}
      {result.steps && result.steps.length > 0 && (
        <div className="space-y-1.5">
          {result.steps.map((s, i) => {
            const isFirstError = result.firstErrorStep === i + 1;
            return (
              <div
                key={i}
                className={
                  isFirstError
                    ? 'flex gap-2 items-start bg-rose-500/10 border border-rose-500/40 rounded-lg px-3 py-2'
                    : 'flex gap-2 items-start px-3 py-1.5'
                }
              >
                <span className="flex-shrink-0 mt-0.5">
                  {s.ok ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                </span>
                <div className="flex-1 min-w-0 text-sm chat-md text-slate-800">
                  <MathText inline>{s.text}</MathText>
                  {s.issue && (
                    <div className="text-xs text-rose-700 mt-1 chat-md">
                      <MathText inline>{s.issue}</MathText>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Diagnosis */}
      {!correct && result.diagnosis && (
        <div className="bg-slate-900/[0.03] border border-slate-900/10 rounded-xl px-3 py-2.5">
          <div className="text-[10px] font-black tracking-widest text-rose-700 uppercase mb-1">
            הטעות
          </div>
          <div className="text-sm text-slate-800 chat-md">
            <MathText>{result.diagnosis}</MathText>
          </div>
        </div>
      )}

      {/* Correct continuation */}
      {!correct && result.correctContinuation && (
        <div className="result-box rounded-xl px-3 py-2.5">
          <div className="text-[10px] font-black tracking-widest text-emerald-700 uppercase mb-1">
            הצעד הנכון
          </div>
          <div className="text-sm text-slate-800 chat-md">
            <MathText>{result.correctContinuation}</MathText>
          </div>
        </div>
      )}

      {/* Encouragement */}
      {result.encouragement && (
        <div className="text-sm text-indigo-800 font-bold text-center">{result.encouragement}</div>
      )}

      <button
        onClick={onReset}
        className="w-full inline-flex items-center justify-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 px-3 py-2 rounded-xl font-bold text-slate-700 text-sm transition-colors"
      >
        בדוק פתרון נוסף
      </button>
    </div>
  );
}
