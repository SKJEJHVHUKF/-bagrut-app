// ============================================================
// mathscan/ocr/vision-engine.ts — the PAID fallback OCR.
// ============================================================
//
// Implements the same `OcrEngine` contract as the local Tesseract engine, so
// the pipeline picks between them by walking a list — no branching on engine
// names anywhere upstream.
//
// This one costs money, and the whole architecture exists to avoid reaching
// it. It runs only when ALL of these hold:
//   · local OCR produced something the validator rejected, and
//   · the caller passed `allowPaidFallback` (a signed-in user), and
//   · the transcription couldn't be matched to the verified library.
//
// Cost note: the request sends the PREPROCESSED image — grayscale, deskewed
// and cropped to the question block. Anthropic bills images at about
// (w × h)/750 tokens, so the crop is the single biggest lever on what this
// call costs. A 4032×3024 phone photo is ~16,250 image tokens; the cropped
// 1400-wide block is typically under 2,000.

import type { OcrEngine, OcrResult, OcrRunOptions, PreprocessedImage } from '../types';

/** Reported back so the cost meter records a measured figure rather than a
 *  guess. Sonnet 4.5 input is $3 per million tokens; the server returns the
 *  ACTUAL usage and the pipeline prefers that — this is only the estimate
 *  used when the response omits it. */
const SONNET_INPUT_USD_PER_TOKEN = 3 / 1_000_000;
const SONNET_OUTPUT_USD_PER_TOKEN = 15 / 1_000_000;

export const visionEngine: OcrEngine = {
  id: 'claude-vision',
  label: 'זיהוי מתקדם (ענן)',
  paid: true,

  async isAvailable(): Promise<boolean> {
    // Availability is really "is the user signed in", which the pipeline
    // already decides via `allowPaidFallback`. Anything more here would cost
    // a round trip on every scan just to learn something we know.
    return typeof fetch === 'function';
  },

  async recognize(image: PreprocessedImage, opts: OcrRunOptions = {}): Promise<OcrResult> {
    const started = performance.now();
    opts.onProgress?.({ progress: 0.1, stage: 'recognizing' });

    const form = new FormData();
    form.append('image', image.blob, 'question.jpg');
    form.append('mode', 'transcribe');

    const res = await fetch('/api/scan-solve', {
      method: 'POST',
      body: form,
      signal: opts.signal,
    });

    const data = await res.json().catch(() => ({}) as Record<string, unknown>);
    if (!res.ok) {
      const message = typeof data.error === 'string' ? data.error : 'זיהוי בענן נכשל';
      throw new VisionOcrError(message, res.status, data);
    }
    if (typeof data.error === 'string' && data.error) {
      throw new VisionOcrError(data.error, 200, data);
    }

    const text: string =
      typeof data.transcribedQuestion === 'string' ? data.transcribedQuestion : '';
    const usage = (data.usage ?? {}) as { input_tokens?: number; output_tokens?: number };
    const costUsd =
      typeof data.costUsd === 'number'
        ? data.costUsd
        : (usage.input_tokens ?? 0) * SONNET_INPUT_USD_PER_TOKEN +
          (usage.output_tokens ?? 0) * SONNET_OUTPUT_USD_PER_TOKEN;

    opts.onProgress?.({ progress: 1, stage: 'done' });

    return {
      engine: 'claude-vision',
      text,
      lines: text
        .split('\n')
        .filter(Boolean)
        // A vision transcription has no per-line confidence; reporting the
        // page-level figure per line is honest here because the model
        // produced the whole block as one unit.
        .map((line) => ({ text: line, confidence: 0.95 })),
      // Deliberately high but not 1: the model reads well, and it still
      // misreads handwriting. Leaving room under 1 keeps the validator's
      // structural checks meaningful instead of rubber-stamped.
      meanConfidence: 0.95,
      durationMs: Math.round(performance.now() - started),
      costUsd,
    };
  },
};

/** Carries the HTTP status so the pipeline can tell "needs Pro" (402) and
 *  "daily cap" (429) apart from a genuine failure, and say so in Hebrew. */
export class VisionOcrError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'VisionOcrError';
  }
}
