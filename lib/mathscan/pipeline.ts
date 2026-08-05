// ============================================================
// mathscan/pipeline.ts — the orchestrator. One function, one contract.
// ============================================================
//
// `runScanPipeline(file, options)` is the ONLY thing the UI calls. Everything
// else in `lib/mathscan` is an implementation detail behind an interface.
//
// The order of the stages IS the cost architecture, cheapest first:
//
//   1. preprocess     device   $0   also shrinks the fallback's image bill
//   2. local OCR      device   $0   Tesseract wasm, nothing leaves the phone
//   3. validate       device   $0   decides whether step 2 can be trusted
//   4. library match  network  $0   ~830 verified, hand-authored solutions
//   5. local CAS      device   $0   exact answer + templated Hebrew
//   6. vision OCR     API      ¢    ONLY on a validated local failure
//   7. AI solve       API      ¢    ONLY on a library AND cache miss
//
// Steps 1-5 are free and cover the common case: a printed question that is
// either already in the library or is an equation/derivative/integral the
// local CAS solves exactly. A scan reaches step 6 only when the student
// photographed handwriting or the light was bad, and step 7 only when the
// question is also genuinely new.
//
// Every stage records its own duration, outcome and cost into a `CostMeter`,
// so `result.trace` is a measurement of what this scan cost — not a guess.

import type {
  ClassifiedProblem,
  Explanation,
  ExplanationDepth,
  OcrResult,
  ScanPipelineOptions,
  ScanResult,
  SolutionSource,
  SolveOutcome,
  UnitLevel,
  Validation,
} from './types';
import { preprocessImage } from './preprocess';
import { buildOcrChain, VisionOcrError } from './ocr';
import { repairOcrText, toDisplayQuestion } from './ocr/normalize';
import { validateTranscription } from './validate';
import { classifyProblem } from './solve/classify';
import { solveProblem } from './solve';
import { explainSolution, explanationFromSteps } from './explain';
import { CostMeter, recordTrace } from './cost';
import { issueCodes, logScanError } from './telemetry';
import { topicForDomain } from './levels';

/** Confidence below which we stop trusting the local read and escalate. */
const DEFAULT_FALLBACK_THRESHOLD = 0.55;

type ServerSolution = {
  source: 'library' | 'cache' | 'ai';
  topic?: string;
  transcribedQuestion?: string;
  steps: { title: string; content: string }[];
  finalAnswer: string;
  costUsd?: number;
  /** 1 = the transcription matched a stored question exactly; below that the
   *  match was fuzzy and the wording shown is OURS, not the student's. */
  matchScore?: number;
};

// ------------------------------------------------------------
// Entry point
// ------------------------------------------------------------

export async function runScanPipeline(
  file: Blob,
  options: ScanPipelineOptions = {}
): Promise<ScanResult> {
  const meter = new CostMeter();
  const unitLevel: UnitLevel = options.unitLevel ?? 5;
  const allowPaid = options.allowPaidFallback ?? false;
  const threshold = options.fallbackThreshold ?? DEFAULT_FALLBACK_THRESHOLD;
  const stage = options.onStage ?? (() => {});

  // ---------- 1. preprocess ----------
  stage('preprocess', 'start');
  meter.begin('preprocess');
  let processed;
  try {
    processed = await preprocessImage(file);
    meter.end('preprocess', 'hit', {
      detail: `${processed.forOcr.width}×${processed.forOcr.height}, ~${processed.forVision.estimatedVisionTokens} vision tokens`,
    });
  } catch (error) {
    meter.end('preprocess', 'error', { detail: message(error) });
    logScanError({
      kind: 'pipeline-error',
      transcription: '',
      confidence: 0,
      issues: ['preprocess'],
      reason: message(error),
      recoveredBy: null,
    });
    throw error;
  }
  stage('preprocess', 'done', `${Math.round(processed.forVision.byteLength / 1024)} KB`);

  // ---------- 2 + 3. local OCR, then validate ----------
  let ocr: OcrResult | null = null;
  let validation: Validation | null = null;

  if (options.transcriptionOverride) {
    // The student typed it. Skip OCR entirely — this path is free AND more
    // accurate than anything we could read off the photo.
    meter.skip('ocr-local', 'transcription supplied by the student');
    ocr = manualOcrResult(options.transcriptionOverride);
    validation = validateTranscription({ ocr, humanEdited: true });
  } else {
    stage('ocr-local', 'start');
    meter.begin('ocr-local');
    const chain = await buildOcrChain({ allowPaid: false });
    for (const engine of chain) {
      try {
        ocr = await engine.recognize(processed.forOcr, {
          onProgress: options.onOcrProgress,
          signal: options.signal,
        });
        break;
      } catch (error) {
        // A dead engine must not kill the scan — the paid path is still
        // there, and so is "type it yourself".
        meter.end('ocr-local', 'error', { detail: `${engine.id}: ${message(error)}` });
        ocr = null;
      }
    }
    if (ocr) {
      validation = validateTranscription({ ocr });
      meter.end('ocr-local', validation.verdict === 'reject' ? 'miss' : 'hit', {
        detail: `conf ${validation.confidence}`,
      });
    } else if (chain.length === 0) {
      meter.skip('ocr-local', 'no local engine available');
    }
    stage('ocr-local', 'done', validation ? `${Math.round(validation.confidence * 100)}%` : 'נכשל');
  }

  meter.begin('validate');
  meter.end('validate', validation ? 'hit' : 'miss', { detail: validation?.verdict });

  // ---------- 6. paid vision, only on a validated local failure ----------
  const needsFallbackOcr = !validation || validation.verdict === 'reject' || validation.confidence < threshold;
  let fallbackBlocked: { message: string; status: number } | null = null;

  if (needsFallbackOcr && allowPaid && !options.transcriptionOverride) {
    stage('fallback-vision', 'start');
    meter.begin('fallback-vision');
    const paidChain = await buildOcrChain({ allowPaid: true });
    const visionEngineInstance = paidChain.find((e) => e.paid);
    if (visionEngineInstance) {
      try {
        const visionResult = await visionEngineInstance.recognize(processed.forVision, {
          onProgress: options.onOcrProgress,
          signal: options.signal,
        });
        const visionValidation = validateTranscription({ ocr: visionResult });
        // Keep whichever read the validator scored higher. Usually the paid
        // one — but not always, and paying for a result is not a reason to
        // use a worse one.
        if (!validation || visionValidation.confidence > validation.confidence) {
          ocr = visionResult;
          validation = visionValidation;
        }
        meter.end('fallback-vision', 'hit', { costUsd: visionResult.costUsd });
      } catch (error) {
        const status = error instanceof VisionOcrError ? error.status : 0;
        fallbackBlocked = { message: message(error), status };
        meter.end('fallback-vision', 'error', { detail: message(error) });
      }
    } else {
      meter.skip('fallback-vision', 'no paid engine available');
    }
    stage('fallback-vision', 'done');
  } else if (needsFallbackOcr) {
    meter.skip('fallback-vision', allowPaid ? 'transcription supplied' : 'paid path not allowed');
  } else {
    meter.skip('fallback-vision', 'local read was good enough');
  }

  // Nothing readable at all — return an honest, editable empty result rather
  // than an exception, so the student lands on "תקן את הטקסט" not a crash.
  if (!ocr || !validation) {
    const empty = manualOcrResult('');
    const emptyValidation = validateTranscription({ ocr: empty });
    logScanError({
      kind: 'ocr-rejected',
      transcription: '',
      confidence: 0,
      issues: ['empty'],
      reason: fallbackBlocked?.message,
      recoveredBy: null,
    });
    return finalize({
      question: '',
      validation: emptyValidation,
      problem: null,
      outcome: null,
      explanations: {},
      source: 'local-cas',
      unitLevel,
      meter,
      topic: null,
      blocked: fallbackBlocked,
      inputMode: 'photo',
    });
  }

  return await solveFromTranscription({
    transcription: validation.normalized,
    validation,
    unitLevel,
    allowPaid,
    meter,
    stage,
    signal: options.signal,
    blocked: fallbackBlocked,
    inputMode: options.transcriptionOverride ? 'typed' : 'photo',
  });
}

// ------------------------------------------------------------
// The solve half — also the entry point for "נסח מחדש"
// ------------------------------------------------------------

export type RerunOptions = {
  unitLevel?: UnitLevel;
  allowPaidFallback?: boolean;
  onStage?: ScanPipelineOptions['onStage'];
  signal?: AbortSignal;
};

/**
 * Re-run everything from the transcription onward, with no image.
 *
 * This is what "נסח מחדש" calls after the student edits the text, and it is
 * FREE: no preprocessing, no OCR, no vision. Correcting a misread question
 * should never cost more than getting it right the first time — otherwise
 * the honest thing (letting the student fix our mistake) becomes the
 * expensive thing.
 */
export async function rerunFromTranscription(
  transcription: string,
  options: RerunOptions = {}
): Promise<ScanResult> {
  const meter = new CostMeter();
  meter.skip('preprocess', 'no image — re-run from text');
  meter.skip('ocr-local', 'no image — re-run from text');
  const ocr = manualOcrResult(transcription);
  const validation = validateTranscription({ ocr, humanEdited: true });
  meter.begin('validate');
  meter.end('validate', 'hit', { detail: validation.verdict });

  return solveFromTranscription({
    transcription: validation.normalized,
    validation,
    unitLevel: options.unitLevel ?? 5,
    allowPaid: options.allowPaidFallback ?? false,
    meter,
    stage: options.onStage ?? (() => {}),
    signal: options.signal,
    blocked: null,
    inputMode: 'typed',
  });
}

async function solveFromTranscription(args: {
  transcription: string;
  validation: Validation;
  unitLevel: UnitLevel;
  allowPaid: boolean;
  meter: CostMeter;
  stage: NonNullable<ScanPipelineOptions['onStage']>;
  signal?: AbortSignal;
  blocked: { message: string; status: number } | null;
  inputMode: 'photo' | 'typed';
}): Promise<ScanResult> {
  const { transcription, validation, unitLevel, allowPaid, meter, stage, signal, inputMode } = args;

  const problem = classifyProblem({ text: transcription, expressions: validation.expressions });
  const topic = topicForDomain(problem.domain, unitLevel, problem.kind);

  /**
   * A rejected read never gets a solution — not even a free one.
   *
   * By this point the paid fallback has already had its chance, so a verdict
   * of `reject` means nobody could read the question. Solving whatever
   * survived the misread is worse than solving nothing: it produces a
   * confident answer to a DIFFERENT question, under a badge that says
   * "נפתר על המכשיר שלך". That happened for real — `x² − 5x + 6 = 0` came
   * back as `x = 6/5` because the squared term had been lost — and a warning
   * banner above the answer is not a fix, because the answer is what gets
   * read. Returning nothing sends the student to the editor instead, which
   * is free and always correct.
   *
   * Text the student typed is never rejected (`humanEdited` floors the
   * verdict at `review`), so this can only block a machine read.
   */
  if (validation.verdict === 'reject') {
    meter.skip('library-match', 'transcription rejected — nothing reliable to match');
    meter.skip('solve-local', 'transcription rejected — refusing to solve a misread question');
    meter.skip('fallback-solve', 'transcription rejected');
    logScanError({
      kind: 'ocr-rejected',
      transcription,
      confidence: validation.confidence,
      issues: issueCodes(validation),
      problemKind: problem.kind,
      domain: problem.domain,
      reason: validation.issues.map((issue) => issue.code).join(','),
      recoveredBy: null,
    });
    return finalize({
      question: transcription,
      validation,
      problem,
      outcome: null,
      explanations: {},
      source: 'local-cas',
      unitLevel,
      meter,
      topic,
      blocked: args.blocked,
      inputMode,
    });
  }

  // ---------- 4. verified library (network, $0, everyone) ----------
  stage('library-match', 'start');
  meter.begin('library-match');
  const libraryHit = await lookupServer(
    { mode: 'match', question: transcription, topic: topic ?? undefined },
    signal
  );
  if (libraryHit) {
    meter.end('library-match', 'hit', { detail: libraryHit.source });
    stage('library-match', 'done', libraryHit.source);
    meter.skip('solve-local', 'answered by the verified library');
    return finalize({
      // Prefer the STORED wording over the OCR's. On a fuzzy match the two
      // differ — the stored text is clean, is what the solution actually
      // refers to, and is how a student spots a wrong match at a glance.
      question: libraryHit.transcribedQuestion || transcription,
      validation,
      problem,
      outcome: null,
      explanations: {
        full: explanationFromSteps(
          libraryHit.steps,
          libraryHit.finalAnswer,
          problem,
          libraryHit.source === 'library' ? 'library' : 'ai'
        ),
      },
      source: libraryHit.source === 'library' ? 'library' : 'cache',
      unitLevel,
      meter,
      topic: libraryHit.topic ?? topic,
      blocked: null,
      matchScore: libraryHit.matchScore,
      inputMode,
    });
  }
  meter.end('library-match', 'miss');
  stage('library-match', 'done', 'לא נמצא במאגר');

  // ---------- 5. local CAS ----------
  //
  // Skipped outright for a multi-section question. The local engine solves a
  // single expression, so on a five-section bagrut question it would answer
  // section א and the result screen would present that as THE solution —
  // complete with a "נפתר על המכשיר שלך" badge. A photographed exam question
  // belongs to the library or to the AI, both of which handle it whole.
  if (problem.multiPart) {
    meter.skip('solve-local', `multi-part question (${problem.parts.join(', ')})`);
    stage('solve-local', 'done', 'שאלה מרובת סעיפים');
    return await escalate({
      transcription,
      validation,
      problem,
      topic,
      unitLevel,
      allowPaid,
      meter,
      stage,
      signal,
      localOutcome: null,
      inputMode,
    });
  }

  stage('solve-local', 'start');
  meter.begin('solve-local');
  const { outcome, attempts } = await solveProblem(problem);
  meter.end('solve-local', outcome.status === 'solved' ? 'hit' : 'miss', {
    detail: outcome.status === 'solved' ? outcome.engine : outcome.reason,
  });
  stage('solve-local', 'done', outcome.status);

  if (outcome.status === 'solved') {
    meter.skip('fallback-solve', 'solved on-device');
    return finalize({
      question: transcription,
      validation,
      problem,
      outcome,
      explanations: buildAllDepths(outcome, problem),
      source: 'local-cas',
      unitLevel,
      meter,
      topic,
      blocked: null,
      inputMode,
    });
  }

  logScanError({
    kind: outcome.status === 'error' ? 'solve-error' : 'solve-unsupported',
    transcription,
    confidence: validation.confidence,
    issues: issueCodes(validation),
    problemKind: problem.kind,
    domain: problem.domain,
    reason: attempts.map((a) => `${a.engine}: ${a.reason ?? a.status}`).join(' · '),
    recoveredBy: allowPaid ? 'ai' : null,
  });

  return await escalate({
    transcription,
    validation,
    problem,
    topic,
    unitLevel,
    allowPaid,
    meter,
    stage,
    signal,
    localOutcome: outcome,
    inputMode,
  });
}

/**
 * The last stage: hand the question to the paid AI solve.
 *
 * Shared by the two routes that get here — a question the local CAS refused,
 * and a multi-section exam question the local CAS was never offered. Keeping
 * one implementation means the quota, the error mapping and the "you need
 * Pro" branch can't drift between them.
 */
async function escalate(args: {
  transcription: string;
  validation: Validation;
  problem: ClassifiedProblem;
  topic: string | null;
  unitLevel: UnitLevel;
  allowPaid: boolean;
  meter: CostMeter;
  stage: NonNullable<ScanPipelineOptions['onStage']>;
  signal?: AbortSignal;
  localOutcome: SolveOutcome | null;
  inputMode: 'photo' | 'typed';
}): Promise<ScanResult> {
  const {
    transcription,
    validation,
    problem,
    topic,
    unitLevel,
    allowPaid,
    meter,
    stage,
    signal,
    localOutcome,
    inputMode,
  } = args;
  const outcome = localOutcome;

  if (!allowPaid) {
    meter.skip('fallback-solve', 'paid path not allowed');
    return finalize({
      question: transcription,
      validation,
      problem,
      outcome,
      explanations: {},
      source: 'local-cas',
      unitLevel,
      meter,
      topic,
      blocked: null,
      inputMode,
    });
  }

  stage('fallback-solve', 'start');
  meter.begin('fallback-solve');
  // try/catch rather than `.catch(cb)`: TypeScript cannot see an assignment
  // made inside a callback, so `blocked` would stay narrowed to `null` and
  // the reason below would be unreachable at the type level.
  let blocked: { message: string; status: number } | null = null;
  let solved: ServerSolution | null = null;
  try {
    solved = await lookupServer(
      { mode: 'solve', question: transcription, topic: topic ?? undefined },
      signal
    );
  } catch (error) {
    blocked = {
      message: message(error),
      status: error instanceof VisionOcrError ? error.status : 0,
    };
  }

  if (!solved) {
    meter.end('fallback-solve', 'error', { detail: blocked?.message ?? 'no solution' });
    stage('fallback-solve', 'done', 'נכשל');
    return finalize({
      question: transcription,
      validation,
      problem,
      outcome,
      explanations: {},
      source: 'local-cas',
      unitLevel,
      meter,
      topic,
      blocked,
      inputMode,
    });
  }

  meter.end('fallback-solve', 'hit', { costUsd: solved.costUsd ?? 0, detail: solved.source });
  stage('fallback-solve', 'done', solved.source);

  return finalize({
    question: solved.transcribedQuestion || transcription,
    validation,
    problem,
    outcome,
    explanations: {
      full: explanationFromSteps(
        solved.steps,
        solved.finalAnswer,
        problem,
        solved.source === 'library' ? 'library' : 'ai'
      ),
    },
    source: solved.source === 'library' ? 'library' : solved.source === 'cache' ? 'cache' : 'ai',
    unitLevel,
    meter,
    topic: solved.topic ?? topic,
    blocked: null,
    inputMode,
  });
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function buildAllDepths(
  outcome: SolveOutcome,
  problem: ClassifiedProblem
): Partial<Record<ExplanationDepth, Explanation>> {
  // All three depths are generated eagerly because each costs microseconds
  // and zero dollars — the "רמז" button must feel instant, not fetch.
  return {
    hint: explainSolution(outcome, problem, 'hint'),
    partial: explainSolution(outcome, problem, 'partial'),
    full: explainSolution(outcome, problem, 'full'),
  };
}

type ServerRequest = { mode: 'match' | 'solve'; question: string; topic?: string };

/** Ask the server for a library/cache/AI solution. `match` never spends
 *  money; `solve` may. A non-2xx is not an exception for `match` — a miss is
 *  the expected case and must not interrupt the free path. */
async function lookupServer(
  request: ServerRequest,
  signal?: AbortSignal
): Promise<ServerSolution | null> {
  try {
    const res = await fetch('/api/scan-solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      if (request.mode === 'match') return null; // a miss, not a failure
      throw new VisionOcrError(
        typeof data.error === 'string' ? data.error : 'הפתרון נכשל',
        res.status,
        data
      );
    }
    if (!Array.isArray(data.steps) || data.steps.length === 0) return null;

    return {
      source: (data.source as ServerSolution['source']) ?? 'ai',
      topic: typeof data.topic === 'string' ? data.topic : undefined,
      transcribedQuestion:
        typeof data.transcribedQuestion === 'string' ? data.transcribedQuestion : undefined,
      steps: (data.steps as { title?: unknown; content?: unknown }[])
        .filter((s) => typeof s?.title === 'string' && typeof s?.content === 'string')
        .map((s) => ({ title: s.title as string, content: s.content as string })),
      finalAnswer: typeof data.finalAnswer === 'string' ? data.finalAnswer : '',
      costUsd: typeof data.costUsd === 'number' ? data.costUsd : 0,
      matchScore: typeof data.matchScore === 'number' ? data.matchScore : undefined,
    };
  } catch (error) {
    if (request.mode === 'match') return null;
    throw error;
  }
}

function manualOcrResult(text: string): OcrResult {
  const repaired = repairOcrText(text);
  return {
    engine: 'manual',
    text: repaired,
    lines: repaired.split('\n').map((line) => ({ text: line, confidence: 1 })),
    meanConfidence: 1,
    durationMs: 0,
    costUsd: 0,
  };
}

function finalize(args: {
  question: string;
  validation: Validation;
  problem: ClassifiedProblem | null;
  outcome: SolveOutcome | null;
  explanations: Partial<Record<ExplanationDepth, Explanation>>;
  source: SolutionSource;
  unitLevel: UnitLevel;
  meter: CostMeter;
  topic: string | null;
  blocked: { message: string; status: number } | null;
  matchScore?: number;
  inputMode: 'photo' | 'typed';
}): ScanResult {
  const trace = args.meter.build(`scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  recordTrace(trace);

  const result: ScanResult = {
    question: args.question,
    topic: args.topic,
    domain: args.problem?.domain ?? 'unknown',
    unitLevel: args.unitLevel,
    confidence: args.validation.confidence,
    validation: args.validation,
    problem: args.problem,
    outcome: args.outcome,
    explanations: args.explanations,
    source: args.source,
    inputMode: args.inputMode,
    // Only meaningful when the match was fuzzy; an exact hit shows the
    // student's own wording and needs no caveat.
    matchScore: args.matchScore !== undefined && args.matchScore < 0.999 ? args.matchScore : undefined,
    trace,
  };
  if (args.blocked) blockedByStatus.set(result, args.blocked);
  return result;
}

/**
 * Why the paid path didn't run — "you need Pro" (402) vs "daily cap" (429)
 * vs a real error. Kept OUT of `ScanResult` because it is a UI concern, not
 * a property of the maths, and a WeakMap means it can't leak into anything
 * that persists the result.
 */
const blockedByStatus = new WeakMap<ScanResult, { message: string; status: number }>();

export function blockedReason(result: ScanResult): { message: string; status: number } | null {
  return blockedByStatus.get(result) ?? null;
}

/** The Hebrew-rendered question, with math wrapped for KaTeX. */
export function displayQuestion(result: ScanResult): string {
  return toDisplayQuestion(result.question);
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
