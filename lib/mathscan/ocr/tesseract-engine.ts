// ============================================================
// mathscan/ocr/tesseract-engine.ts — the local, open-source, $0 OCR.
// ============================================================
//
// Tesseract 5 (LSTM) compiled to WebAssembly, running in a Web Worker on the
// student's phone. Nothing leaves the device and no API is billed.
//
// EVERY asset is self-hosted under /public/tesseract:
//   worker.min.js · tesseract-core-simd-lstm.wasm.js · lang/{heb,eng}.traineddata.gz
// This is not a preference — `next.config.ts` ships a strict CSP whose
// `script-src`/`connect-src` are `'self'`, so tesseract.js's default jsDelivr
// paths are blocked outright. If you ever bump the tesseract.js version,
// re-copy those three files or local OCR silently stops working and every
// scan falls through to the paid path.
//
// What it is good at: printed questions from a worksheet, a textbook or an
// exam paper — the majority of what students photograph. What it is weak at:
// handwriting and stacked fractions. That weakness is *designed for*: the
// validator scores the output and anything shaky escalates to the fallback,
// so a bad local read costs a few hundred milliseconds, never a wrong answer.

import type {
  OcrEngine,
  OcrLine,
  OcrProgress,
  OcrResult,
  OcrRunOptions,
  PreprocessedImage,
} from '../types';

// Paths under /public. Kept together so a version bump is a one-place edit.
const WORKER_PATH = '/tesseract/worker.min.js';
const CORE_PATH = '/tesseract/tesseract-core-simd-lstm.wasm.js';
const CORE_PATH_NO_SIMD = '/tesseract/tesseract-core-lstm.wasm.js';
const LANG_PATH = '/tesseract/lang';

/** Hebrew first: the language list order is the recognition priority, and a
 *  bagrut question is Hebrew prose wrapped around Latin/numeric math. */
const DEFAULT_LANGUAGES = ['heb', 'eng'];

/** OEM 1 = LSTM only. Our core build is the `-lstm` one, which has no legacy
 *  engine compiled in at all — asking for any other mode fails at init. */
const OEM_LSTM_ONLY = 1;

// Page-segmentation mode is set from the `PSM` enum at worker creation:
// PSM.SINGLE_BLOCK ("a single uniform block of text"). After preprocessing
// has already cropped to the question block, letting Tesseract re-run its own
// layout analysis (PSM.AUTO) mostly finds spurious columns inside the maths.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TesseractWorker = any;

let workerPromise: Promise<TesseractWorker> | null = null;
let cachedAvailability: boolean | null = null;

/** WebAssembly SIMD feature probe. The 40-byte module below is a valid wasm
 *  binary whose body uses `v128.const`; engines without SIMD reject it at
 *  validation, which is exactly the signal we want. */
function hasWasmSimd(): boolean {
  try {
    return WebAssembly.validate(
      new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10,
        10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11,
      ])
    );
  } catch {
    return false;
  }
}

async function getWorker(onProgress?: (p: OcrProgress) => void): Promise<TesseractWorker> {
  if (workerPromise) return workerPromise;

  workerPromise = (async () => {
    const { createWorker, PSM } = await import('tesseract.js');
    const worker = await createWorker(DEFAULT_LANGUAGES, OEM_LSTM_ONLY, {
      workerPath: WORKER_PATH,
      corePath: hasWasmSimd() ? CORE_PATH : CORE_PATH_NO_SIMD,
      langPath: LANG_PATH,
      gzip: true,
      // MUST stay false. By default tesseract.js fetches worker.min.js and
      // spawns the worker from a `blob:` URL — and `next.config.ts` ships
      // `script-src 'self'`, which does not cover `blob:`. The worker is then
      // blocked before it runs, `createWorker` rejects in ~40 ms, and local
      // OCR is dead in production while working in any CSP-less test. Loading
      // the worker from its own same-origin path satisfies `worker-src`'s
      // fallback to `default-src 'self'` and needs no CSP relaxation.
      workerBlobURL: false,
      // 'write' caches the traineddata in IndexedDB, so the ~2.5 MB download
      // happens once per device rather than once per scan.
      cacheMethod: 'write',
      logger: (m: { status?: string; progress?: number }) => {
        if (!onProgress) return;
        const progress = typeof m.progress === 'number' ? m.progress : 0;
        const status = m.status ?? '';
        if (status.includes('core')) onProgress({ progress, stage: 'loading-core' });
        else if (status.includes('language') || status.includes('traineddata'))
          onProgress({ progress, stage: 'loading-language' });
        else if (status.includes('recognizing')) onProgress({ progress, stage: 'recognizing' });
      },
    });

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      // Without this every inter-word gap collapses and the Hebrew tokens we
      // fuzzy-match the library on stop existing.
      preserve_interword_spaces: '1',
      // Silences Tesseract's DPI guess, which is wrong for a phone photo and
      // makes it mis-size the LSTM input.
      user_defined_dpi: '300',
    });

    return worker;
  })();

  try {
    return await workerPromise;
  } catch (err) {
    // Never leave a rejected promise cached — the next scan must be free to
    // retry (a flaky first fetch of a 3.9 MB core is a real failure mode).
    workerPromise = null;
    // tesseract.js rejects with a bare string, and sometimes with nothing at
    // all, so the trace recorded "tesseract-local: undefined" and the actual
    // cause was invisible. Normalise to a real Error with a real message.
    throw new Error(
      `Tesseract worker failed to start: ${
        err instanceof Error ? err.message : err ? String(err) : 'no reason reported'
      }`
    );
  }
}

// ------------------------------------------------------------
// Symbol-level reconstruction: superscripts → LaTeX powers.
// ------------------------------------------------------------

type TesseractSymbol = {
  text: string;
  confidence: number;
  is_superscript?: boolean;
  is_subscript?: boolean;
};
type TesseractWord = { text: string; confidence: number; symbols?: TesseractSymbol[] };
type TesseractLine = {
  text: string;
  confidence: number;
  words?: TesseractWord[];
  bbox?: { x0: number; y0: number; x1: number; y1: number };
};

/**
 * Rebuild a line from its symbols so exponents survive.
 *
 * Plain `line.text` flattens "x²" to "x2" — which then parses as the number
 * x·2 and quietly solves a different problem. Tesseract does tag the glyph
 * `is_superscript`, so we re-insert the `^{…}` the flattening dropped.
 * Runs of superscript digits are grouped, so x^{12} stays one exponent.
 */
function lineFromSymbols(line: TesseractLine): string {
  const words = line.words ?? [];
  if (words.length === 0) return line.text ?? '';

  const parts: string[] = [];
  for (const word of words) {
    const symbols = word.symbols ?? [];
    if (symbols.length === 0) {
      parts.push(word.text ?? '');
      continue;
    }
    let out = '';
    let run: 'none' | 'sup' | 'sub' = 'none';
    for (const sym of symbols) {
      const ch = sym.text ?? '';
      const want: 'none' | 'sup' | 'sub' = sym.is_superscript
        ? 'sup'
        : sym.is_subscript
          ? 'sub'
          : 'none';
      if (want !== run) {
        if (run !== 'none') out += '}';
        // A leading superscript has no base to attach to — that is an OCR
        // artefact (a stray mark above the line), so drop the marker rather
        // than emit `^{…}` with nothing in front of it.
        if (want !== 'none' && out.length > 0) out += want === 'sup' ? '^{' : '_{';
        else if (want !== 'none') {
          run = 'none';
          out += ch;
          continue;
        }
        run = want;
      }
      out += ch;
    }
    if (run !== 'none') out += '}';
    parts.push(out);
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

// ------------------------------------------------------------
// The engine
// ------------------------------------------------------------

export const tesseractEngine: OcrEngine = {
  id: 'tesseract-local',
  label: 'זיהוי מקומי (Tesseract)',
  paid: false,

  /**
   * A pure CAPABILITY check — no network.
   *
   * This deliberately does not probe for the assets. An earlier version
   * HEAD-requested the worker script, and that quietly disabled local OCR
   * everywhere: Next's dev static handler answers `HEAD` with a 200 that the
   * browser reports as `net::ERR_ABORTED`, `fetch` rejects, the engine
   * removed itself from the chain, and every scan fell through to the paid
   * path with no error anywhere. A probe that can fail while the thing it
   * probes is fine is worse than no probe.
   *
   * Missing assets are caught at BUILD time by `scripts/verify-mathscan.ts`,
   * which is the right place for it, and at runtime `getWorker()` throws —
   * the pipeline already treats a throwing engine as "try the next one".
   */
  async isAvailable(): Promise<boolean> {
    if (cachedAvailability !== null) return cachedAvailability;
    cachedAvailability =
      typeof window !== 'undefined' &&
      typeof WebAssembly === 'object' &&
      typeof Worker !== 'undefined' &&
      typeof createImageBitmap === 'function';
    return cachedAvailability;
  },

  async warmup(onProgress?: (p: OcrProgress) => void): Promise<void> {
    await getWorker(onProgress);
    onProgress?.({ progress: 1, stage: 'done' });
  },

  async recognize(image: PreprocessedImage, opts: OcrRunOptions = {}): Promise<OcrResult> {
    const started = performance.now();
    const worker = await getWorker(opts.onProgress);

    const { data } = await worker.recognize(
      image.dataUrl,
      {},
      // `blocks: true` is what gives us word/symbol geometry. Without it v7
      // returns text only and the superscript reconstruction above has
      // nothing to work with.
      { text: true, blocks: true }
    );

    const lines: OcrLine[] = [];
    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs ?? []) {
        for (const line of para.lines ?? []) {
          const text = lineFromSymbols(line as TesseractLine);
          if (!text.trim()) continue;
          lines.push({
            text,
            confidence: Math.max(0, Math.min(1, (line.confidence ?? 0) / 100)),
            bbox: line.bbox,
          });
        }
      }
    }

    // Fall back to the flat page text when block output is unavailable —
    // losing exponents beats losing the whole read.
    const text = lines.length > 0 ? lines.map((l) => l.text).join('\n') : (data.text ?? '').trim();

    opts.onProgress?.({ progress: 1, stage: 'done' });

    return {
      engine: 'tesseract-local',
      text,
      lines,
      meanConfidence: Math.max(0, Math.min(1, (data.confidence ?? 0) / 100)),
      durationMs: Math.round(performance.now() - started),
      costUsd: 0,
    };
  },

  async dispose(): Promise<void> {
    const pending = workerPromise;
    workerPromise = null;
    if (!pending) return;
    try {
      const worker = await pending;
      await worker.terminate();
    } catch {
      // Already gone — nothing to clean up.
    }
  },
};

/** Exported for the unit tests, which exercise the superscript
 *  reconstruction without spinning up a wasm worker. */
export const __testables = { lineFromSymbols, hasWasmSimd };
