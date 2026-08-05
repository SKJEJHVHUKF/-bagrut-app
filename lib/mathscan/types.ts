// ============================================================
// mathscan/types.ts — THE INTERNAL API between the UI and the services.
// ============================================================
//
// Everything the /scan UI knows about the scanning pipeline lives in this
// file. No component imports a concrete engine; they import these types and
// call `runScanPipeline` (lib/mathscan/pipeline.ts). That is what makes the
// pieces swappable: replacing Tesseract with a math-trained OCR model, or the
// mathjs CAS with a real SymPy backend, is a new file implementing
// `OcrEngine` / `SymbolicEngine` plus one line in the registry — no UI change.
//
// Cost discipline is encoded in the types, not just the docs: every stage
// reports `costUsd` and `paid`, so "how much did this scan cost" is a sum
// over `ScanTrace.stages`, never an estimate.

// ------------------------------------------------------------
// 0. Curriculum scope — 5 units now, 3 and 4 later.
// ------------------------------------------------------------

/** Bagrut unit level. The pipeline is level-aware from day one so adding
 *  3 and 4 units is content work, not a refactor. */
export type UnitLevel = 3 | 4 | 5;

/** Coarse mathematical domain of a question. Deliberately separate from the
 *  app's Hebrew topic names (`content/lessons`): the domain is what the
 *  SOLVER reasons about, the topic is what the STUDENT sees. Mapping between
 *  them lives in `lib/mathscan/levels.ts`. */
export type MathDomain =
  | 'algebra'
  | 'geometry'
  | 'trigonometry'
  | 'calculus'
  | 'statistics'
  | 'sequences'
  | 'analytic-geometry'
  | 'vectors'
  | 'complex'
  | 'unknown';

// ------------------------------------------------------------
// 1. Preprocessing
// ------------------------------------------------------------

/** A processed image, ready for OCR *and* for a vision API call. Both
 *  consumers get the same cleaned bytes — the crop that helps the local OCR
 *  also cuts the vision token count, so preprocessing is a cost lever. */
export type PreprocessedImage = {
  /** Cleaned image as a data URL (image/jpeg or image/png). */
  dataUrl: string;
  /** Raw bytes, for multipart upload to the fallback route. */
  blob: Blob;
  width: number;
  height: number;
  /** Bytes of the encoded result. */
  byteLength: number;
  /** What actually ran, in order — surfaced in the UI's "what we did" trace. */
  operations: PreprocessOperation[];
  /** Detected skew in degrees (positive = counter-clockwise correction). */
  skewDegrees: number;
  /** Fraction of the ORIGINAL frame kept after auto-crop. <1 means we
   *  cropped; the token saving is roughly proportional. */
  cropRatio: number;
  /** Estimated Anthropic image tokens for this image, ≈ (w×h)/750.
   *  Reported so the UI can show what the crop saved. */
  estimatedVisionTokens: number;
};

export type PreprocessOperation =
  | 'downscale'
  | 'grayscale'
  | 'contrast'
  | 'denoise'
  | 'deskew'
  | 'crop'
  | 'binarize';

export type PreprocessOptions = {
  /** Longest edge of the OCR-facing image. 1400 keeps small print legible
   *  while staying well inside the vision token budget. */
  maxDimension?: number;
  /** Skip the (relatively slow) skew search — used for re-runs. */
  skipDeskew?: boolean;
  /** Produce a hard black/white image. Better for Tesseract on printed text,
   *  worse for a vision model, so the pipeline keeps BOTH variants. */
  binarize?: boolean;
};

// ------------------------------------------------------------
// 2. OCR
// ------------------------------------------------------------

/** One recognised line, with the engine's own confidence. */
export type OcrLine = {
  text: string;
  /** 0..1 */
  confidence: number;
  /** Bounding box in image pixels, if the engine reports one. */
  bbox?: { x0: number; y0: number; x1: number; y1: number };
};

export type OcrResult = {
  /** Which engine produced this. */
  engine: OcrEngineId;
  /** Raw recognised text, lines joined by \n. */
  text: string;
  lines: OcrLine[];
  /** Engine-reported mean confidence, 0..1. NOT the pipeline's confidence —
   *  see `Validation.confidence` for the number the UI shows. */
  meanConfidence: number;
  /** Wall-clock milliseconds. */
  durationMs: number;
  /** USD spent producing this result. 0 for every local engine. */
  costUsd: number;
};

export type OcrEngineId = 'tesseract-local' | 'claude-vision' | 'manual';

/** The contract every OCR backend implements. Add a math-trained model
 *  (Texify/pix2tex/an ONNX checkpoint) by writing one of these. */
export interface OcrEngine {
  readonly id: OcrEngineId;
  /** Human label for the UI trace. */
  readonly label: string;
  /** True when this engine costs money per call. */
  readonly paid: boolean;
  /** Cheap availability probe — e.g. "are the wasm assets reachable".
   *  A `false` here removes the engine from the chain without an error. */
  isAvailable(): Promise<boolean>;
  /** Load weights/wasm. Safe to call repeatedly; must be idempotent. */
  warmup?(onProgress?: (p: OcrProgress) => void): Promise<void>;
  recognize(image: PreprocessedImage, opts: OcrRunOptions): Promise<OcrResult>;
  /** Free resources. Called when the user leaves /scan. */
  dispose?(): Promise<void>;
}

export type OcrRunOptions = {
  /** Language hint — the app is Hebrew-first but the math is Latin. */
  languages?: string[];
  onProgress?: (p: OcrProgress) => void;
  signal?: AbortSignal;
};

export type OcrProgress = {
  /** 0..1 */
  progress: number;
  /** Machine-readable stage, for the UI to label in Hebrew. */
  stage: 'loading-core' | 'loading-language' | 'recognizing' | 'done';
};

// ------------------------------------------------------------
// 3. Validation
// ------------------------------------------------------------

/** What the validator decided to do with an OCR result. */
export type ValidationVerdict =
  /** Clean enough to solve on-device. */
  | 'accept'
  /** Readable but risky — show it to the student and ask them to confirm. */
  | 'review'
  /** Broken/garbage — escalate to the paid fallback. */
  | 'reject';

export type ValidationIssue = {
  code:
    | 'empty'
    | 'too-short'
    | 'unbalanced-delimiters'
    | 'garbage-ratio'
    | 'no-math-content'
    | 'no-relation'
    | 'unparseable'
    | 'low-engine-confidence'
    | 'suspicious-characters'
    | 'multiple-questions';
  /** Hebrew, shown to the student when the verdict is `review`. */
  message: string;
  /** How much this issue pulled the confidence down, 0..1. */
  penalty: number;
};

export type Validation = {
  verdict: ValidationVerdict;
  /** 0..1 — the number the UI renders as "ביטחון זיהוי". Composed from the
   *  engine confidence AND the structural checks; an engine that is
   *  confidently wrong gets caught by the structure. */
  confidence: number;
  issues: ValidationIssue[];
  /** The cleaned-up transcription (delimiters normalised, OCR confusions
   *  repaired). This — not the raw OCR text — is what gets solved. */
  normalized: string;
  /** Machine-readable math extracted from the text, when we found any. */
  expressions: string[];
};

// ------------------------------------------------------------
// 4. Solving
// ------------------------------------------------------------

export type ProblemKind =
  | 'equation'
  | 'inequality'
  | 'system'
  | 'simplify'
  | 'evaluate'
  | 'derivative'
  | 'integral'
  | 'definite-integral'
  | 'limit'
  | 'unknown';

/** A classified problem — the solver's input. Built by
 *  `lib/mathscan/solve/classify.ts` from the validated transcription. */
export type ClassifiedProblem = {
  kind: ProblemKind;
  domain: MathDomain;
  /** The mathjs-syntax pieces to work on. For `equation` this is
   *  ['lhs - rhs']; for `system` one entry per equation. */
  expressions: string[];
  /** Variable(s) to solve for / differentiate by. */
  variables: string[];
  /** Integration/definite bounds when present. */
  bounds?: { lower: string; upper: string };
  /** The Hebrew instruction words we matched ("פתור", "גזור", …). */
  cues: string[];
  /** 0..1 — how sure the classifier is. Low means "solve it, but flag it". */
  confidence: number;
  /**
   * True when the photo holds a multi-section question (סעיף א, ב, ג …) —
   * the normal shape of a bagrut or מתכונת question.
   *
   * This is a routing flag, not a label. The local CAS solves ONE expression;
   * handing it a five-section question means it answers section א and the
   * screen presents that as "the solution". So a multi-part question skips
   * the local engine entirely and goes to the verified library (which stores
   * these questions section by section) or to the AI.
   */
  multiPart: boolean;
  /** The section labels found, in order — 'א', 'ב', … */
  parts: string[];
};

/** One move in a worked solution. `kind` drives the Hebrew templating, so
 *  the explanation costs $0 — no model writes these sentences. */
export type SolveStep = {
  kind:
    | 'restate'
    | 'domain'
    | 'move-terms'
    | 'expand'
    | 'factor'
    | 'coefficients'
    | 'discriminant'
    | 'apply-formula'
    | 'substitute'
    | 'simplify'
    | 'differentiate'
    | 'integrate'
    | 'evaluate-bounds'
    | 'solve-linear'
    | 'roots'
    | 'verify'
    | 'conclude';
  /** LaTeX for the mathematical content of this step. Hebrew NEVER goes
   *  inside this string — KaTeX has no bidi. */
  latex?: string;
  /** Extra machine data the explainer templates on (coefficients, Δ, …). */
  data?: Record<string, string | number>;
};

export type SolveOutcome =
  | {
      status: 'solved';
      kind: ProblemKind;
      steps: SolveStep[];
      /** Final answer as LaTeX. */
      answerLatex: string;
      /** Machine-readable answer for `lib/answer-check.ts` re-grading. */
      answerValues: string[];
      /** Which engine produced it. */
      engine: SymbolicEngineId;
      /** True when the engine verified the answer by substitution. */
      verified: boolean;
    }
  | {
      status: 'unsupported';
      kind: ProblemKind;
      /** Why the local engine bowed out — logged, and drives the fallback. */
      reason: string;
      engine: SymbolicEngineId;
    }
  | {
      status: 'error';
      kind: ProblemKind;
      reason: string;
      engine: SymbolicEngineId;
    };

export type SymbolicEngineId = 'local-mathjs' | 'sympy' | 'ai';

/** The CAS contract. `engine-local.ts` implements it with mathjs; a SymPy
 *  backend (Pyodide worker or a Python service) implements the same shape —
 *  see `solve/engine-sympy.ts`. The pipeline never names an engine directly. */
export interface SymbolicEngine {
  readonly id: SymbolicEngineId;
  readonly label: string;
  readonly paid: boolean;
  /** Which problem kinds this engine will attempt. */
  supports(kind: ProblemKind): boolean;
  isAvailable(): Promise<boolean>;
  solve(problem: ClassifiedProblem): Promise<SolveOutcome>;
}

// ------------------------------------------------------------
// 5. Explanation (Hebrew)
// ------------------------------------------------------------

/** Three depths, exactly as the result screen's three buttons.
 *  `hint` never reveals the answer. */
export type ExplanationDepth = 'hint' | 'partial' | 'full';

export type ExplainedStep = {
  /** Short Hebrew label — the leading label of a clean-stacked step. */
  title: string;
  /** Hebrew prose + LaTeX. Hebrew outside `$…$`, always. */
  content: string;
};

export type Explanation = {
  depth: ExplanationDepth;
  /** One line of "what kind of question this is". */
  headline: string;
  steps: ExplainedStep[];
  /** Present for `partial` and `full` only. */
  finalAnswer?: string;
  /** Where the Hebrew came from. `template` = $0. */
  source: 'template' | 'library' | 'ai';
};

// ------------------------------------------------------------
// 5b. The tutor attached to a scanned question
// ------------------------------------------------------------

/** One turn of the conversation that sits under a scanned question. */
export type TutorMessage = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * Everything the tutor is allowed to know.
 *
 * Deliberately narrow: the question and the solution we ALREADY showed the
 * student, and nothing else. The tutor's job is to explain what is on the
 * screen, so grounding it in that exact text is both cheaper than the app's
 * topic-grounding block and more accurate — it cannot contradict the steps
 * the student is looking at.
 */
export type TutorGrounding = {
  question: string;
  steps: { title: string; content: string }[];
  finalAnswer: string;
  topic: string | null;
  unitLevel: UnitLevel;
  /** Where the solution came from — the tutor speaks differently about a
   *  verified library solution than about one the AI just generated. */
  source: SolutionSource;
};

// ------------------------------------------------------------
// 6. Cost + telemetry
// ------------------------------------------------------------

export type ScanStageName =
  | 'preprocess'
  | 'ocr-local'
  | 'validate'
  | 'library-match'
  | 'cache'
  | 'solve-local'
  | 'explain-local'
  | 'fallback-vision'
  | 'fallback-solve';

export type ScanStage = {
  name: ScanStageName;
  durationMs: number;
  /** USD. 0 for everything that runs on the student's device. */
  costUsd: number;
  /** Whether this stage hit a paid API. */
  paid: boolean;
  /** 'hit' | 'miss' | 'skip' | 'error' — for the OCR/error log. */
  outcome: 'hit' | 'miss' | 'skip' | 'error';
  detail?: string;
};

/** The full record of one scan. Persisted (locally) so the cost per question
 *  is a measurement, not a guess, and so OCR failures accumulate into a
 *  corpus we can improve against. */
export type ScanTrace = {
  id: string;
  createdAt: number;
  stages: ScanStage[];
  totalCostUsd: number;
  totalDurationMs: number;
  /** Did any paid stage run? The headline metric for "almost zero cost". */
  usedPaidPath: boolean;
};

// ------------------------------------------------------------
// 7. The pipeline result — what the UI renders
// ------------------------------------------------------------

/** Where the final solution came from. Rendered as a badge; also the honest
 *  signal for trust (a verified library solution ≠ a fresh AI answer). */
export type SolutionSource = 'library' | 'cache' | 'local-cas' | 'ai';

export type ScanResult = {
  /** The question we believe was photographed. Editable by the student via
   *  "נסח מחדש" — which re-runs the pipeline from validation onward, for $0. */
  question: string;
  /** App-facing Hebrew topic (from `content/lessons`), when we could name it. */
  topic: string | null;
  domain: MathDomain;
  unitLevel: UnitLevel;
  /** 0..1 recognition confidence, shown to the student. */
  confidence: number;
  validation: Validation;
  problem: ClassifiedProblem | null;
  outcome: SolveOutcome | null;
  /** Ready-made explanations. `hint` is always present when we solved. */
  explanations: Partial<Record<ExplanationDepth, Explanation>>;
  source: SolutionSource;
  /**
   * Where the text came from.
   *
   * The recognition-confidence meter answers exactly one question — "can you
   * trust that we read your PHOTO correctly?" — so it is meaningless for text
   * the student typed, and telling them to "צלם שוב באור טוב יותר" when no
   * camera was involved is nonsense. The UI keys off this.
   */
  inputMode: 'photo' | 'typed';
  /**
   * Set only for a FUZZY library/cache hit (0..1, below 1).
   *
   * On a fuzzy match the question shown is the STORED wording, not what the
   * student photographed — cleaner and correct, but no longer literally
   * theirs. The UI says so, because silently swapping a student's question
   * for a similar one is the kind of thing that is only fine while it is
   * right.
   */
  matchScore?: number;
  trace: ScanTrace;
};

export type ScanPipelineOptions = {
  unitLevel?: UnitLevel;
  /** Skip the local OCR (used by "I'll type it myself"). */
  transcriptionOverride?: string;
  /** Allow the paid fallback. False = strictly $0 (anonymous users). */
  allowPaidFallback?: boolean;
  /** Confidence below which we escalate to the paid path. */
  fallbackThreshold?: number;
  onStage?: (stage: ScanStageName, status: 'start' | 'done', detail?: string) => void;
  onOcrProgress?: (p: OcrProgress) => void;
  signal?: AbortSignal;
};
