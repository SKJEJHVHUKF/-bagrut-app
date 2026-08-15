'use client';

// ============================================================
// /scan — צילום שאלה → פתרון
// ============================================================
//
// This page is a CONTROLLER, not an implementation. It owns capture, screen
// state and the theme; every piece of maths, imaging and cost accounting sits
// behind `@/lib/mathscan`. It never names Tesseract, mathjs or Claude — which
// is what lets any of them be replaced without touching this file.
//
// Access policy, deliberately different from the old page: the free path
// (preprocess → local OCR → verified library → on-device solve) needs NO
// login, because it costs nothing to serve and matches the app's stated rule
// that library and cache hits are free for everyone. A login is required only
// at the first stage that spends money, and the screen says so at that exact
// moment rather than as a wall on arrival.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Camera,
  Crown,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isProUser } from '@/lib/access';
import { getUnitLevel } from '@/lib/study-plan';
import { MathText } from '@/components/practice/MathText';
import { saveScan, compressToThumbnail } from '@/lib/scans';
import {
  blockedReason,
  disposeOcrEngines,
  displayQuestion,
  formatCostIls,
  isSafeToRenderAsMath,
  rerunFromTranscription,
  runScanPipeline,
  summarizeCost,
  warmupLocalOcr,
  type OcrProgress,
  type ScanResult,
  type ScanStageName,
  type UnitLevel,
} from '@/lib/mathscan';
import { ConfidenceMeter } from '@/components/scan/ConfidenceMeter';
import { RepairSuggestion } from '@/components/scan/RepairSuggestion';
import { QuestionEditor } from '@/components/scan/QuestionEditor';
import { ScanStages, ScanTraceSummary, type LiveStage } from '@/components/scan/ScanStages';
import { SolutionPanel } from '@/components/scan/SolutionPanel';
import { QuestionTutor } from '@/components/scan/QuestionTutor';
import {
  ScanThemeStyles,
  ScanThemeToggle,
  useScanTheme,
} from '@/components/scan/ScanTheme';

type Access = 'loading' | 'anonymous' | 'free' | 'pro';

const OCR_STAGE_LABEL: Record<OcrProgress['stage'], string> = {
  'loading-core': 'טוען את מנוע הזיהוי',
  'loading-language': 'טוען את מאגר השפה',
  recognizing: 'קורא את התמונה',
  done: 'סיים',
};

export default function ScanPage() {
  const [theme, toggleTheme] = useScanTheme();
  const [access, setAccess] = useState<Access>('loading');
  const [unitLevel, setUnitLevel] = useState<UnitLevel>(5);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [stages, setStages] = useState<LiveStage[]>([]);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  /** The solution as it streams in, before the pipeline finishes. */
  const [liveText, setLiveText] = useState<string>('');

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  // ---------- session + level ----------
  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (cancelled) return;
        setAccess(!user ? 'anonymous' : isProUser(user) ? 'pro' : 'free');
      })
      .catch(() => {
        // A Supabase outage must not take the free path down with it —
        // an anonymous student can still scan and solve for $0.
        if (!cancelled) setAccess('anonymous');
      });
    setUnitLevel(getUnitLevel());
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- warm the wasm while the student frames the shot ----------
  useEffect(() => {
    void warmupLocalOcr();
    return () => {
      // ~40 MB of wasm heap; a student who opens the scanner and leaves
      // shouldn't keep paying for it.
      void disposeOcrEngines();
    };
  }, []);

  // ---------- object URL lifetime ----------
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    []
  );

  const onStage = useCallback((name: ScanStageName, status: 'start' | 'done', detail?: string) => {
    setStages((current) => {
      if (status === 'start') return [...current, { name, status: 'running', detail }];
      const next = [...current];
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].name === name) {
          next[i] = { ...next[i], status: 'done', detail: detail ?? next[i].detail };
          break;
        }
      }
      return next;
    });
  }, []);

  const allowPaid = access === 'free' || access === 'pro';

  const reset = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    setPreviewUrl(null);
    setFile(null);
    setResult(null);
    setError(null);
    setStages([]);
    setOcrProgress(null);
    setSavedId(null);
    setLiveText('');
  }, []);

  const pickFile = (picked: File | null) => {
    if (!picked) return;
    reset();
    setFile(picked);
    const url = URL.createObjectURL(picked);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  };

  const solve = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setStages([]);
    setLiveText('');
    try {
      const scan = await runScanPipeline(file, {
        unitLevel,
        allowPaidFallback: allowPaid,
        onStage,
        onOcrProgress: setOcrProgress,
        onSolveText: setLiveText,
      });
      setResult(scan);
      const blocked = blockedReason(scan);
      // A 401 is NOT an error — it is "sign in and we solve this now", and
      // SolutionPanel renders it as a call to action with a login button.
      // Duplicating it in the red danger box told the student the app had
      // failed, which is both wrong and the reason the whole screen read as
      // broken.
      if (blocked && blocked.status !== 401 && Object.keys(scan.explanations).length === 0) {
        setError(blocked.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה בעיבוד התמונה');
    } finally {
      setBusy(false);
      setOcrProgress(null);
    }
  };

  const resolveEdited = async (next: string) => {
    setBusy(true);
    setError(null);
    setStages([]);
    setLiveText('');
    try {
      const scan = await rerunFromTranscription(next, {
        unitLevel,
        allowPaidFallback: allowPaid,
        onStage,
        onSolveText: setLiveText,
      });
      setResult(scan);
      setSavedId(null);
      const blocked = blockedReason(scan);
      // A 401 is NOT an error — it is "sign in and we solve this now", and
      // SolutionPanel renders it as a call to action with a login button.
      // Duplicating it in the red danger box told the student the app had
      // failed, which is both wrong and the reason the whole screen read as
      // broken.
      if (blocked && blocked.status !== 401 && Object.keys(scan.explanations).length === 0) {
        setError(blocked.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!result) return;
    const full = result.explanations.full ?? result.explanations.partial;
    if (!full) return;
    try {
      const thumbnail = file
        ? await compressToThumbnail(file)
        : { base64: '', mime: 'image/jpeg' };
      const scan = saveScan({
        subject: 'math5',
        topic: result.topic ?? 'כללי',
        transcribedQuestion: result.question,
        steps: full.steps.map((step) => ({ title: step.title, content: step.content })),
        finalAnswer: full.finalAnswer ?? '',
        thumbnail: thumbnail.base64,
        thumbnailMime: thumbnail.mime,
      });
      setSavedId(scan.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
    }
  };

  const blocked = result ? blockedReason(result) : null;
  const needsUpgrade = blocked?.status === 402;
  const needsLogin = blocked?.status === 401;

  return (
    // Two elements on purpose. The outer one only DEFINES the theme
    // variables; the inner one PAINTS with them. Putting both on a single
    // element leaves the root's own `background-color` stuck at the previous
    // theme's colour when the attribute flips — the variables update (a child
    // reading `var(--scan-bg)` gets the new value immediately) but the
    // transitioned property on the defining element itself does not repaint.
    // Every descendant was already dark while the page behind them stayed
    // ivory. Splitting the two roles makes the swap ordinary inheritance.
    <div data-scan-theme={theme}>
      <ScanThemeStyles />
      {/* `.scan-root` is full-bleed so the surface reaches the viewport
          edges; the content column is constrained one level in. */}
      <div className="scan-root">
      <main className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
        <Header theme={theme} onToggleTheme={toggleTheme} unitLevel={unitLevel} />

        {!previewUrl && !result && <Intro />}

        {/* ---------- capture ---------- */}
        {!previewUrl && (
          <>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="scan-card flex flex-col items-center justify-center gap-3 py-10 px-6 transition-transform active:scale-[.99]"
              >
                <Camera className="w-10 h-10" style={{ color: 'var(--scan-primary)' }} aria-hidden />
                <span className="text-center">
                  <span className="block font-black">צלם עכשיו</span>
                  <span className="block text-xs scan-muted mt-1">פתיחת המצלמה</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="scan-card flex flex-col items-center justify-center gap-3 py-10 px-6 transition-transform active:scale-[.99]"
              >
                <Upload className="w-10 h-10 scan-muted" aria-hidden />
                <span className="text-center">
                  <span className="block font-black">העלה מהגלריה</span>
                  <span className="block text-xs scan-muted mt-1">בחירת קובץ</span>
                </span>
              </button>
            </div>
            <TypeItYourself onSubmit={resolveEdited} busy={busy} />
          </>
        )}

        {/* ---------- preview ---------- */}
        {previewUrl && !result && (
          <section className="space-y-4 mb-5">
            <div className="scan-card overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="השאלה שצולמה"
                className="w-full max-h-[380px] object-contain"
                style={{ background: 'var(--scan-card-2)' }}
              />
              <button
                type="button"
                onClick={reset}
                className="scan-icon-btn absolute top-2 left-2"
                aria-label="הסר תמונה"
                disabled={busy}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={solve}
              disabled={busy}
              className="scan-btn scan-btn-primary w-full !py-4"
            >
              {busy ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                  <span>{ocrProgress ? OCR_STAGE_LABEL[ocrProgress.stage] : 'מעבד…'}</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" aria-hidden />
                  <span>פתור את השאלה</span>
                </>
              )}
            </button>

            {/* The solution as it is written. This is the difference between
                a minute of blank spinner — which is what the owner hit — and
                watching the answer appear. Same tokens, same cost. */}
            {busy && liveText && (
              <section className="scan-card p-5">
                <div className="text-xs font-black tracking-widest uppercase mb-2 flex items-center gap-2" style={{ color: 'var(--scan-primary)' }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                  <span>כותב את הפתרון…</span>
                </div>
                <div className="chat-md math-content scan-solution text-sm leading-relaxed" aria-live="polite">
                  <MathText>{liveText}</MathText>
                </div>
              </section>
            )}

            {busy && !liveText && (
              <div className="scan-card p-4">
                <ScanStages stages={stages} />
                {ocrProgress && ocrProgress.stage !== 'recognizing' && (
                  <p className="mt-3 text-[11px] scan-faint leading-relaxed">
                    מנוע הזיהוי נטען פעם אחת למכשיר ואז נשמר — הסריקות הבאות מתחילות מיד.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* ---------- errors ---------- */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-4 mb-5 flex gap-3"
              style={{
                background: 'var(--scan-danger-soft)',
                border: '1px solid var(--scan-danger)',
              }}
              role="alert"
            >
              <AlertTriangle
                className="w-5 h-5 shrink-0 mt-0.5"
                style={{ color: 'var(--scan-danger)' }}
                aria-hidden
              />
              <p className="text-sm leading-relaxed">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------- result ---------- */}
        {result && (
          <div className="space-y-5">
            <RecognisedQuestion result={result} />

            {/* The meter answers ONE question — "can you trust that we read
                your photo correctly?" — so it is shown only when that question
                applies. Two cases where it doesn't, and both used to produce
                nonsense on screen:
                  · TYPED text — there was no photo, yet the banner told the
                    student to "צלם שוב באור טוב יותר".
                  · a VERIFIED library match — the screen said "לא הצלחנו
                    לקרוא את התמונה" directly above a correct, hand-authored
                    solution. The match caveat above already explains what
                    happened, and the student can read the matched question.
                The issues themselves are still useful, so a typed question
                keeps them — without the percentage or the camera advice. */}
            {result.inputMode === 'photo' && result.source !== 'library' && result.source !== 'cache' ? (
              <ConfidenceMeter confidence={result.confidence} issues={result.validation.issues} />
            ) : (
              <InputNotes issues={result.validation.issues} />
            )}

            {/* The one-tap way out of a rejected read.
                The pipeline is right to refuse to solve a misread question,
                but a refusal on its own is a dead end: the only cure is
                retyping the equation, which is precisely what a student who
                photographed it will not do. For the failure that actually
                happens — a `²` read as `°` — we already know what went wrong,
                so we offer the correction instead of only naming it.
                Placed directly under the confidence meter that reports the
                problem, and ABOVE the solution area, because on a rejected
                read there is no solution below it to compete with.
                proposeRepair abstains unless the original text is
                mathematically impossible, and the student sees the corrected
                question before it is solved — we never swap it silently. */}
            <RepairSuggestion question={result.question} onApply={resolveEdited} busy={busy} />

            {needsLogin && (
              <UpsellCard
                // Not "הזיהוי המקומי לא הצליח לקרוא את התמונה" — that is one
                // possible cause and often not the one. A 401 also arrives
                // when the read was perfect and the question simply is not in
                // the bank yet, and telling that student their photo was
                // unreadable sends them off re-photographing a fine picture.
                title="השאלה הזאת עוד לא במאגר — נפתור אותה עכשיו"
                body="פתרון חדש דורש חשבון: התחברות פותחת גם את הזיהוי בענן וגם את הפתרון המלא. שאלות שכבר נמצאות במאגר נשארות חינם וללא הגבלה, גם בלי חשבון."
                href={`/login?next=${encodeURIComponent('/scan')}`}
                cta="התחברות"
                Icon={ShieldCheck}
              />
            )}
            {needsUpgrade && (
              <UpsellCard
                title="זו שאלה חדשה — פתרון AI הוא פיצ׳ר Pro"
                body="קראנו את השאלה, אבל היא עדיין לא במאגר הפתרונות המאומתים. שאלות שכבר במאגר — תמיד חינם."
                href="/pricing"
                cta="שדרג ל-Pro"
                Icon={Crown}
              />
            )}

            {/* Keyed on the trace id so every new result REMOUNTS the panel.
                Without it the panel kept the previous scan's depth state: a
                rejected read left it at `null`, and the corrected re-solve
                then rendered its badge with no solution underneath. */}
            <SolutionPanel key={result.trace.id} result={result} blocked={blockedReason(result)} />

            {/* The tutor is keyed to the result too: a new question must
                start a new conversation, not inherit the previous one's. */}
            <QuestionTutor key={`tutor-${result.trace.id}`} result={result} />

            <div className="flex flex-wrap gap-2">
              <QuestionEditor question={result.question} onSubmit={resolveEdited} busy={busy} />
              {(result.explanations.full || result.explanations.partial) &&
                (savedId ? (
                  <Link href="/library" className="scan-btn">
                    <BookOpen className="w-4 h-4" aria-hidden />
                    <span>נשמר · לספרייה</span>
                    <ArrowLeft className="w-4 h-4" aria-hidden />
                  </Link>
                ) : (
                  <button type="button" onClick={save} className="scan-btn">
                    <BookOpen className="w-4 h-4" aria-hidden />
                    <span>שמור לספרייה</span>
                  </button>
                ))}
              <button type="button" onClick={reset} className="scan-btn" disabled={busy}>
                <RefreshCw className="w-4 h-4" aria-hidden />
                <span>שאלה חדשה</span>
              </button>
            </div>

            <ScanTraceSummary trace={result.trace} />
          </div>
        )}

        <CostFooter />
      </main>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Pieces
// ------------------------------------------------------------

function Header({
  theme,
  onToggleTheme,
  unitLevel,
}: {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  unitLevel: UnitLevel;
}) {
  return (
    <header className="flex items-center justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="font-display text-2xl sm:text-3xl font-black leading-tight">
          צלם שאלה, תבין אותה
        </h1>
        <p className="text-xs scan-muted mt-1">מתמטיקה {unitLevel} יחידות · שאלות מודפסות</p>
      </div>
      <ScanThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  );
}

function Intro() {
  return (
    <section className="space-y-3 mb-5">
      <div className="scan-card px-4 py-3 flex items-center gap-3">
        <span
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--scan-success-soft)' }}
          aria-hidden
        >
          <ShieldCheck className="w-5 h-5" style={{ color: 'var(--scan-success)' }} />
        </span>
        <p className="text-sm leading-snug scan-muted">
          <b style={{ color: 'var(--scan-ink)' }}>מצלמים שאלה מודפסת</b> — מבגרות, ממתכונת, מדף
          תרגילים או מספר הלימוד. הקריאה קורית על המכשיר שלך, והתמונה לא נשלחת לשום מקום.
        </p>
      </div>
      <ol className="grid grid-cols-3 gap-2">
        {[
          { n: 1, t: 'מצלמים', d: 'בגרות, מתכונת או תרגיל' },
          { n: 2, t: 'קוראים', d: 'המכשיר מזהה את השאלה' },
          { n: 3, t: 'מבינים', d: 'פתרון מוסבר + מורה לשאול' },
        ].map((step) => (
          <li key={step.n} className="scan-card-flat p-3 text-center">
            <span
              className="w-6 h-6 mx-auto rounded-lg text-xs font-black flex items-center justify-center mb-1.5"
              style={{ background: 'var(--scan-primary-soft)', color: 'var(--scan-primary)' }}
            >
              {step.n}
            </span>
            <span className="block text-sm font-black">{step.t}</span>
            <span className="block text-[11px] scan-faint mt-0.5">{step.d}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The no-camera path. It is also the fastest and most accurate route to an
 *  answer, so it is offered up front rather than hidden as a fallback. */
function TypeItYourself({
  onSubmit,
  busy,
}: {
  onSubmit: (text: string) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm scan-muted underline">
        או הקלד את השאלה בעצמך
      </button>
    );
  }

  return (
    <section className="scan-card p-4 space-y-3">
      <h2 className="text-sm font-black">הקלד את השאלה</h2>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        dir="rtl"
        className="scan-input"
        placeholder="פתור את המשוואה x^2 - 5x + 6 = 0"
        aria-label="טקסט השאלה"
      />
      <button
        type="button"
        onClick={() => onSubmit(text.trim())}
        disabled={busy || text.trim().length < 3}
        className="scan-btn scan-btn-primary w-full"
      >
        {busy ? 'פותר…' : 'פתור · חינם'}
      </button>
    </section>
  );
}

function RecognisedQuestion({ result }: { result: ScanResult }) {
  const display = displayQuestion(result);
  const safe = isSafeToRenderAsMath(display);
  return (
    <section className="scan-card p-5">
      <h2 className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: 'var(--scan-primary)' }}>
        {result.matchScore === undefined ? 'השאלה שזיהינו' : 'השאלה שהתאמנו מהמאגר'}
      </h2>
      {/* On a fuzzy match the wording below is OURS, not the student's. Saying
          so is the difference between a helpful normalisation and a silent
          substitution — and it is how a wrong match gets noticed. */}
      {result.matchScore !== undefined && (
        <p className="text-[11px] scan-faint leading-relaxed mb-2">
          זיהינו שזו שאלה שכבר קיימת אצלנו במאגר, ולכן מוצג הנוסח המדויק שלה. אם זו לא השאלה
          שצילמת — לחץ על &quot;נסח מחדש&quot;.
        </p>
      )}
      {safe ? (
        <div className="chat-md math-content text-sm sm:text-base leading-relaxed">
          <MathText>{display}</MathText>
        </div>
      ) : (
        <p dir="rtl" className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
          {result.question || 'לא זוהה טקסט'}
        </p>
      )}
    </section>
  );
}

/**
 * The issues, without the recognition framing.
 *
 * Used when a confidence percentage would be meaningless — typed text, or a
 * verified library match. A note like "the degree sign is probably an
 * exponent" is still worth reading; "we couldn't read the photo, try again in
 * better light" is not, when there was no photo.
 */
function InputNotes({ issues }: { issues: ScanResult['validation']['issues'] }) {
  const notable = issues.filter((issue) => issue.penalty >= 0.15).slice(0, 2);
  if (notable.length === 0) return null;
  return (
    <section className="scan-card-flat px-4 py-3">
      <ul className="space-y-1">
        {notable.map((issue) => (
          <li key={issue.code} className="text-xs scan-muted flex gap-2 leading-relaxed">
            <span aria-hidden>•</span>
            <span>{issue.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UpsellCard({
  title,
  body,
  href,
  cta,
  Icon,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  Icon: typeof Crown;
}) {
  return (
    <section
      className="rounded-2xl p-5 space-y-3"
      style={{ background: 'var(--scan-warn-soft)', border: '1px solid var(--scan-warn)' }}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color: 'var(--scan-warn)' }} aria-hidden />
        <h3 className="font-black">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed scan-muted">{body}</p>
      <Link href={href} className="scan-btn scan-btn-primary w-full sm:w-auto">
        <Icon className="w-4 h-4" aria-hidden />
        <span>{cta}</span>
      </Link>
    </section>
  );
}

/** The measured cost of the student's own scans. Reads the local trace log,
 *  so it is their real history, not a marketing claim. */
function CostFooter() {
  const [summary, setSummary] = useState<ReturnType<typeof summarizeCost> | null>(null);

  useEffect(() => {
    setSummary(summarizeCost());
  }, []);

  if (!summary || summary.scans === 0) return null;

  return (
    <footer className="mt-8 pt-5" style={{ borderTop: '1px solid var(--scan-line)' }}>
      <p className="text-[11px] scan-faint leading-relaxed">
        {/* "ללא עלות", not "ללא קריאה לשרת" — `freeRatio` counts solves that
            cost nothing, and the corpus/bank/cache paths all reach the server.
            Now that the bank is the main free path, the old wording described
            something that does not happen. */}
        סרקת {summary.scans} שאלות · {Math.round(summary.freeRatio * 100)}% מהן נפתרו ללא שום
        עלות · עלות ממוצעת לשאלה: {formatCostIls(summary.averageCostUsd)}
      </p>
    </footer>
  );
}
