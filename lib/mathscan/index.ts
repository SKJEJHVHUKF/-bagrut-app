// ============================================================
// mathscan — the public surface. Import from here, never from a sub-module.
// ============================================================
//
// The rule that keeps the pieces swappable: UI code imports ONLY from
// `@/lib/mathscan`. It never names Tesseract, mathjs, SymPy or Claude. Every
// concrete engine sits behind `OcrEngine` / `SymbolicEngine`, chosen by a
// registry, so replacing one is a new file plus one line in that registry.
//
//   ── UI → services ──────────────────────────────────────────────
//   runScanPipeline(file, opts)        photo   → ScanResult
//   rerunFromTranscription(text, opts) text    → ScanResult   (always $0)
//   displayQuestion(result)            result  → Hebrew + $…$ for MathText
//   blockedReason(result)              result  → why the paid path stopped
//   summarizeCost() / readTraces()     measured cost per question
//   readScanErrors()                   the OCR failure worklist
//   warmupLocalOcr()                   preload the wasm while the student
//                                      is still framing the shot
//
// Everything above is safe in a client component. `preprocessImage` and the
// Tesseract engine additionally require a browser (canvas + Worker) and say
// so by throwing, rather than silently producing nothing on the server.

export type {
  ClassifiedProblem,
  Explanation,
  ExplainedStep,
  ExplanationDepth,
  MathDomain,
  OcrEngine,
  OcrEngineId,
  OcrProgress,
  OcrResult,
  PreprocessedImage,
  PreprocessOperation,
  ProblemKind,
  ScanPipelineOptions,
  ScanResult,
  ScanStage,
  ScanStageName,
  ScanTrace,
  SolutionSource,
  SolveOutcome,
  SolveStep,
  SymbolicEngine,
  SymbolicEngineId,
  TutorGrounding,
  TutorMessage,
  UnitLevel,
  Validation,
  ValidationIssue,
  ValidationVerdict,
} from './types';

export {
  runScanPipeline,
  rerunFromTranscription,
  displayQuestion,
  blockedReason,
} from './pipeline';

export { preprocessImage, estimateVisionTokens } from './preprocess';
export { validateTranscription, isSafeToRenderAsMath, ACCEPT_THRESHOLD, REJECT_THRESHOLD } from './validate';
export { classifyProblem } from './solve/classify';
export { solveProblem, isKindSupported } from './solve';
export { explainSolution, explanationFromSteps, domainLabel } from './explain';
export { toDisplayQuestion, repairOcrText, extractMathSegments } from './ocr/normalize';
export {
  askTutor,
  groundingFromResult,
  suggestedQuestions,
  TutorError,
  type TutorStreamHandlers,
} from './tutor-client';
export { buildOcrChain, getOcrEngine, disposeOcrEngines } from './ocr';
export {
  CostMeter,
  costOfCall,
  formatCostIls,
  readTraces,
  recordTrace,
  summarizeCost,
  type CostSummary,
} from './cost';
export {
  clearScanErrors,
  logScanError,
  readScanErrors,
  summarizeScanErrors,
  type ScanErrorEntry,
  type ScanErrorKind,
} from './telemetry';
export {
  allLevels,
  checkScope,
  scopeFor,
  topicForDomain,
  LEVEL_SCOPES,
  type LevelScope,
} from './levels';

import { getOcrEngine } from './ocr';
import type { OcrProgress } from './types';

/**
 * Start downloading the OCR wasm + traineddata now.
 *
 * ~6.5 MB the first time on a device, then IndexedDB-cached forever. Called
 * as soon as the capture screen mounts, so the download overlaps with the
 * student aiming the camera instead of adding to the wait after the shutter.
 * Resolves to false when local OCR isn't available at all — the caller
 * should treat that as "the paid path is the only path", not as an error.
 */
export async function warmupLocalOcr(
  onProgress?: (p: OcrProgress) => void
): Promise<boolean> {
  const engine = getOcrEngine('tesseract-local');
  if (!engine) return false;
  try {
    if (!(await engine.isAvailable())) return false;
    await engine.warmup?.(onProgress);
    return true;
  } catch {
    return false;
  }
}
